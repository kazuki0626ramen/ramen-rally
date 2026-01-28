"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();

  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    handleLogin,
  } = useAuth();

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#b94a3a] via-[#8b2f23] to-[#5a1a14]">
      
      {/* やわらか装飾 */}
      <div className="absolute top-16 -left-24 w-72 h-72 bg-orange-300 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-16 -right-24 w-80 h-80 bg-yellow-200 rounded-full blur-3xl opacity-20" />

      {/* 🍜 */}
      <div className="relative z-10 mb-[-32px]">
        <span className="text-[96px] drop-shadow-xl">🍜</span>
      </div>

      {/* ログインカード */}
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/15 backdrop-blur-lg p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.25)] border border-white/20">

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-center text-white mb-1">
            おかえりなさい
          </h1>
          <p className="text-center text-white/70 text-sm mb-8">
            ログインして続けましょう 🍥
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Email */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                ✉️
              </span>
              <input
                type="email"
                placeholder="メールアドレス"
                className="w-full bg-white/20 border border-white/30 p-4 pl-12 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
                🔑
              </span>
              <input
                type="password"
                placeholder="パスワード"
                className="w-full bg-white/20 border border-white/30 p-4 pl-12 rounded-xl text-white placeholder-white/60 outline-none focus:ring-2 focus:ring-orange-400 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 rounded-xl font-bold shadow-lg hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50"
            >
              {loading ? "ログイン中…" : "ログインする"}
            </button>

            {/* Signup */}
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="text-white/80 text-xs hover:text-yellow-200 transition-colors"
              >
                はじめての方はこちら 🍥
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* 小さな飾り */}
      <div className="absolute bottom-6 right-6 text-white/20 text-3xl">✦</div>
    </main>
  );
}