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
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

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
        // いいね数（like_count）を擬似的に初期化、またはDBから取得
        const formattedData = data?.map(d => ({
          ...d,
          like_count: d.like_count || 0,
          is_liked: false
        }));
        setDiaries(formattedData || []);
      }
      setLoading(false);
    };
    fetchTimeline();
  }, []);

  // いいね機能のカウンター連動
  const handleLike = async (diaryId: string) => {
    if (!userId) {
      alert("いいねをするにはログインが必要です");
      return;
    }

    // 画面上の数字を即座に増やす（楽観的更新）
    setDiaries(prev => prev.map(d => {
      if (d.id === diaryId) {
        return { ...d, like_count: d.like_count + 1, is_liked: true };
      }
      return d;
    }));

    // 本来はここで supabase.from('likes').insert(...) を行いますが、
    // 現状はフロントエンドでのカウントアップを優先します
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
        {diaries.map((diary) => (
          <div key={diary.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-white">
            {/* ユーザーヘッダー */}
            <div className="px-6 py-4 flex items-center gap-3 bg-slate-50/50">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-[10px] font-black text-orange-500">
                {diary.profiles?.nickname?.charAt(0) || "U"}
              </div>
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                {diary.profiles?.nickname || "Guest User"}
              </span>
            </div>

            {/* 写真 */}
            {diary.image_url && (
              <div className="w-full aspect-square overflow-hidden">
                <img src={diary.image_url} alt="Ramen" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6">
              {/* 店舗と評価 */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-black text-orange-500 uppercase mb-1">{diary.master_shops?.area}</p>
                  <h3 className="text-lg font-black text-slate-800">{diary.master_shops?.name}</h3>
                </div>
                <div className="flex text-xs">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < diary.rating ? "grayscale-0" : "grayscale opacity-20"}>⭐</span>
                  ))}
                </div>
              </div>

              {/* コメントセクション（アイコン付き） */}
              <div className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                <span className="text-lg">💬</span>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  {diary.comment || "No comment."}
                </p>
              </div>

              {/* いいねカウンター */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleLike(diary.id)}
                  className="flex items-center gap-2 group"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${diary.is_liked ? "bg-pink-100 scale-110" : "bg-slate-50"}`}>
                    <span className="text-lg">{diary.is_liked ? "❤️" : "🤍"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Like</span>
                    <span className="text-xs font-black text-slate-800">{diary.like_count}</span>
                  </div>
                </button>
                
                <span className="text-[9px] font-bold text-slate-300">
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
