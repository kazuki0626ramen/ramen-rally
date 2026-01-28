"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase"; 
import { useRouter } from "next/navigation";

export function useAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        alert("ログイン失敗: " + error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { email, setEmail, password, setPassword, loading, handleLogin };
}
