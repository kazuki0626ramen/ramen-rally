"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [userLevel, setUserLevel] = useState<number>(1); // レベル用
  const [totalEaten, setTotalEaten] = useState<number>(0); // 累計杯数用
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("すべて");
  const [showUnvisitedOnly, setShowUnvisitedOnly] = useState(false);
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 50) return { title: "真・ラーメン大帝 👑", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-100" };
  };

  const rank = getRank(stamps.length);

  // レベルに基づいた進化段階 (5レベルごとに1段階)
  const evolutionStage = Math.ceil(userLevel / 5);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    
    // プロフィールからレベルと累計杯数を取得
    const { data: profile } = await supabase.from("profiles").select("nickname, level, total_eaten").eq("id", user.id).single();
    if (profile) {
      setNickname(profile.nickname || "Guest");
      setUserLevel(profile.level || 1);
      setTotalEaten(profile.total_eaten || 0);
    }

    const { data: shopData } = await supabase.from("master_shops").select("*").order("area", { ascending: false });
    if (shopData) setShops(shopData);
    const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
    if (stampData) setStamps(stampData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [router]);

  const handleAddStamp = async (shop: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isNow = confirm(`今「${shop.name}」にいますか？`);
    let type = 'memory';
    if (isNow) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const dist = getDistance(pos.coords.latitude, pos.coords.longitude, shop.latitude, shop.longitude);
        type = dist <= 200 ? 'checkin' : 'memory';
        await executeInsert(user.id, shop, type);
      }, () => executeInsert(user.id, shop, 'memory'));
    } else { await executeInsert(user.id, shop, 'memory'); }
  };

  const executeInsert = async (uid: string, shop: any, type: string) => {
    await supabase.from("stamps").insert({ user_id: uid, shop_id: shop.id, shop_name: shop.name, type });
    fetchData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING RALLY...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans relative">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY 50</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-black text-slate-400 uppercase">Logout</button>
      </div>

      {/* ユーザーカード（レベル・アバター表示版） */}
      <div className="w-full max-w-md bg-white p-6 rounded-[28px] shadow-lg border border-white mb-6">
        <div className="flex items-center">
          <div className="relative mr-4">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl border-2 border-orange-100 overflow-hidden">
               {/* 20段階のアバター画像をここに表示するイメージ（現在は段階に応じた絵文字） */}
               {evolutionStage >= 15 ? "🔥" : evolutionStage >= 10 ? "👨‍🍳" : evolutionStage >= 5 ? "🍜" : "👶"}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-orange-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white">
              Lv.{userLevel}
            </div>
          </div>
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

      {/* ...ナビゲーションボタンとエリアタブはそのまま... */}
      <div className="w-full max-w-md space-y-3 mb-6">
        <button onClick={() => router.push("/timeline")} className="w-full bg-white text-orange-600 py-4 rounded-[24px] font-black italic shadow-sm border-2 border-orange-100 flex items-center justify-center gap-3">
          <span className="text-xl">🌐</span><span className="tracking-widest uppercase text-sm">World Timeline</span>
        </button>
      </div>

      <div className="w-full max-w-md flex bg-white p-1.5 rounded-2xl shadow-sm border border-orange-50 mb-4">
        {["すべて", "東京", "神奈川"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? "bg-orange-500 text-white shadow-md" : "text-slate-400"}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ショップリスト */}
      <div className="w-full max-w-md space-y-4 mb-24">
        {shops.filter(s => activeTab === "すべて" || s.area === activeTab).map((shop) => {
          const isGot = stamps.some(st => st.shop_id === shop.id);
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isGot ? "bg-orange-100" : "bg-slate-50 opacity-40"}`}>🍲</div>
                <div>
                  <h4 className="font-black tracking-tight text-xs text-slate-800">{shop.name}</h4>
                  <button onClick={() => router.push(`/diary/${shop.id}`)} className="text-[8px] text-orange-600 font-black uppercase mt-1 block">📝 Log</button>
                </div>
              </div>
              <button onClick={() => isGot ? null : handleAddStamp(shop)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isGot ? "bg-orange-500 text-white" : "bg-white border-2 border-dashed border-slate-200"}`}>
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => router.push("/diary/new")}
        className="fixed bottom-8 right-6 w-16 h-16 bg-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl z-50 border-4 border-white"
      >
        <span className="font-bold">+</span>
      </button>
    </main>
  );
}
