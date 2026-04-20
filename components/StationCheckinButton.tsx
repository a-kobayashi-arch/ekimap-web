"use client";

import { useState, useEffect } from "react";
import { getUserId } from "@/lib/userId";

interface Props {
  stationSlug: string;
  stationName: string;
}

/**
 * 駅レベルのチェックインボタン
 *
 * 動作：
 * 1. マウント時に localStorage → API の順で既存チェックインを確認
 * 2. 未チェックイン：アクセントカラーのボタンを表示
 * 3. チェックイン済み：グレー背景・日付表示（ボタン無効化）
 * 4. ボタン押下：楽観的に UI を更新してから API に POST
 */
export default function StationCheckinButton({ stationSlug, stationName }: Props) {
  const lsKey = `station-visited-${stationSlug}`;
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);

    // ① localStorage から高速初期表示
    try {
      const cached = localStorage.getItem(lsKey);
      if (cached) setCheckedInAt(cached);
    } catch {}

    // ② API で最新状態を確認（クロスデバイス同期）
    const userId = getUserId();
    if (!userId) return;

    fetch(
      `/api/station-checkin?userId=${encodeURIComponent(userId)}&stationSlug=${encodeURIComponent(stationSlug)}`
    )
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { checkedIn: boolean; checkedInAt?: string }) => {
        if (data.checkedIn && data.checkedInAt) {
          setCheckedInAt(data.checkedInAt);
          try { localStorage.setItem(lsKey, data.checkedInAt); } catch {}
        } else if (!data.checkedIn) {
          setCheckedInAt(null);
          try { localStorage.removeItem(lsKey); } catch {}
        }
      })
      .catch(() => {
        // API 不可時は localStorage 状態を維持
      });
  }, [stationSlug, lsKey]);

  async function handleCheckin() {
    if (loading || checkedInAt) return;
    setLoading(true);

    // 楽観的更新：先に UI を確定状態に
    const optimisticAt = new Date().toISOString();
    setCheckedInAt(optimisticAt);
    try { localStorage.setItem(lsKey, optimisticAt); } catch {}

    const userId = getUserId();
    if (!userId) { setLoading(false); return; }

    try {
      const res = await fetch("/api/station-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, stationSlug, stationName }),
      });
      const data: {
        success?: boolean;
        checkedInAt?: string;
        alreadyCheckedIn?: boolean;
      } = await res.json();

      // サーバー側の日時で上書き（より正確な時刻）
      const serverAt = data.checkedInAt ?? optimisticAt;
      setCheckedInAt(serverAt);
      try { localStorage.setItem(lsKey, serverAt); } catch {}
    } catch {
      // 通信エラー時は楽観的更新値をそのまま維持
    } finally {
      setLoading(false);
    }
  }

  // SSR ハイドレーション前は何も描画しない
  if (!mounted) return null;

  // ── チェックイン済み表示 ─────────────────────
  if (checkedInAt) {
    const dateStr = new Date(checkedInAt).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-3">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-gray-600">{stationName} 訪問済み</p>
          <p className="text-xs text-gray-400 mt-0.5">{dateStr} にチェックイン済み</p>
        </div>
      </div>
    );
  }

  // ── 未チェックインボタン ──────────────────────
  return (
    <button
      onClick={handleCheckin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold text-white text-base shadow-md transition-all active:scale-95 disabled:opacity-60 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600"
    >
      {loading ? (
        <>
          <span className="inline-block animate-spin">⏳</span>
          記録中...
        </>
      ) : (
        <>
          🏅 {stationName}にチェックイン
        </>
      )}
    </button>
  );
}
