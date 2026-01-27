"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showCommentInput, setShowCommentInput] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  const fetchTimeline = async () => {
    try {
      // 1. 公開されている日記をすべて取得
      const { data: diaries, error: dError } = await supabase
        .from("diaries")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (dError) throw dError;
      if (!diaries) return setPosts([]);

      // 2. 各日記に紐づく情報を1つずつ丁寧に組み立てる
      const postsWithData = await Promise.all(diaries.map(async (diary) => {
        // ショップ名・プロフィール・いいね・コメントを個別に取得
        const [prof, shp, lk, cm] = await Promise.all([
          supabase.from("profiles").select("nickname").eq("id", diary.user_id).single(),
          supabase.from("shops").select("name").eq("id", diary.shop_id).single(),
          supabase.from("likes").select('*', { count: 'exact', head: true }).eq("diary_id", diary.id),
          supabase.from("comments").select("*").eq("diary_id", diary.id).order('created_at', { ascending: true })
        ]);

        // コメントごとに、その投稿者の名前をさらに取得（安全策）
        const commentsWithNicknames = await Promise.all((cm.data || []).map(async (c) => {
          const { data: cProf } = await supabase.from("profiles").select("nickname").eq("id", c.user_id).single();
          return { ...c, nickname: cProf?.nickname || "ゲスト" };
        }));

        return {
          ...diary,
          profiles: prof.data,
          shops: shp.data,
          like_count: lk.count || 0,
          comments: commentsWithNicknames
        };
      }));

      setPosts(postsWithData);
    } catch (err) {
      console.error("Timeline Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimeline(); }, []);

  const handleLike = async (diaryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");
    const { error } = await supabase.from("likes").insert({ user_id: user.id, diary_id: diaryId });
    if (error) await supabase.from("likes").delete().eq("user_id", user.id).eq("diary_id", diaryId);
    fetchTimeline();
  };

  const handleSendComment = async (diaryId: string) => {
    const text = commentText[diaryId];
    if (!text?.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");

    const { error } = await supabase.from("comments").insert({ 
      user_id: user.id, 
      diary_id: diaryId, 
      content: text 
    });

    if (error) {
      alert("送信失敗");
    } else {
      setCommentText({ ...commentText, [diaryId]: "" });
      fetchTimeline(); // 送信後に最新情報を再取得
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen font-sans pb-20 text-slate-900">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8 px-2">
          <button onClick={() => router.push("/")} className="p-2 text-slate-400 font-black">←</button>
          <h1 className="flex-1 text-center text-xl font-black italic text-orange-600 tracking-tighter mr-8">WORLD TIMELINE</h1>
        </div>

        <div className="space-y-10">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl shadow-orange-100/30 border border-white">
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl shadow-inner">🍜</div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{post.profiles?.nickname || "麺活メンバー"}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {post.image_url && <img src={post.image_url} alt="ramen" className="w-full aspect-square object-cover" />}

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-slate-900 tracking-tight text-lg">@{post.shops?.name || "秘密の名店"}</h3>
                  <span className="text-orange-500">{"⭐".repeat(post.rating)}</span>
                </div>
                <p className="text-sm text-slate-900 leading-relaxed mb-6 font-bold">{post.comment}</p>

                <div className="flex gap-6 border-t border-slate-50 pt-4 mb-4">
                  <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5 text-slate-600 font-black text-xs">
                    <span className="text-red-500 text-lg">❤️</span> <span>{post.like_count}</span>
                  </button>
                  <button onClick={() => setShowCommentInput({ ...showCommentInput, [post.id]: !showCommentInput[post.id] })} className="flex items-center gap-1.5 text-slate-600 font-black text-xs">
                    <span className="text-blue-500 text-lg">💬</span> <span>{post.comments?.length || 0}</span>
                  </button>
                </div>

                {/* コメント表示：文字を真っ黒かつ太字にして確実に表示 */}
                {post.comments?.length > 0 && (
                  <div className="space-y-3 mb-4 bg-slate-100 p-4 rounded-2xl">
                    {post.comments.map((c: any) => (
                      <div key={c.id} className="text-[13px] leading-snug">
                        <span className="font-black text-slate-900 mr-2">{c.nickname}:</span>
                        <span className="font-bold text-slate-900">{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}

                {showCommentInput[post.id] && (
                  <div className="flex gap-2 mt-2">
                    <input 
                      type="text" 
                      value={commentText[post.id] || ""} 
                      onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} 
                      className="flex-1 bg-slate-200 rounded-full px-4 py-2 text-sm text-slate-900 font-bold focus:outline-none" 
                      placeholder="コメントを書く..."
                    />
                    <button onClick={() => handleSendComment(post.id)} className="bg-orange-600 text-white px-5 py-2 rounded-full text-xs font-black shadow-md">送信</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
