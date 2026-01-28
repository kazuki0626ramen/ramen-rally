"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DiaryPage({ params }: { params: Promise<{ id: string }> }) {
  // Promise形式のparamsをアンラップ
  const { id } = use(params);
  
  const [shop, setShop] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchShop = async () => {
      // master_shopsテーブルからお店の情報を取得
      const { data, error } = await supabase
        .from("master_shops")
        .select("*")
        .eq("id", id)
        .single();
      
      if (data) {
        setShop(data);
      } else {
        console.error("Shop not found:", error);
      }
      setLoading(false);
    };
    fetchShop();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("ログインが必要です");
      router.push("/login");
      return;
    }

    // --- ここが修正の重要ポイント ---
    // shop_id ではなく master_shop_id として保存する
    const { error } = await supabase.from("diaries").insert({
      user_id: user.id,
      master_shop_id: id, // URLから取得したID（master_shopsのID）
      rating: rating,
      comment: comment,
    });

    if (error) {
      console.error("Save error:", error);
      alert("保存に失敗しました: " + error.message);
      setSaving(false);
    } else {
      alert("日記を保存しました！🍜");
      router.push("/"); // 保存後はホームへ戻る
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING SHOP DATA...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <button onClick={() => router.back()} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="text-lg font-black text-slate-800 italic uppercase tracking-tighter">Ramen Log</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-xl shadow-orange-100/20 border border-white">
        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">{shop?.area}</p>
        <h2 className="text-2xl font-black text-slate-800 mb-6 leading-tight">{shop?.name}</h2>

        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setRating(num)}
                className={`text-2xl transition-all duration-200 ${rating >= num ? "grayscale-0 scale-110" : "grayscale opacity-20"}`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Review Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="麺の太さ、スープの味、お店の雰囲気など..."
            className="w-full h-32 bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-orange-200 outline-none resize-none transition-all"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-[20px] font-black italic tracking-widest uppercase transition-all shadow-lg ${
            saving 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
              : "bg-orange-500 text-white shadow-orange-200 hover:bg-orange-600 active:scale-95"
          }`}
        >
          {saving ? "SAVING..." : "Save Memory"}
        </button>
      </div>
    </main>
  );
}
