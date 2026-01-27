"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const getRank = (count: number) => {
    if (count >= 10) return { title: "極めし麺神", color: "text-red-600", bg: "bg-red-50" };
    if (count >= 8) return { title: "伝説のラーメン王", color: "text-purple-600", bg: "bg-purple-50" };
    if (count >= 5) return { title: "麺界のホープ", color: "text-blue-600", bg: "bg-blue-50" };
    if (count >= 3) return { title: "ラーメン愛好家", color: "text-green-600", bg: "bg-green-50" };
    if (count >= 1) return { title: "駆け出し麺職人", color: "text-orange-600", bg: "bg-orange-50" };
    return { title: "一般市民", color: "text-slate-400", bg: "bg-slate-50" };
  };

  const rank = getRank(stamps.length);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("nickname").eq("id", user.id).single();
      if (profile?.nickname) setNickname(profile.nickname);
      const { data: shopData } = await supabase.from("shops").select("*").order("created_at", { ascending: true });
      if (shopData) setShops(shopData);
      const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (stampData) setStamps(stampData);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleAddStamp = async (shopId: string, shopName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("stamps").insert({
      user_id: user.id,
      shop_id: shopId,
      shop_name: shopName,
    });
    if (error) {
      alert("Error: " + error.message);
    } else {
      const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (updatedStamps) setStamps(updatedStamps);
    }
  };

  // 【ここを強化！】 削除の条件にお店IDを確実に入れ、削除後にリストを完全にリセットする
  const handleRemoveStamp = async (shopId: string) => {
    if (!confirm("取り消しますか？")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // DBから完全に削除
    const { error } = await supabase
      .from("stamps")
      .delete()
      .eq("user_id", user.id)
      .eq("shop_id", shopId);

    if (error) {
      alert("削除失敗: " + error.message);
    } else {
      // ★重要：削除が成功したら、DBから最新のスタンプ情報を「再取得」して画面をリフレッシュする
      const { data: updatedStamps } = await supabase
        .from("stamps")
        .select("*")
        .eq("user_id", user.id);
      
      setStamps(updatedStamps || []);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">LOADING...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-black text-slate-400 uppercase">Logout</button>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-lg shadow-orange-100/30 w-full max-w-md border border-white flex flex-col mb-8 transition-transform hover:scale-[1.01]">
        <div className="flex items-center w-full">
          <div className="text-4xl mr-4 drop-shadow-sm">🍜</div>
          <div className="text-left flex-1">
            <p className="text-slate-400 text-[10px] font-black uppercase mb-1">Passport</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{nickname}</h2>
          </div>
          <button onClick={() => router.push("/profile")} className="bg-orange-50 p-2 rounded-full shadow-sm">⚙️</button>
        </div>
        
        <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center justify-between ${rank.bg}`}>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${rank.color}`}>RANK: {rank.title}</span>
          <span className="text-[10px] font-bold text-slate-400 italic">{stamps.length} Stamps</span>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        {shops.map((shop) => {
          // お店IDが一致するかどうかを厳密にチェック
          const isGot = stamps.some(s => String(s.shop_id) === String(shop.id));
          
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${isGot ? "bg-orange-100 rotate-6" : "bg-slate-50 opacity-40 grayscale"}`}>
                  {shop.icon || '🍜'}
                </div>
                <div>
                  <h4 className={`font-black tracking-tight ${isGot ? "text-slate-800" : "text-slate-300"}`}>{shop.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isGot ? "Visit Completed" : "Not Visited"}</p>
                </div>
              </div>

              <button
                onClick={() => isGot ? handleRemoveStamp(shop.id) : handleAddStamp(shop.id, shop.name)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md active:scale-95
                  ${isGot ? "bg-orange-500 text-white shadow-orange-200" : "bg-white border-2 border-dashed border-slate-200 text-transparent hover:border-orange-300"}`}
              >
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
