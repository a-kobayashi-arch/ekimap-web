import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

export const metadata: Metadata = {
  title: "駅ナカ回遊・送客最適化 PoC | JR東日本スタートアップ応募",
  description:
    "改札内の回遊・滞在価値・店舗送客を可視化する駅ナカ運営DX/販促基盤のPoCプロポーザル",
};

export default function JrLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F6FAF7] min-h-screen">
      <header className="border-b border-[#c8e6d0] bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/jr" className="text-sm font-semibold text-[#1A7040] tracking-wide">
            駅空間DXプラットフォーム
          </Link>
          <nav className="flex items-center gap-5 text-sm text-gray-500">
            <Link href="/jr" className="hover:text-gray-800 transition-colors">
              提案概要
            </Link>
            <Link href="/jr/demo-sample" className="hover:text-gray-800 transition-colors">
              審査用デモ
            </Link>
            <Link href="/" className="hover:text-gray-800 transition-colors">
              ユーザー画面
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-100 mt-24">
        <div className="max-w-5xl mx-auto px-6 py-8 text-xs text-gray-400">
          本資料はJR東日本スタートアップ応募用のPoC提案資料です。
        </div>
      </footer>
    </div>
  );
}
