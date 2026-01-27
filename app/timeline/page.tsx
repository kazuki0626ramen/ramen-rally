"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTimeline = async () => {
      setLoading(true);
      // 検証用：結合を一切せず、diariesテーブルから直接取得
      const { data, error } = await supabase
        .from("diaries")
        .select("*") 
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">DEBUGGING TIMELINE...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen font-sans">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={() => router.push("/")} className="p-2 text-slate-400 font-bold">← Back</button>
          <h1 className="flex-1 text-center text-xl font-black italic text-orange-600">DEBUG VIEW</h1>
        </div>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">データが1件も見つかりません 🍥</p>
              <p className="text-[10px] text-slate-300 mt-2">is_public=true のデータがDBにあるか再確認してください</p>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Diary ID: {post.id.slice(0,8)}</span>
                  <span className="text-orange-500">{"⭐".repeat(post.rating)}</span>
                </div>
                
                {post.image_url && (
                  <img src={post.image_url} alt="ramen" className="w-full aspect-video object-cover rounded-2xl mb-4" />
                )}
                
                <p className="text-slate-800 font-bold text-sm mb-2">{post.comment || "(コメントなし)"}</p>
                
                <div className="text-[10px] text-slate-400 border-t pt-2 mt-2">
                  <p>Shop ID: {post.shop_id}</p>
                  <p>User ID: {post.user_id}</p>
                  <p>Public: {String(post.is_public)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
