"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

function computeLevelFromDiaries(totalEaten: number) {
  const level = totalEaten + 1;
  const totalExp = totalEaten * 100;
  const percent = 100;
  return { level, totalExp, percent };
}

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState<string>("Guest User");
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [rankIn, setRankIn] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) router.push("/login");
          return;
        }

        // ========== 1. プロフィール取得 ==========
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("[fetchData] Profile fetch error:", profileError);
        }

        // ========== 2. ショップ・スタンプ取得（並列） ==========
        const [shopRes, stampRes] = await Promise.all([
          supabase.from("shops").select("*").order("created_at", { ascending: true }),
          supabase.from("stamps").select("*").eq("user_id", user.id),
        ]);

        if (isMounted) {
          if (shopRes.data) setShops(shopRes.data);
          if (stampRes.data) setStamps(stampRes.data);
        }

        // ========== 3. diaries 件数取得（マスターデータ） ==========
        const { count: diaryCount, error: countError } = await supabase
          .from("diaries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        if (countError) {
          console.error("[fetchData] Diary count error:", countError);
        }

        const totalEaten = typeof diaryCount === "number" ? diaryCount : 0;
        console.log(`[fetchData] User: ${user.id}, totalEaten: ${totalEaten}`);
        const computed = computeLevelFromDiaries(totalEaten);

        // ========== 4. State 即座セット（UI非ブロック） ==========
        if (isMounted) {
          setProfile({
            ...(profileData || {}),
            total_eaten: totalEaten,
            total_exp: computed.totalExp,
            level: computed.level,
          });
          setNickname(profileData?.nickname || "Guest User");
        }

        // ========== 5. レベルアップ演出判定 ==========
        const params = new URLSearchParams(window.location.search);
        if (params.get("levelup") === "true") {
          if (isMounted) setShowLevelUp(true);
          window.history.replaceState({}, "", window.location.pathname);
        }

        // ========== 6. DB 非同期同期（画面更新を待たない） ==========
        (async () => {
          try {
            const updates: Record<string, any> = {};
            if (!profileData || profileData.total_eaten !== totalEaten) {
              updates.total_eaten = totalEaten;
            }
            if (!profileData || profileData.total_exp !== computed.totalExp) {
              updates.total_exp = computed.totalExp;
            }
            if (!profileData || profileData.level !== computed.level) {
              updates.level = computed.level;
            }

            if (Object.keys(updates).length > 0) {
              await supabase.from("profiles").update(updates).eq("id", user.id);
            }
          } catch (e) {
            console.warn("[fetchData] Async profile sync error:", e);
          }
        })();

        // ========== 7. ランキング内でのTop10判定（バッジ表示用） ==========
        async function checkRankIn(uid: string): Promise<boolean> {
          try {
            // --- 杯数（diaries の投稿数、.limit(10000)で上限回避） ---
            const { data: diariesAll, error: diariesError } = await supabase
              .from("diaries")
              .select("user_id,created_at")
              .limit(10000);

            if (diariesError) {
              console.error("[checkRankIn] Diaries fetch error:", diariesError);
              return false;
            }

            const cupCountMap: Record<string, number> = {};
            (diariesAll || []).forEach((d: any) => {
              cupCountMap[d.user_id] = (cupCountMap[d.user_id] || 0) + 1;
            });

            // 型安全なソート：[string, number][] として処理
            const cupRank: string[] = Object.entries(cupCountMap)
              .sort((a, b) => {
                const countA = typeof a[1] === "number" ? a[1] : 0;
                const countB = typeof b[1] === "number" ? b[1] : 0;
                return countB - countA;
              })
              .map((e) => e[0]);

            // --- Lv（計算ベース：diaryCount + 1） ---
            const allUserIds = Object.keys(cupCountMap);
            const lvRank: string[] = allUserIds
              .map((userId) => ({
                id: userId,
                level: (cupCountMap[userId] || 0) + 1,
              }))
              .sort((a, b) => b.level - a.level)
              .map((x) => x.id);

            // --- スタンプ（ユニーク shop ごと、.limit(10000)で上限回避） ---
            const { data: stampsAll, error: stampsError } = await supabase
              .from("stamps")
              .select("user_id,shop_id,created_at")
              .limit(10000);

            if (stampsError) {
              console.error("[checkRankIn] Stamps fetch error:", stampsError);
              return false;
            }

            const stampMap: Record<string, Set<string>> = {};
            (stampsAll || []).forEach((s: any) => {
              if (!stampMap[s.user_id]) {
                stampMap[s.user_id] = new Set<string>();
              }
              stampMap[s.user_id]!.add(s.shop_id);
            });

            // 型安全なソート：[string, number][] として処理
            const stampRank: string[] = Object.entries(stampMap)
              .map((e): [string, number] => [e[0], e[1].size])
              .sort((a, b) => b[1] - a[1])
              .map((e) => e[0]);

            const inCup = cupRank.slice(0, 10).includes(uid);
            const inLv = lvRank.slice(0, 10).includes(uid);
            const inStamp = stampRank.slice(0, 10).includes(uid);

            return inCup || inLv || inStamp;
          } catch (e) {
            console.error("[checkRankIn] Error:", e);
            return false;
          }
        }

        const isRankIn = await checkRankIn(user.id);
        if (isMounted) {
          setRankIn(Boolean(isRankIn));
          setLoading(false);
        }
      } catch (error) {
        console.error("[fetchData] Unexpected error:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // --- 演出用useEffect：canvas-confetti + rr-shake ---
  useEffect(() => {
    let shakeTimeout: any = null;
    if (showLevelUp) {
      (async () => {
        try {
          const confettiMod = await import("canvas-confetti");
          const confetti = (confettiMod as any).default || confettiMod;
          confetti({
            particleCount: 200,
            spread: 160,
            origin: { y: 0.4 },
            colors: ["#FFA500", "#FFD700", "#FF8C00"],
          });
        } catch (e) {
          // ライブラリなくてもOK
        }
      })();
      if (overlayRef.current) {
        overlayRef.current.classList.add("rr-shake");
        shakeTimeout = setTimeout(() => {
          overlayRef.current?.classList.remove("rr-shake");
        }, 700);
      }
    }
    return () => {
      if (shakeTimeout) clearTimeout(shakeTimeout);
    };
  }, [showLevelUp]);

  const stage = Math.min(Math.ceil((profile?.level || 1) / 5), 20);
  const avatarUrl = `/avatars/stage-${stage}.png`;
  const getEmoji = (lv: number) => {
    if (lv >= 90) return "👑";
    if (lv >= 50) return "👨‍🍳";
    if (lv >= 20) return "🍜";
    return "👶";
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF0] text-orange-600 font-black italic uppercase">
        Loading Rally...
      </div>
    );

  return (
    <main className="p-6 bg-[#FFFBF0] min-h-screen font-sans flex flex-col items-center text-slate-800 pb-24 relative overflow-hidden">
      {/* --- レベルアップ演出オーバーレイ --- */}
      {showLevelUp && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowLevelUp(false)}
        >
          <div className="absolute w-[600px] h-[600px] bg-orange-600/20 rounded-full animate-ping opacity-30" />
          <div className="relative flex flex-col items-center text-center">
            <div className="relative w-48 h-48 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full border-8 border-white shadow-[0_0_90px_rgba(249,115,22,1)] flex items-center justify-center mb-6 animate-in zoom-in-150 duration-500">
              <span className="text-8xl drop-shadow-2xl">
                {getEmoji(profile?.level || 1)}
              </span>
              <div className="absolute -bottom-6 bg-white text-orange-600 font-black px-6 py-1 rounded-sm skew-x-[-20deg] border-2 border-orange-600 shadow-2xl text-[12px]">
                LEVEL UP!
              </div>
            </div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-orange-200 italic mb-4 animate-in slide-in-from-bottom-10 duration-700">
              レベル昇格
            </h2>
            <div className="flex items-center justify-center gap-6 animate-in zoom-in-50 delay-300 duration-500">
              <span className="text-white/40 text-3xl font-black italic">
                LV.{profile?.level ? profile.level - 1 : 0}
              </span>
              <span className="text-white text-4xl opacity-50">▶</span>
              <span className="text-8xl font-black text-orange-500 italic drop-shadow-[0_0_40px_rgba(249,115,22,1)] animate-bounce">
                {profile?.level || 1}
              </span>
            </div>
            <div className="mt-6">
              <h3 className="text-2xl font-black text-yellow-300 drop-shadow-md">
                {profile
                  ? profile.level >= 11
                    ? "麺神"
                    : profile.level >= 6
                      ? "ラーメン愛好家"
                      : "麺見習い"
                  : ""}
              </h3>
            </div>
            <p className="mt-12 text-white/50 text-[10px] font-black tracking-[0.5em] animate-pulse">
              TAP TO CONTINUE
            </p>
          </div>
        </div>
      )}

      {/* --- ロゴ --- */}
      <div className="w-full max-w-md flex justify-center py-4 mb-2">
        <h1 className="text-2xl font-black text-orange-500 tracking-tight flex items-center gap-2">
          <span className="text-3xl">🍜</span> RAMEN RALLY
        </h1>
      </div>

      {/* --- プロフィールカード --- */}
      <div className="w-full max-w-md bg-white p-8 rounded-[40px] shadow-[0_10px_25px_-5px_rgba(249,115,22,0.1)] border border-orange-100 mb-8 relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-orange-50 rounded-full opacity-50 z-0" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-28 h-28 bg-orange-100 rounded-full flex items-center justify-center text-6xl mb-4 border-4 border-white shadow-md overflow-hidden bg-gradient-to-b from-orange-50 to-orange-100 relative">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  getEmoji(profile?.level || 1);
              }}
            />
            {rankIn && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-300 via-yellow-100 to-white text-orange-600 px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-2 animate-pulse">
                <span className="text-sm">✨</span>
                <span>RANK IN!</span>
              </div>
            )}
          </div>
          <div className="mb-6">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">
              {nickname}
            </p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
              Lv.
              <span className="text-orange-500">{profile?.level || 1}</span>
            </h2>
          </div>
          <div className="w-full grid grid-cols-2 gap-6 bg-orange-50/50 p-5 rounded-[28px] border border-orange-100/50 mb-4">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Total Eaten
              </p>
              <p className="text-2xl font-black text-slate-800">
                {profile?.total_eaten ?? 0}
                <span className="text-xs ml-1 font-bold">杯</span>
              </p>
            </div>
            <div className="border-l border-orange-200/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Total EXP
              </p>
              <p className="text-2xl font-black text-slate-800">
                {profile?.total_exp ?? 0}
                <span className="text-[10px] ml-1 uppercase">pts</span>
              </p>
            </div>
          </div>

          {/* 経験値プログレスバー */}
          <div className="w-full px-2">
            <div className="flex justify-between text-[9px] font-black text-slate-400 mb-1 tracking-widest uppercase">
              <span>Next Level</span>
              <span>100%</span>
            </div>
            <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 transition-all duration-1000 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* --- メニューボタン --- */}
      <div className="w-full max-w-md space-y-4">
        <MenuButton
          icon="🏆"
          color="#FEF3C7"
          label="Leaderboard"
          title="Ranking"
          onClick={() => router.push("/ranking")}
        />
        <MenuButton
          icon="🗺️"
          color="#FFEDD5"
          label="Area Mission"
          title="Stamp Rally"
          onClick={() => router.push("/stamps")}
        />
        <MenuButton
          icon="🌏"
          color="#F3E8FF"
          label="Global Feed"
          title="Timeline"
          onClick={() => router.push("/timeline")}
        />
      </div>

      {/* --- 浮動Log（投稿）ボタン --- */}
      <button
        onClick={() => router.push("/diary/new")}
        className="fixed bottom-8 right-6 w-20 h-20 bg-orange-500 text-white rounded-full shadow-xl flex flex-col items-center justify-center active:scale-90 transition-all z-50 border-4 border-white"
      >
        <span className="text-3xl font-bold">+</span>
        <span className="text-[10px] font-black uppercase tracking-tighter">Log</span>
      </button>
    </main>
  );
}

function MenuButton({
  icon,
  color,
  label,
  title,
  onClick,
}: {
  icon: string;
  color: string;
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white p-5 rounded-[32px] flex items-center space-x-4 shadow-sm border border-orange-50/50 active:scale-95 transition-all text-left group"
    >
      <div
        style={{ backgroundColor: color }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-6 transition-transform"
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </div>
        <div className="text-lg font-black text-slate-700 tracking-tight">
          {title}
        </div>
      </div>
      <div className="text-orange-200 font-black pr-2">❯</div>
    </button>
  );
}
