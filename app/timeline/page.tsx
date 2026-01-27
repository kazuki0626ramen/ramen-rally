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
      const { data: diaries, error: dError } = await supabase
        .from("diaries")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (dError) throw dError;
      if (!diaries) return setPosts([]);

      const postsWithData = await Promise.all(diaries.map(async (diary) => {
        // 各データを個別に取得
        const [prof, shp, lk, cm] = await Promise.all([
          supabase.from("profiles").select("nickname").eq("id", diary.user_id).single(),
          supabase.from("shops").select("name").eq("id", diary.shop_id).single(),
          supabase.from("likes").select('*', { count: 'exact', head: true }).eq("diary_id", diary.id),
          // コメント取得時に、書いた人のニックネームも確実に結合する
          supabase.from("comments")
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles:user_id (nickname)
            `)
            .eq("diary_id", diary.id)
            .order('created_at', { ascending: true })
        ]);

        return {
          ...diary,
          profiles: prof.data,
          shops: shp.data,
          like_count: lk.count || 0,
          comments: cm.data || []
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

  // いいね処理（変更なし）
  const handleLike = async (diaryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");
    const { error } = await supabase.from("likes").insert({ user_id: user.id, diary_id: diaryId });
    if (error) await supabase.from("likes").delete().eq("user_id", user.id).eq("diary_id", diaryId);
    fetchTimeline();
  };

  // コメント送信（ここを強化しました）
  const handleSendComment = async (diaryId: string) => {
    const text = commentText[diaryId];
    if (!text?.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");

    // 送信ボタンを連打できないように、一旦テキストを消す
    const currentText = text;
    setCommentText({ ...commentText, [diaryId]: "" });

    const { error } = await supabase.from("comments").insert({ 
      user_id: user.id, 
      diary_id: diaryId, 
      content: currentText 
    });

    if (error) {
      console.error("Comment Insert Error:", error);
      alert("送信に失敗しました。もう一度お試しください。");
      setCommentText({ ...commentText, [diaryId]: currentText }); // 失敗したら戻す
    } else {
      // 送信完了後、少しだけ待ってから再取得（Supabase側の反映ラグ対策）
      setTimeout(() => {
        fetchTimeline();
      }, 500);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic tracking-tighter">LOADING...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen font-sans pb-20">
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
                  <h4 className="font-black text-slate-900 text-sm">
                    {post.profiles?.nickname || "麺活メンバー"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {post.image_url && <img src={post.image_url} alt="ramen" className="w-full aspect-square object-cover" />}

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-slate-900 tracking-tight text-lg">
                    @{post.shops?.name || "秘密の名店"}
                  </h3>
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

                {/* コメント表示部分（黒色、見やすく修正） */}
                {post.comments?.length > 0 && (
                  <div className="space-y-3 mb-4 bg-slate-100/50 p-4 rounded-2xl">
                    {post.comments.map((c: any) => (
                      <div key={c.id} className="text-[13px] leading-snug text-slate-900 border-b border-white/50 pb-2 last:border-0">
                        <span className="font-black mr-2 text-slate-900">
                          {c.profiles?.nickname || "Guest"}:
                        </span>
                        <span className="font-medium text-slate-900">{c.content}</span>
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
                      className="flex-1 bg-slate-100 rounded-full px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-300" 
                      placeholder="おいしそう！"
                    />
                    <button 
                      onClick={() => handleSendComment(post.id)} 
                      className="bg-orange-600 text-white px-6 py-2 rounded-full text-xs font-black shadow-md active:scale-95"
                    >
                      送信
                    </button>
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
