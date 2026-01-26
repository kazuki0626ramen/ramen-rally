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
      // 1. 現在ログインしているユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. profilesテーブルからニックネームを取得
        const { data, error } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();

        if (data && data.nickname) {
          setNickname(data.nickname);
        } else {
          // ニックネームが未設定ならメールアドレスの一部などを出すか、そのままGuestにする
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
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        <button 
          onClick={handleLogout}
          className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
        >
          LOGOUT
        </button>
      </div>

      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-orange-100/50 w-full max-w-sm border border-white text-center">
        <div className="text-4xl mb-2">🍜</div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Welcome back</p>
        <h2 className="text-2xl font-black text-slate-800">
          {loading ? "..." : nickname}
        </h2>
        
        <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <p className="text-orange-800 text-sm font-bold">現在のランク: 麺通</p>
        </div>
      </div>

      {/* ここにスタンプカードなどのコンテンツが続く */}
      <button 
        onClick={() => router.push("/profile")}
        className="mt-8 text-orange-600 text-sm font-bold hover:underline"
      >
        プロフィールを編集する
      </button>
    </main>
  );
}