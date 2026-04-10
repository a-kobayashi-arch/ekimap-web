"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/types";

interface StampProgressProps {
  station: Station;
}

export default function StampProgress({ station }: StampProgressProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`checkins-${station.id}`);
      if (stored) setCheckedIds(new Set(JSON.parse(stored)));
    } catch {}
  }, [station.id]);

  const total = station.facilities.length;
  const count = station.facilities.filter((f) => checkedIds.has(f.id)).length;
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  const isComplete = count === total;

  return (
    <div className={`rounded-2xl p-5 ${isComplete ? "bg-yellow-50 border border-yellow-200" : "bg-white border border-gray-100"} shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-800">{station.name}</h3>
          {station.building && <p className="text-sm text-gray-400">{station.building}</p>}
        </div>
        {isComplete ? (
          <span className="text-3xl">🏆</span>
        ) : (
          <span className="text-3xl">🎫</span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-blue-600">{count}</span>
        <span className="text-gray-500">/ {total} 施設 制覇！</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${isComplete ? "bg-yellow-400" : "bg-blue-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 mt-1">{percent}%</p>

      {isComplete && (
        <p className="text-center text-yellow-700 font-semibold mt-2 text-sm">
          全施設制覇おめでとうございます！🎉
        </p>
      )}
    </div>
  );
}
