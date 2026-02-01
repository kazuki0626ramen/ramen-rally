"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false); // 昇格演出の表示管理

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        // 【演出ロジック】もしレベルが前回より上がっていたら演出を出す
        // ※デバッグ用：初回ログイン時やレベルが1以上の時に演出を見たい場合はここを調整
        if (data && data.level > 1) {
          setShowLevelUp(true);
          // 3秒後に自動で閉じる
          setTimeout(() => setShowLevelUp(false), 3000);
        }
        
        setProfile(data);
      }
    }
    fetchProfile();
  }, []);

  // 【アバター判定】5レベルごとに1〜20のステージを計算
  const stage = Math.min(Math.ceil((profile?.level || 1) / 5), 20);
  const avatarUrl = `/avatars/stage-${stage}.png`;

  // 絵文字バックアップ（画像がない時用）
  const getEmoji = (lv: number) => {
    if (lv >= 90) return "👑";
    if (lv >= 50) return "👨‍🍳";
    if (lv >= 20) return "🍜";
    return "👶";
  };

  return (
    <main className="p-6 bg-[#FFFBF0] min-h-screen font-sans flex flex-col items-center text-slate-800 pb-24 relative">
      
      {/* --- 将棋ウォーズ風：レベル昇格演出レイヤー --- */}
      {showLevelUp && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 animate-in fade-in duration-500"
          onClick={() => setShowLevelUp(false)}
        >
          <div className="text-center animate-bounce">
            <p className="text-orange-500 text-xl font-black mb-2 tracking-[0.5em] drop-shadow-lg">LEVEL UP</p>
            <h2 className="text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_0_15px_rgba(249,115,22,0.8)]">
              レベル昇格
            </h2>
            <div className="mt-4 text-white font-bold bg-orange-600 px-6 py-2 rounded-full inline-block">
              LV.{profile?.level} REACHED!
            </div>
          </div>
        </div>
      )}

      {/* ロゴエリア */}
      <div className="w-full max-w-md flex justify-center py-4 mb-2">
        <h1 className="text-2xl font-black text-orange-500 tracking-tight flex items-center gap-2">
          <span className="text-3xl">🍜</span> RAMEN RALLY
        </h1>
      </div>

      {/* 1. ユーザープロフィールカード */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-[0_10px_25px_-5px_rgba(249,115,22,0.1)] border border-orange-100 mb-8 relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-orange-50 rounded-full opacity-50 z-0" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* アバター枠（画像があれば表示、なければ絵文字） */}
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

      {/* 2. ナビゲーションメニュー */}
      <div className="w-full max-w-md space-y-4">
        <MenuButton icon="🗺️" color="#FFEDD5" label="Area Mission" title="Stamp Rally" onClick={() => router.push('/stamps')} />
        <MenuButton icon="🏆" color="#FEF3C7" label="Leaderboard" title="Ranking" onClick={() => router.push('/ranking')} />
        <MenuButton icon="🌏" color="#F3E8FF" label="Global Feed" title="Timeline" onClick={() => router.push('/timeline')} />
      </div>

      {/* 3. 記録する（FAB） */}
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

// 共通ボタンコンポーネント
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
