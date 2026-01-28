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
      // 1. ログインユーザーの確認
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // 2. 日記・名前・店名の取得（プロフィールがなくても取得できるLeft Join形式）
      const { data, error } = await supabase
        .from("diaries")
        .select(`
          *,
          profiles (nickname),
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

  // いいね機能
  const handleLike = async (diaryId: string) => {
    if (!userId) {
      alert("いいねをするにはログインが必要です");
      return;
    }
    // ここにいいねのDB保存処理がある場合は追記
    alert("いいね！しました❤️");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <button onClick={() => router.push("/")} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Timeline</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md space-y-8">
        {diaries && diaries.length > 0 ? (
          diaries.map((diary) => (
            <div key={diary.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-white">
              {/* 1. 投稿者ヘッダー */}
              <div className="px-6 py-3 bg-slate-50/50 flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-[8px] font-black text-orange-500">
                  {diary.profiles?.nickname?.charAt(0) || "U"}
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase">
                  {diary.profiles?.nickname || "Guest User"}
                </span>
              </div>

              {/* 2. ラーメン写真 */}
              {diary.image_url && (
                <div className="w-full aspect-square overflow-hidden bg-slate-100">
                  <img src={diary.image_url} alt="Ramen" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="p-6">
                {/* 3. 店舗情報と星評価 */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[9px] font-black text-orange-500 uppercase mb-1">{diary.master_shops?.area}</p>
                    <h3 className="text-lg font-black text-slate-800">{diary.master_shops?.name}</h3>
                  </div>
                  <div className="flex text-xs">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < (diary.rating || 0) ? "grayscale-0" : "grayscale opacity-20"}>⭐</span>
                    ))}
                  </div>
                </div>

                {/* 4. コメント部分 (ここに感想が表示されます) */}
                <div className="mb-6">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {diary.comment || "コメントはありません"}
                  </p>
                </div>

                {/* 5. いいねボタンと日付 */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => handleLike(diary.id)} 
                    className="flex items-center gap-2 group active:scale-90 transition-transform"
                  >
                    <span className="text-lg">❤️</span>
                    <span className="text-xs font-bold text-slate-400 group-hover:text-pink-500">Like</span>
                  </button>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">
                    {new Date(diary.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-slate-300 font-black italic text-xs uppercase">
            No public logs found.
          </div>
        )}
      </div>
    </main>
  );
}
