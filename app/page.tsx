"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center text-slate-800">
      
      {/* 1. プロフィールカード */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-sm border border-orange-50 mb-6 relative overflow-hidden">
        <div className="absolute -top-2 -right-2 p-4 opacity-10 text-7xl rotate-12">🍜</div>
        <div className="relative z-10 text-left">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Status</p>
          <div className="flex items-baseline space-x-2 mb-4">
            <span className="text-4xl font-black italic text-orange-600 tracking-tighter">LV.{profile?.level || 1}</span>
            <span className="text-slate-300 font-bold text-sm">/ Master</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-orange-50 pt-4">
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Exp</p>
              <p className="text-2xl font-black text-slate-700">{profile?.total_exp || 0}<span className="text-[10px] ml-1 uppercase">pts</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Eaten</p>
              <p className="text-2xl font-black text-slate-700">{profile?.total_eaten || 0}<span className="text-[10px] ml-1">杯</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. メインアクション：記録する */}
      <button 
        onClick={() => router.push('/diary/default/new')}
        className="w-full max-w-md bg-orange-600 text-white p-6 rounded-[32px] shadow-xl shadow-orange-100 flex items-center justify-between active:scale-95 transition-all mb-8 group"
      >
        <div className="flex items-center space-x-4 text-left">
          <span className="text-3xl group-hover:rotate-12 transition-transform">➕</span>
          <span className="text-lg font-black tracking-tighter uppercase italic leading-none">Post New Record</span>
        </div>
        <span className="bg-orange-500/50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">+1 EXP</span>
      </button>

      {/* 3. ナビゲーションメニュー */}
      <div className="w-full max-w-md space-y-3">
        
        {/* スタンプラリー（エリア別：東京・神奈川など） */}
        <button 
          onClick={() => router.push('/stamps')} 
          className="w-full bg-white border-2 border-orange-100 p-5 rounded-[28px] flex items-center justify-between shadow-sm active:scale-95 transition-all text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🗺️</div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Area Mission</div>
              <div className="text-md font-black italic text-orange-600 tracking-tighter uppercase">Stamp Rally</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-orange-200 text-xs">→</div>
        </button>

        {/* ランキング（順位表示画面） */}
        <button 
          onClick={() => router.push('/ranking')}
          className="w-full bg-white border-2 border-orange-100 p-5 rounded-[28px] flex items-center justify-between shadow-sm active:scale-95 transition-all text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🏆</div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leaderboard</div>
              <div className="text-md font-black italic text-orange-600 tracking-tighter uppercase">Ranking</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-orange-200 text-xs">→</div>
        </button>

        {/* タイムライン（旧：ワールドダイアリー） */}
        <button 
          onClick={() => router.push('/diary')}
          className="w-full bg-white border-2 border-orange-100 p-5 rounded-[28px] flex items-center justify-between shadow-sm active:scale-95 transition-all text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🌏</div>
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Feed</div>
              <div className="text-md font-black italic text-orange-600 tracking-tighter uppercase">Timeline</div>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-orange-200 text-xs">→</div>
        </button>

      </div>

      <div className="mt-10 opacity-30 text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase">
        Ramen Rally Integrated UI v1.5
      </div>
    </main>
  );
}
