"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

// 距離計算ロジック（そのまま維持）
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export default function StampsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("すべて");
  const [showUnvisitedOnly, setShowUnvisitedOnly] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    
    // マスターショップ情報と自分のスタンプ情報を取得
    const { data: shopData } = await supabase.from("master_shops").select("*").order("area", { ascending: false });
    if (shopData) setShops(shopData);
    const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
    if (stampData) setStamps(stampData || []);
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [router]);

  // スタンプ追加ロジック（そのまま維持）
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
    fetchData(); // 再読み込み
  };

  const handleRemoveStamp = async (shopId: string) => {
    if (!confirm("スタンプを取り消しますか？")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("stamps").delete().eq("user_id", user.id).eq("shop_id", shopId);
      fetchData();
    }
  };

  // フィルタリング処理
  const filteredShops = shops.filter(shop => {
    const matchesArea = activeTab === "すべて" ? true : shop.area === activeTab;
    const isGot = stamps.some(s => String(s.shop_id) === String(shop.id));
    return matchesArea && (showUnvisitedOnly ? !isGot : true);
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">Loading Shops...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      {/* 上部ナビゲーション */}
      <div className="w-full max-w-md flex items-center mb-6">
        <button onClick={() => router.push("/")} className="text-slate-400 text-sm font-black mr-4">← BACK</button>
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">STAMP RALLY</h1>
      </div>

      {/* エリアタブ */}
      <div className="w-full max-w-md flex bg-white p-1.5 rounded-2xl shadow-sm border border-orange-50 mb-4">
        {["すべて", "東京", "神奈川"].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === tab ? "bg-orange-500 text-white shadow-md" : "text-slate-400"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 表示切り替えオプション */}
      <div className="w-full max-w-md flex items-center justify-end gap-2 mb-4 px-2">
        <span className="text-[10px] font-black text-slate-400 uppercase">未訪問のみ表示</span>
        <button 
          onClick={() => setShowUnvisitedOnly(!showUnvisitedOnly)} 
          className={`w-8 h-4 rounded-full relative transition-colors ${showUnvisitedOnly ? 'bg-orange-500' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showUnvisitedOnly ? 'left-4.5' : 'left-0.5'}`} />
        </button>
      </div>

      {/* ショップリスト */}
      <div className="w-full max-w-md space-y-4 mb-10">
        {filteredShops.map((shop) => {
          const myStamp = stamps.find(s => String(s.shop_id) === String(shop.id));
          const isGot = !!myStamp;
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between transition-all active:bg-orange-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isGot ? (myStamp?.type === 'checkin' ? "bg-yellow-100 ring-2 ring-yellow-400" : "bg-orange-100") : "bg-slate-50 opacity-40 grayscale"}`}>
                  {myStamp?.type === 'checkin' ? '🏆' : (isGot ? '⭐' : '🍲')}
                </div>
                <div>
                  <h4 className={`font-black tracking-tight text-xs ${isGot ? "text-slate-800" : "text-slate-300"}`}>{shop.name}</h4>
                  <div className="flex gap-2">
                    <button onClick={() => router.push(`/diary/${shop.id}`)} className="text-[8px] text-orange-600 font-black uppercase mt-1">📝 Log</button>
                    {shop.area && <span className="text-[8px] text-slate-300 font-black uppercase mt-1">📍 {shop.area}</span>}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => isGot ? handleRemoveStamp(shop.id) : handleAddStamp(shop)} 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-md active:scale-90 transition-all ${isGot ? "bg-orange-500 text-white" : "bg-white border-2 border-dashed border-slate-200"}`}
              >
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}

        {filteredShops.length === 0 && (
          <div className="text-center py-10">
            <p className="text-slate-300 font-black italic text-sm uppercase">No Shops Found...</p>
          </div>
        )}
      </div>
    </main>
  );
}
