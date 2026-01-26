"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();

      if (data) setNickname(data.nickname || "");
      setLoading(false);
    };
    getProfile();
  }, [router]);

  const updateProfile = async () => {
    setLoading(true);
    // 修正ポイント: updated_at をプログラムから送らず、
    // ニックネームだけを送るようにしてエラーを回避します
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      nickname: nickname,
      // updated_at: new Date(), ← ここを削除しました
    });

    if (error) {
      alert("更新失敗: " + error.message);
    } else {
      alert("ニックネームを更新しました！");
      router.push("/");
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#1A3A34] flex items-center justify-center text-white italic">Loading...</div>;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#1A3A34] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D5A27] via-[#1A3A34] to-[#0D1F1C]" />
      
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-[24px] shadow-2xl border border-white/20 text-center">
          <h1 className="text-2xl font-black text-white mb-6 tracking-widest italic uppercase">Edit Profile</h1>
          
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-2">
              👤
            </div>
            <p className="text-white/40 text-[10px] tracking-widest uppercase">{user?.email}</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="text-left">
              <label className="text-white/70 text-[10px] font-black ml-1 mb-2 block uppercase tracking-[0.2em]">Nickname</label>
              <input
                type="text"
                placeholder="ニックネームを入力"
                className="w-full bg-white/10 border border-white/20 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 transition-all placeholder:text-white/20"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            
            <button 
              onClick={updateProfile}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 rounded-xl font-black shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "SAVING..." : "SAVE CHANGES"}
            </button>

            <button 
              type="button" 
              onClick={() => router.push("/")}
              className="text-white/40 text-[10px] font-black hover:text-white transition-colors tracking-widest uppercase"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}