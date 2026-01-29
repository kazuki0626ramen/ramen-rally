import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ラーメンアプリ（仮）🍥",
  description: "あなたの一杯を記録しよう！親しみやすいラーメン管理アプリです。",
  openGraph: {
    title: "ラーメンアプリ（仮）🍥",
    description: "今日も美味しい一杯を！ログインして始めよう。",
    url: "https://your-app-url.vercel.app", // 公開後のURLに書き換えてください
    siteName: "ラーメンアプリ",
    images: [
      {
        url: "/ogp-image.png", // publicフォルダに画像を置くか、一旦無しでもタイトルは出ます
        width: 1200,
        height: 630,
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ラーメンアプリ（仮）🍥",
    description: "親しみやすさ重視のラーメン管理アプリ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
