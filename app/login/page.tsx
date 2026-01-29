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
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#c04d3d] via-[#a1392b] to-[#6b1e15]">
      
      {/* 背景の柔らかな光 */}
      <div className="absolute top-20 -left-20 w-80 h-80 bg-orange-400 rounded-full blur-[100px] opacity-25 animate-pulse" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-yellow-300 rounded-full blur-[120px] opacity-20" />

      {/* 🍜 ラーメンセクション */}
      <div className={`relative z-10 mb-[-24px] flex flex-col items-center transition-all duration-700 ${loading ? 'scale-90 opacity-50' : 'animate-bounce [animation-duration:3s]'}`}>
        {/* 湯気のエフェクト */}
        <div className="flex gap-2 mb-[-10px]">
          <div className="w-1.5 h-8 bg-white/30 rounded-full blur-sm animate-pulse [animation-delay:0.2s]" />
          <div className="w-1.5 h-12 bg-white/20 rounded-full blur-sm animate-pulse [animation-delay:0.5s]" />
          <div className="w-1.5 h-10 bg-white/30 rounded-full blur-sm animate-pulse [animation-delay:0.8s]" />
        </div>
        <span className="text-[100px] drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)] select-none">
          🍜
        </span>
      </div>

      {/* ログインカード */}
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight">
              おかえりなさい！
            </h1>
            <div className="h-1 w-12 bg-orange-400 mx-auto my-2 rounded-full" />
            <p className="text-white/70 text-sm font-medium">
              今日も美味しい一杯を 🍥
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Email 入力時に✉️が動く & オートコンプリート対応 */}
            <div className="group relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl transition-transform group-focus-within:scale-125 group-focus-within:-rotate-12">
                ✉️
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="メールアドレス"
                className="w-full bg-black/20 border border-white/10 p-4 pl-14 rounded-2xl text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-orange-400 focus:bg-black/30 transition-all shadow-inner"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password: オートコンプリート対応 */}
            <div className="group relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl transition-transform group-focus-within:scale-125 group-focus-within:rotate-12">
                🔑
              </span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                placeholder="パスワード"
                className="w-full bg-black/20 border border-white/10 p-4 pl-14 rounded-2xl text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-orange-400 focus:bg-black/30 transition-all shadow-inner"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* 送信ボタン：loading中の色変化を追加 */}
            <button
              type="submit"
              disabled={loading}
              className={`mt-2 relative group overflow-hidden p-4 rounded-2xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
                loading 
                ? "bg-gray-600 cursor-not-allowed" 
                : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_10px_20px_-5px_rgba(249,115,22,0.5)]"
              }`}
            >
              <span className="relative z-10 text-white">
                {loading ? "麺をゆでています..." : "ログインする"}
              </span>
              {!loading && (
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              )}
            </button>

            {/* 各種リンク */}
            <div className="flex flex-col gap-4 mt-2 items-center">
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-white/50 text-[10px] hover:text-orange-200 transition-colors border-b border-transparent hover:border-orange-200 pb-0.5"
              >
                パスワードを忘れた方はこちら 🍥
              </button>

              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="text-white/80 text-xs font-bold hover:text-yellow-200 transition-colors flex items-center justify-center gap-2"
              >
                <span>はじめての方はこちら</span>
                <span className="animate-bounce">🍥</span>
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* 画面端の小さな星 */}
      <div className="absolute top-1/4 right-10 text-white/10 text-4xl animate-spin [animation-duration:8s]">✦</div>
      <div className="absolute bottom-1/4 left-10 text-white/10 text-2xl animate-reverse-spin">✦</div>
    </main>
  );
}
