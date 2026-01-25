"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // ログイン処理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("ログイン失敗: " + error.message);
    } else {
      router.push("/"); // 成功したらトップへ
    }
  };

  // 新規登録処理（今回は簡易的に同じ画面に）
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert("登録失敗: " + error.message);
    } else {
      alert("登録成功！ログインしてください。");
    }
  };

  return (
    <main className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">ログイン / 新規登録</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="email"
          placeholder="メールアドレス"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="パスワード"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="bg-orange-500 text-white p-2 rounded font-bold">
          ログイン
        </button>
        <button 
          type="button" 
          onClick={handleSignUp}
          className="text-orange-600 text-sm underline"
        >
          初めての方はこちら（新規登録）
        </button>
      </form>
    </main>
  );
}