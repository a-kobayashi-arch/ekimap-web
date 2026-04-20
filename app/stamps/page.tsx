"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllStations } from "@/lib/stations";
import StampProgress from "@/components/StampProgress";
import type { Facility } from "@/types";
import { getUserId } from "@/lib/userId";

export default function StampsPage() {
  const stations = getAllStations();

  // ── 施設チェックイン状態 ──────────────────────────
  const [visitedMap,    setVisitedMap]    = useState<Record<string, Set<string>>>({});
  const [interestedMap, setInterestedMap] = useState<Record<string, Set<string>>>({});

  // ── 駅スタンプ状態 ───────────────────────────────
  const [checkedInStations, setCheckedInStations] = useState<Set<string>>(new Set());

  const [mounted, setMounted] = useState(false);

  // ① localStorage から初期読み込み（高速表示）
  useEffect(() => {
    const vm: Record<string, Set<string>> = {};
    const im: Record<string, Set<string>> = {};
    const stationSet = new Set<string>();

    for (const station of stations) {
      try {
        const v = localStorage.getItem(`visited-${station.id}`);
        const i = localStorage.getItem(`interested-${station.id}`);
        vm[station.id] = v ? new Set(JSON.parse(v)) : new Set();
        im[station.id] = i ? new Set(JSON.parse(i)) : new Set();
      } catch {
        vm[station.id] = new Set();
        im[station.id] = new Set();
      }
      // 駅スタンプの localStorage 確認
      try {
        const sv = localStorage.getItem(`station-visited-${station.slug}`);
        if (sv) stationSet.add(station.slug);
      } catch {}
    }

    setVisitedMap(vm);
    setInterestedMap(im);
    setCheckedInStations(stationSet);
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ② API から施設チェックイン最新状態を取得（クロスデバイス同期）
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    fetch(`/api/checkins?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { checkins: string[] }) => {
        if (!Array.isArray(data.checkins)) return;

        setVisitedMap(() => {
          const next: Record<string, Set<string>> = {};
          for (const station of stations) {
            const facilityIdSet = new Set(station.facilities.map((f: Facility) => f.id));
            const matched = data.checkins.filter((id) => facilityIdSet.has(id));
            next[station.id] = new Set(matched);
            try {
              localStorage.setItem(`visited-${station.id}`, JSON.stringify(matched));
            } catch {}
          }
          return next;
        });
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ③ API から駅スタンプ最新状態を取得（クロスデバイス同期）
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    fetch(`/api/station-checkin?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { stations: string[] }) => {
        if (!Array.isArray(data.stations)) return;
        const slugSet = new Set(data.stations);
        setCheckedInStations(slugSet);
        // localStorage に書き戻し（各駅のキーはチェックイン時刻が必要なため
        // ここでは slugSet を記録するだけ。日付は StationCheckinButton が管理）
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  // ── 集計 ────────────────────────────────────────
  const totalAll   = stations.reduce((sum, s) => sum + s.facilities.length, 0);
  const visitedAll = stations.reduce(
    (sum, s) => sum + s.facilities.filter((f: Facility) => visitedMap[s.id]?.has(f.id)).length, 0
  );
  const interestedAll = stations.reduce(
    (sum, s) => sum + s.facilities.filter((f: Facility) => interestedMap[s.id]?.has(f.id)).length, 0
  );
  const stationVisitedCount = checkedInStations.size;
  const stationTotalCount   = stations.length;

  function handleReset() {
    if (!confirm("スタンプ帳の記録をすべてリセットしますか？\n（駅スタンプ・施設チェックイン両方）\nこの操作は元に戻せません。")) return;

    for (const station of stations) {
      localStorage.removeItem(`visited-${station.id}`);
      localStorage.removeItem(`interested-${station.id}`);
      localStorage.removeItem(`station-visited-${station.slug}`);
    }

    const emptyV: Record<string, Set<string>> = {};
    const emptyI: Record<string, Set<string>> = {};
    for (const station of stations) {
      emptyV[station.id] = new Set();
      emptyI[station.id] = new Set();
    }
    setVisitedMap(emptyV);
    setInterestedMap(emptyI);
    setCheckedInStations(new Set());

    // KV から施設チェックインを削除（facilityId 省略 → 全削除）
    const userId = getUserId();
    if (userId) {
      fetch("/api/checkins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      }).catch(() => {});
      // 注: 駅スタンプの KV 削除は未実装（将来対応）
    }
  }

  const hasAny = visitedAll > 0 || interestedAll > 0 || stationVisitedCount > 0;

  // 路線制覇バーの幅
  const linePercent = stationTotalCount > 0
    ? Math.round((stationVisitedCount / stationTotalCount) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">スタンプ帳</h1>
        {hasAny && (
          <button
            onClick={handleReset}
            className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            全リセット
          </button>
        )}
      </div>

      {/* ── サマリーカード ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
          <p className="text-xs text-green-600 font-medium mb-1">🏅 駅スタンプ</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-green-700">{stationVisitedCount}</span>
            <span className="text-green-400 text-xs">/ {stationTotalCount}</span>
          </div>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-xs text-green-600 font-medium mb-1">✓ 行った</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-green-700">{visitedAll}</span>
            <span className="text-green-500 text-xs">/ {totalAll}</span>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <p className="text-xs text-yellow-600 font-medium mb-1">★ 気になる</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-yellow-600">{interestedAll}</span>
            <span className="text-yellow-400 text-xs">件</span>
          </div>
        </div>
      </div>

      {/* ── 路線制覇セクション ─────────────────────── */}
      <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            🚃 埼京線コンプリートチャレンジ
          </h2>
          <span className="text-sm text-gray-500">
            {stationVisitedCount}/{stationTotalCount}駅制覇
          </span>
        </div>

        {/* プログレスバー */}
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              stationVisitedCount === stationTotalCount ? "bg-yellow-400" : "bg-green-500"
            }`}
            style={{ width: `${linePercent}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 mt-1 text-right block mb-3">
          {linePercent}% 制覇
        </span>

        {/* 駅スタンプグリッド */}
        <div className="flex flex-wrap gap-2">
          {stations.map((station) => {
            const visited = checkedInStations.has(station.slug);
            return (
              <Link
                key={station.id}
                href={`/station/${station.slug}`}
                className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  visited
                    ? "bg-green-500 border-green-600 text-white shadow-md"
                    : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                <span className="text-base">{visited ? "✅" : "⬜"}</span>
                <span className="mt-0.5 whitespace-nowrap">{station.name}</span>
              </Link>
            );
          })}
        </div>

        {stationVisitedCount === stationTotalCount && stationTotalCount > 0 && (
          <p className="text-center text-yellow-700 font-semibold mt-3 text-sm">
            全駅制覇おめでとうございます！🎉
          </p>
        )}
      </section>

      {/* ── 施設チェックインセクション ────────────── */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          施設チェックイン
        </h2>
        {stations.map((station) => (
          <div key={station.id}>
            <StampProgress station={station} />
            {/* Visited facilities */}
            {(visitedMap[station.id]?.size ?? 0) > 0 && (
              <div className="mt-2 ml-2 space-y-1">
                {station.facilities
                  .filter((f: Facility) => visitedMap[station.id]?.has(f.id))
                  .map((f: Facility) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>{f.name}</span>
                      <span className="text-gray-400 text-xs">{f.floor}</span>
                    </div>
                  ))}
              </div>
            )}
            {/* Interested facilities */}
            {(interestedMap[station.id]?.size ?? 0) > 0 && (
              <div className="mt-1 ml-2 space-y-1">
                {station.facilities
                  .filter((f: Facility) => interestedMap[station.id]?.has(f.id))
                  .map((f: Facility) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="text-yellow-400">★</span>
                      <span>{f.name}</span>
                      <span className="text-gray-400 text-xs">{f.floor}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {!hasAny && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🎫</div>
          <p className="font-medium">まだ記録がありません</p>
          <p className="text-sm mt-1">
            駅ページで「チェックイン」ボタンを押して駅スタンプを集めよう！
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            駅を探す
          </Link>
        </div>
      )}
    </div>
  );
}
