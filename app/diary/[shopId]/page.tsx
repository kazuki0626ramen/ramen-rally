"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function DiaryPostPage() {
  const { shopId } = useParams();
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      const { data } = await supabase.from("shops").select("name").eq("id", shopId).single();
      if (data) setShopName(data.name);
    };
    fetchShop();
  }, [shopId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      let imageUrl = "";
      // 1. 画像がある場合はストレージにアップロード
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('diary-photos')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('diary-photos').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      // 2. 日記データをDBに保存
      const { error: dbError } = await supabase.from("diaries").insert({
        user_id: user.id,
        shop_id: shopId,
        rating,
        comment,
        image_url: imageUrl,
        is_public: isPublic
      });

      if (dbError) throw dbError;
      alert("日記を保存しました！");
      router.push("/");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="mb-4 text-slate-400 font-bold">← 戻る</button>
        <h1 className="text-2xl font-black text-slate-800 mb-1">{shopName}</h1>
        <p className="text-sm text-orange-500 font-bold mb-6 italic uppercase tracking-widest">Noodle Log</p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-[32px] shadow-lg border border-white">
          {/* 星評価 */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button key={num} type="button" onClick={() => setRating(num)} className="text-3xl transition-transform active:scale-125">
                  {num <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          {/* 写真アップロード */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100" />
          </div>

          {/* コメント */}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase mb-2">Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="今日の一杯はどうだった？" className="w-full h-24 p-4 bg-slate-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
          </div>

          {/* 公開設定 */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
            <span className="text-xs font-black text-slate-600 uppercase">Make Public (X)</span>
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="w-5 h-5 accent-orange-500" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50">
            {loading ? "Saving..." : "Save Diary 🍥"}
          </button>
        </form>
      </div>
    </main>
  );
}
