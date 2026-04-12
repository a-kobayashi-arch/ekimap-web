"use client";

import type { Facility, GateArea } from "@/types";

const categoryEmoji: Record<string, string> = {
  飲食: "🍴",
  コンビニ: "🏪",
  ATM: "🏧",
  トイレ: "🚻",
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

interface FacilityCardProps {
  facility: Facility;
  stationId: string;
  checkedIn: boolean;
  onCheckIn: (facilityId: string) => void;
}

export default function FacilityCard({ facility, checkedIn, onCheckIn }: FacilityCardProps) {
  const gate = gateAreaStyle[facility.gateArea];

  return (
    <div className={`bg-white rounded-xl border p-4 transition-all ${checkedIn ? "border-green-300 bg-green-50" : "border-gray-100"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{categoryEmoji[facility.category] ?? "📍"}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 truncate">{facility.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${gate.className}`}>
              {gate.label}
            </span>
            {checkedIn && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                ✓ チェックイン済み
              </span>
            )}
          </div>
          {facility.description && (
            <p className="text-sm text-gray-500 mt-0.5">{facility.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>📍 {facility.floor}</span>
            <span>🕐 {facility.hours}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onCheckIn(facility.id)}
          disabled={checkedIn}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            checkedIn
              ? "bg-green-100 text-green-600 cursor-default"
              : "bg-blue-500 hover:bg-blue-600 text-white active:scale-95"
          }`}
        >
          {checkedIn ? "チェックイン済み" : "チェックイン"}
        </button>
      </div>
    </div>
  );
}
