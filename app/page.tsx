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
  const [activeTab, setActiveTab] = useState<string>("すべて"); // タブの状態
  const [popup, setPopup] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 30) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50" };
    if (count >= 20) return { title: "伝説のラーメン王", color: "text-purple-600", bg: "bg-purple-50" };
    if (count >= 10) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50" };
    if (count >= 5) return { title: "ラーメン愛好家", color: "text-green-600", bg: "bg-green-50" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50" };
  };

  const rank = getRank(stamps.length);

  // フィルタリングされたショップ
  const filteredShops = shops.filter(shop => 
    activeTab === "すべて" ? true : shop.area === activeTab
  );

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

  // スタンプ追加・削除ロジック（前回の内容を継承）
  const handleAddStamp = async (shop: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const isNow = confirm(`今「${shop.name}」にいますか？\n【OK】位置を確認して金のスタンプを狙う\n【キャンセル】過去の記録として通常スタンプ`);
    let finalType = 'memory';

    if (isNow) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const dist = getDistance(latitude, longitude, shop.latitude, shop.longitude);
        if (dist <= 200) { finalType = 'checkin'; }
        else { alert(`お店から約${Math.round(dist)}m離れています。通常スタンプになります。`); }
        await executeInsert(user.id, shop, finalType);
      }, () => { alert("位置情報エラー。通常スタンプを付与します。"); executeInsert(user.id, shop, 'memory'); });
    } else { await executeInsert(user.id, shop, 'memory'); }
  };

  const executeInsert = async (userId: string, shop: any, type: string) => {
    const { error } = await supabase.from("stamps").insert({ user_id: userId, shop_id: shop.id, shop_name: shop.name, type: type });
    if (!error) { 
      const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", userId);
      setStamps(updatedStamps || []); 
    }
  };

  const handleRemoveStamp = async (shopId: string) => {
    if (!confirm("スタンプを取り消しますか？")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("stamps").delete().eq("user_id", user.id).eq("shop_id", shopId);
    const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
    setStamps(updatedStamps || []);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic text-sm tracking-widest">LOADING RAMEN DATA...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans relative">
      {/* ヘッダー・ユーザーカード（既存通り） */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY 50</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-black text-slate-400 uppercase">Logout</button>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-lg shadow-orange-100/30 w-full max-w-md border border-white mb-6">
        <div className="flex items-center w-full">
          <div className="text-4xl mr-4">🍜</div>
          <div className="text-left flex-1">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Rally Member</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{nickname}</h2>
          </div>
          <button onClick={() => router.push("/profile")} className="bg-orange-50 p-2 rounded-full">⚙️</button>
        </div>
        <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center justify-between ${rank.bg}`}>
          <span className={`text-[10px] font-black uppercase ${rank.color}`}>RANK: {rank.title}</span>
          <span className="text-[10px] font-bold text-slate-400 italic">{stamps.length} / {shops.length} Stamps</span>
        </div>
      </div>

      {/* エリア切り替えタブ */}
      <div className="w-full max-w-md flex bg-white p-1.5 rounded-2xl shadow-sm border border-orange-50 mb-6">
        {["すべて", "東京", "神奈川"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab 
                ? "bg-orange-500 text-white shadow-md shadow-orange-100" 
                : "text-slate-400 hover:text-orange-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ショップリスト（フィルタリング済み） */}
      <div className="w-full max-w-md space-y-4 mb-10">
        <div className="flex items-center justify-between ml-2">
          <h3 className="font-black text-slate-700 italic text-sm tracking-tighter uppercase">{activeTab} のお店</h3>
          <span className="text-[9px] font-bold text-slate-400">{filteredShops.length} 店舗表示中</span>
        </div>

        {filteredShops.map((shop) => {
          const myStamp = stamps.find(s => String(s.shop_id) === String(shop.id));
          const isGot = !!myStamp;
          const isGold = myStamp?.type === 'checkin';
          
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-inner 
                  ${isGot ? (isGold ? "bg-yellow-100 ring-2 ring-yellow-400" : "bg-orange-100") : "bg-slate-50 opacity-40 grayscale"}`}>
                  {isGold ? '🏆' : (isGot ? '⭐' : '🍲')}
                </div>
                <div>
                  <span className="text-[8px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-sm">{shop.area}</span>
                  <h4 className={`font-black tracking-tight leading-none mt-1 ${isGot ? "text-slate-800" : "text-slate-300"}`}>{shop.name}</h4>
                  <button onClick={() => router.push(`/diary/${shop.id}`)} className="text-[9px] text-orange-600 font-black uppercase mt-2 block">📝 Write Log</button>
                </div>
              </div>
              <button 
                onClick={() => isGot ? handleRemoveStamp(shop.id) : handleAddStamp(shop)} 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-md active:scale-90 
                  ${isGot 
                    ? (isGold ? "bg-yellow-400 text-white" : "bg-orange-500 text-white") 
                    : "bg-white border-2 border-dashed border-slate-200 text-transparent"}`}>
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
