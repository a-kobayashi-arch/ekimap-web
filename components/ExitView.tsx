"use client";

import { useState } from "react";
import type { Station, Facility } from "@/types";
import { calcFacilityTransferTime } from "@/lib/transferTimeCalculator";

interface ExitViewProps {
  station: Station;
}

const categoryEmoji: Record<string, string> = {
  飲食店: "🍽️",
  ショップ: "🛍️",
  サービス: "💆",
  設備: "🔧",
  その他: "📦",
};

function FacilityRow({
  facility,
  stationId,
}: {
  facility: Facility;
  stationId: string;
}) {
  const result = calcFacilityTransferTime(
    facility.distanceFromExit,
    facility.floorsToClimb,
    stationId
  );
  if (!result) return null;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base shrink-0">{categoryEmoji[facility.category] ?? "📍"}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{facility.name}</p>
          {facility.areaInBuilding && (
            <p className="text-xs text-gray-400">{facility.areaInBuilding}</p>
          )}
        </div>
      </div>
      <span className="shrink-0 ml-3 text-sm font-bold text-blue-600">
        {result.minutes}分
      </span>
    </div>
  );
}

export default function ExitView({ station }: ExitViewProps) {
  const exits = station.exits;
  const [activeExit, setActiveExit] = useState<string>(exits?.[0]?.id ?? "");

  if (!exits || exits.length === 0) return null;

  // 選択中の改札に対応する施設を抽出し、距離昇順でソート
  const facilitiesForExit = station.facilities
    .filter((f) => f.nearestExit === activeExit && f.distanceFromExit !== undefined)
    .sort((a, b) => (a.distanceFromExit ?? 0) - (b.distanceFromExit ?? 0));

  const currentExit = exits.find((e) => e.id === activeExit);

  return (
    <section className="mt-6">
      <h2 className="font-semibold text-gray-700 mb-3">改札から探す</h2>

      {/* Exit selector */}
      <div className="flex gap-2 mb-4">
        {exits.map((exit) => {
          const count = station.facilities.filter((f) => f.nearestExit === exit.id).length;
          return (
            <button
              key={exit.id}
              onClick={() => setActiveExit(exit.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                activeExit === exit.id
                  ? "bg-blue-500 text-white border-blue-500 shadow"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              🚪 {exit.name}
              <span className={`ml-1 text-xs ${activeExit === exit.id ? "text-blue-100" : "text-gray-400"}`}>
                {count}件
              </span>
            </button>
          );
        })}
      </div>

      {/* Description */}
      {currentExit?.description && (
        <p className="text-xs text-gray-400 mb-3">{currentExit.description}</p>
      )}

      {/* Facility list sorted by distance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-1">
        {facilitiesForExit.length > 0 ? (
          facilitiesForExit.map((f) => (
            <FacilityRow key={f.id} facility={f} stationId={station.id} />
          ))
        ) : (
          <p className="text-center text-gray-400 py-6 text-sm">
            この改札に対応するデータがありません
          </p>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">
        ※ 乗り換え時間は推定値です。実際の所要時間は混雑状況により異なります。
      </p>
    </section>
  );
}
