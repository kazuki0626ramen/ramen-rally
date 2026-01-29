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
      {/* ヘッダー・プロフィール表示 */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-sm border border-orange-50 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🍜</div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Current Level</p>
          <h2 className="text-4xl font-black italic text-orange-600 tracking-tighter mb-4">
            LV.{profile?.level || 1}
          </h2>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Exp</p>
              <p className="text-2xl font-black text-slate-800">{profile?.total_exp || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Eaten</p>
              <p className="text-2xl font-black text-slate-800">{profile?.total_eaten || 0} <span className="text-sm">杯</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* メインアクション：記録する */}
      <button 
        onClick={() => router.push('/diary/default/new')}
        className="w-full max-w-md bg-orange-600 text-white p-6 rounded-[32px] shadow-xl shadow-orange-100 flex items-center justify-center space-x-3 active:scale-95 transition-all mb-8"
      >
        <span className="text-2xl">➕</span>
        <span className="text-lg font-black tracking-widest uppercase">Post New Record</span>
      </button>

      {/* サブアクション：ランキングと日記 */}
      <div className="w-full max-w-md grid grid-cols-1 gap-4">
        {/* ランキングボタン */}
        <button 
          onClick={() => router.push('/ranking')}
          className="w-full bg-white border-2 border-orange-100 p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">🏆</div>
            <div className="text-left">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global</div>
              <div className="text-lg font-black italic text-orange-600 tracking-tighter uppercase">Stamp Rally</div>
            </div>
          </div>
          <span className="text-orange-200 font-bold">→</span>
        </button>

        {/* 日記ボタン */}
        <button 
          onClick={() => router.push('/diaries')}
          className="w-full bg-white border-2 border-orange-100 p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-95 transition-all"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">📖</div>
            <div className="text-left">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal</div>
              <div className="text-lg font-black italic text-orange-600 tracking-tighter uppercase">Diary History</div>
            </div>
          </div>
          <span className="text-orange-200 font-bold">→</span>
        </button>
      </div>

      {/* フッター（ログアウトなどが必要な場合） */}
      <div className="mt-12 opacity-30 text-[10px] font-black tracking-widest text-slate-400 uppercase">
        Ramen Rally v1.0
      </div>
    </main>
  );
}
