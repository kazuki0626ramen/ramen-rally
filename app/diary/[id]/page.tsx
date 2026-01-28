"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [shop, setShop] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("public");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data, error } = await supabase
          .from("master_shops")
          .select("*")
          .eq("id", id)
          .single();
        if (data) setShop(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [id]);

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

    const { error } = await supabase.from("diaries").insert({
      user_id: user.id,
      master_shop_id: id,
      rating: rating,
      comment: comment,
      image_url: imageUrl,
      status: status,
    });

    if (error) {
      alert("保存に失敗しました: " + error.message);
      setSaving(false);
    } else {
      alert("日記を保存しました！🍜");
      router.push("/");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-orange-600 font-black italic">LOADING...</div>;

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-lg border border-white mt-10">
        <h2 className="text-2xl font-black mb-6 italic">{shop?.name || "SHOP LOG"}</h2>
        
        {/* 写真アップロード */}
        <div className="mb-6">
          <div className="w-full aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Ramen" className="w-full h-full object-cover" />
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="opacity-0 absolute inset-0 cursor-pointer" />
            )}
            {!imageUrl && <span className="text-slate-400 text-xs font-bold">📸 写真を追加</span>}
          </div>
        </div>

        {/* 評価 */}
        <div className="mb-6">
          <div className="flex gap-2 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={rating >= n ? "grayscale-0" : "grayscale opacity-20"}>⭐</button>
            ))}
          </div>
        </div>

        <textarea
          className="w-full h-24 bg-slate-50 rounded-xl p-4 mb-6 outline-none text-sm"
          placeholder="味の感想..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* 公開設定 */}
        <div className="flex bg-slate-50 p-1 rounded-xl mb-8">
          {["public", "private"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg ${status === s ? "bg-white shadow-sm text-orange-50" : "text-slate-400"}`}
            >
              {s === "public" ? "🌍 公開" : "🔒 非公開"}
            </button>
          ))}
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black italic uppercase shadow-lg">
          {saving ? "SAVING..." : "Complete Log"}
        </button>
      </div>
    </main>
  );
}
