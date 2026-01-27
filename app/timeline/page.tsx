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

  const getRank = (count: number) => {
    if (count >= 10) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50" };
    if (count >= 8) return { title: "伝説のラーメン王", color: "text-purple-600", bg: "bg-purple-50" };
    if (count >= 5) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50" };
    if (count >= 3) return { title: "ラーメン愛好家", color: "text-green-600", bg: "bg-green-50" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50" };
  };

  const fetchTimeline = async () => {
    // 修正ポイント：結合部分の指定をシンプルにし、データが欠けていても日記自体は取得するようにする
    const { data, error } = await supabase
      .from("diaries")
      .select(`
        *,
        profiles (nickname),
        shops (name),
        stamps (count),
        likes (count),
        comments (id, content, created_at, profiles (nickname))
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Fetch Error:", error);
    } else {
      console.log("Fetched Data:", data); // ブラウザのコンソールで確認用
      setPosts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  // ... (handleLike, handleSendComment 関数は前回と同じ)
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
    const { error } = await supabase.from("comments").insert({ user_id: user.id, diary_id: diaryId, content: text });
    if (!error) {
      setCommentText({ ...commentText, [diaryId]: "" });
      setShowCommentInput({ ...showCommentInput, [diaryId]: false });
      fetchTimeline();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING TIMELINE...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen font-sans pb-20">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8 px-2">
          <button onClick={() => router.push("/")} className="p-2 text-slate-400 font-bold text-sm">← Back</button>
          <h1 className="flex-1 text-center text-xl font-black italic text-orange-600 tracking-tighter mr-8">WORLD TIMELINE</h1>
        </div>

        <div className="space-y-8">
          {posts.length === 0 && <p className="text-center text-slate-400 text-sm py-20 font-bold">まだ公開された日記がありません 🍥</p>}
          
          {posts.map((post) => {
            const stampCount = post.stamps?.[0]?.count || 0;
            const likeCount = post.likes?.[0]?.count || 0;
            const rank = getRank(stampCount);

            return (
              <div key={post.id} className="bg-white rounded-[32px] overflow-hidden shadow-lg shadow-orange-100/20 border border-white">
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl shadow-inner">🍜</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-800 text-sm">{post.profiles?.nickname || "Unknown Member"}</h4>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${rank.bg} ${rank.color}`}>{rank.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(post.created_at).toLocaleString('ja-JP')}</p>
                  </div>
                </div>

                {post.image_url && (
                  <div className="w-full aspect-square bg-slate-100">
                    <img src={post.image_url} alt="ramen" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-800 tracking-tight text-lg">@{post.shops?.name || "Ramen Shop"}</h3>
                    <span className="text-orange-500">{"⭐".repeat(post.rating)}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">{post.comment}</p>

                  <div className="flex gap-6 border-t border-slate-50 pt-4 mb-4">
                    <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5 text-slate-600 font-black text-xs">
                      <span className="text-red-500 text-lg">❤️</span> <span>{likeCount}</span>
                    </button>
                    <button onClick={() => setShowCommentInput({ ...showCommentInput, [post.id]: !showCommentInput[post.id] })} className="flex items-center gap-1.5 text-slate-600 font-black text-xs">
                      <span className="text-blue-400 text-lg">💬</span> <span>{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  {post.comments && post.comments.length > 0 && (
                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-2xl">
                      {post.comments.map((c: any) => (
                        <div key={c.id} className="text-[11px] leading-tight">
                          <span className="font-black text-slate-800 mr-1">{c.profiles?.nickname}:</span>
                          <span className="text-slate-600">{c.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCommentInput[post.id] && (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={commentText[post.id] || ""} 
                        onChange={(e) => setCommentText({ ...commentText, [post.id]: e.target.value })} 
                        className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-xs" 
                        placeholder="コメントを書く..."
                      />
                      <button onClick={() => handleSendComment(post.id)} className="bg-orange-500 text-white px-4 py-2 rounded-full text-xs font-black">送信</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
