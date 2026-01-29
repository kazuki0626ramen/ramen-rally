"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter, useSearchParams, useParams } from "next/navigation";

export default function NewDiaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const [shopName, setShopName] = useState("");
  const [memo, setMemo] = useState("");
  const [rating, setRating] = useState(3);
  const [isPublic, setIsPublic] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const shop = searchParams.get("shop");
    if (shop) setShopName(shop);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() && !imageUrl.trim()) {
      alert("「店名」または「写真」のどちらかは入力してください🍜");
      return;
    }
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインしてください");

      // 日記の保存
      await supabase.from("diaries").insert({
        user_id: user.id,
        shop_id: params?.id !== "default" ? params?.id : null,
        shop_name: shopName,
        image_url: imageUrl,
        memo: memo,
        rating: rating,
        is_public: isPublic,
      });

      // 経験値の加算
      const { data: profile } = await supabase.from("profiles").select("total_exp").eq("id", user.id).single();
      const nextExp = (profile?.total_exp ?? 0) + 1;
      await supabase.from("profiles").update({ total_exp: nextExp }).eq("id", user.id);

      alert(`記録完了！EXP: ${nextExp} 🍜`);
      router.push("/");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex items-center mb-8">
        <button type="button" onClick={() => router.back()} className="text-slate-400 text-sm font-black mr-4 uppercase tracking-tighter">← Cancel</button>
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">NEW RECORD</h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        {/* SHOP NAME カード */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Shop Name</label>
          <input 
            type="text" 
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="店名を入力"
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        {/* PHOTO URL カード */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Photo URL</label>
          <input 
            type="text" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="画像のURLを貼り付け"
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        {/* PUBLIC SETTING カード */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50 flex items-center justify-between">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Public Setting</label>
            <p className="text-[10px] text-slate-300 font-bold mt-1">{isPublic ? "タイムラインに公開中" : "自分のみ閲覧可能"}</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-orange-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {/* 投稿ボタン */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-orange-600 text-white font-black py-5 rounded-[32px] shadow-xl shadow-orange-100 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? "SAVING..." : "POST RECORD +1 EXP"}
        </button>
      </form>
    </main>
  );
}
