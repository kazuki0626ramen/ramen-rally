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
      if (imageFile) {
        // 画像名の重複を避けるためにタイムスタンプを付与
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('diary-photos')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('diary-photos').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      const { error: dbError } = await supabase.from("diaries").insert({
        user_id: user.id,
        shop_id: shopId,
        rating,
        comment,
        image_url: imageUrl,
        is_public: isPublic
      });

      if (dbError) throw dbError;
      alert("日記を保存しました！🍥");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      alert("保存に失敗しました: " + (err.message || "権限エラー"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="mb-4 text-slate-400 font-bold flex items-center gap-1">
          <span>←</span> <span>戻る</span>
        </button>
        
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-800 leading-tight">{shopName}</h1>
          <p className="text-[10px] text-orange-500 font-black italic uppercase tracking-[0.2em]">Add Your Ramen Log</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-[32px] shadow-xl border border-white/50">
          {/* 星評価 */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Rating</label>
            <div className="flex gap-3 bg-slate-50 p-3 rounded-2xl justify-center">
              {[1, 2, 3, 4, 5].map((num) => (
                <button key={num} type="button" onClick={() => setRating(num)} className="text-3xl transition-all active:scale-125">
                  {num <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
          </div>

          {/* 写真アップロード */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Photo</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
              className="w-full text-[10px] text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 transition-all" 
            />
          </div>

          {/* コメント：文字色を濃い黒（slate-900）に修正 */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comment</label>
            <textarea 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="スープの味や麺の感想をメモ..." 
              className="w-full h-32 p-4 bg-slate-50 rounded-2xl text-sm text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-100 transition-all" 
            />
          </div>

          {/* 公開設定 */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-600 uppercase">Publish to Timeline</span>
              <span className="text-[8px] text-slate-400 font-bold">他のユーザーに公開しますか？</span>
            </div>
            <input 
              type="checkbox" 
              checked={isPublic} 
              onChange={(e) => setIsPublic(e.target.checked)} 
              className="w-6 h-6 accent-orange-500 rounded-lg" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Processing..." : "Save Diary 🍥"}
          </button>
        </form>
      </div>
    </main>
  );
}
