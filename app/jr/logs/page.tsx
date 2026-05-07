"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllStations } from "@/lib/stations";

// ── 駅名・施設名の変換マップ（ビルド時に全駅データから構築） ──
const STATION_NAMES: Record<string, string> = Object.fromEntries(
  getAllStations().map((s) => [s.slug, s.name])
);

const ALL_FACILITY_NAMES: Record<string, string> = Object.fromEntries(
  getAllStations().flatMap((s) => s.facilities.map((f) => [f.id, f.name]))
);

// ── ワンタップ状態の表示名 ──
const ONE_TAP_LABELS: Record<string, string> = {
  vacant:             "空いてた",
  crowded:            "混んでた",
  charging_available: "充電できた",
  open:               "営業してた",
  closed:             "閉まってた",
};

// ── 期間モード ──
type RangeMode = "today" | "7d" | "30d" | "date";

const RANGE_BUTTONS: { mode: RangeMode; label: string }[] = [
  { mode: "today", label: "今日" },
  { mode: "7d",    label: "過去7日" },
  { mode: "30d",   label: "過去30日" },
  { mode: "date",  label: "日付指定" },
];

// ── /api/events/summary レスポンス型 ──
interface EventsSummary {
  date: string;
  range: string;
  startDate: string;
  endDate: string;
  totalEvents: number;
  eventCounts: {
    facility_detail_open: number;
    category_select: number;
    one_tap_status: number;
  };
  topStations: {
    stationSlug: string;
    facilityDetailOpen: number;
    categorySelect: number;
    oneTapStatus: number;
  }[];
  topFacilities: { facilityId: string; facilityDetailOpen: number }[];
  categoryCounts: { category: string; count: number }[];
  oneTapStatusCounts: {
    vacant: number;
    crowded: number;
    charging_available: number;
  };
  stationCategoryCounts: { stationSlug: string; category: string; count: number }[];
  stationOneTapCounts:   { stationSlug: string; status: string;   count: number }[];
}

// ── 現在日付を JST で YYYY-MM-DD 返す ──
function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

// ── 集計期間ラベル ──
function periodLabel(mode: RangeMode, summary: EventsSummary | null, dateInput: string): string {
  if (!summary) return "–";
  if (mode === "today") return `今日（${summary.endDate}）`;
  if (mode === "7d")    return `過去7日（${summary.startDate}〜${summary.endDate}）`;
  if (mode === "30d")   return `過去30日（${summary.startDate}〜${summary.endDate}）`;
  return `指定日（${dateInput}）`;
}

// ── セクションヘッダー ──
function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </p>
  );
}

