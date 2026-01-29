"use client";

import { useState, useEffect } from "react";
// パスをリポジトリ構成に合わせた相対パスに修正（ビルドエラー回避）
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
        shop_id: params?.id || null,
        shop_name: shopName,
        image_url: imageUrl,
        memo: memo,
        rating: rating,
        is_public: isPublic,
      });

      if (diaryError) throw diaryError;

      // 2. 経験値+1の加算ロジック（強化版）
      // 最新の経験値を再取得
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("total_exp")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("プロフィール取得失敗:", fetchError.message);
      }

      // 現在の値がnullなら0として扱い、+1する
      const currentExp = profile?.total_exp ?? 0;
      const nextExp = currentExp + 1;

      const { error: expError } = await supabase
        .from("profiles")
        .update({ total_exp: nextExp })
        .eq("id", user.id);

      if (expError) {
        console.error("経験値更新失敗:", expError.message);
        alert("記録は保存されましたが、経験値の更新に失敗しました。");
      } else {
        alert(`記録完了！経験値が ${nextExp} になりました 🍜`);
      }

      router.push("/"); 
      router.refresh();
    } catch (error: any) {
      alert("保存エラー: " + error.message);
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
            placeholder="店名を入力（空でも写真があればOK）"
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Photo URL</label>
          <input 
            type="text" 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="写真のURL（空でも店名があればOK）"
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none"
          />
        </div>

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

        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Memo</label>
          <textarea 
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full bg-orange-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-200 outline-none resize-none"
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
