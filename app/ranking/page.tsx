"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

type RankItem = { id: string; name: string; value: number };

function getStartOfMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function RankingPage() {
  const router = useRouter();
  const [active, setActive] = useState<"lv" | "cup" | "stamp">("lv");
  const [monthly, setMonthly] = useState(true);
  const [list, setList] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const startISO = getStartOfMonthISO();

      // profiles map for names
      const { data: profiles } = await supabase.from("profiles").select("id,nickname,level");
      const nameMap: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { nameMap[p.id] = p; });

      if (active === "lv") {
        const arr = (profiles || []).map((p: any) => ({ id: p.id, name: p.nickname || "NoName", value: p.level || 0 }));
        arr.sort((a, b) => b.value - a.value);
        setList(arr);
        // my rank
        const { data: user } = await supabase.auth.getUser();
        const uid = (user as any)?.user?.id;
        setMyRank(uid ? arr.findIndex(x => x.id === uid) + 1 || null : null);
        setLoading(false);
        return;
      }

      if (active === "cup") {
        // diaries: count per user
        const q = supabase.from("diaries").select("user_id,created_at");
        if (monthly) q.gte("created_at", startISO);
        const { data: diaries } = await q;
        const map: Record<string, number> = {};
        (diaries || []).forEach((d: any) => { map[d.user_id] = (map[d.user_id] || 0) + 1; });
        const arr: RankItem[] = Object.entries(map).map(([id, v]) => ({ id, name: nameMap[id]?.nickname || "Guest", value: v }));
        arr.sort((a, b) => b.value - a.value);
        setList(arr);
        const { data: user } = await supabase.auth.getUser();
        const uid = (user as any)?.user?.id;
        setMyRank(uid ? arr.findIndex(x => x.id === uid) + 1 || null : null);
        setLoading(false);
        return;
      }

      if (active === "stamp") {
        const q = supabase.from("stamps").select("user_id,shop_id,created_at");
        if (monthly) q.gte("created_at", startISO);
        const { data: stamps } = await q;
        const map: Record<string, Set<string>> = {};
        (stamps || []).forEach((s: any) => {
          map[s.user_id] = map[s.user_id] || new Set();
          map[s.user_id].add(s.shop_id);
        });
        const arr: RankItem[] = Object.entries(map).map(([id, set]) => ({ id, name: nameMap[id]?.nickname || "Guest", value: (set as Set<string>).size }));
        arr.sort((a, b) => b.value - a.value);
        setList(arr);
        const { data: user } = await supabase.auth.getUser();
        const uid = (user as any)?.user?.id;
        setMyRank(uid ? arr.findIndex(x => x.id === uid) + 1 || null : null);
        setLoading(false);
        return;
      }
    }
    load();
  }, [active, monthly]);

  return (
    <main className="p-6 bg-[#FFFBF0] min-h-screen font-sans text-slate-800">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-orange-500">ランキング</h1>
            <p className="text-sm text-slate-500">カテゴリと期間で切り替えて表示</p>
          </div>
          <button className="text-xs font-black text-orange-500" onClick={() => router.push('/')}>← マイページへ</button>
        </header>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 mb-4">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setActive('lv')} className={`flex-1 py-2 rounded-lg font-black ${active==='lv' ? 'bg-orange-200 text-orange-800' : 'bg-orange-50 text-slate-600'}`}>Lv</button>
            <button onClick={() => setActive('cup')} className={`flex-1 py-2 rounded-lg font-black ${active==='cup' ? 'bg-orange-200 text-orange-800' : 'bg-orange-50 text-slate-600'}`}>杯数</button>
            <button onClick={() => setActive('stamp')} className={`flex-1 py-2 rounded-lg font-black ${active==='stamp' ? 'bg-orange-200 text-orange-800' : 'bg-orange-50 text-slate-600'}`}>スタンプ</button>
          </div>

          <div className="flex items-center justify-end gap-3 mb-2">
            <div className="text-[11px] font-black text-slate-400">期間</div>
            <button onClick={() => setMonthly(true)} className={`px-3 py-1 rounded-full font-bold ${monthly ? 'bg-orange-500 text-white' : 'bg-orange-50 text-slate-600'}`}>月間</button>
            <button onClick={() => setMonthly(false)} className={`px-3 py-1 rounded-full font-bold ${!monthly ? 'bg-orange-500 text-white' : 'bg-orange-50 text-slate-600'}`}>累計</button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-orange-500 font-black">集計中…</div>
          ) : (
            <div>
              <ol className="space-y-2">
                {list.slice(0, 50).map((item, idx) => (
                  <li key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-md font-black text-lg"
                        style={{ background: idx===0 ? 'linear-gradient(90deg,#FFD700,#FFC107)' : idx===1 ? 'linear-gradient(90deg,#C0C0C0,#D1D5DB)' : idx===2 ? 'linear-gradient(90deg,#CD7F32,#F1C6A9)' : '#fff' }}>
                        {idx<3 ? (idx===0? '👑' : idx===1 ? '🥈' : '🥉') : idx+1}
                      </div>
                      <div>
                        <div className="font-black text-slate-800">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.id}</div>
                      </div>
                    </div>
                    <div className="font-black text-orange-600">{item.value}</div>
                  </li>
                ))}
              </ol>

              <div className="fixed left-0 right-0 bottom-6 mx-auto max-w-3xl px-6">
                <div className="bg-white p-3 rounded-xl shadow-md border border-orange-50 text-center font-black">
                  現在の自分の順位： {myRank && myRank > 0 ? `${myRank}位` : '圏外'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; // パスを ../../ に修正しました
import { useRouter } from "next/navigation";

export default function RankingPage() {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 10) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50" };
    if (count >= 8) return { title: "伝説 of 麺", color: "text-purple-600", bg: "bg-purple-50" };
    if (count >= 5) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50" };
    if (count >= 3) return { title: "愛好家", color: "text-green-600", bg: "bg-green-50" };
    if (count >= 1) return { title: "職人見習い", color: "text-orange-600", bg: "bg-orange-50" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50" };
  };

  useEffect(() => {
    const fetchRankings = async () => {
      // supabaseの接続確認
      const { data, error } = await supabase.from("user_rankings").select("*");
      if (error) {
        console.error(error);
      } else if (data) {
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      <div className="w-full max-w-md flex items-center mb-8">
        <button onClick={() => router.push("/")} className="p-2 -ml-2 text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="flex-1 text-center text-xl font-black italic text-orange-600 tracking-tighter mr-8">WORLD RANKING</h1>
      </div>
      <div className="w-full max-w-md space-y-3">
        {rankings.map((user) => {
          const rankAttr = getRank(user.stamp_count);
          return (
            <div key={user.user_id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4">
              <div className="w-8 text-center font-black italic text-slate-400">
                {user.displayRank === 1 ? "🥇" : user.displayRank === 2 ? "🥈" : user.displayRank === 3 ? "🥉" : user.displayRank}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <h4 className="font-black text-slate-800 tracking-tight">{user.nickname || "User"}</h4>
                  <span className="text-orange-500 font-black text-sm italic">{user.stamp_count} 杯</span>
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
