"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // フォルダ階層に合わせて調整してください
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ログイン処理（既存のパスワードログイン）
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("ログイン失敗: " + error.message);
    } else {
      router.push("/");
      router.refresh(); // 画面を更新してログイン状態を反映
    }
    setLoading(false);
  };

  // 新規登録処理（メール認証送信）
  const handleSignUp = async () => {
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        // Vercelの本番環境でもローカル環境でも動くように設定
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      alert("登録失敗: " + error.message);
    } else {
      alert("確認メールを送信しました！メール内のリンクをクリックして登録を完了してください。");
    }
    setLoading(false);
  };

  return (
    <main className="p-8 flex flex-col items-center bg-[#FFF9F5] min-h-screen">
      <h1 className="text-2xl font-black italic text-orange-600 mb-8 tracking-tighter">RAMEN RALLY</h1>
      <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-orange-100/50 w-full max-w-sm border border-white">
        <h2 className="text-xl font-bold mb-6 text-slate-700">ログイン / 新規登録</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="メールアドレス"
            className="border border-slate-100 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="パスワード"
            className="border border-slate-100 bg-slate-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-orange-200 transition-all disabled:opacity-50"
          >
            {loading ? "送信中..." : "ログイン"}
          </button>

          <button 
            type="button" 
            onClick={handleSignUp}
            disabled={loading}
            className="text-orange-600 text-sm font-bold hover:text-orange-700 transition-colors mt-2"
          >
            初めての方はこちら（新規登録）
          </button>
        </form>
      </div>
    </main>
  );
}