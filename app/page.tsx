"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from "next/navigation";

export default function Home() {
  const [shops, setShops] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [myStamps, setMyStamps] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const { data: shopData } = await supabase.from('shops').select('*').order('shop_id', { ascending: true });
      if (shopData) setShops(shopData);

      if (user) {
        const { data: stampData } = await supabase.from('stamps').select('shop_id').eq('user_id', user.id);
        if (stampData) setMyStamps(stampData.map(s => s.shop_id));
      }
    };
    fetchData();
  }, []);

  const toggleStamp = async (shopId: number) => {
    if (!user) {
      alert("ログインが必要です！");
      router.push("/login");
      return;
    }
    if (myStamps.includes(shopId)) {
      await supabase.from('stamps').delete().eq('user_id', user.id).eq('shop_id', shopId);
      setMyStamps(myStamps.filter(id => id !== shopId));
    } else {
      await supabase.from('stamps').insert({ user_id: user.id, shop_id: shopId });
      setMyStamps([...myStamps, shopId]);
    }
  };

  // --- 称号と進捗の計算 ---
  const progressCount = myStamps.length;
  const totalShops = shops.length;
  const progressPercentage = totalShops > 0 ? (progressCount / totalShops) * 100 : 0;

  const getRank = (count: number) => {
    if (count >= 100) return { title: "伝説のラーメン王", color: "text-purple-600", icon: "👑" };
    if (count >= 80) return { title: "ラーメン大将", color: "text-red-600", icon: "🚩" };
    if (count >= 50) return { title: "ラーメン鉄人", color: "text-blue-600", icon: "🍳" };
    if (count >= 30) return { title: "ラーメン職人", color: "text-green-600", icon: "🥢" };
    if (count >= 10) return { title: "ラーメン修行僧", color: "text-yellow-600", icon: "🍜" };
    return { title: "ラーメン見習い", color: "text-orange-400", icon: "🥚" };
  };

  const rank = getRank(progressCount);

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans text-slate-800">
      {/* ヘッダー */}
      <header className="flex justify-between items-center max-w-md mx-auto mb-8">
        <h1 className="text-2xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        {user ? (
          <button onClick={() => supabase.auth.signOut().then(() => setUser(null))} className="text-[10px] font-bold bg-white shadow-sm border border-slate-100 px-3 py-2 rounded-xl uppercase tracking-widest text-slate-400 hover:text-red-400 transition-colors">Logout</button>
        ) : (
          <button onClick={() => router.push("/login")} className="text-xs font-bold bg-orange-500 text-white px-4 py-2 rounded-xl shadow-lg shadow-orange-200">Login</button>
        )}
      </header>

      {/* プロフィール & 称号カード */}
      <section className="max-w-md mx-auto mb-10 bg-white p-6 rounded-[32px] shadow-xl shadow-orange-100/50 border border-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full -mr-8 -mt-8 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              {rank.icon}
            </div>
            <div>
              <p className={`text-sm font-black uppercase tracking-widest ${rank.color}`}>{rank.title}</p>
              <p className="text-xs text-slate-400 font-medium">{user?.email || "Guest User"}</p>
            </div>
          </div>

          <div className="flex justify-between items-end mb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tighter">{progressCount}</span>
              <span className="text-slate-300 font-bold text-xl">/ {totalShops}</span>
            </div>
            <span className="text-xl font-black text-orange-500 mb-1">{Math.round(progressPercentage)}%</span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-[2px]">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(249,115,22,0.4)]"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </section>

      {/* お店リスト */}
      <div className="max-w-md mx-auto space-y-4">
        <h3 className="text-sm font-black text-slate-400 ml-2 mb-2 uppercase tracking-[0.2em]">Shop List</h3>
        {shops.map((shop) => {
          const isStamped = myStamps.includes(shop.shop_id);
          return (
            <button 
              key={shop.shop_id} 
              onClick={() => toggleStamp(shop.shop_id)}
              className={`w-full p-5 rounded-[24px] transition-all duration-300 flex items-center gap-4 group relative ${
                isStamped 
                ? 'bg-orange-50 border-2 border-orange-200 shadow-sm' 
                : 'bg-white border-2 border-transparent hover:border-slate-100 shadow-md shadow-slate-200/50'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${
                isStamped ? 'bg-orange-500 text-white scale-110 shadow-lg shadow-orange-200' : 'bg-slate-50 text-slate-200'
              }`}>
                {isStamped ? '✔️' : '🍜'}
              </div>
              
              <div className="flex-1 text-left">
                <h2 className={`font-bold leading-tight ${isStamped ? 'text-orange-900' : 'text-slate-700'}`}>{shop.shop_name}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">📍 {shop.area}</p>
              </div>

              {isStamped && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-2 w-2 rounded-full bg-orange-400 animate-ping" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </main>
  );
}