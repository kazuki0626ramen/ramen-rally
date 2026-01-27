"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; // ここを修正しました
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 10) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50" };
    if (count >= 8) return { title: "伝説のラーメン王", color: "text-purple-600", bg: "bg-purple-50" };
    if (count >= 5) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50" };
    if (count >= 3) return { title: "ラーメン愛好家", color: "text-green-600", bg: "bg-green-50" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50" };
  };

  useEffect(() => {
    const fetchTimeline = async () => {
      const { data, error } = await supabase
        .from("diaries")
        .select(`
          *,
          profiles:user_id (nickname),
          shops:shop_id (name),
          stamps(count)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Fetch Error:", error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    fetchTimeline();
  }, []);

  const handleLike = async (diaryId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("ログインが必要です");

    const { error } = await supabase.from("likes").insert({
      user_id: user.id,
      diary_id: diaryId
    });

    if (error) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("diary_id", diaryId);
    }
    window.location.reload();
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
          {posts.length === 0 ? (
            <p className="text-center text-slate-400 text-sm font-bold mt-10">まだ公開された日記がありません 🍥</p>
          ) : (
            posts.map((post) => {
              const stampCount = post.stamps?.[0]?.count || 0;
              const rank = getRank(stampCount);

              return (
                <div key={post.id} className="bg-white rounded-[32px] overflow-hidden shadow-lg shadow-orange-100/20 border border-white">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">🍜</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-slate-800 text-sm">{(post.profiles as any)?.nickname || "User"}</h4>
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
                      <h3 className="font-black text-slate-800 tracking-tight">@{(post.shops as any)?.name || "Shop"}</h3>
                      <span className="text-orange-500">{"⭐".repeat(post.rating)}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">{post.comment}</p>

                    <div className="flex gap-6 border-t border-slate-50 pt-4">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-slate-600 font-black text-sm active:scale-125 transition-transform"
                      >
                        <span className="text-red-500">❤️</span>
                        <span>いいね！</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-slate-600 font-black text-sm">
                        <span className="text-blue-400">💬</span>
                        <span>コメント</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
