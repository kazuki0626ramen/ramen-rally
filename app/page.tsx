"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function HomePage() {
  const [masterShops, setMasterShops] = useState<any[]>([]);
  const [visitedShopIds, setVisitedShopIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRallyData();
  }, []);

  const fetchRallyData = async () => {
    try {
      // 1. 現在のログインユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      
      // 2. 公式50店舗を取得
      const { data: shops } = await supabase
        .from("master_shops")
        .select("*")
        .order("area", { ascending: false });

      // 3. ユーザーが投稿した公式店舗のIDリストを取得
      if (user) {
        const { data: diaries } = await supabase
          .from("diaries")
          .select("master_shop_id")
          .eq("user_id", user.id)
          .not("master_shop_id", "is", null);

        if (diaries) {
          const ids = diaries.map(d => d.master_shop_id);
          setVisitedShopIds(Array.from(new Set(ids))); // 重複を排除
        }
      }

      if (shops) setMasterShops(shops);
    } catch (error) {
      console.error("データ取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  // 進捗率の計算
  const progress = masterShops.length > 0 
    ? Math.round((visitedShopIds.length / masterShops.length) * 100) 
    : 0;

  if (loading) return <div className="flex h-screen items-center justify-center font-black text-orange-500 italic">LOADING RALLY...</div>;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen pb-24 text-slate-900">
      <div className="max-w-md mx-auto">
        {/* ヘッダーセクション */}
        <header className="py-6 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-orange-500 tracking-[0.2em] uppercase">Season 2026</p>
            <h1 className="text-4xl font-black italic tracking-tighter leading-none">RAMEN<br/>RALLY 50</h1>
          </div>
          <Link href="/post" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition">
            POST +
          </Link>
        </header>

        {/* 進捗カード：ここが動くと感動します */}
        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-2xl mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xs font-bold opacity-60 mb-2 uppercase tracking-widest">Master Progress</h2>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-6xl font-black italic leading-none">{progress}</span>
              <span className="text-xl font-black italic opacity-40">%</span>
            </div>
            
            <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-bold opacity-50 text-right uppercase tracking-wider">
              {visitedShopIds.length} / {masterShops.length} SHOPS CLEARED
            </p>
          </div>
          <div className="absolute -right-6 -bottom-6 text-9xl opacity-10 grayscale rotate-12">🍜</div>
        </div>

        {/* エリア別スタンプリスト */}
        {["東京", "神奈川"].map(area => (
          <section key={area} className="mb-8">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                <span className="w-1 h-5 bg-orange-500 rounded-full" />
                {area} LEGENDS
              </h3>
            </div>
            
            <div className="space-y-2">
              {masterShops.filter(s => s.area === area).map(shop => {
                const isVisited = visitedShopIds.includes(shop.id);
                return (
                  <div 
                    key={shop.id}
                    className={`p-4 rounded-2xl flex items-center justify-between border-2 transition-all duration-500 ${
                      isVisited 
                      ? "bg-white border-orange-200 shadow-sm" 
                      : "bg-slate-100/50 border-transparent opacity-40 grayscale"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${isVisited ? 'bg-orange-100' : 'bg-slate-200'}`}>
                        {isVisited ? '⭐' : '🍲'}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-tight">{shop.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">100 Meiten Regular</p>
                      </div>
                    </div>
                    {isVisited && (
                      <div className="bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-sm">
                        DONE
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
