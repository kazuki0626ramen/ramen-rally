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
    <main className="p-6 bg-[#FFFBF0] min-h-screen font-sans flex flex-col items-center text-slate-800 pb-24">
      
      {/* ロゴエリア */}
      <div className="w-full max-w-md flex justify-center py-4 mb-2">
        <h1 className="text-2xl font-black text-orange-500 tracking-tight flex items-center gap-2">
          <span className="text-3xl">🍜</span> RAMEN RALLY
        </h1>
      </div>

      {/* 1. ユーザープロフィールカード（可愛らしいデザイン） */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-[0_10px_25px_-5px_rgba(249,115,22,0.1)] border border-orange-100 mb-8 relative overflow-hidden">
        {/* 背景の薄いデコレーション */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-orange-50 rounded-full opacity-50 z-0" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* アバター枠 */}
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-5xl mb-4 border-4 border-white shadow-sm overflow-hidden">
             {/* 将来的にはここに stage-X.png を入れる */}
             { (profile?.level || 1) >= 10 ? "👨‍🍳" : "👶" }
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Ramen Eater</p>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
              Lv.<span className="text-orange-500">{profile?.level || 1}</span> 
              <span className="text-lg text-slate-400 ml-2">/ Master</span>
            </h2>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-6 bg-orange-50/50 p-5 rounded-[28px]">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Eaten</p>
              <p className="text-2xl font-black text-slate-800">{profile?.total_eaten || 0}<span className="text-xs ml-1 font-bold">杯</span></p>
            </div>
            <div className="border-l border-orange-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total EXP</p>
              <p className="text-2xl font-black text-slate-800">{profile?.total_exp || 0}<span className="text-[10px] ml-1 uppercase">pts</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ナビゲーションメニュー */}
      <div className="w-full max-w-md space-y-4">
        
        {/* スタンプラリー */}
        <button 
          onClick={() => router.push('/stamps')} 
          className="w-full bg-white p-5 rounded-[30px] flex items-center space-x-4 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-50 active:scale-95 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-[#FFEDD5] rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">🗺️</div>
          <div className="flex-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Area Mission</div>
            <div className="text-lg font-black text-slate-700 tracking-tight">Stamp Rally</div>
          </div>
          <div className="text-orange-200 font-black">❯</div>
        </button>

        {/* ランキング */}
        <button 
          onClick={() => router.push('/ranking')}
          className="w-full bg-white p-5 rounded-[30px] flex items-center space-x-4 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-50 active:scale-95 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-[#FEF3C7] rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">🏆</div>
          <div className="flex-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Leaderboard</div>
            <div className="text-lg font-black text-slate-700 tracking-tight">Ranking</div>
          </div>
          <div className="text-orange-200 font-black">❯</div>
        </button>

        {/* タイムライン */}
        <button 
          onClick={() => router.push('/timeline')}
          className="w-full bg-white p-5 rounded-[30px] flex items-center space-x-4 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-50 active:scale-95 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-[#F3E8FF] rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">🌏</div>
          <div className="flex-1">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">Global Feed</div>
            <div className="text-lg font-black text-slate-700 tracking-tight">Timeline</div>
          </div>
          <div className="text-orange-200 font-black">❯</div>
        </button>

      </div>

      {/* 3. 記録する：右下の浮かぶボタン（FAB） */}
      <button 
        onClick={() => router.push('/diary/default/new')}
        className="fixed bottom-8 right-6 w-18 h-18 bg-orange-500 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(249,115,22,0.5)] flex flex-col items-center justify-center active:scale-90 transition-all z-50 border-4 border-white p-4"
      >
        <span className="text-2xl font-bold leading-none">+</span>
        <span className="text-[9px] font-black uppercase tracking-tighter">Post</span>
      </button>

      <div className="mt-12 opacity-20 text-[8px] font-black tracking-[0.4em] text-slate-400 uppercase">
        Super Ramen Rally v2.0
      </div>
    </main>
  );
}
