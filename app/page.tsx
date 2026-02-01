"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        // 演出ロジック：レベル1より上ならデモとして表示
        if (data && data.level > 1) {
          setShowLevelUp(true);
        }
        setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  const stage = Math.min(Math.ceil((profile?.level || 1) / 5), 20);
  const avatarUrl = `/avatars/stage-${stage}.png`;

  const getEmoji = (lv: number) => {
    if (lv >= 90) return "👑";
    if (lv >= 50) return "👨‍🍳";
    if (lv >= 20) return "🍜";
    return "👶";
  };

  return (
    <main className="p-6 bg-[#FFFBF0] min-h-screen font-sans flex flex-col items-center text-slate-800 pb-24 relative overflow-hidden">
      
      {/* --- 【追加】CoDモバイル風：超ド派手レベルアップ演出 --- */}
      {showLevelUp && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowLevelUp(false)}
        >
          {/* 衝撃波 */}
          <div className="absolute w-[600px] h-[600px] bg-orange-600/20 rounded-full animate-ping opacity-30" />
          
          <div className="relative flex flex-col items-center">
            {/* 背後の光の筋 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40 scale-150">
              <div className="w-1 h-[800px] bg-gradient-to-t from-transparent via-orange-400 to-transparent rotate-45 animate-pulse" />
              <div className="w-1 h-[800px] bg-gradient-to-t from-transparent via-orange-400 to-transparent -rotate-45 animate-pulse" />
            </div>

            {/* メインエンブレム */}
            <div className="relative w-44 h-44 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full border-8 border-white shadow-[0_0_60px_rgba(249,115,22,1)] flex items-center justify-center mb-10 animate-in zoom-in-150 duration-500 ease-out">
              <span className="text-7xl drop-shadow-2xl">{getEmoji(profile?.level || 1)}</span>
              <div className="absolute -bottom-5 bg-white text-orange-600 font-black px-6 py-1 rounded-sm skew-x-[-20deg] border-2 border-orange-600 shadow-2xl text-[10px] tracking-tighter">
                LEVEL UP!
              </div>
            </div>

            {/* 文字情報 */}
            <div className="text-center">
              <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-200 italic tracking-tighter mb-4 animate-in slide-in-from-bottom-10 duration-700">
                レベル昇格
              </h2>
              <div className="flex items-center justify-center gap-6 animate-in zoom-in-50 delay-300 duration-500">
                <span className="text-white/40 text-3xl font-black italic tracking-tighter">LV.{profile?.level ? profile.level - 1 : 0}</span>
                <span className="text-white text-4xl opacity-50">▶</span>
                <span className="text-8xl font-black text-orange-500 italic drop-shadow-[0_0_40px_rgba(249,115,22,1)] animate-bounce">
                  {profile?.level || 1}
                </span>
              </div>
            </div>
            <p className="mt-20 text-white/50 text-[10px] font-black tracking-[0.5em] animate-pulse">TAP TO CONTINUE</p>
          </div>
        </div>
      )}

      {/* --- メインUI（ここから下は元の機能を完璧に維持） --- */}
      <div className="w-full max-w-md flex justify-center py-4 mb-2">
        <h1 className="text-2xl font-black text-orange-500 tracking-tight flex items-center gap-2">
          <span className="text-3xl">🍜</span> RAMEN RALLY
        </h1>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-[0_10px_25px_-5px_rgba(249,115,22,0.1)] border border-orange-100 mb-8 relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-orange-50 rounded-full opacity-50 z-0" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-28 h-28 bg-orange-100 rounded-full flex items-center justify-center text-6xl mb-4 border-4 border-white shadow-md overflow-hidden bg-gradient-to-b from-orange-50 to-orange-100">
             <img 
               src={avatarUrl} 
               alt="Avatar" 
               className="w-full h-full object-cover"
               onError={(e) => {
                 (e.target as HTMLImageElement).style.display = 'none';
                 (e.target as HTMLImageElement).parentElement!.innerHTML = getEmoji(profile?.level || 1);
               }}
             />
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Ramen Eater</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
              Lv.<span className="text-orange-500">{profile?.level || 1}</span> 
              <span className="text-lg text-slate-400 ml-2 italic">/ Master</span>
            </h2>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-6 bg-orange-50/50 p-5 rounded-[28px] border border-orange-100/50">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Eaten</p>
              <p className="text-2xl font-black text-slate-800">{profile?.total_eaten || 0}<span className="text-xs ml-1 font-bold">杯</span></p>
            </div>
            <div className="border-l border-orange-200/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total EXP</p>
              <p className="text-2xl font-black text-slate-800">{profile?.total_exp || 0}<span className="text-[10px] ml-1 uppercase">pts</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <MenuButton icon="🗺️" color="#FFEDD5" label="Area Mission" title="Stamp Rally" onClick={() => router.push('/stamps')} />
        <MenuButton icon="🏆" color="#FEF3C7" label="Leaderboard" title="Ranking" onClick={() => router.push('/ranking')} />
        <MenuButton icon="🌏" color="#F3E8FF" label="Global Feed" title="Timeline" onClick={() => router.push('/timeline')} />
      </div>

      <button 
        onClick={() => router.push('/diary/default/new')}
        className="fixed bottom-8 right-6 w-20 h-20 bg-orange-500 text-white rounded-full shadow-[0_15px_30px_-5px_rgba(249,115,22,0.4)] flex flex-col items-center justify-center active:scale-90 transition-all z-50 border-4 border-white"
      >
        <span className="text-3xl font-bold leading-none">+</span>
        <span className="text-[10px] font-black uppercase tracking-tighter">Log</span>
      </button>
    </main>
  );
}

function MenuButton({ icon, color, label, title, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className="w-full bg-white p-5 rounded-[32px] flex items-center space-x-4 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.03)] border border-orange-50/50 active:scale-95 transition-all text-left group"
    >
      <div style={{ backgroundColor: color }} className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
        <div className="text-lg font-black text-slate-700 tracking-tight">{title}</div>
      </div>
      <div className="text-orange-200 font-black pr-2">❯</div>
    </button>
  );
}
