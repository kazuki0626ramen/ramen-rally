"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // スタンプの最大数
  const MAX_STAMPS = 10;

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 1. プロフィール(ニックネーム)取得
      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();
      
      if (profile?.nickname) setNickname(profile.nickname);

      // 2. スタンプ履歴取得
      const { data: stampData } = await supabase
        .from("stamps")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (stampData) setStamps(stampData);
      
      setLoading(false);
    };

    fetchData();
  }, [router]);

  // スタンプを押す処理
  const handleAddStamp = async () => {
    if (stamps.length >= MAX_STAMPS) {
      alert("コンプリートおめでとうございます！");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("stamps").insert({
      user_id: user.id,
      shop_name: "ラーメン屋", // 必要に応じて変更
    });

    if (error) {
      alert("スタンプの取得に失敗しました");
    } else {
      // 画面上のスタンプを更新
      const { data: updatedStamps } = await supabase
        .from("stamps")
        .select("*")
        .eq("user_id", user.id);
      if (updatedStamps) setStamps(updatedStamps);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-bold italic animate-pulse">
      LOADING RAMEN RALLY...
    </div>
  );

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 hover:text-red-500 tracking-widest">LOGOUT</button>
      </div>

      {/* ユーザープロフィールカード */}
      <div className="bg-white p-5 rounded-[28px] shadow-lg shadow-orange-100/50 w-full max-w-sm border border-white text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="text-3xl">🍜</div>
          <div className="text-left">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Welcome back</p>
            <h2 className="text-xl font-black text-slate-800">{nickname}</h2>
          </div>
          <button 
            onClick={() => router.push("/profile")}
            className="ml-auto bg-slate-50 p-2 rounded-full hover:bg-orange-50 transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* スタンプカード本体 */}
      <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-orange-200/40 w-full max-w-sm border-2 border-orange-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl font-black italic uppercase">Rally</div>
        
        <div className="flex justify-between items-end mb-6">
          <h3 className="font-black text-slate-700 italic tracking-tighter">STAMP CARD</h3>
          <p className="text-[10px] font-bold text-orange-500">{stamps.length} / {MAX_STAMPS}</p>
        </div>

        {/* スタンプ台紙 */}
        <div className="grid grid-cols-5 gap-3 mb-8">
          {Array.from({ length: MAX_STAMPS }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-full flex items-center justify-center text-xl shadow-inner border-2 transition-all duration-500
                ${i < stamps.length 
                  ? "bg-orange-100 border-orange-400 scale-100" 
                  : "bg-slate-50 border-slate-100 text-transparent scale-90"}`}
            >
              {i < stamps.length ? "🍥" : ""}
            </div>
          ))}
        </div>

        {/* スタンプを押すボタン */}
        <button 
          onClick={handleAddStamp}
          disabled={stamps.length >= MAX_STAMPS}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-200 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          {stamps.length >= MAX_STAMPS ? "COMPLETE!" : "STAMP GET!"}
        </button>
      </div>

      <p className="mt-8 text-slate-300 text-[10px] font-black tracking-[0.3em] uppercase">
        Step up to Ramen Master
      </p>
    </main>
  );
}