"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

export default function HomePage() {
  const [masterShops, setMasterShops] = useState<any[]>([]);
  const [visitedShopIds, setVisitedShopIds] = useState<string[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]); // タイムライン用
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. 公式マスター店舗取得
      const { data: shops } = await supabase.from("master_shops").select("*");
      if (shops) setMasterShops(shops);

      // 2. タイムライン（全ユーザーの投稿）取得
      const { data: timeline } = await supabase
        .from("diaries")
        .select(`*, profiles(nickname, avatar_url)`)
        .order("created_at", { ascending: false })
        .limit(10);
      if (timeline) setDiaries(timeline);

      // 3. 自分の進捗取得
      if (user) {
        const { data: myVisits } = await supabase
          .from("diaries")
          .select("master_shop_id")
          .eq("user_id", user.id)
          .not("master_shop_id", "is", null);

        if (myVisits) {
          const ids = myVisits.map(d => d.master_shop_id);
          setVisitedShopIds(Array.from(new Set(ids)));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const progress = masterShops.length > 0 ? Math.round((visitedShopIds.length / masterShops.length) * 100) : 0;

  return (
    <main className="p-4 bg-[#FFF9F5] min-h-screen pb-24 text-slate-900">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <header className="py-4 flex justify-between items-center">
          <h1 className="text-2xl font-black italic tracking-tighter text-slate-900">RAMEN LOG</h1>
          <Link href="/post" className="bg-orange-500 text-white px-5 py-2 rounded-full font-black text-sm shadow-lg shadow-orange-200">
            POST +
          </Link>
        </header>

        {/* --- セクション1：スタンプラリー進捗 (新機能) --- */}
        <div className="bg-slate-900 rounded-[24px] p-5 text-white shadow-xl mb-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Rally Progress</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black italic">{progress}</span>
                <span className="text-sm font-black italic opacity-40">%</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold opacity-60 uppercase">Cleared</p>
              <p className="text-lg font-black italic">{visitedShopIds.length}/50</p>
            </div>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* --- セクション2：タイムライン (以前の機能) --- */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black italic uppercase">Latest Feed</h2>
            <Link href="/rally" className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              全50店舗リストを見る →
            </Link>
          </div>

          <div className="space-y-6">
            {diaries.map((diary) => (
              <div key={diary.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                {diary.image_url && (
                  <img src={diary.image_url} alt="ramen" className="w-full h-64 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-slate-800">{diary.shop_name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(diary.created_at).toLocaleDateString()}</p>
                    </div>
                    {diary.is_gold_stamp && (
                      <span className="bg-yellow-400 text-[8px] font-black px-2 py-1 rounded-full shadow-sm">GOLD STAMP</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed mb-3">{diary.comment}</p>
                  <div className="flex items-center gap-2 border-t pt-3">
                    <div className="w-6 h-6 bg-slate-200 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400">{diary.profiles?.nickname || "Guest"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