// ── 指標カード ──
function MetricCard({
  label,
  value,
  unit,
  accent = false,
}: {
  label: string;
  value: number;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
      }`}
    >
      <p className={`text-xs font-medium mb-1 ${accent ? "text-blue-500" : "text-gray-400"}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold ${accent ? "text-blue-700" : "text-gray-800"}`}>
          {value}
        </span>
        <span className={`text-sm ${accent ? "text-blue-400" : "text-gray-400"}`}>{unit}</span>
      </div>
    </div>
  );
}

// ── バーグラフ行 ──
function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="bg-blue-400 h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-semibold text-gray-700 w-10 text-right shrink-0">{count}件</span>
    </div>
  );
}

// ── メインページ ──
export default function JrLogsPage() {
  const today = getTodayJST();

  const [mode, setMode]       = useState<RangeMode>("today");
  const [dateInput, setDateInput] = useState(today);
  const [summary, setSummary] = useState<EventsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  const buildUrl = useCallback((m: RangeMode, d: string): string => {
    if (m === "date") return `/api/events/summary?date=${d}`;
    return `/api/events/summary?range=${m}`;
  }, []);

  const fetchSummary = useCallback((m: RangeMode, d: string) => {
    setLoading(true);
    setError(false);
    setSummary(null);
    fetch(buildUrl(m, d))
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: EventsSummary) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [buildUrl]);

  useEffect(() => {
    fetchSummary(mode, dateInput);
  }, [mode, dateInput, fetchSummary]);

  // 駅別カテゴリ: stationSlug ごとにグルーピング
  const stationCatGroups = summary
    ? Object.entries(
        summary.stationCategoryCounts.reduce<Record<string, { category: string; count: number }[]>>(
          (acc, item) => {
            if (!acc[item.stationSlug]) acc[item.stationSlug] = [];
            acc[item.stationSlug].push({ category: item.category, count: item.count });
            return acc;
          },
          {}
        )
      ).sort(
        ([, a], [, b]) =>
          b.reduce((s, x) => s + x.count, 0) - a.reduce((s, x) => s + x.count, 0)
      )
    : [];

  // 駅別ワンタップ: stationSlug ごとにグルーピング
  const stationOtpGroups = summary
    ? Object.entries(
        summary.stationOneTapCounts.reduce<Record<string, { status: string; count: number }[]>>(
          (acc, item) => {
            if (!acc[item.stationSlug]) acc[item.stationSlug] = [];
            acc[item.stationSlug].push({ status: item.status, count: item.count });
            return acc;
          },
          {}
        )
      ).sort(
        ([, a], [, b]) =>
          b.reduce((s, x) => s + x.count, 0) - a.reduce((s, x) => s + x.count, 0)
      )
    : [];

  const maxCatCount =
    summary && summary.categoryCounts.length > 0 ? summary.categoryCounts[0].count : 1;

  const maxFacCount =
    summary && summary.topFacilities.length > 0
      ? summary.topFacilities[0].facilityDetailOpen
      : 1;

  const hasData = summary && summary.totalEvents > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* ── タイトル ── */}
      <div className="border-l-4 border-gray-800 pl-5 py-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          管理者向け / ログビューア
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          駅ナカ探索ログ 管理画面
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
          ユーザーが改札内施設を探す過程で発生する閲覧・目的選択・状態確認ログを集計表示します。
        </p>
      </div>

      {/* ── 期間切替UI ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-600 font-medium shrink-0">表示期間：</span>
          <div className="flex gap-1.5 flex-wrap">
            {RANGE_BUTTONS.map(({ mode: m, label }) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  mode === m
                    ? "bg-gray-800 text-white border-gray-800 shadow-sm"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-600 hover:text-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 日付指定モード時のみ表示 */}
        {mode === "date" && (
          <div className="flex items-center gap-3 pl-[5.5rem]">
            <input
              type="date"
              value={dateInput}
              max={today}
              onChange={(e) => e.target.value && setDateInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <button
              onClick={() => setDateInput(today)}
              className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-2 hover:border-gray-400 hover:text-gray-600 transition-all"
            >
              今日に戻す
            </button>
          </div>
        )}

        {/* 集計期間ラベル */}
        <div className="flex items-center gap-2 pl-[5.5rem]">
          <span className="text-xs text-gray-400">集計期間：</span>
          <span className="text-xs font-medium text-gray-600">
            {loading ? "取得中…" : periodLabel(mode, summary, dateInput)}
          </span>
          {loading && <span className="text-xs text-gray-400 animate-pulse">読み込み中…</span>}
          {error  && <span className="text-xs text-red-400">データの取得に失敗しました</span>}
        </div>
      </div>

      {/* ── データなし ── */}
      {!hasData && !loading && (
        <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-400">
          <p className="text-sm">
            {summary
              ? `集計期間（${summary.startDate}〜${summary.endDate}）のログはまだありません。`
              : "データがありません。"}
          </p>
          <p className="text-xs mt-1">
            施設ページでカテゴリ選択・詳細閲覧・鮮度確認を行うとデータが蓄積されます。
          </p>
        </div>
      )}

      {/* ── データあり ── */}
      {hasData && summary && (
        <>
          {/* ── サマリーカード ── */}
          <div>
            <SectionHeader title={`イベントサマリー（${periodLabel(mode, summary, dateInput)}）`} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="合計イベント数"
                value={summary.totalEvents}
                unit="件"
                accent
              />
              <MetricCard
                label="施設詳細閲覧"
                value={summary.eventCounts.facility_detail_open}
                unit="件"
              />
              <MetricCard
                label="目的カテゴリ選択"
                value={summary.eventCounts.category_select}
                unit="件"
              />
              <MetricCard
                label="ワンタップ確認"
                value={summary.eventCounts.one_tap_status}
                unit="件"
              />
            </div>
          </div>

          {/* ── 目的別ニーズ + 鮮度確認ログ ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* 目的別ニーズ */}
            {summary.categoryCounts.length > 0 && (
              <div className="border border-gray-200 rounded-xl p-5">
                <SectionHeader title="目的別ニーズ" />
                <div className="space-y-3">
                  {summary.categoryCounts.map((c) => (
                    <BarRow
                      key={c.category}
                      label={c.category}
                      count={c.count}
                      max={maxCatCount}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 鮮度確認ログ */}
            <div className="border border-gray-200 rounded-xl p-5">
              <SectionHeader title="鮮度確認ログ（ワンタップ）" />
              <div className="space-y-3">
                {(
                  [
                    { key: "vacant",             label: "空いてた" },
                    { key: "crowded",            label: "混んでた" },
                    { key: "charging_available", label: "充電できた" },
                  ] as const
                ).map(({ key, label }) => {
                  const count = summary.oneTapStatusCounts[key];
                  const maxOtp = Math.max(
                    summary.oneTapStatusCounts.vacant,
                    summary.oneTapStatusCounts.crowded,
                    summary.oneTapStatusCounts.charging_available,
                    1
                  );
                  return (
                    <BarRow key={key} label={label} count={count} max={maxOtp} />
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 施設別閲覧ランキング ── */}
          {summary.topFacilities.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5">
              <SectionHeader title="施設別閲覧ランキング（TOP 5）" />
              <div className="space-y-2.5">
                {summary.topFacilities.map((f, i) => {
                  const name = ALL_FACILITY_NAMES[f.facilityId] ?? f.facilityId;
                  return (
                    <div key={f.facilityId} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{name}</p>
                        <p className="text-xs text-gray-400">{f.facilityId}</p>
                      </div>
                      <BarRow label="" count={f.facilityDetailOpen} max={maxFacCount} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 駅別カテゴリ集計 ── */}
          {stationCatGroups.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5">
              <SectionHeader title="駅別 目的カテゴリ" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stationCatGroups.map(([slug, items]) => (
                  <div key={slug}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {STATION_NAMES[slug] ?? slug}
                    </p>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const maxItem = Math.max(...items.map((x) => x.count), 1);
                        return (
                          <BarRow
                            key={item.category}
                            label={item.category}
                            count={item.count}
                            max={maxItem}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 駅別ワンタップ集計 ── */}
          {stationOtpGroups.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-5">
              <SectionHeader title="駅別 鮮度確認ログ" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stationOtpGroups.map(([slug, items]) => (
                  <div key={slug}>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {STATION_NAMES[slug] ?? slug}
                    </p>
                    <div className="space-y-2">
                      {items.map((item) => {
                        const maxItem = Math.max(...items.map((x) => x.count), 1);
                        return (
                          <BarRow
                            key={item.status}
                            label={ONE_TAP_LABELS[item.status] ?? item.status}
                            count={item.count}
                            max={maxItem}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 駅別アクティビティ（topStations） ── */}
          {summary.topStations.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  駅別アクティビティ（TOP 5）
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">駅名</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">施設詳細閲覧</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">カテゴリ選択</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">ワンタップ</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">合計</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.topStations.map((s) => (
                      <tr key={s.stationSlug} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {STATION_NAMES[s.stationSlug] ?? s.stationSlug}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.facilityDetailOpen}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.categorySelect}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.oneTapStatus}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {s.facilityDetailOpen + s.categorySelect + s.oneTapStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── フッター注記 ── */}
      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
        <p>
          ※ 本画面は Vercel KV に蓄積された日次集計データを表示します。KV 未接続環境ではすべて 0 件と表示されます。
        </p>
      </div>
    </div>
  );
}
