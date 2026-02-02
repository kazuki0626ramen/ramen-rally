"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>("Guest User");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [rankIn, setRankIn] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchData() {
      // 1. ユーザー確認
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. 日記（LOG）の数を直接カウント（これが全ての正解になる）
      // .select('*', { count: 'exact' }) を使うことで、保存されている全レコードを数えます
      const { count, error: countError } = await supabase
        .from("diaries")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

      const totalEaten = count ?? 0; // これが最新の杯数
      const currentLevel = totalEaten + 1; // 1杯で1Lvアップ
      const currentExp = totalEaten * 100;

      // 3. プロフィール基本情報の取得（ニックネーム用）
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      // 4. UIに反映するデータをセット
      // DBの profiles.total_eaten が 20 のままでも、ここで最新の count を上書きします
      setProfile({
        ...(profileData || {}),
        total_eaten: totalEaten,
        total_exp: currentExp,
        level: currentLevel
      });
      setNickname(profileData?.nickname || "Guest User");

      // 5. ランキング判定（Top10）
      const { data: allDiaries } = await supabase.from("diaries").select("user_id");
      const counts: Record<string, number> = {};
      (allDiaries || []).forEach(d => counts[d.user_id] = (counts[d.user_id] || 0) + 1);
      const topUsers = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10).map(e => e[0]);
      setRankIn(topUsers.includes(user.id));

      // 6. レベルアップ演出判定
      const params = new URLSearchParams(window.location.search);
      if (params.get('levelup') === 'true') {
        setShowLevelUp(true);
        window.history.replaceState({}, '', window.location.pathname);
      }

      setLoading(false);

      // 7. バックグラウンドで profiles テーブルを同期（失敗しても表示には影響させない）
      if (profileData && (profileData.total_eaten !== totalEaten || profileData.level !== currentLevel)) {
        await supabase.from('profiles').update({
          total_eaten: totalEaten,
          level: currentLevel,
          total_exp: currentExp
        }).eq('id', user.id);
      }
    }

    fetchData();
  }, [router]);

  // --- UI表示用パーツ（絵文字・称号） ---
  const getEmoji = (lv: number) => {
    if (lv >= 50) return "👑";
    if (lv >= 20) return "👨‍🍳";
    return "🍜";
  };

  const getTitle = (lv: number) => {
    if (lv >= 30) return "伝説の麺神";
    if (lv >= 15) return "一流ラーメン師";
    return "麺見習い";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFFBF0] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 bg-[#FFFBF0] min-h-screen font-sans flex flex-col items-center text-slate-800 pb-24 relative overflow-hidden">
      
      {/* レベルアップ演出：showLevelUp が true の時だけ表示 */}
      {showLevelUp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setShowLevelUp(false)}>
           <div className="text-center animate-in zoom-in-125 duration-300">
              <div className="text-9xl mb-4">{getEmoji(profile?.level)}</div>
              <h2 className="text-white text-4xl font-black italic">LEVEL UP!</h2>
              <div className="text-orange-500 text-8xl font-black">Lv.{profile?.level}</div>
              <p className="text-yellow-400 text-2xl font-bold mt-4">{getTitle(profile?.level)}</p>
           </div>
        </div>
      )}

      {/* メインカード */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-xl border border-orange-100 mt-10">
        <div className="flex flex-col items-center">
          <div className="text-6xl mb-4 relative">
            {getEmoji(profile?.level)}
            {rankIn && <span className="absolute -top-2 -right-2 text-xs bg-yellow-400 px-2 py-1 rounded-full font-black">TOP 10</span>}
          </div>
          <p className="text-xs font-black text-orange-400 uppercase tracking-widest">{nickname}</p>
          <h2 className="text-5xl font-black text-slate-800 italic">Lv.{profile?.level}</h2>
          <p className="text-orange-600 font-bold mb-6">{getTitle(profile?.level)}</p>

          <div className="w-full grid grid-cols-2 gap-4 bg-orange-50 p-5 rounded-3xl text-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Total Eaten</p>
              <p className="text-3xl font-black text-slate-800">{profile?.total_eaten}<span className="text-sm ml-1">杯</span></p>
            </div>
            <div className="border-l border-orange-200">
              <p className="text-[10px] font-black text-slate-400 uppercase">Total EXP</p>
              <p className="text-3xl font-black text-slate-800">{profile?.total_exp}<span className="text-[10px] ml-1">pts</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* メニューボタン */}
      <div className="w-full max-w-md mt-8 space-y-4">
        <button onClick={() => router.push('/ranking')} className="w-full bg-white p-5 rounded-3xl flex items-center justify-between shadow-sm border border-orange-50">
          <span className="font-black text-slate-700">🏆 ランキングを見る</span>
          <span className="text-orange-300">❯</span>
        </button>
      </div>

      {/* 投稿ボタン */}
      <button onClick={() => router.push('/diary/default/new')} className="fixed bottom-8 right-6 w-20 h-20 bg-orange-500 text-white rounded-full shadow-2xl flex items-center justify-center text-4xl font-bold border-4 border-white">
        +
      </button>
    </main>
  );
}
