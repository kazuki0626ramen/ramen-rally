"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function DiaryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [shop, setShop] = useState<any>(null);
  const [freeShopName, setFreeShopName] = useState(""); // 自由入力用
  const [isFreeInput, setIsFreeInput] = useState(false); // モード判定

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("public");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchShop = async () => {
      // IDが "new" の場合は自由入力モードへ
      if (id === "new") {
        setIsFreeInput(true);
        setLoading(false);
        return;
      }

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
    if (isFreeInput && !freeShopName.trim()) {
      alert("店名を入力してください");
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインが必要です");
      return;
    }

    const { error } = await supabase.from("diaries").insert({
      user_id: user.id,
      master_shop_id: isFreeInput ? null : id, // 自由入力ならIDはnull
      shop_name_free: isFreeInput ? freeShopName : null, // 自由入力の店名を保存
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
      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-xl border border-white mt-4">
        {/* ヘッダー部分：モードによって切り替え */}
        <div className="mb-8">
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">
            {isFreeInput ? "Free Logging" : "Official Stamp"}
          </p>
          {isFreeInput ? (
            <input
              type="text"
              className="w-full text-2xl font-black italic bg-slate-50 p-3 rounded-xl border-2 border-orange-100 focus:border-orange-500 outline-none text-slate-900"
              placeholder="店名を入力..."
              value={freeShopName}
              onChange={(e) => setFreeShopName(e.target.value)}
            />
          ) : (
            <h2 className="text-2xl font-black italic text-slate-800">{shop?.name || "SHOP LOG"}</h2>
          )}
        </div>
        
        {/* 写真アップロード */}
        <div className="mb-6">
          <div className="w-full aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Ramen" className="w-full h-full object-cover" />
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} className="opacity-0 absolute inset-0 cursor-pointer" />
            )}
            {!imageUrl && (
              <div className="text-center">
                <span className="text-2xl block mb-1">📸</span>
                <span className="text-slate-400 text-[10px] font-black uppercase">Add Photo</span>
              </div>
            )}
          </div>
        </div>

        {/* 評価 */}
        <div className="mb-6 flex flex-col items-center bg-slate-50 py-4 rounded-2xl">
          <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Rating</p>
          <div className="flex gap-2 text-2xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className={rating >= n ? "grayscale-0" : "grayscale opacity-20"}>⭐</button>
            ))}
          </div>
        </div>

        <textarea
          className="w-full h-28 bg-slate-50 rounded-xl p-4 mb-6 outline-none text-sm text-slate-900 font-medium placeholder:text-slate-300"
          placeholder="味の感想を自由にメモ..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        {/* 公開設定 */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
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

        <button 
          onClick={handleSave} 
          disabled={saving} 
          className={`w-full py-4 rounded-2xl font-black italic uppercase shadow-lg transition-all ${saving ? "bg-slate-200" : "bg-orange-500 text-white active:scale-95"}`}
        >
          {saving ? "Saving..." : "Complete Log"}
        </button>
        
        <button 
          onClick={() => router.back()} 
          className="w-full mt-4 text-[10px] font-black text-slate-300 uppercase hover:text-slate-500"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}
