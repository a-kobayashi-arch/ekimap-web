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
    <div className="bg-white min-h-screen">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/jr" className="text-sm font-semibold text-gray-800 tracking-wide">
            駅ナカ回遊 PoC
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/jr/demo" className="hover:text-gray-800 transition-colors">
              デモを見る
            </Link>
            <Link
              href="/"
              className="hover:text-gray-800 transition-colors"
            >
              ← 一般向けサイト
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
