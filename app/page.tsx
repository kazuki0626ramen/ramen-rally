"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [profile, setProfile] = useState<any | null>(null);
  const [showLevelUp, setShowLevelUp] = useState<boolean>(false);
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 称号を判定する関数
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

      // プロフィール取得（EXP, level, total_eaten など全体を取得）
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data);
        if (data.nickname) setNickname(data.nickname);
      }

      // ショップリスト取得
      const { data: shopData } = await supabase.from("shops").select("*").order("created_at", { ascending: true });
      if (shopData) setShops(shopData);

      // スタンプ履歴取得
      const { data: stampData } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (stampData) setStamps(stampData || []);

      // URLパラメータからlevelupを検知して1回だけ表示
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("levelup") === "true") {
          setShowLevelUp(true);
          // URLからパラメータを消して再表示を防ぐ
          window.history.replaceState({}, "", window.location.pathname);
        }
      } catch (e) {
        // サーバーサイドや非ブラウザ環境では無視
      }

      setLoading(false);
    };
    fetchData();
  }, [router]);

  // スタンプを押す処理
  const handleAddStamp = async (shopId: string, shopName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("stamps").insert({
      user_id: user.id,
      shop_id: shopId,
      shop_name: shopName,
    });

    if (error) {
      alert("スタンプ取得失敗: " + error.message);
      return;
    }

    // プロフィールの集計更新: total_eaten, total_exp, level
    const prevTotal = profile?.total_eaten || 0;
    const prevExp = profile?.total_exp || 0;
    const prevLevel = profile?.level || 0;

    const newTotal = prevTotal + 1;
    const newExp = prevExp + 10; // 1杯あたり10EXP
    const newLevel = Math.floor(newExp / 100);

    const { error: upsertError } = await supabase.from("profiles").update({
      total_eaten: newTotal,
      total_exp: newExp,
      level: newLevel,
    }).eq("id", user.id);

    if (upsertError) {
      console.warn("プロフィール更新失敗:", upsertError.message);
    }

    // スタンプ一覧とプロフィールを再取得
    const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
    if (updatedStamps) setStamps(updatedStamps);

    const { data: refreshedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (refreshedProfile) setProfile(refreshedProfile);

    // レベルアップしたら /?levelup=true へ遷移させる（1回だけ表示）
    if (newLevel > prevLevel) {
      router.push("/?levelup=true");
    }
  };

  // スタンプを取り消す処理 (パターンA追加)
  const handleRemoveStamp = async (shopId: string) => {
    if (!confirm("このお店のスタンプを取り消しますか？")) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("stamps")
      .delete()
      .eq("user_id", user.id)
      .eq("shop_id", shopId);

    if (error) {
      alert("取り消しに失敗しました: " + error.message);
    } else {
      // 画面上のスタンプリストから削除
      setStamps(stamps.filter(s => s.shop_id !== shopId));
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING RALLY...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logout</button>
      </div>

      {/* ユーザープロフィールカード */}
      <div className="bg-white p-6 rounded-[28px] shadow-lg shadow-orange-100/30 w-full max-w-md border border-white flex flex-col mb-8">
        <div className="flex items-center w-full">
          <div className="text-4xl mr-4 drop-shadow-sm">🍜</div>
          <div className="text-left flex-1">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Rally Member</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{nickname}</h2>
          </div>
          <button onClick={() => router.push("/profile")} className="bg-orange-50 hover:bg-orange-100 p-2 rounded-full transition-colors shadow-sm">⚙️</button>
        </div>
        
        {/* 称号バッジ */}
        <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center justify-between ${rank.bg}`}>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${rank.color}`}>RANK: {rank.title}</span>
          <span className="text-[10px] font-bold text-slate-400 italic">{stamps.length} Stamps</span>
        </div>
        {/* 経験値プログレスバー */}
        <div className="w-full mt-4">
          <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 tracking-widest uppercase">
            <span>Next Level</span>
            <span>{((profile?.total_exp ?? 0) % 100)}%</span>
          </div>
          <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-1000"
              style={{ width: `${(profile?.total_exp ?? 0) % 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* レベルアップ演出のオーバーレイ（簡易） */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white p-8 rounded-2xl text-center max-w-sm w-full">
            <h2 className="text-4xl font-black text-orange-500 mb-4">LEVEL UP!</h2>
            <p className="text-sm text-slate-600 mb-6">おめでとう！レベルが上がりました。</p>
            <button onClick={() => setShowLevelUp(false)} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black">OK</button>
          </div>
        </div>
      )}

      {/* お店リスト */}
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between ml-2 mb-2">
          <h3 className="font-black text-slate-700 italic uppercase text-sm tracking-tighter">Visit History</h3>
          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
            {stamps.length} / {shops.length} SHOPS
          </span>
        </div>

        {shops.map((shop) => {
          const isGot = stamps.some(s => s.shop_id === shop.id);
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex items-center justify-between transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 ${isGot ? "bg-orange-100 rotate-6" : "bg-slate-50 opacity-40 grayscale"}`}>
                  {shop.icon || '🍜'}
                </div>
                <div>
                  <h4 className={`font-black tracking-tight ${isGot ? "text-slate-800" : "text-slate-300"}`}>{shop.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isGot ? "Visit Completed" : "Not Visited"}</p>
                </div>
              </div>

              {/* スタンプボタン:
                  - まだなら handleAddStamp
                  - 取得済みなら handleRemoveStamp 
              */}
              <button
                onClick={() => isGot ? handleRemoveStamp(shop.id) : handleAddStamp(shop.id, shop.name)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md active:scale-90
                  ${isGot ? "bg-orange-500 text-white shadow-orange-200" : "bg-white border-2 border-dashed border-slate-200 text-transparent hover:border-orange-300"}`}
              >
                {isGot ? "🍥" : ""}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-12 text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase text-center leading-relaxed">
        Collect them all,<br/>Master the Noodle
      </p>
    </main>
  );
}