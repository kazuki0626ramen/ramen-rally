"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [shops, setShops] = useState<any[]>([]); // DBからのショップリスト
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. プロフィール取得
      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      if (profile?.nickname) setNickname(profile.nickname);

      // 2. ショップリストをDBから取得
      const { data: shopData } = await supabase.from("shops").select("*").order("created_at", { ascending: true });
      if (shopData) setShops(shopData);

      // 3. スタンプ履歴取得
      const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (stampData) setStamps(stampData);
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleAddStamp = async (shopId: string, shopName: string) => {
    // 重複チェック
    if (stamps.some(s => s.shop_id === shopId)) {
      alert("このお店のスタンプは既に取得済みです！");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // スタンプ挿入（shop_idはUUIDとして送信）
    const { error } = await supabase.from("stamps").insert({
      user_id: user.id,
      shop_id: shopId,
      shop_name: shopName,
    });

    if (error) {
      console.error(error);
      alert("スタンプ取得失敗: " + error.message);
    } else {
      const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (updatedStamps) setStamps(updatedStamps);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING RALLY...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600">RAMEN RALLY</h1>
        <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logout</button>
      </div>

      {/* プロフィール */}
      <div className="bg-white p-5 rounded-[28px] shadow-lg shadow-orange-100/30 w-full max-w-md border border-white flex items-center mb-8 transition-transform hover:scale-[1.02]">
        <div className="text-3xl mr-4 drop-shadow-sm">🍜</div>
        <div className="text-left">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Participant</p>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">{nickname}</h2>
        </div>
        <button onClick={() => router.push("/profile")} className="ml-auto bg-orange-50 hover:bg-orange-100 p-2 rounded-full transition-colors">⚙️</button>
      </div>

      {/* DBから取得したお店リスト */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between ml-2 mb-2">
          <h3 className="font-black text-slate-700 italic uppercase text-sm tracking-tighter">Shop List</h3>
          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
            {stamps.length} / {shops.length} COMPLETED
          </span>
        </div>

        {shops.map((shop) => {
          const isGot = stamps.some(s => s.shop_id === shop.id);
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${isGot ? "bg-orange-100 rotate-12" : "bg-slate-50 opacity-40"}`}>
                  {shop.icon || '🍜'}
                </div>
                <div>
                  <h4 className={`font-black tracking-tight ${isGot ? "text-slate-800" : "text-slate-400"}`}>{shop.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isGot ? "Reached" : "Target"}</p>
                </div>
              </div>

              <button
                onClick={() => handleAddStamp(shop.id, shop.name)}
                disabled={isGot}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md active:scale-90
                  ${isGot ? "bg-orange-500 text-white shadow-orange-200 cursor-default" : "bg-white border-2 border-dashed border-slate-200 text-transparent hover:border-orange-300"}`}
              >
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}

        {shops.length === 0 && (
          <p className="text-center text-slate-400 text-xs py-10 italic">お店データがありません。Supabaseで追加してください。</p>
        )}
      </div>

      <p className="mt-12 text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase">Road to Ramen Master</p>
    </main>
  );
}