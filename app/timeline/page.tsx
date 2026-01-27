"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // ランク計算用の関数
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
      // 公開設定の日記を最新20件取得（投稿者のプロフィールと店名も同時に取得）
      const { data, error } = await supabase
        .from("diaries")
        .select(`
          *,
          profiles:user_id (nickname),
          shops:shop_id (name),
          stamps_count:stamps(count)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error(error);
      } else {
        setPosts(data);
      }
      setLoading(false);
    };
    fetchTimeline();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING TIMELINE...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen font-sans pb-20">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={() => router.push("/")} className="p-2 text-slate-400 font-bold text-sm">← Back</button>
          <h1 className="flex-1 text-center text-xl font-black italic text-orange-600 tracking-tighter mr-8">WORLD TIMELINE</h1>
        </div>

        <div className="space-y-8">
          {posts.map((post) => {
            // stamps_count は配列の要素として返ってくるため調整
            const stampCount = post.stamps_count?.[0]?.count || 0;
            const rank = getRank(stampCount);

            return (
              <div key={post.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
                {/* ユーザー情報ヘッダー */}
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">🍜</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-800 text-sm">{post.profiles?.nickname || "User"}</h4>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${rank.bg} ${rank.color}`}>{rank.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(post.created_at).toLocaleString('ja-JP')}</p>
                  </div>
                </div>

                {/* ラーメン写真 */}
                {post.image_url && (
                  <div className="w-full aspect-square bg-slate-100">
                    <img src={post.image_url} alt="ramen" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* 日記内容 */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-black text-slate-800 tracking-tight">@{post.shops?.name}</h3>
                    <span className="text-orange-500">{"⭐".repeat(post.rating)}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{post.comment}</p>

                  {/* アクションボタン（見た目のみ。機能は後ほど実装） */}
                  <div className="flex gap-4 border-t border-slate-50 pt-4">
                    <button className="flex items-center gap-1 text-slate-400 font-black text-xs">❤️ 0</button>
                    <button className="flex items-center gap-1 text-slate-400 font-black text-xs">💬 0</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
