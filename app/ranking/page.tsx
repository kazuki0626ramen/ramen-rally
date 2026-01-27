"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function RankingPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 称号を取得する共通ロジック（Homeと同じ）
  const getRank = (count: number) => {
    if (count >= 10) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50" };
    if (count >= 8) return { title: "伝説のラーメン王", color: "text-purple-600", bg: "bg-purple-50" };
    if (count >= 5) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50" };
    if (count >= 3) return { title: "ラーメン愛好家", color: "text-green-600", bg: "bg-green-50" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50" };
  };

  useEffect(() => {
    const fetchRankings = async () => {
      const { data, error } = await supabase.from("user_rankings").select("*");
      if (!error && data) {
        // パターン1の順位計算ロジック
        let currentRank = 1;
        const formatted = data.map((item, index, array) => {
          if (index > 0 && item.stamp_count < array[index - 1].stamp_count) {
            currentRank = index + 1;
          }
          return { ...item, displayRank: currentRank };
        });
        setRankings(formatted);
      }
      setLoading(false);
    };
    fetchRankings();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING RANKING...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      <div className="w-full max-w-md flex items-center mb-8">
        <button onClick={() => router.push("/")} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="flex-1 text-center text-xl font-black italic text-orange-600 tracking-tighter mr-8">WORLD RANKING</h1>
      </div>

      <div className="w-full max-w-md space-y-3">
        {rankings.map((user, index) => {
          const rankAttr = getRank(user.stamp_count);
          const isTop3 = user.displayRank <= 3;

          return (
            <div key={user.user_id} className={`bg-white p-4 rounded-2xl shadow-sm border ${isTop3 ? 'border-orange-200 shadow-orange-100/50' : 'border-slate-50'} flex items-center gap-4`}>
              <div className={`w-8 text-center font-black italic ${user.displayRank === 1 ? 'text-yellow-500 text-xl' : 'text-slate-400'}`}>
                {user.displayRank === 1 ? "🥇" : user.displayRank === 2 ? "🥈" : user.displayRank === 3 ? "🥉" : user.displayRank}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <h4 className="font-black text-slate-800 tracking-tight">{user.nickname || "Unknown"}</h4>
                  <span className="text-orange-500 font-black text-sm italic">{user.stamp_count} <span className="text-[10px] text-slate-400 not-italic">Cups</span></span>
                </div>
                <div className={`px-2 py-0.5 rounded-lg inline-block border ${rankAttr.bg}`}>
                  <span className={`text-[9px] font-black uppercase ${rankAttr.color}`}>{rankAttr.title}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
