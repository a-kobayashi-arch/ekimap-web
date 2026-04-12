"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/types";

interface StampProgressProps {
  station: Station;
}

export default function StampProgress({ station }: StampProgressProps) {
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const v = localStorage.getItem(`visited-${station.id}`);
      const i = localStorage.getItem(`interested-${station.id}`);
      if (v) setVisitedIds(new Set(JSON.parse(v)));
      if (i) setInterestedIds(new Set(JSON.parse(i)));
    } catch {}
  }, [station.id]);

  const total = station.facilities.length;
  const visitedCount    = station.facilities.filter((f) => visitedIds.has(f.id)).length;
  const interestedCount = station.facilities.filter((f) => interestedIds.has(f.id)).length;
  const percent = total > 0 ? Math.round((visitedCount / total) * 100) : 0;
  const isComplete = visitedCount === total;

  return (
    <div className={`rounded-2xl p-5 ${isComplete ? "bg-yellow-50 border border-yellow-200" : "bg-white border border-gray-100"} shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800">{station.name}</h3>
          {station.building && <p className="text-sm text-gray-400">{station.building}</p>}
        </div>
        {isComplete ? <span className="text-3xl">🏆</span> : <span className="text-3xl">🎫</span>}
      </div>

      <div className="flex items-baseline gap-3 mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-green-600">{visitedCount}</span>
          <span className="text-gray-500">/ {total} 行った</span>
        </div>
        {interestedCount > 0 && (
          <div className="flex items-baseline gap-1 text-sm">
            <span className="font-bold text-yellow-500">{interestedCount}</span>
            <span className="text-gray-400">気になる</span>
          </div>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${isComplete ? "bg-yellow-400" : "bg-green-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{percent}%</p>

      {isComplete && (
        <p className="text-center text-yellow-700 font-semibold mt-2 text-sm">
          全施設訪問おめでとうございます！🎉
        </p>
      )}
    </div>
  );
}
