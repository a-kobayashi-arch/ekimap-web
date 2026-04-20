"use client";

import { useState, useEffect } from "react";
import { getUserId } from "@/lib/userId";

/**
 * チェックイン状態を管理するカスタムフック
 *
 * 動作：
 * 1. localStorage から即座に初期値を読み込み（高速レンダリング）
 * 2. マウント後に API からユーザーの全チェックイン一覧を取得し最新状態に更新
 * 3. toggle() は楽観的更新（UI 即時反映 → API は非同期）
 * 4. 全操作で localStorage にも書き戻し（StampProgress との同期用）
 * 5. API 不可時は localStorage のみで動作（フォールバック）
 */
export function useCheckins(stationId: string) {
  const lsKey = `visited-${stationId}`;

  // localStorage から初期値を読み込む（SSR では空 Set）
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem(lsKey);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  // マウント後に API から最新状態を取得して反映
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    fetch(`/api/checkins?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { checkins: string[] }) => {
        if (!Array.isArray(data.checkins)) return;
        setCheckedIds(new Set(data.checkins));
        // localStorage に書き戻し（StampProgress / スタンプ帳との同期）
        try {
          localStorage.setItem(lsKey, JSON.stringify(data.checkins));
        } catch {}
      })
      .catch(() => {
        // API エラー時はそのまま localStorage 状態を維持
      });
  }, [lsKey]);

  /** チェックイン状態をトグル（楽観的更新） */
  function toggle(facilityId: string) {
    const isChecked = checkedIds.has(facilityId);

    // 楽観的 UI 更新
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (isChecked) next.delete(facilityId);
      else next.add(facilityId);
      // localStorage 同期（StampProgress のため）
      try {
        localStorage.setItem(lsKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });

    // API に非同期で記録（失敗しても UI はロールバックしない）
    const userId = getUserId();
    if (!userId) return;

    if (isChecked) {
      fetch("/api/checkins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, facilityId }),
      }).catch(() => {});
    } else {
      fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, facilityId, stationId }),
      }).catch(() => {});
    }
  }

  return { checkedIds, toggle };
}
