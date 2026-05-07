"use client";

import { useState } from "react";
import type { NavLine, StationEntry } from "@/lib/navigation";
import StationCard from "@/components/StationCard";

interface LineAccordionProps {
  line: NavLine;
  entries: StationEntry[];
}

function ComingSoonBadge() {
  return (
    <span className="text-xs font-medium bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
      参考表示
    </span>
  );
}

export default function LineAccordion({ line, entries }: LineAccordionProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-3">
      {/* 路線ヘッダー（クリックで開閉） */}
      <button
        type="button"
        className="w-full flex items-center gap-2 hover:opacity-75 transition-opacity"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div
          className="h-1 w-6 rounded-full flex-shrink-0"
          style={{ backgroundColor: line.color }}
        />
        <h3 className="font-bold text-gray-700" style={{ color: line.color }}>
          {line.name}
        </h3>
        <span className="text-xs text-gray-400">{entries.length}駅</span>
        <span
          className={`ml-auto text-gray-400 text-sm transition-transform duration-200 flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {/* 駅カード（開いているときのみ） */}
      {open && (
        <div className="flex flex-col gap-3">
          {entries.map(({ slug, name, station }) =>
            station ? (
              <StationCard key={slug} station={station} />
            ) : (
              /* 未実装駅のプレースホルダー */
              <div
                key={slug}
                className="bg-gray-50 rounded-2xl p-4 border border-gray-100 border-l-4 border-l-gray-200 flex items-center justify-between opacity-60"
              >
                <div>
                  <p className="font-semibold text-gray-500">{name}駅</p>
                  <p className="text-xs text-gray-400 mt-0.5">施設データ準備中</p>
                </div>
                <ComingSoonBadge />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
