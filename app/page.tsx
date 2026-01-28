"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

// 距離計算関数
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("すべて");
  const [showUnvisitedOnly, setShowUnvisitedOnly] = useState(false);
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 50) return { title: "真・ラーメン大帝 👑", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.3)]" };
    if (count >= 45) return { title: "麺の解脱者", color: "text-fuchsia-700", bg: "bg-fuchsia-50", border: "border-fuchsia-100" };
    if (count >= 40) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" };
    if (count >= 35) return { title: "至高の啜り手", color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" };
    if (count >= 30) return { title: "伝説のラーメン王", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" };
    if (count >= 20) return { title: "百戦錬磨の麺客", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
    if (count >= 10) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
    if (count >= 5) return { title: "ラーメン愛好家", color: "text-green-600", bg: "bg-green-50", border: "border-green-100" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100" };
  };

  const rank = getRank(stamps.length);

  const filteredShops = shops.filter(shop => {
    const matchesArea = activeTab === "すべて" ? true : shop.area === activeTab;
    const isGot = stamps.some(s => String(s.shop_id) === String(shop.id));
    const matchesUnvisited = showUnvisitedOnly ? !isGot : true;
    return matchesArea && matchesUnvisited;
  });

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
    if (profile?.nickname) setNickname(profile.nickname);
    const { data: shopData } = await supabase.from("master_shops").select("*").order("area", { ascending: false });
    if (shopData) setShops(shopData);
    const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
    if (stampData) setStamps(stampData || []);
    const { data: diaryData } = await supabase.from("diaries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (diaryData) setDiaries(diaryData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleAddStamp = async (shop: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isNow = confirm(`今「${shop.name}」にいますか？\n【OK】位置判定（金のスタンプ）\n【キャンセル】過去の記録`);
    let finalType = 'memory';
    if (isNow) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, shop.latitude, shop.longitude);
        finalType = dist <= 200 ? 'checkin' : 'memory';
        if (dist > 200) alert(`お店から${Math.round(dist)}m離れているため通常スタンプになります。`);
        await executeInsert(user.id, shop, finalType);
      }, () => executeInsert(user.id, shop, 'memory'));
    } else { await executeInsert(user.id, shop, 'memory'); }
  };

  const executeInsert = async (uid: string, shop: any, type: string) => {
    await supabase.from("stamps").insert({ user_id: uid, shop_id: shop.id, shop_name: shop.name, type: type });
    fetchData();
  };

  const handleRemoveStamp = async (sid: string) => {
    if (!confirm("スタンプを取り消しますか？")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("stamps").delete().eq("user_id", user.id).eq("shop_id", sid);
      fetchData();
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING RALLY...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans relative">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY 50</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-black text-slate-400 uppercase">Logout</button>
      </div>

      {/* ユーザーカード */}
      <div className="w-full max-w-md bg-white p-6 rounded-[28px] shadow-lg border border-white mb-6">
        <div className="flex items-center">
          <div className="text-4xl mr-4">🍜</div>
          <div className="flex-1 text-left">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Rally Member</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{nickname}</h2>
          </div>
          <button onClick={() => router.push("/profile")} className="bg-orange-50 p-2 rounded-full">⚙️</button>
        </div>
        <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center justify-between transition-all duration-700 ${rank.bg} ${rank.border}`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${rank.color}`}>RANK: {rank.title}</span>
          <span className="text-[10px] font-bold text-slate-400 italic">{stamps.length} / {shops.length} Stamps</span>
        </div>
      </div>

      {/* ナビゲーションボタン */}
      <div className="w-full max-w-md space-y-3 mb-6">
        <button 
          onClick={() => router.push("/timeline")}
          className="w-full bg-white text-orange-600 py-4 rounded-[24px] font-black italic shadow-sm border-2 border-orange-100 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="text-xl">🌐</span><span className="tracking-widest uppercase text-sm">World Timeline</span>
        </button>

        <button 
          onClick={() => router.push("/ranking")} 
          className="w-full bg-gradient-to-r from-orange-600 to-orange-400 text-white py-4 rounded-[24px] font-black italic shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="text-xl">🏆</span><span className="tracking-widest uppercase text-sm">View World Ranking</span>
        </button>
      </div>

      {/* エリアタブ */}
      <div className="w-full max-w-md flex bg-white p-1.5 rounded-2xl shadow-sm border border-orange-50 mb-4">
        {["すべて", "東京", "神奈川"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? "bg-orange-500 text-white shadow-md" : "text-slate-400"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* 未訪問フィルタースイッチ */}
      <div className="w-full max-w-md flex items-center justify-end gap-2 mb-6 px-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">未訪問のみ表示</span>
        <button 
          onClick={() => setShowUnvisitedOnly(!showUnvisitedOnly)}
          className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${showUnvisitedOnly ? 'bg-orange-500' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${showUnvisitedOnly ? 'left-6' : 'left-1'}`} />
        </button>
      </div>

      {/* ショップリスト */}
      <div className="w-full max-w-md space-y-4 mb-24">
        <div className="flex items-center justify-between ml-2">
          <h3 className="font-black text-slate-700 italic text-sm tracking-tighter uppercase">{activeTab} のリスト</h3>
          <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-md">{filteredShops.length} 件</span>
        </div>

        {filteredShops.length > 0 ? (
          filteredShops.map((shop) => {
            const myStamp = stamps.find(s => String(s.shop_id) === String(shop.id));
            const isGot = !!myStamp;
            const isGold = myStamp?.type === 'checkin';
            return (
              <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-all duration-500 ${isGot ? (isGold ? "bg-yellow-100 ring-2 ring-yellow-400 scale-110" : "bg-orange-100") : "bg-slate-50 opacity-40 grayscale"}`}>
                    {isGold ? '🏆' : (isGot ? '⭐' : '🍲')}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-sm">{shop.area}</span>
                      {isGot && <span className="text-[7px] font-black px-1.5 py-0.5 bg-green-100 text-green-600 rounded-sm">CHECKED</span>}
                      {isGold && <span className="text-[7px] font-black px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded-sm">GOLD</span>}
                    </div>
                    <h4 className={`font-black tracking-tight leading-none mt-1 text-xs ${isGot ? "text-slate-800" : "text-slate-300"}`}>{shop.name}</h4>
                    <button onClick={() => router.push(`/diary/${shop.id}`)} className="text-[8px] text-orange-600 font-black uppercase mt-1 block">📝 Log Details</button>
                  </div>
                </div>
                <button 
                  onClick={() => isGot ? handleRemoveStamp(shop.id) : handleAddStamp(shop)} 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all shadow-md active:scale-90 ${isGot ? (isGold ? "bg-yellow-400 text-white shadow-yellow-100" : "bg-orange-500 text-white shadow-orange-100") : "bg-white border-2 border-dashed border-slate-200 text-transparent"}`}
                >
                  {isGot ? "🍥" : ""}
                </button>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-slate-300 font-black italic text-xs uppercase tracking-widest">No Shops Found</div>
        )}
      </div>

      {/* Floating Action Button (ステップ2のメイン追加) */}
      <button 
        onClick={() => router.push("/diary/new")}
        className="fixed bottom-8 right-6 w-16 h-16 bg-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl hover:scale-110 active:scale-95 transition-all z-50 border-4 border-white"
        style={{ boxShadow: '0 10px 30px -5px rgba(249, 115, 22, 0.6)' }}
      >
        <span className="font-bold">+</span>
      </button>
    </main>
  );
}
