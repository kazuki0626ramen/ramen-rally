"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter, useSearchParams, useParams } from "next/navigation";

export default function NewDiaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  
  const [shopName, setShopName] = useState("");
  const [memo, setMemo] = useState("");
  const [rating, setRating] = useState(3);
  const [isPublic, setIsPublic] = useState(true); // 画像12枚目の「PUBLIC」選択状態に合わせる
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const shop = searchParams.get("shop");
    if (shop) setShopName(shop);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim() && !imageUrl.trim()) {
      alert("「店名」または「写真」を入力してください🍜");
      return;
    }
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です");

      // 1. 日記を保存（レビュー・公開設定を含む）
      const insertPayload = {
        user_id: user.id,
        shop_id: params?.id !== "default" ? params?.id : null,
        shop_name: shopName,
        image_url: imageUrl,
        memo: memo,
        rating: rating,
        is_public: isPublic,
      };

      const { data: inserted, error: insertError } = await supabase
        .from("diaries")
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error("Diary insert failed:", {
          code: insertError?.code,
          message: insertError?.message,
          details: insertError?.details,
        });
        alert(`投稿に失敗しました: ${insertError.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      console.log("Diary inserted:", inserted);

      // 2. 経験値を +1 する
      // --- 挿入が成功したので、最新の diaries 件数を正確に取得してから profiles を更新 ---
      try {
        const { count: diaryCount, error: countError } = await supabase
          .from("diaries")
          .select("id", { count: 'exact', head: true })
          .eq("user_id", user.id);

        if (countError) {
          console.warn("Failed to fetch diary count after insert:", countError);
        }

        const totalEaten = typeof diaryCount === 'number' ? diaryCount : 0;
        const nextExp = totalEaten * 100; // 1杯=100pts の方針

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ total_eaten: totalEaten, total_exp: nextExp })
          .eq("id", user.id);

        if (updateError) {
          console.error("Failed to update profile after diary insert:", updateError);
          alert(`プロフィール更新に失敗しました: ${updateError.message || 'Unknown error'}`);
        }
      } catch (e) {
        console.error("Error while syncing profile after insert:", e);
      }

      alert("記録完了！データを保存しました。");
      // ルートに戻してキャッシュを明示的に無効化
      router.push("/");
      try { router.refresh(); } catch (e) { /* noop */ }
    } catch (error: any) {
      console.error("Unexpected error in handleSubmit:", error);
      alert(error?.message || "投稿中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // 画像アップロード処理
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      const file = e.target.files[0];

      // バリデーション: ファイルサイズ (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("画像サイズは5MB以下にしてください🙇‍♂️");
        return;
      }

      setUploading(true);

      // ファイル名の生成（衝突回避のためランダム文字列付与）
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Supabase Storageへアップロード (バケット名 'diary-photos')
      const { error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        throw uploadError;
      }

      // 公開URLを取得してStateにセット
      const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(filePath);
      setImageUrl(publicUrl);
    } catch (error: any) {
      alert(`画像のアップロードに失敗しました: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="p-6 bg-[#FFF9F5] min-h-screen font-sans flex flex-col items-center">
      {/* ヘッダー */}
      <div className="w-full max-w-md flex items-center justify-between mb-8">
        <button type="button" onClick={() => router.back()} className="text-slate-400 text-sm font-black uppercase tracking-tighter">← CANCEL</button>
        <h1 className="text-xl font-black italic text-orange-600 tracking-tighter uppercase">FREE LOGGING</h1>
        <div className="w-12"></div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        {/* SHOP NAME 入力 */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-2">FREE LOGGING</label>
          <input 
            type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
            placeholder="店名を入力..."
            className="w-full bg-white border-2 border-orange-100 rounded-2xl px-4 py-4 text-xl font-bold placeholder:text-slate-300 outline-none"
          />
        </div>

        {/* ADD PHOTO エリア */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border-2 border-dashed border-slate-100 flex flex-col items-center justify-center space-y-2">
          <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ADD PHOTO</div>
          
          {/* ファイル選択ボタン */}
          <label className={`cursor-pointer px-4 py-2 rounded-full text-xs font-black text-white shadow-md transition-all mb-2 ${uploading ? 'bg-slate-300' : 'bg-orange-400 hover:bg-orange-500'}`}>
            {uploading ? "UPLOADING..." : "📷 SELECT IMAGE"}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              disabled={uploading}
              className="hidden" 
            />
          </label>
          <div className="text-[9px] text-slate-300 font-bold mb-1">- OR URL -</div>

          <input 
            type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="画像URLを貼り付け"
            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs text-center"
          />
          {imageUrl && (
            <div className="w-full mt-4 aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-orange-100">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* RATING (星) */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50 text-center">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">RATING</label>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" onClick={() => setRating(star)} className="text-3xl text-orange-300">
                {star <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>

        {/* メモ */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-orange-50">
          <textarea 
            value={memo} onChange={(e) => setMemo(e.target.value)}
            placeholder="味の感想を自由にメモ..."
            className="w-full bg-slate-50/50 border-none rounded-2xl px-4 py-3 text-sm min-h-[100px] outline-none"
          />
        </div>

        {/* PUBLIC/PRIVATE 切替 */}
        <div className="bg-slate-100 p-1 rounded-2xl flex">
          <button 
            type="button" onClick={() => setIsPublic(true)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 ${isPublic ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
          >
            <span>🌎 PUBLIC</span>
          </button>
          <button 
            type="button" onClick={() => setIsPublic(false)}
            className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 ${!isPublic ? 'bg-white shadow-sm text-slate-600' : 'text-slate-400'}`}
          >
            <span>🔒 PRIVATE</span>
          </button>
        </div>

        {/* 投稿ボタン */}
        <button 
          type="submit" disabled={loading}
          className="w-full bg-orange-600 text-white font-black py-5 rounded-full shadow-xl active:scale-95 transition-all text-lg tracking-widest"
        >
          {loading ? "SAVING..." : "POST RECORD +1 EXP"}
        </button>
      </form>
    </main>
  );
}
