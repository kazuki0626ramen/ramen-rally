"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    fetchProfile();
  }, []);

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      {/* 1. プロフィールカード（レベル・経験値・杯数） */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-sm border border-orange-50 mb-6 relative overflow-hidden">
        <div className="absolute -top-2 -right-2 p-4 opacity-10 text-7xl rotate-12">🍜</div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Status</p>
          <div className="flex items-baseline space-x-2 mb-4">
            <span className="text-4xl font-black italic text-orange-600 tracking-tighter">LV.{profile?.level || 1}</span>
            <span className="text-slate-300 font-bold text-sm">/ Master</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-orange-50 pt-4">
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Exp</p>
              <p className="text-2xl font-black text-slate-700">{profile?.total_exp || 0}<span className="text-[10px] ml-1">pts</span></p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total Eaten</p>
              <p className="text-2xl font-black text-slate-700">{profile?.total_eaten || 0}<span className="text-[10px] ml-1">杯</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. メインアクション：新規記録（スタンプ） */}
      <button 
        onClick={() => router.push('/diary/default/new')}
        className="w-full max-w-md bg-orange-600 text-white p-6 rounded-[32px] shadow-xl shadow-orange-100 flex items-center justify-between active:scale-95 transition-all mb-8 group"
      >
        <div className="flex items-center space-x-4">
          <span className="text-3xl group-hover:rotate-12 transition-transform">➕</span>
          <span className="text-lg font-black tracking-tighter uppercase italic">Post New Record</span>
        </div>
        <span className="bg-orange-500/50 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">+1 EXP</span>
      </button>

      {/* 3. ナビゲーションメニュー（ランキング・日記） */}
      <div className="w-full max-w-md space-y-4">
        
        {/* ランキング / スタンプラリー */}
        <button 
          onClick={() => router.push('/ranking')}
          className="w-full bg-white border-2 border-orange-100 p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
            <div className="text-left">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking</div>
              <div className="text-lg font-black italic text-orange-600 tracking-tighter uppercase">Stamp Rally</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-orange-200">→</div>
        </button>

        {/* ワールド日記 / 全体公開日記 */}
        <button 
          onClick={() => router.push('/diaries')}
          className="w-full bg-white border-2 border-orange-100 p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">🌏</div>
            <div className="text-left">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Feed</div>
              <div className="text-lg font-black italic text-orange-600 tracking-tighter uppercase">World Diary</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-orange-200">→</div>
        </button>

        {/* マイ日記 */}
        <button 
          onClick={() => router.push('/my-diary')}
          className="w-full bg-white border-2 border-orange-100 p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">📖</div>
            <div className="text-left">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Logs</div>
              <div className="text-lg font-black italic text-orange-600 tracking-tighter uppercase">Your History</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-orange-200">→</div>
        </button>

      </div>

      {/* バージョン表示 */}
      <div className="mt-12 opacity-30 text-[9px] font-black tracking-[0.3em] text-slate-400 uppercase">
        Ramen Rally Original UI v1.2
      </div>
    </main>
  );
}
