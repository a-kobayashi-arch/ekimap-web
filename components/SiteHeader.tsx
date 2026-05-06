"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * ルートレイアウト用ヘッダー。
 * /jr 配下では非表示（null）とし、JR専用レイアウトのヘッダーに委譲する。
 * それ以外では B2C 用ヘッダー（駅ナカマップ / スタンプ帳）を表示する。
 */
export default function SiteHeader() {
  const pathname = usePathname();

  // /jr および /jr/* では非表示
  if (pathname === "/jr" || pathname.startsWith("/jr/")) return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
          <span>🚉</span>
          <span>駅ナカマップ</span>
        </Link>
        <Link
          href="/stamps"
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
        >
          <span>🎫</span>
          <span>スタンプ帳</span>
        </Link>
      </div>
    </header>
  );
}
