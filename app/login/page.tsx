"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("ログイン失敗: " + error.message);
    } else {
      router.push("/");
      router.refresh(); // 状態を最新にする
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#8B0000] overflow-hidden">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#b22222] via-[#8B0000] to-[#4a0000]" />
      
      {/* 雲のような装飾エフェクト */}
      <div className="absolute top-10 -left-20 w-64 h-64 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-red-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />

      {/* ラーメン画像（少し上に配置） */}
      <div className="relative z-10 mb-[-40px] transition-transform duration-700 hover:scale-110">
        <span className="text-[120px] drop-shadow-2xl inline-block transform -rotate-12">🍜</span>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full flex justify-center">
            <div className="w-1 h-12 bg-white/20 blur-md rounded-full animate-bounce delay-75" />
            <div className="w-1 h-16 bg-white/10 blur-md rounded-full animate-bounce mx-2" />
            <div className="w-1 h-10 bg-white/20 blur-md rounded-full animate-bounce delay-150" />
        </div>
      </div>

      {/* ログインカード */}
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-[24px] shadow-2xl border border-white/20">
          <h1 className="text-3xl font-black text-center text-white mb-8 tracking-[0.2em] italic">LOGIN</h1>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">👤</span>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-white/10 border border-white/20 p-4 pl-12 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">🔒</span>
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-white/10 border border-white/20 p-4 pl-12 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 rounded-xl font-black shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN"}
            </button>

            <div className="flex flex-col items-center gap-3">
              <button 
                type="button" 
                onClick={() => router.push("/signup")} 
                className="text-white/70 text-xs font-bold hover:text-yellow-400 transition-colors tracking-widest border-b border-transparent hover:border-yellow-400"
              >
                初めての方はこちら（新規登録）
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="absolute bottom-8 right-8 text-white/20 text-4xl transform rotate-45">✦</div>
    </main>
  );
}