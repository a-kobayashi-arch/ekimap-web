import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteMain from "@/components/SiteMain";

export const metadata: Metadata = {
  title: "駅ナカマップ",
  description: "改札内施設の探索・目的別検索・滞在サポートアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">
        <SiteHeader />
        <SiteMain>{children}</SiteMain>
      </body>
    </html>
  );
}
