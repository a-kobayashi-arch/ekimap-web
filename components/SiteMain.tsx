"use client";

import { usePathname } from "next/navigation";

/**
 * ルートレイアウト用 main ラッパー。
 * /jr 配下では max-w-2xl 制約を外し、JR専用レイアウトの幅設計に委譲する。
 * それ以外では B2C 用の max-w-2xl mx-auto px-4 py-6 を適用する。
 */
export default function SiteMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /jr および /jr/* では幅制約なし
  if (pathname === "/jr" || pathname.startsWith("/jr/")) {
    return <>{children}</>;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
  );
}
