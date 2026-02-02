"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const router = useRouter();

  const fetchTimeline = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    // 取得方法をさらに安定したものに変更
    const { data, error } = await supabase
      .from("diaries")
      .select(`
        *,
        profiles!diaries_user_id_fkey (nickname),
        master_shops (name, area),
        diary_replies (
          id,
          content,
          created_at,
          profiles!diary_replies_user_id_fkey (nickname)
        )
      `)
      .eq("status", "public")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Timeline Error:", error);
      // 万が一エラーが出た場合は返信なしで日記だけ取得を試みる
      const { data: fallbackData } = await supabase
        .from("diaries")
        .select("*, profiles(nickname), master_shops(name, area)")
        .eq("status", "public");
      setDiaries(fallbackData || []);
    } else {
      setDiaries(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleLike = (diaryId: string) => {
    if (!userId) return;
    setDiaries(prev => prev.map(d => {
      if (d.id === diaryId) {
        const newIsLiked = !d.is_liked;
        return { 
          ...d, 
          is_liked: newIsLiked, 
          like_count: newIsLiked ? (d.like_count || 0) + 1 : Math.max(0, (d.like_count || 0) - 1) 
        };
      }
      return d;
    }));
  };

  const submitReply = async (diaryId: string) => {
    if (!replyText.trim() || !userId) return;
    const { error } = await supabase.from("diary_replies").insert({
      diary_id: diaryId,
      user_id: userId,
      content: replyText
    });
    if (!error) {
      setReplyText("");
      setReplyTargetId(null);
      fetchTimeline();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <button onClick={() => router.push("/")} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="text-xl font-black text-slate-800 italic uppercase">Timeline</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md space-y-8">
        {diaries.map((diary) => (
          <div key={diary.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-white">
            {/* 投稿者 */}
            <div className="px-6 py-4 flex items-center gap-3 bg-slate-50/50">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-[10px] font-black text-orange-500">
                {diary.profiles?.nickname?.charAt(0) || "U"}
              </div>
              <span className="text-xs font-black text-slate-700 uppercase">{diary.profiles?.nickname || "Guest"}</span>
            </div>

            {/* 写真 */}
            {diary.image_url && (
              <div className="w-full aspect-video overflow-hidden bg-slate-100">
                <img src={diary.image_url} alt="Ramen" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6">
              {/* ショップ・評価 */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{diary.master_shops?.area || "FREE LOG"}</p>
                  <h3 className="text-xl font-black text-slate-900 leading-tight italic tracking-tight">{diary.shop_name || diary.master_shops?.name || "No Shop"}</h3>
                </div>
                <div className="flex text-xs bg-slate-50 px-2 py-1 rounded-lg">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < (diary.rating || 0) ? "grayscale-0" : "grayscale opacity-20"}>⭐</span>
                  ))}
                </div>
              </div>

              {/* コメント */}
              <div className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                <span className="text-lg">💬</span>
                <p className="text-sm text-slate-900 leading-relaxed font-medium italic">{diary.memo || diary.comment || "No comment."}</p>
              </div>

              {/* 返信一覧 */}
              {diary.diary_replies && diary.diary_replies.length > 0 && (
                <div className="mb-6 ml-6 space-y-3 border-l-2 border-orange-100 pl-4">
                  {diary.diary_replies.map((reply: any) => (
                    <div key={reply.id} className="text-xs text-slate-900 bg-orange-50/50 p-2 rounded-lg">
                      <span className="font-black text-orange-500 mr-2">{reply.profiles?.nickname || "Guest"}:</span>
                      {reply.content}
                    </div>
                  ))}
                </div>
              )}

              {/* 返信入力 */}
              {replyTargetId === diary.id && (
                <div className="mb-6">
                  <textarea
                    className="w-full bg-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none h-20"
                    placeholder="返信を入力..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setReplyTargetId(null)} className="text-[10px] font-black text-slate-400">Cancel</button>
                    <button onClick={() => submitReply(diary.id)} className="px-4 py-1 bg-blue-500 text-white rounded-lg text-[10px] font-black">Send</button>
                  </div>
                </div>
              )}

              {/* ボタン */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-6">
                  <button onClick={() => handleLike(diary.id)} className="flex items-center gap-2">
                    <span className="text-lg">{diary.is_liked ? "❤️" : "🤍"}</span>
                    <span className="text-xs font-black text-slate-800">{diary.like_count || 0}</span>
                  </button>
                  <button onClick={() => setReplyTargetId(replyTargetId === diary.id ? null : diary.id)} className="flex items-center gap-2">
                    <span className="text-lg">🔁</span>
                    <span className="text-xs font-black text-slate-800">Reply</span>
                  </button>
                </div>
                <span className="text-[9px] font-bold text-slate-300">{new Date(diary.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
