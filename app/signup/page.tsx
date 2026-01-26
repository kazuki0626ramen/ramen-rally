"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // メール認証後のリダイレクト先
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      alert("登録失敗: " + error.message);
    } else {
      alert("確認メールを送信しました！メール内のリンクをクリックして完了してください。");
      router.push("/login"); // 送信後はログイン画面へ
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#1A3A34] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D5A27] via-[#1A3A34] to-[#0D1F1C]" />
      
      <div className="relative z-10 mb-[-40px]">
        <span className="text-[120px] drop-shadow-2xl inline-block transform rotate-12">🍥</span>
      </div>

      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-[24px] shadow-2xl border border-white/20">
          <h1 className="text-3xl font-black text-center text-white mb-8 tracking-[0.2em] italic text-green-100">SIGN UP</h1>
          
          <form onSubmit={handleSignUp} className="flex flex-col gap-6">
            <input
              type="email"
              placeholder="New Email Address"
              className="w-full bg-white/10 border border-white/20 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-green-400 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Set Password"
              className="w-full bg-white/10 border border-white/20 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-green-400 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-emerald-700 text-white p-4 rounded-xl font-black shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
            </button>

            <div className="flex flex-col items-center gap-3">
              <button 
                type="button" 
                onClick={() => router.push("/login")}
                className="text-white/70 text-xs font-bold hover:text-green-400 transition-colors tracking-widest border-b border-transparent hover:border-green-400"
              >
                ログイン画面に戻る
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="absolute bottom-8 left-8 text-white/10 text-4xl transform -rotate-12">🍜</div>
    </main>
  );
}