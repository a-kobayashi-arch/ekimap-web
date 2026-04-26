"use client";

import { useState } from "react";
import type { Facility, GateArea, StationExit } from "@/types";
import ReportModal from "./ReportModal";
import { calcFacilityTransferTime } from "@/lib/transferTimeCalculator";

const categoryEmoji: Record<string, string> = {
  飲食店: "🍽️",
  ショップ: "🛍️",
  "食材・お土産": "🎁",
  "雑貨・文具": "🛒",
  サービス: "💆",
  設備: "🔧",
  その他: "📦",
};

const gateAreaStyle: Record<GateArea, { label: string; className: string }> = {
  改札内: {
    label: "改札内",
    className: "bg-orange-100 text-orange-700 border border-orange-200",
  },
  改札外: {
    label: "改札外",
    className: "bg-sky-100 text-sky-700 border border-sky-200",
  },
  調査中: {
    label: "調査中",
    className: "bg-gray-100 text-gray-400 border border-gray-200",
  },
};

function OutletIcon({ status }: { status?: string }) {
  if (status === "available") {
    return <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">🔌 あり</span>;
  }
  return <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">🔌 不明</span>;
}

function SeatingIcon({ status }: { status?: string }) {
  if (status === "yes") {
    return <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">🪑 座れる</span>;
  }
  if (status === "no") {
    return <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">🪑 座れない</span>;
  }
  return <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">🪑 不明</span>;
}

const crowdedIcon: Record<string, string> = {
  empty: "🟢",
  normal: "🟡",
  crowded: "🔴",
  unknown: "❓",
};

const crowdedLabel: Record<string, string> = {
  empty: "空いてる",
  normal: "普通",
  crowded: "混んでる",
  unknown: "混雑不明",
};

function CrowdedIcon({ status }: { status?: string }) {
  if (!status) return null;
  return (
    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
      <span className="text-lg leading-none">{crowdedIcon[status] ?? "❓"}</span>
      {crowdedLabel[status]}
    </span>
  );
}

interface FacilityCardProps {
  facility: Facility;
  stationId: string;
  exits?: StationExit[];
  visited: boolean;
  interested: boolean;
  onToggleVisited: () => void;
  onToggleInterested: () => void;
}

export default function FacilityCard({
  facility,
  stationId,
  exits,
  visited,
  interested,
  onToggleVisited,
  onToggleInterested,
}: FacilityCardProps) {
  const [showReport, setShowReport] = useState(false);
  const gate = gateAreaStyle[facility.gateArea];

  const hasStatusInfo =
    facility.outlet !== undefined ||
    facility.seating !== undefined ||
    facility.crowded !== undefined;

  // 乗り換え時間の計算
  const transferResult = calcFacilityTransferTime(
    facility.distanceFromExit,
    facility.floorsToClimb,
    stationId
  );
  const nearestExitInfo = exits?.find((e) => e.id === facility.nearestExit);

  return (
    <>
      <div className={`bg-white rounded-xl border p-4 transition-all ${
        visited ? "border-green-300 bg-green-50" : interested ? "border-yellow-300 bg-yellow-50" : "border-gray-100"
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{categoryEmoji[facility.category] ?? "📍"}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800 truncate">{facility.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${gate.className}`}>
                {gate.label}
              </span>
            </div>
            {facility.description && (
              <p className="text-sm text-gray-500 mt-0.5">{facility.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>📍 {facility.floor}</span>
              <span>🕐 {facility.hours}</span>
            </div>

            {/* Status icons */}
            {hasStatusInfo && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {facility.outlet !== undefined && <OutletIcon status={facility.outlet} />}
                {facility.seating !== undefined && <SeatingIcon status={facility.seating} />}
                {facility.crowded !== undefined && (
                  <CrowdedIcon status={facility.crowded} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Transfer time info */}
        {transferResult && (
          <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
            {nearestExitInfo && (
              <span>🚪 {nearestExitInfo.name}</span>
            )}
            <span>
              ⏱ <span className="font-semibold text-gray-800">{transferResult.minutes}分</span>
              <span className="text-gray-400 ml-1">（目安 {transferResult.range}）</span>
            </span>
            {facility.areaInBuilding && (
              <span>🏢 {facility.areaInBuilding}</span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 flex gap-2 justify-between items-center">
          <button
            onClick={() => setShowReport(true)}
            className="text-xs text-gray-400 hover:text-blue-500 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
          >
            📝 情報を報告する
          </button>
          <div className="flex gap-2">
            <button
              onClick={onToggleInterested}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                interested
                  ? "bg-yellow-400 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600"
              }`}
            >
              {interested ? "★ 気になる" : "☆ 気になる"}
            </button>
            <button
              onClick={onToggleVisited}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${
                visited
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600"
              }`}
            >
              {visited ? "✓ 行った" : "行った"}
            </button>
          </div>
        </div>
      </div>

      {showReport && (
        <ReportModal
          facilityId={facility.id}
          facilityName={facility.name}
          stationId={stationId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
