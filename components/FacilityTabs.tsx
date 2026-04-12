"use client";

import { useState, useEffect } from "react";
import type { Category, Facility } from "@/types";
import FacilityCard from "./FacilityCard";

const CATEGORIES: Category[] = ["飲食店", "ショップ", "サービス", "設備", "その他"];
const ALL_TAB = "すべて";

interface FacilityTabsProps {
  facilities: Facility[];
  stationId: string;
}

export default function FacilityTabs({ facilities, stationId }: FacilityTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const storageKey = `checkins-${stationId}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setCheckedIds(new Set(JSON.parse(stored)));
    } catch {}
  }, [storageKey]);

  function handleCheckIn(facilityId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.add(facilityId);
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }

  const displayed =
    activeTab === ALL_TAB
      ? facilities
      : facilities.filter((f) => f.category === activeTab);

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

      {/* Facility list */}
      <div className="mt-4 flex flex-col gap-3">
        {displayed.map((facility) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            stationId={stationId}
            checkedIn={checkedIds.has(facility.id)}
            onCheckIn={handleCheckIn}
          />
        ))}
        {displayed.length === 0 && (
          <p className="text-center text-gray-400 py-8">施設情報がありません</p>
        )}
      </div>
    </div>
  );
}
