import type { Metadata } from "next";

export const metadata: Metadata = {
  // ブラウザのタブに表示される名前
  title: "ラーメンラリー 🍥 | 今日の一杯を記録しよう",
  description: "ラーメン好きのための、親しみやすいスタンプ＆記録アプリです。",
  
  // SNS（LINE/Twitter）で送った時の表示
  openGraph: {
    title: "ラーメンラリー 🍥",
    description: "【プレリリース中】一緒に美味しいラーメンを記録しませんか？ログインして始めよう！",
    url: "https://ramen-rally.vercel.app", 
    siteName: "ラーメンラリー",
    locale: "ja_JP",
    type: "website",
    // もし画像があればここに入れます。一旦無しでもタイトルと説明は出ます。
    images: [
      {
        url: "https://ramen-rally.vercel.app/ogp.png", 
        width: 1200,
        height: 630,
        alt: "ラーメンラリーのプレビュー画像",
      },
    ],
  },
  
  // Twitter(X)専用の設定
  twitter: {
    card: "summary_large_image",
    title: "ラーメンラリー 🍥",
    description: "親しみやすさ重視のラーメン管理アプリ",
  },
};
