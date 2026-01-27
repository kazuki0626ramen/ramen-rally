"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [nickname, setNickname] = useState<string>("Guest User");
  const [shops, setShops] = useState<any[]>([]);
  const [stamps, setStamps] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState<{ msg: string; show: boolean }>({ msg: "", show: false });
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

  const triggerPopup = (count: number) => {
    let message = "スタンプをゲットしました！🍥";
    if (count === 1) message = "最初の一杯、ごちそうさま！麺活ロードの始まりです🍥";
    if (count === 3) message = "3店舗制覇！ラーメン愛が伝わります🍜";
    if (count === 5) message = "半分達成！あなたはもう立派なラーメン通です✨";
    if (count > 0 && count === shops.length) message = "全店舗制覇！伝説のラーメン王の誕生です！👑";

    setPopup({ msg: message, show: true });
    setTimeout(() => setPopup({ msg: "", show: false }), 3500);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).replace(/\//g, ".");
  };

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
      const { data: diaryData } = await supabase.from("diaries").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (diaryData) setDiaries(diaryData);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleAddStamp = async (shopId: string, shopName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("stamps").insert({ user_id: user.id, shop_id: shopId, shop_name: shopName });
    if (error) {
      alert("Error: " + error.message);
    } else {
      const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      if (updatedStamps) { setStamps(updatedStamps); triggerPopup(updatedStamps.length); }
    }
  };

  const handleRemoveStamp = async (shopId: string) => {
    if (!confirm("スタンプを取り消しますか？")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("stamps").delete().eq("user_id", user.id).eq("shop_id", shopId);
    if (error) {
      alert("Error: " + error.message);
    } else {
      const { data: updatedStamps } = await supabase.from("stamps").select("*").eq("user_id", user.id);
      setStamps(updatedStamps || []);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 flex flex-col items-center bg-[#FFF9F5] min-h-screen font-sans relative">
      {popup.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-xs animate-bounce">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-600">
            <span className="text-2xl">✨</span>
            <span className="text-xs font-bold leading-tight">{popup.msg}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter">RAMEN RALLY</h1>
        <button onClick={() => { supabase.auth.signOut(); router.push("/login"); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logout</button>
      </div>

      <div className="bg-white p-6 rounded-[28px] shadow-lg shadow-orange-100/30 w-full max-w-md border border-white flex flex-col mb-6">
        <div className="flex items-center w-full">
          <div className="text-4xl mr-4 drop-shadow-sm">🍜</div>
          <div className="text-left flex-1">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">Rally Member</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{nickname}</h2>
          </div>
          <button onClick={() => router.push("/profile")} className="bg-orange-50 hover:bg-orange-100 p-2 rounded-full shadow-sm">⚙️</button>
        </div>
        <div className={`mt-4 px-4 py-2 rounded-xl border flex items-center justify-between ${rank.bg}`}>
          <span className={`text-[10px] font-black uppercase tracking-tighter ${rank.color}`}>RANK: {rank.title}</span>
          <span className="text-[10px] font-bold text-slate-400 italic">{stamps.length} Stamps</span>
        </div>
      </div>

      <button onClick={() => router.push("/ranking")} className="w-full max-w-md mb-8 bg-gradient-to-r from-orange-600 to-orange-400 text-white py-4 rounded-[24px] font-black italic shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-95 transition-transform">
        <span className="text-xl">🏆</span><span className="tracking-widest uppercase">View World Ranking</span>
      </button>

      <div className="w-full max-w-md space-y-4 mb-10">
        <div className="flex items-center justify-between ml-2 mb-2">
          <h3 className="font-black text-slate-700 italic uppercase text-sm tracking-tighter">Shop List</h3>
          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">PROGRESS: {stamps.length} / {shops.length}</span>
        </div>

        {shops.map((shop) => {
          const myStamp = stamps.find(s => String(s.shop_id) === String(shop.id));
          const isGot = !!myStamp;
          const myLatestDiary = diaries.find(d => String(d.shop_id) === String(shop.id));
          
          return (
            <div key={shop.id} className="bg-white p-4 rounded-3xl shadow-sm border border-orange-50 flex flex-col gap-3 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* ★アイコン部分を写真に置き換えるロジック */}
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-2xl transition-all duration-500 shadow-inner ${isGot ? "bg-orange-100" : "bg-slate-50 opacity-40 grayscale"}`}>
                    {myLatestDiary?.image_url ? (
                      <img src={myLatestDiary.image_url} alt="ramen" className="w-full h-full object-cover" />
                    ) : (
                      <span className={isGot ? "rotate-6" : ""}>{shop.icon || '🍜'}</span>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-col">
                      <h4 className={`font-black tracking-tight leading-none mb-1 ${isGot ? "text-slate-800" : "text-slate-300"}`}>{shop.name}</h4>
                      <div className="flex items-center gap-2">
                        {isGot && <p className="text-[9px] text-slate-400 font-medium tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{formatDate(myStamp.created_at)}</p>}
                        <button onClick={() => router.push(`/diary/${shop.id}`)} className="text-[9px] text-orange-600 font-black uppercase tracking-tighter bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 active:bg-orange-200">📝 Log</button>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => isGot ? handleRemoveStamp(shop.id) : handleAddStamp(shop.id, shop.name)} className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all shadow-md active:scale-90 ${isGot ? "bg-orange-500 text-white shadow-orange-200" : "bg-white border-2 border-dashed border-slate-200 text-transparent"}`}>{isGot ? "🍥" : ""}</button>
              </div>

              {myLatestDiary && (
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 ml-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">{"⭐".repeat(myLatestDiary.rating)}</span>
                    <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">My Last Review</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{myLatestDiary.comment || "（メモなし）"}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
