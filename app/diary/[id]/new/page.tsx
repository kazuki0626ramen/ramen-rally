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
      if (!user) throw new Error("ログインユーザーが見つかりません");

      // 1. 日記を保存
      const { error: diaryError } = await supabase.from("diaries").insert({
        user_id: user.id,
        shop_id: params?.id !== "default" ? params?.id : null,
        shop_name: shopName,
        image_url: imageUrl,
        memo: memo,
        rating: rating,
        is_public: isPublic,
      });

      if (diaryError) throw new Error(`日記の保存失敗: ${diaryError.message}`);

      // 2. 現在のプロフィール値を取得
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_exp, total_eaten")
        .eq("id", user.id)
        .single();

      const nextExp = (profile?.total_exp ?? 0) + 1;
      const nextEaten = (profile?.total_eaten ?? 0) + 1;

      // 3. 経験値と杯数を更新
      const { error: expError } = await supabase
        .from("profiles")
        .update({ 
          total_exp: nextExp,
          total_eaten: nextEaten 
        })
        .eq("id", user.id);

      if (expError) {
        alert(`記録は保存されましたが、EXP更新に失敗しました: ${expError.message}`);
      } else {
        alert(`ナイスラー！経験値が ${nextExp} になりました 🍜`);
      }

      router.push("/"); 
      router.refresh();

    } catch (error: any) {
      alert("エラーが発生しました: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex items-center mb-8">
        <button type="button" onClick={() => router.back()} className="text-slate-400 text-sm font-black mr-4">← CANCEL</button>
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">NEW RECORD</h1>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Shop Name</label>
          <input 
            type="text" 
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Photo URL</label>
          <input 
            type="text" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-orange-600 text-white font-black py-4 rounded-[32px] shadow-xl active:scale-90 transition-all disabled:opacity-50"
        >
          {loading ? "SAVING..." : "POST RECORD +1 EXP"}
        </button>
      </form>
    </main>
  );
}
