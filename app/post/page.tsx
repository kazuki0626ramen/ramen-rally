"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function PostPage() {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState<File | null>(null);
  const [masterShops, setMasterShops] = useState<any[]>([]);
  const [selectedShopId, setSelectedShopId] = useState("");
  const [isGold, setIsGold] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMasterShops = async () => {
      try {
        const { data, error } = await supabase.from("master_shops").select("*").order("name");
        if (error) throw error;
        if (data) setMasterShops(data);
      } catch (err) {
        console.error("店舗データの取得に失敗:", err);
        alert("店舗リストの読み込みに失敗しました。DBを確認してください。");
      }
    };
    fetchMasterShops();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーションチェック
    if (!selectedShopId) {
      alert("お店を選択してください！");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("ログインが必要です");
        router.push("/login");
        return;
      }

      let imageUrl = "";
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("ramen-images").upload(fileName, image);
        if (!uploadError) {
          const { data } = supabase.storage.from("ramen-images").getPublicUrl(fileName);
          imageUrl = data.publicUrl;
        }
      }

      const selectedShop = masterShops.find(s => s.id === selectedShopId);

      const { error } = await supabase.from("diaries").insert({
        user_id: user.id,
        shop_name: selectedShop?.name || "不明な店",
        master_shop_id: selectedShopId,
        comment,
        rating,
        image_url: imageUrl,
        is_gold_stamp: isGold,
        is_public: true
      });

      if (error) throw error;
      router.push("/"); // トップに戻る
      router.refresh(); // データを更新
    } catch (err: any) {
      alert("エラーが発生しました: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-black italic text-orange-600 mb-8 text-center">CHECK IN</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 店舗選択（ここが空だとボタンが動きません） */}
          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 ml-2">SELECT SHOP</label>
            <select 
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              className="w-full p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-orange-500"
            >
              <option value="">お店をリストから選ぶ</option>
              {masterShops.map(shop => (
                <option key={shop.id} value={shop.id}>{shop.area}: {shop.name}</option>
              ))}
            </select>
            {masterShops.length === 0 && (
              <p className="text-red-500 text-[10px] mt-1 ml-2 font-bold">※店舗データがロードされていません</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 mb-2 ml-2">COMMENT</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold h-24 outline-none"
              placeholder="味の感想..."
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black shadow-xl transition active:scale-95 ${
              loading ? "bg-slate-300" : "bg-slate-900 text-white"
            }`}
          >
            {loading ? "SAVING..." : "POST RECORD"}
          </button>
          
          <button 
            type="button"
            onClick={() => router.push("/")}
            className="w-full py-2 text-slate-400 font-bold text-sm"
          >
            CANCEL
          </button>
        </form>
      </div>
    </main>
  );
}
