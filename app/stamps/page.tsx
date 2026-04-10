"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllStations } from "@/lib/stations";
import StampProgress from "@/components/StampProgress";
import type { Facility } from "@/types";

export default function StampsPage() {
  const stations = getAllStations();
  const [checkedMap, setCheckedMap] = useState<Record<string, Set<string>>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const map: Record<string, Set<string>> = {};
    for (const station of stations) {
      try {
        const stored = localStorage.getItem(`checkins-${station.id}`);
        map[station.id] = stored ? new Set(JSON.parse(stored)) : new Set();
      } catch {
        map[station.id] = new Set();
      }
    }
    setCheckedMap(map);
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const totalAll = stations.reduce((sum, s) => sum + s.facilities.length, 0);
  const checkedAll = stations.reduce(
    (sum, s) => sum + (s.facilities.filter((f: Facility) => checkedMap[s.id]?.has(f.id)).length),
    0
  );

  function handleReset() {
    if (!confirm("チェックインをすべてリセットしますか？\nこの操作は元に戻せません。")) return;
    for (const station of stations) {
      localStorage.removeItem(`checkins-${station.id}`);
    }
    const empty: Record<string, Set<string>> = {};
    for (const station of stations) empty[station.id] = new Set();
    setCheckedMap(empty);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">スタンプ帳</h1>
        {checkedAll > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            全リセット
          </button>
        )}
      </div>

      {/* Overall progress */}
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-sm text-blue-600 font-medium mb-1">総合チェックイン数</p>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-blue-700">{checkedAll}</span>
          <span className="text-blue-500">/ {totalAll} 施設</span>
        </div>
      </div>

      {/* Per station */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">駅別の進捗</h2>
        {stations.map((station) => (
          <div key={station.id}>
            <StampProgress station={station} />
            {/* Checked-in facilities for this station */}
            {(checkedMap[station.id]?.size ?? 0) > 0 && (
              <div className="mt-2 ml-2 space-y-1">
                {station.facilities
                  .filter((f: Facility) => checkedMap[station.id]?.has(f.id))
                  .map((f: Facility) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="text-green-500">✓</span>
                      <span>{f.name}</span>
                      <span className="text-gray-400 text-xs">{f.floor}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </section>

      {checkedAll === 0 && (
        <div className="text-center py-10 text-gray-400">
          <div className="text-5xl mb-3">🎫</div>
          <p className="font-medium">まだチェックインがありません</p>
          <p className="text-sm mt-1">駅に行って施設をチェックインしよう！</p>
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
