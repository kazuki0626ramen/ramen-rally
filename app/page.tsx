"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

// お店リストの定義（ここにお店を追加できます）
const SHOPS = [
  { id: "shop_1", name: "元祖 醤油ラーメン", icon: "🍜" },
  { id: "shop_2", name: "博多 豚骨龍", icon: "🐷" },
  { id: "shop_3", name: "北海道 味噌王", icon: "🌽" },
  { id: "shop_4", name: "濃厚 魚介つけ麺", icon: "🐟" },
];

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
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

      // プロフィール取得
      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      if (profile?.nickname) setNickname(profile.nickname);

      // スタンプ履歴取得
      const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (stampData) setStamps(stampData);
      
      setLoading(false);
    };
    fetchData();
  }, [router]);

  // 特定のお店でスタンプを押す処理
  const handleAddStamp = async (shopId: string, shopName: string) => {
    // すでにそのお店のスタンプがあるかチェック
    if (stamps.some(s => s.shop_id === shopId)) {
      alert("このお店のスタンプは既に取得済みです！");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("stamps").insert({
      user_id: user.id,
      shop_id: shopId,
      shop_name: shopName,
    });

    if (error) {
      alert("スタンプ取得失敗: " + error.message);
    } else {
      // 画面更新
      const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (updatedStamps) setStamps(updatedStamps);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black">LOADING RALLY...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600">RAMEN RALLY</h1>
        <button onClick={handleLogout} className="text-[10px] font-black text-slate-400">LOGOUT</button>
      </div>

      {/* ユーザープロフィール（現在の機能を維持） */}
      <div className="bg-white p-5 rounded-[28px] shadow-lg shadow-orange-100/30 w-full max-w-md border border-white flex items-center mb-8">
        <div className="text-3xl mr-4">🍜</div>
        <div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Rally Participant</p>
          <h2 className="text-xl font-black text-slate-800">{nickname}</h2>
        </div>
        <button onClick={() => router.push("/profile")} className="ml-auto bg-orange-50 p-2 rounded-full">⚙️</button>
      </div>

      {/* お店リスト（お店とスタンプの紐付け） */}
      <div className="w-full max-w-md space-y-4">
        <h3 className="font-black text-slate-700 italic ml-2">SHOP LIST</h3>
        {SHOPS.map((shop) => {
          const isGot = stamps.some(s => s.shop_id === shop.id);
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isGot ? "bg-orange-100" : "bg-slate-50 opacity-40"}`}>
                  {shop.icon}
                </div>
                <div>
                  <h4 className={`font-black ${isGot ? "text-slate-800" : "text-slate-400"}`}>{shop.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{isGot ? "Visited" : "Not Visited"}</p>
                </div>
              </div>

              {/* お店ごとのスタンプボタン/表示 */}
              <button
                onClick={() => handleAddStamp(shop.id, shop.name)}
                disabled={isGot}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md active:scale-90
                  ${isGot ? "bg-orange-500 text-white shadow-orange-200" : "bg-white border-2 border-dashed border-slate-200 text-transparent hover:border-orange-300"}`}
              >
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 p-4 bg-orange-100/50 rounded-2xl text-center w-full max-w-md">
        <p className="text-orange-800 text-xs font-black">コンプリートまであと {SHOPS.length - stamps.length} 軒！</p>
      </div>
    </main>
  );
}