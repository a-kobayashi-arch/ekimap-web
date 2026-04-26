"use client";

import { useState, useEffect } from "react";
import type { Building, Category, Facility, StationExit } from "@/types";
import FacilityCard from "./FacilityCard";
import { useCheckins } from "@/hooks/useCheckins";

const CATEGORIES: Category[] = ["飲食店", "食材・お土産", "雑貨・文具", "ショップ", "サービス", "設備", "その他"];
const ALL_TAB = "すべて";
const ALL_EXIT = "all";

interface FacilityTabsProps {
  facilities: Facility[];
  stationId: string;
  exits?: StationExit[];
  buildings?: Building[];
}

export default function FacilityTabs({ facilities, stationId, exits, buildings }: FacilityTabsProps) {
  const hasMultiBuildings = (buildings?.length ?? 0) >= 2;
  const defaultBuilding = buildings?.[0]?.id ?? "";

  const [activeBuilding, setActiveBuilding] = useState<string>(defaultBuilding);
  const [activeExit, setActiveExit] = useState<string>(ALL_EXIT);
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [interestedIds, setInterestedIds] = useState<Set<string>>(new Set());
  const [filterOutlet, setFilterOutlet] = useState(false);
  const [filterSeating, setFilterSeating] = useState(false);

  // visited は useCheckins フック（KV + localStorage 同期）
  const { checkedIds: visitedIds, toggle: toggleVisited } = useCheckins(stationId);

  const interestedKey = `interested-${stationId}`;

  useEffect(() => {
    try {
      const i = localStorage.getItem(interestedKey);
      if (i) setInterestedIds(new Set(JSON.parse(i)));
    } catch {}
  }, [interestedKey]);

  function toggleInterested(id: string) {
    setInterestedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      try { localStorage.setItem(interestedKey, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function handleBuildingChange(buildingId: string) {
    setActiveBuilding(buildingId);
    setActiveExit(ALL_EXIT);
    setActiveTab(ALL_TAB);
  }

  function handleExitChange(exitId: string) {
    setActiveExit(exitId);
    setActiveTab(ALL_TAB);
  }

  // ── フィルタリングパイプライン ──

  // 1. Building フィルタ
  const buildingFiltered = hasMultiBuildings
    ? facilities.filter((f) => f.building === activeBuilding)
    : facilities;

  // 2. このビルディングに関連する改札口（nearestExitが存在するもの）
  const relevantExits = exits?.filter((exit) =>
    buildingFiltered.some((f) => f.nearestExit === exit.id)
  ) ?? [];
  const showExitFilter = relevantExits.length >= 2;

  // 3. Exit フィルタ（選択時は距離順ソート）
  let exitFiltered: Facility[];
  if (activeExit === ALL_EXIT) {
    exitFiltered = buildingFiltered;
  } else {
    exitFiltered = buildingFiltered
      .filter((f) => f.nearestExit === activeExit)
      .sort((a, b) => (a.distanceFromExit ?? 999) - (b.distanceFromExit ?? 999));
  }

  // 4. Category フィルタ
  const categoryFiltered =
    activeTab === ALL_TAB
      ? exitFiltered
      : exitFiltered.filter((f) => f.category === activeTab);

  // 5. Attribute フィルタ
  const displayed = categoryFiltered.filter((f) => {
    if (filterOutlet && f.outlet !== "available") return false;
    if (filterSeating && f.seating !== "yes") return false;
    return true;
  });

  const tabs = [ALL_TAB, ...CATEGORIES];

  return (
    <div>
      {/* ① Building tabs（複数ビルディングがある場合のみ） */}
      {hasMultiBuildings && buildings && (
        <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-3">
          {buildings.map((b) => {
            const count = facilities.filter((f) => f.building === b.id).length;
            const isActive = activeBuilding === b.id;
            return (
              <button
                key={b.id}
                onClick={() => handleBuildingChange(b.id)}
                className={`flex-1 flex flex-col items-center py-2 px-3 rounded-xl transition-all text-sm font-semibold ${
                  isActive
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{b.name}</span>
                <span className={`text-xs font-normal mt-0.5 ${isActive ? "text-gray-500" : "text-gray-400"}`}>
                  {b.label} · {count}件
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ② Exit filter（改札口タブ・関連改札が2つ以上ある場合のみ） */}
      {showExitFilter && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-3">
          <button
            onClick={() => handleExitChange(ALL_EXIT)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
              activeExit === ALL_EXIT
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
            }`}
          >
            すべての改札
          </button>
          {relevantExits.map((exit) => {
            const count = buildingFiltered.filter((f) => f.nearestExit === exit.id).length;
            const isActive = activeExit === exit.id;
            return (
              <button
                key={exit.id}
                onClick={() => handleExitChange(exit.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  isActive
                    ? "bg-orange-500 text-white border-orange-500 shadow"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-400 hover:text-orange-600"
                }`}
              >
                🚪 {exit.name}
                <span className={`text-xs ${isActive ? "text-orange-100" : "text-gray-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ③ Category tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const count =
            tab === ALL_TAB
              ? exitFiltered.length
              : exitFiltered.filter((f) => f.category === tab).length;
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

      {/* ④ Attribute filter buttons */}
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

      {/* 改札選択時: 距離順ヒント */}
      {activeExit !== ALL_EXIT && (
        <p className="text-xs text-orange-500 mt-2 ml-1">
          📍 改札からの距離順に表示しています
        </p>
      )}

      {/* ⑤ Facility list */}
      <div className="mt-4 flex flex-col gap-3">
        {displayed.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            stationId={stationId}
            exits={exits}
            visited={visitedIds.has(facility.id)}
            interested={interestedIds.has(facility.id)}
            onToggleVisited={() => toggleVisited(facility.id)}
            onToggleInterested={() => toggleInterested(facility.id)}
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
