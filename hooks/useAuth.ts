"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useRouter } from "next/navigation";

export function useAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // エラーメッセージを翻訳する関数
  const getJapaneseMessage = (error: any) => {
    if (!error) return "";
    const msg = error.message.toLowerCase();
    if (msg.includes("invalid login credentials")) return "メールアドレスかパスワードが間違っているみたいです 🍥";
    if (msg.includes("email not confirmed")) return "メールアドレスの確認がまだ終わっていないようです";
    if (msg.includes("too many requests")) return "少し時間を置いてから、もう一度試してみてね";
    return "おっと、エラーが起きちゃったみたい。もう一度試してね！";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // 連打防止

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        alert(getJapaneseMessage(error));
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Login Error:", err);
      alert("通信に失敗しました。電波の良いところで試してね！");
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, loading, handleLogin };
}
