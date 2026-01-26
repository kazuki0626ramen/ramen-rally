"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();

        if (data && data.nickname) {
          setNickname(data.nickname);
        } else {
          setNickname(user.email?.split("@")[0] || "名無し麺");
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="p-8 flex flex-col items-center bg-[#FFF9F5] min-h-screen">
      {/* ヘッダーエリア */}
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
        >
          LOGOUT
        </button>
      </div>

      {/* ユーザープロフィールカード */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-orange-100/50 w-full max-w-sm border border-white text-center mb-6">
        <div className="text-4xl mb-2 relative inline-block">
          🍜
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Authenticated User</p>
        <h2 className="text-2xl font-black text-slate-800 mb-4">
          {loading ? "..." : nickname}
        </h2>
        
        <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-orange-800 text-sm font-bold">現在のランク: 駆け出し麺職人</p>
        </div>
      </div>

      {/* メインアクション：スタンプカードへの導線 */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        <button 
          onClick={() => router.push("/stamps")} // スタンプカードのページパスに合わせて変更してください
          className="group relative bg-orange-600 text-white p-6 rounded-[24px] font-black shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all active:scale-95 overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-left">
              <span className="block text-[10px] opacity-70 uppercase tracking-widest mb-1">Main Rally</span>
              <span className="text-xl">スタンプカードを開く</span>
            </div>
            <span className="text-3xl group-hover:translate-x-2 transition-transform">→</span>
          </div>
          {/* 装飾用の波紋 */}
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-500 rounded-full opacity-50 blur-2xl" />
        </button>

        {/* 設定への導線 */}
        <button 
          onClick={() => router.push("/profile")}
          className="bg-white text-slate-600 p-4 rounded-[20px] font-bold border border-slate-100 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          <span>👤</span> プロフィール設定を変更
        </button>
      </div>

      <p className="mt-12 text-slate-300 text-[10px] font-bold tracking-widest uppercase">
        © 2024 Ramen Rally Project
      </p>
    </main>
  );
}