"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function HomePage() {
  const [masterShops, setMasterShops] = useState<any[]>([]);
  const [visitedShopIds, setVisitedShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("麺活プレイヤー");

  useEffect(() => {
    fetchRallyData();
  }, []);

  const fetchRallyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      if (prof?.nickname) setUserName(prof.nickname);
    }
    
    // 1. 全50店舗を取得
    const { data: shops } = await supabase.from("master_shops").select("*").order("area", { ascending: false });
    
    // 2. 自分が投稿済みの公式店舗IDを取得
    const { data: diaries } = await supabase
      .from("diaries")
      .select("master_shop_id")
      .eq("user_id", user?.id)
      .not("master_shop_id", "is", null);

    if (shops) setMasterShops(shops);
    if (diaries) {
      const ids = diaries.map(d => d.master_shop_id);
      setVisitedShopIds(Array.from(new Set(ids))); // 重複排除
    }
    setLoading(false);
  };

  const progress = Math.round((visitedShopIds.length / 50) * 100);

  if (loading) return <div className="flex h-screen items-center justify-center font-black italic text-orange-500">LOADING...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen pb-24">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <header className="py-6">
          <p className="text-[10px] font-black text-orange-500 tracking-widest uppercase mb-1">Tokyo & Kanagawa 2026</p>
          <h1 className="text-4xl font-black italic text-slate-900 tracking-tighter leading-none">
            RAMEN <br /> RALLY 50
          </h1>
        </header>

        {/* 進捗カード */}
        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-sm font-bold opacity-70 mb-1">{userName} の達成率</h2>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black italic">{progress}</span>
              <span className="text-xl font-black italic opacity-50">%</span>
            </div>
            
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-bold opacity-50 text-right uppercase tracking-wider">
              {visitedShopIds.length} / 50 shops cleared
            </p>
          </div>
          {/* 背景の装飾的な「麺」 */}
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 grayscale">🍜</div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href="/post" className="bg-orange-500 text-white p-4 rounded-3xl text-center shadow-lg shadow-orange-200 active:scale-95 transition">
            <span className="block text-2xl mb-1">📍</span>
            <span className="text-xs font-black uppercase">Check-in</span>
          </Link>
          <Link href="/timeline" className="bg-white text-slate-900 p-4 rounded-3xl text-center shadow-sm border border-slate-100 active:scale-95 transition">
            <span className="block text-2xl mb-1">📱</span>
            <span className="text-xs font-black uppercase">Timeline</span>
          </Link>
        </div>

        {/* スタンプリスト（エリア別） */}
        {["東京", "神奈川"].map(area => (
          <section key={area} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black italic uppercase tracking-tight">{area} LEGENDS</h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-200 rounded-full">
                {visitedShopIds.filter(id => masterShops.find(s => s.id === id && s.area === area)).length} / {masterShops.filter(s => s.area === area).length}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {masterShops.filter(s => s.area === area).map(shop => {
                const isVisited = visitedShopIds.includes(shop.id);
                return (
                  <div 
                    key={shop.id}
                    className={`group relative p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${
                      isVisited 
                      ? "bg-white border-orange-200 shadow-sm" 
                      : "bg-white/50 border-slate-100 opacity-50 grayscale"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isVisited ? 'bg-orange-100' : 'bg-slate-100'}`}>
                        {isVisited ? '🧡' : '🍜'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none mb-1">{shop.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Legendary 100 Selected</p>
                      </div>
                    </div>
                    {isVisited && (
                      <div className="bg-yellow-400 text-[8px] font-black px-2 py-1 rounded-md rotate-12 shadow-sm">
                        CLEARED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
