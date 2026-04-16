"use client";

import { useState, useEffect } from "react";
import type { Category, Facility, StationExit } from "@/types";
import FacilityCard from "./FacilityCard";

const CATEGORIES: Category[] = ["飲食店", "ショップ", "サービス", "設備", "その他"];
const ALL_TAB = "すべて";

interface FacilityTabsProps {
  facilities: Facility[];
  stationId: string;
  exits?: StationExit[];
}

export default function FacilityTabs({ facilities, stationId, exits }: FacilityTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [filterOutlet, setFilterOutlet] = useState(false);
  const [filterSeating, setFilterSeating] = useState(false);

  const visitedKey    = `visited-${stationId}`;
  const interestedKey = `interested-${stationId}`;

  useEffect(() => {
    try {
      const v = localStorage.getItem(visitedKey);
      const i = localStorage.getItem(interestedKey);
      if (v) setVisitedIds(new Set(JSON.parse(v)));
      if (i) setInterestedIds(new Set(JSON.parse(i)));
    } catch {}
  }, [visitedKey, interestedKey]);

  function toggle(
    id: string,
    current: Set<string>,
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string
  ) {
    setter(() => {
      const next = new Set(current);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      try { localStorage.setItem(key, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  // Category filter
  const categoryFiltered =
    activeTab === ALL_TAB
      ? facilities
      : facilities.filter((f) => f.category === activeTab);

  // Attribute filters
  const displayed = categoryFiltered.filter((f) => {
    if (filterOutlet && f.outlet !== "available") return false;
    if (filterSeating && f.seating !== "yes") return false;
    return true;
  });

  const tabs = [ALL_TAB, ...CATEGORIES];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const count =
            tab === ALL_TAB
              ? facilities.length
              : facilities.filter((f) => f.category === tab).length;
          if (tab !== ALL_TAB && count === 0) return null;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-blue-500 text-white shadow"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
              <span className={`ml-1 text-xs ${activeTab === tab ? "text-blue-100" : "text-gray-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Attribute filter buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setFilterOutlet((v) => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            filterOutlet
              ? "bg-green-500 text-white border-green-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600"
          }`}
        >
          🔌 コンセント
        </button>
        <button
          onClick={() => setFilterSeating((v) => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
            filterSeating
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
          }`}
        >
          🪑 座れる
        </button>
      </div>

      {/* Facility list */}
      <div className="mt-4 flex flex-col gap-3">
        {displayed.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            stationId={stationId}
            exits={exits}
            visited={visitedIds.has(facility.id)}
            interested={interestedIds.has(facility.id)}
            onToggleVisited={() => toggle(facility.id, visitedIds, setVisitedIds, visitedKey)}
            onToggleInterested={() => toggle(facility.id, interestedIds, setInterestedIds, interestedKey)}
          />
        ))}
        {displayed.length === 0 && (
          <p className="text-center text-gray-400 py-8">
            {filterOutlet || filterSeating ? "条件に合う施設がありません" : "施設情報がありません"}
          </p>
        )}
      </div>
    </div>
  );
}
