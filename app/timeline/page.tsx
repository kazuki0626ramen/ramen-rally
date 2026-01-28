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
      // 修正ポイント：結合を少し緩めて、日記データを確実に取得する
      const { data, error } = await supabase
        .from("diaries")
        .select(`
          *,
          master_shops (
            name,
            area
          )
        `)
        .eq("status", "public")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Timeline Error:", error);
      } else {
        // デバッグ用：取得したデータをコンソールで確認
        console.log("Fetched diaries:", data);
        setDiaries(data || []);
      }
      setLoading(false);
    };
    fetchTimeline();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING TIMELINE...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <button onClick={() => router.push("/")} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">World Timeline</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md space-y-6">
        {diaries && diaries.length > 0 ? (
          diaries.map((diary) => (
            <div key={diary.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-orange-50">
              {diary.image_url && (
                <div className="w-full aspect-video overflow-hidden">
                  <img src={diary.image_url} alt="Ramen" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">
                      {diary.master_shops?.area || "Area Unknown"}
                    </p>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                      {diary.master_shops?.name || "Unknown Shop"}
                    </h3>
                  </div>
                  <div className="flex text-xs">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < (diary.rating || 0) ? "grayscale-0" : "grayscale opacity-20"}>⭐</span>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium">
                  {diary.comment}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Posted on: {new Date(diary.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-slate-300 font-black italic text-xs uppercase tracking-widest leading-loose">
            No public logs yet.
          </div>
        )}
      </div>
    </main>
  );
}
