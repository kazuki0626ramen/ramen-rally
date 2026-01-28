"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DiaryPage({ params }: { params: Promise<{ id: string }> }) {
  // Promise形式のparamsを安全に展開
  const { id } = use(params);
  
  const [shop, setShop] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchShop = async () => {
      // master_shopsから店舗情報を取得
      const { data } = await supabase.from("master_shops").select("*").eq("id", id).single();
      if (data) setShop(data);
      setLoading(false);
    };
    fetchShop();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    // 保存処理：master_shop_id カラムに値を入れます
    const { error } = await supabase.from("diaries").insert({
      user_id: user.id,
      master_shop_id: id, 
      rating: rating,
      comment: comment,
    });

    if (error) {
      console.error("Save Error:", error);
      alert("保存に失敗しました: " + error.message);
      setSaving(false);
    } else {
      alert("日記を保存しました！🍜");
      router.push("/");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center text-slate-800">
      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-lg border border-white mt-10">
        <h2 className="text-2xl font-black mb-6 italic tracking-tighter">
          {shop?.name || "SHOP LOG"}
        </h2>
        
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Rating</label>
          <div className="flex gap-2 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={rating >= n ? "grayscale-0" : "grayscale opacity-20"}>⭐</button>
            ))}
          </div>
        </div>

        <textarea
          className="w-full h-32 bg-slate-50 rounded-2xl p-4 mb-6 outline-none focus:ring-2 focus:ring-orange-100"
          placeholder="味の感想を書こう..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black italic uppercase shadow-lg shadow-orange-100 active:scale-95 transition-transform"
        >
          {saving ? "SAVING..." : "Save Memory"}
        </button>
      </div>
    </main>
  );
}
