"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Supabaseのパスワードリセット機能
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      alert("エラーが起きたみたいです: " + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#c04d3d] via-[#a1392b] to-[#6b1e15]">
      
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/20 text-center">
          
          <span className="text-6xl mb-4 block">📩</span>
          <h1 className="text-2xl font-black text-white mb-2">パスワードを忘れた？</h1>
          
          {sent ? (
            <div className="animate-in fade-in zoom-in duration-500">
              <p className="text-white/90 mb-6 leading-relaxed">
                メールを送ったよ！<br/>届いたリンクから新しいパスワードを決めてね 🍥
              </p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-white/20 text-white p-4 rounded-2xl font-bold hover:bg-white/30 transition-all"
              >
                ログイン画面に戻る
              </button>
            </div>
          ) : (
            <>
              <p className="text-white/70 text-sm mb-8">
                登録したメールアドレスを入力してね。<br/>再設定用のリンクを送るよ 🍜
              </p>

              <form onSubmit={handleReset} className="flex flex-col gap-5">
                <input
                  type="email"
                  placeholder="メールアドレス"
                  className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className={`p-4 rounded-2xl font-bold text-white shadow-lg transition-all ${
                    loading ? "bg-gray-600" : "bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110"
                  }`}
                >
                  {loading ? "送信中..." : "再設定メールを送る"}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-white/50 text-xs hover:text-white transition-colors"
                >
                  もどる
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
