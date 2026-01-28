"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function TimelinePage() {
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTimeline = async () => {
      // 修正：リレーション名を指定せず、シンプルな取得にします
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
        console.error("Timeline Fetch Error:", error);
      } else {
        setDiaries(data || []);
      }
      setLoading(false);
    };
    fetchTimeline();
  }, []);

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
            {/* ユーザー情報 */}
            <div className="px-6 py-4 flex items-center gap-3 bg-slate-50/50">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-[10px] font-black text-orange-500">
                {diary.profiles?.nickname?.charAt(0) || "U"}
              </div>
              <span className="text-xs font-black text-slate-700">{diary.profiles?.nickname || "Guest"}</span>
            </div>

            {/* 写真 */}
            {diary.image_url && (
              <div className="w-full aspect-square overflow-hidden bg-slate-100">
                <img src={diary.image_url} alt="Ramen" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] font-black text-orange-500 uppercase">{diary.master_shops?.area}</p>
                  <h3 className="text-lg font-black text-slate-800">{diary.master_shops?.name}</h3>
                </div>
                <div className="flex text-xs">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < diary.rating ? "grayscale-0" : "grayscale opacity-20"}>⭐</span>
                  ))}
                </div>
              </div>

              {/* コメント・いいね (機能を統合) */}
              <div className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                <span className="text-lg">💬</span>
                <p className="text-sm text-slate-600 italic">{diary.comment || "No comment."}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">❤️</span>
                  <span className="text-xs font-bold text-slate-400">Like</span>
                </div>
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
