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

      // profilesテーブルから今のニックネームを取得
      const { data, error } = await supabase
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
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      nickname: nickname,
      updated_at: new Date(),
    });

    if (error) {
      alert("更新失敗: " + error.message);
    } else {
      alert("ニックネームを更新しました！");
      router.push("/"); // トップに戻る
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#1A3A34] flex items-center justify-center text-white">読み込み中...</div>;

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#1A3A34] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D5A27] via-[#1A3A34] to-[#0D1F1C]" />
      
      <div className="relative z-20 w-full max-w-sm px-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-[24px] shadow-2xl border border-white/20 text-center">
          <h1 className="text-2xl font-black text-white mb-6 tracking-widest italic">USER PROFILE</h1>
          
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-2">
              🍜
            </div>
            <p className="text-white/50 text-xs">{user?.email}</p>
          </div>

          <div className="flex flex-col gap-6">
            <div className="text-left">
              <label className="text-white/70 text-xs font-bold ml-1 mb-2 block uppercase tracking-tighter">Nickname</label>
              <input
                type="text"
                placeholder="例: 麺匠さすらい人"
                className="w-full bg-white/10 border border-white/20 p-4 rounded-xl text-white outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            
            <button 
              onClick={updateProfile}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 rounded-xl font-black shadow-xl hover:brightness-110 transition-all disabled:opacity-50"
            >
              SAVE CHANGES
            </button>

            <button 
              type="button" 
              onClick={() => router.push("/")}
              className="text-white/50 text-xs font-bold hover:text-white transition-colors"
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}