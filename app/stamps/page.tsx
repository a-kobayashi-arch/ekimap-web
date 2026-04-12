"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllStations } from "@/lib/stations";
import StampProgress from "@/components/StampProgress";
import type { Facility } from "@/types";

export default function StampsPage() {
  const stations = getAllStations();
  const [visitedMap,    setVisitedMap]    = useState<Record<string, Set<string>>>({});
  const [interestedMap, setInterestedMap] = useState<Record<string, Set<string>>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const vm: Record<string, Set<string>> = {};
    const im: Record<string, Set<string>> = {};
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
    }
    setVisitedMap(vm);
    setInterestedMap(im);
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  const totalAll   = stations.reduce((sum, s) => sum + s.facilities.length, 0);
  const visitedAll = stations.reduce(
    (sum, s) => sum + s.facilities.filter((f: Facility) => visitedMap[s.id]?.has(f.id)).length, 0
  );
  const interestedAll = stations.reduce(
    (sum, s) => sum + s.facilities.filter((f: Facility) => interestedMap[s.id]?.has(f.id)).length, 0
  );

  function handleReset() {
    if (!confirm("「行った」「気になる」の記録をすべてリセットしますか？\nこの操作は元に戻せません。")) return;
    for (const station of stations) {
      localStorage.removeItem(`visited-${station.id}`);
      localStorage.removeItem(`interested-${station.id}`);
    }
    const emptyV: Record<string, Set<string>> = {};
    const emptyI: Record<string, Set<string>> = {};
    for (const station of stations) {
      emptyV[station.id] = new Set();
      emptyI[station.id] = new Set();
    }
    setVisitedMap(emptyV);
    setInterestedMap(emptyI);
  }

  const hasAny = visitedAll > 0 || interestedAll > 0;

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

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-sm text-green-600 font-medium mb-1">✓ 行った</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-green-700">{visitedAll}</span>
            <span className="text-green-500 text-sm">/ {totalAll}</span>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
          <p className="text-sm text-yellow-600 font-medium mb-1">★ 気になる</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-yellow-600">{interestedAll}</span>
            <span className="text-yellow-400 text-sm">件</span>
          </div>
        </div>
      </div>

      {/* Per station */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">駅別の進捗</h2>
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
          <p className="text-sm mt-1">訪れた施設に「行った」を、気になる施設に「気になる」を押してみよう！</p>
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
