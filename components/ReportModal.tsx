"use client";

import { useState } from "react";
import type { OutletStatus, SeatingStatus, CrowdedStatus } from "@/types";

interface ReportModalProps {
  facilityId: string;
  facilityName: string;
  stationId: string;
  onClose: () => void;
}

interface Report {
  timestamp: string;
  facilityId: string;
  outlet: OutletStatus | "";
  seating: SeatingStatus | "";
  crowded: CrowdedStatus | "";
  memo: string;
}

export default function ReportModal({
  facilityId,
  facilityName,
  stationId,
  onClose,
}: ReportModalProps) {
  const [outlet, setOutlet] = useState<OutletStatus | "">("");
  const [seating, setSeating] = useState<SeatingStatus | "">("");
  const [crowded, setCrowded] = useState<CrowdedStatus | "">("");
  const [memo, setMemo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const report: Report = {
      timestamp: new Date().toISOString(),
      facilityId,
      outlet,
      seating,
      crowded,
      memo: memo.trim(),
    };
    try {
      const key = `ekimap_reports_${stationId}`;
      const existing = localStorage.getItem(key);
      const arr: Report[] = existing ? JSON.parse(existing) : [];
      arr.push(report);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch {}
    setSubmitted(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 space-y-5">
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="text-5xl">🙏</div>
            <p className="font-bold text-gray-800 text-lg">ありがとうございます！</p>
            <p className="text-sm text-gray-500">情報提供を受け付けました。</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-bold text-gray-800 text-base">情報を報告する</h2>
              <p className="text-sm text-gray-500 mt-0.5">{facilityName}</p>
            </div>

            {/* Outlet */}
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold text-gray-700">🔌 コンセント</legend>
              <div className="flex gap-3">
                {(["available", "unknown"] as OutletStatus[]).map((v) => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="outlet"
                      value={v}
                      checked={outlet === v}
                      onChange={() => setOutlet(v)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {v === "available" ? "ある" : "不明"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Seating */}
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold text-gray-700">🪑 座れる</legend>
              <div className="flex gap-3">
                {(["yes", "no", "unknown"] as SeatingStatus[]).map((v) => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="seating"
                      value={v}
                      checked={seating === v}
                      onChange={() => setSeating(v)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {v === "yes" ? "座れる" : v === "no" ? "座れない" : "不明"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Crowded */}
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-semibold text-gray-700">👥 混雑</legend>
              <div className="flex gap-3 flex-wrap">
                {(["empty", "normal", "crowded", "unknown"] as CrowdedStatus[]).map((v) => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="crowded"
                      value={v}
                      checked={crowded === v}
                      onChange={() => setCrowded(v)}
                      className="accent-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {v === "empty" ? "空いてる" : v === "normal" ? "普通" : v === "crowded" ? "混んでる" : "不明"}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* Memo */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700" htmlFor="report-memo">
                メモ（任意）
              </label>
              <textarea
                id="report-memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="気づいたことを自由に書いてください"
                rows={3}
                maxLength={200}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <p className="text-right text-xs text-gray-400">{memo.length}/200</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                送信する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
