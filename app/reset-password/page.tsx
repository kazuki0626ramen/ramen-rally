"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      alert("更新に失敗しました: " + error.message);
    } else {
      alert("パスワードを更新しました！新しいパスワードでログインしてね 🍥");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#c04d3d] to-[#6b1e15]">
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 text-center">
          <h1 className="text-2xl font-black text-white mb-6">新しいパスワード</h1>
          <form onSubmit={handleUpdate} className="flex flex-col gap-5">
            <input
              type="password"
              placeholder="新しいパスワード（6文字以上）"
              className="w-full bg-black/20 border border-white/10 p-4 rounded-2xl text-white outline-none focus:ring-2 focus:ring-orange-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="p-4 rounded-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg"
            >
              {loading ? "更新中..." : "パスワードを保存する"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
