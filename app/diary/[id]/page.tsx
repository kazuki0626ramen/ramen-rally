"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DiaryPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [shop, setShop] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("public"); // 公開・非公開
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchShop = async () => {
      const { data } = await supabase.from("master_shops").select("*").eq("id", id).single();
      if (data) setShop(data);
      setLoading(false);
    };
    fetchShop();
  }, [id]);

  // 写真アップロード機能の復活
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `diary-images/${fileName}`;

    setSaving(true);
    const { error: uploadError } = await supabase.storage
      .from("ramen_images")
      .upload(filePath, file);

    if (uploadError) {
      alert("写真のアップロードに失敗しました");
      setSaving(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("ramen_images").getPublicUrl(filePath);
    setImageUrl(publicUrl);
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    // 全機能（写真、ステータス、店舗ID）を統合して保存
    const { error } = await supabase.from("diaries").insert({
      user_id: user.id,
      master_shop_id: id,
      rating: rating,
      comment: comment,
      image_url: imageUrl, // 写真URL復活
      status: status,      // 公開設定復活
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
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="text-slate-400 font-bold text-sm">← Back</button>
        <h1 className="text-lg font-black text-slate-800 italic uppercase">Diary Entry</h1>
        <div className="w-10"></div>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-lg border border-white">
        <h2 className="text-2xl font-black mb-6 italic tracking-tighter">{shop?.name}</h2>
        
        {/* 画像アップロード UI */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Photo</label>
          <div className="w-full aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Uploaded ramen" className="w-full h-full object-cover" />
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="opacity-0 absolute inset-0 cursor-pointer" />
            )}
            {!imageUrl && <span className="text-slate-400 text-xs font-bold">Tap to Upload Photo 📸</span>}
          </div>
        </div>

        {/* 評価 UI */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Rating</label>
          <div className="flex gap-2 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className={rating >= n ? "grayscale-0" : "grayscale opacity-20"}>⭐</button>
            ))}
          </div>
        </div>

        {/* コメント UI */}
        <div className="mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Review</label>
          <textarea
            className="w-full h-24 bg-slate-50 rounded-xl p-4 outline-none focus:ring-2 focus:ring-orange-100 text-sm"
            placeholder="今日の感想を語りましょう..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {/* 公開設定 UI */}
        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">Visibility</label>
          <div className="flex bg-slate-50 p-1 rounded-xl">
            {["public", "private"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${status === s ? "bg-white shadow-sm text-orange-500" : "text-slate-400"}`}
              >
                {s === "public" ? "🌍 Public" : "🔒 Private"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black italic uppercase shadow-lg shadow-orange-100 active:scale-95 transition-transform"
        >
          {saving ? "SAVING..." : "Complete Log"}
        </button>
      </div>
    </main>
  );
}
