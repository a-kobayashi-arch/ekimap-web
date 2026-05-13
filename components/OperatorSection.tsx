"use client";

import { useState } from "react";
import type { Operator } from "@/types";
import { summarizeOperator, isExpandable } from "@/lib/operatorUtils";

function OperatorCard({ op, isJrEast }: { op: Operator; isJrEast: boolean }) {
  const [open, setOpen] = useState(false);
  const expandable = isExpandable(op);
  const summary = summarizeOperator(op);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isJrEast
          ? "bg-white border-gray-100 shadow-sm"
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* ヘッダー行 */}
      <div
        className={`flex items-center justify-between px-4 py-3.5 ${
          expandable
            ? isJrEast
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-pointer hover:bg-gray-100 active:bg-gray-200"
            : ""
        } transition-colors`}
        onClick={() => expandable && setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* 事業者カラードット */}
          <span
            className={`w-3 h-3 rounded-full flex-shrink-0 ${isJrEast ? "" : "opacity-40"}`}
            style={{ backgroundColor: op.color }}
          />
          <div className="min-w-0">
            {/* 事業者名 + 接続路線ラベル + 公式リンク */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-sm ${
                  isJrEast
                    ? "font-bold text-gray-800"
                    : "font-medium text-gray-500"
                }`}
              >
                {op.name}
              </span>
              {!isJrEast && (
                <span className="text-[10px] text-gray-400 font-medium">
                  接続路線
                </span>
              )}
              {op.url && (
                <a
                  href={op.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-blue-400 hover:text-blue-600 hover:underline flex-shrink-0"
                >
                  公式↗
                </a>
              )}
            </div>
            {/* 路線サマリー */}
            {summary && (
              <p className={`text-xs mt-0.5 ${isJrEast ? "text-gray-500" : "text-gray-400"}`}>
                {summary}
              </p>
            )}
          </div>
        </div>

        {/* 展開アイコン */}
        {expandable && (
          <span
            className={`text-gray-400 text-sm transition-transform duration-200 flex-shrink-0 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        )}
      </div>

      {/* 展開コンテンツ */}
      {expandable && open && (
        <div className={`px-4 pb-4 pt-1 border-t ${isJrEast ? "border-gray-50" : "border-gray-200"}`}>
          {/* グループ別 (新幹線 / 在来線 etc.) */}
          {op.groups?.map((group) => (
            <div key={group.label} className="mt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                {group.label}
                <span className="ml-1 font-normal text-gray-300">
                  {group.lines.length}路線
                </span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.lines.map((line) => (
                  <span
                    key={line.name}
                    className="text-xs px-2.5 py-1 rounded-full text-gray-700"
                    style={{
                      backgroundColor: line.color ? `${line.color}20` : "#f3f4f6",
                      border: `1px solid ${line.color ?? "#e5e7eb"}`,
                      color: line.color ?? "#374151",
                    }}
                  >
                    {line.name}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* フラットな複数路線 */}
          {!op.groups && op.lines && op.lines.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {op.lines.map((line) => (
                <span
                  key={line.name}
                  className="text-xs px-2.5 py-1 bg-gray-100 rounded-full text-gray-700"
                >
                  {line.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface OperatorSectionProps {
  operators: Operator[];
}

/**
 * 駅詳細ページの「路線・接続事業者」セクション
 * - JR東日本は本実証実験の主対象として通常表示
 * - JR以外の事業者は「接続路線」として控えめに表示
 * - 路線が多い事業者はアコーディオン展開
 */
export default function OperatorSection({ operators }: OperatorSectionProps) {
  return (
    <section>
      <h2 className="font-semibold text-gray-700 mb-3">路線・接続事業者</h2>
      <div className="space-y-2">
        {operators.map((op) => (
          <OperatorCard key={op.name} op={op} isJrEast={op.name === "JR東日本"} />
        ))}
      </div>
    </section>
  );
}
