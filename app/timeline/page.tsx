"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchTimeline = async () => {
      // ユーザーIDの取得
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // 日記、投稿者情報、店舗情報を一括取得
      const { data, error } = await supabase
        .from("diaries")
        .select(`
          *,
          profiles:user_id (nickname, avatar_url),
          master_shops (name, area)
        `)
        .eq("status", "public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Timeline Error:", error);
      } else {
        setDiaries(data || []);
      }
      setLoading(false);
    };
    fetchTimeline();
  }, []);

  // いいね機能のロジック (既存の仕組みを維持)
  const handleLike = async (diaryId: string) => {
    if (!userId) {
      alert("いいねをするにはログインが必要です");
      return;
    }
    // ここに「いいね」の保存処理（likesテーブル等）がある場合は追加
    alert("いいね機能を連動させます（実装状況に応じて調整可能）");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING TIMELINE...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <button onClick={() => router.push("/")} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">World Timeline</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md space-y-8">
        {diaries.map((diary) => (
          <div key={diary.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-orange-900/5 border border-white">
            {/* ユーザーヘッダー */}
            <div className="px-6 py-4 flex items-center gap-3 bg-slate-50/50">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-[10px] font-black text-orange-500">
                {diary.profiles?.nickname?.charAt(0) || "U"}
              </div>
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {diary.profiles?.nickname || "Unknown User"}
              </span>
            </div>

            {/* 写真 */}
            {diary.image_url && (
              <div className="w-full aspect-square overflow-hidden bg-slate-100">
                <img src={diary.image_url} alt="Ramen" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6">
              {/* 店舗情報 */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] mb-1">
                    {diary.master_shops?.area}
                  </p>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">
                    {diary.master_shops?.name}
                  </h3>
                </div>
                <div className="flex text-xs bg-slate-50 px-2 py-1 rounded-lg">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < diary.rating ? "grayscale-0" : "grayscale opacity-20"}>⭐</span>
                  ))}
                </div>
              </div>

              {/* コメント */}
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                {diary.comment}
              </p>

              {/* アクションバー (いいね機能) */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleLike(diary.id)}
                  className="flex items-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center group-active:scale-90 transition-transform">
                    <span className="text-lg">❤️</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">Like</span>
                </button>
                
                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                  {new Date(diary.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
