"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [userLevel, setUserLevel] = useState<number>(1);
  const [stampsCount, setStampsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 50) return { title: "真・ラーメン大帝 👑", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.3)]" };
    if (count >= 20) return { title: "百戦錬磨の麺客", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100" };
  };

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    
    const { data: profile } = await supabase.from("profiles").select("nickname, level").eq("id", user.id).single();
    if (profile) {
      setNickname(profile.nickname || "Guest");
      setUserLevel(profile.level || 1);
    }

    const { data: stampData } = await supabase.from("stamps").select("id").eq("user_id", user.id);
    setStampsCount(stampData?.length || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">Loading Ramen World...</div>;

  const rank = getRank(stampsCount);
  const evolutionStage = Math.ceil(userLevel / 5);

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY 50</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-black text-slate-400 uppercase">Logout</button>
      </div>

      {/* ユーザーカード（現状維持） */}
      <div className="w-full max-w-md bg-white p-6 rounded-[28px] shadow-lg border border-white mb-8">
        <div className="flex items-center">
          <div className="relative mr-4">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl border-2 border-orange-100 overflow-hidden">
               {evolutionStage >= 15 ? "🔥" : evolutionStage >= 10 ? "👨‍🍳" : evolutionStage >= 5 ? "🍜" : "👶"}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
              Lv.{userLevel}
            </div>
          </div>
          <div className="flex-1 text-left">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Rally Member</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{nickname}</h2>
          </div>
          <button onClick={() => router.push("/profile")} className="bg-orange-50 p-2 rounded-full shadow-sm">⚙️</button>
        </div>
        <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center justify-between ${rank.bg} ${rank.border}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${rank.color}`}>RANK: {rank.title}</span>
          <span className="text-[10px] font-bold text-slate-400 italic">{stampsCount} / 50 Stamps</span>
        </div>
      </div>

      {/* メインメニュー：ここが新しいハブ機能です */}
      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        {/* スタンプ帳（一番大きく） */}
        <button 
          onClick={() => router.push("/stamps")}
          className="w-full bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-[32px] shadow-xl flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Collection</span>
            <h3 className="text-xl font-black italic tracking-wider">STAMP RALLY 🍜</h3>
          </div>
          <span className="text-4xl group-hover:rotate-12 transition-transform">🍥</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => router.push("/ranking")}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-orange-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <span className="text-2xl">🏆</span>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Ranking</span>
          </button>
          
          <button 
            onClick={() => router.push("/timeline")}
            className="bg-white p-5 rounded-[28px] shadow-sm border border-orange-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <span className="text-2xl">🌐</span>
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Timeline</span>
          </button>
        </div>

        <button 
          onClick={() => router.push("/diary/new")}
          className="w-full bg-white p-5 rounded-[28px] shadow-sm border-2 border-dashed border-orange-200 flex items-center justify-center gap-3 text-orange-600 active:scale-95 transition-all"
        >
          <span className="text-xl">✍️</span>
          <span className="text-xs font-black uppercase tracking-widest">New Record</span>
        </button>
      </div>
    </main>
  );
}
