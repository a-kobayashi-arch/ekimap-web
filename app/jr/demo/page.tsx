"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStationBySlug } from "@/lib/stations";
import type { Station } from "@/types";

// ── デモ対象駅の定義 ─────────────────────────────────

const DEMO_STATIONS = [
  {
    slug: "omiya",
    label: "大宮",
    pocContext: {
      summary: "ecute 大宮の南北2棟回遊・送客最適化",
      detail:
        "サウス館・ノース館に分かれた ecute 大宮と、南口・北口の複数改札をまたいだ回遊パターンを可視化。どちらの改札から入り、どちらの棟のどの施設に立ち寄るかを計測する。",
      verifyPoints: [
        "南口/北口改札別の回遊パターン計測",
        "ecute サウス ↔ ノース間の送客最適化",
        "座席・充電スポットへの目的別誘導効果の定量化",
      ],
    },
  },
  {
    slug: "shinjuku",
    label: "新宿",
    pocContext: {
      summary: "大型ターミナル駅における滞在価値・送客最大化",
      detail:
        "乗降者数日本最多クラスの新宿駅。EATo LUMINE を中心に、高トラフィック環境での改札内送客最適化・滞在延長効果を検証する。ピーク時の混雑施設から空き施設への動的誘導が鍵。",
      verifyPoints: [
        "多改札口ユーザーの滞在動線の把握",
        "ピーク時間帯の混雑施設 ↔ 空き施設への動的誘導",
        "目的別（食べる/買う/充電/座る）の送客効果測定",
      ],
    },
  },
  {
    slug: "akabane",
    label: "赤羽",
    pocContext: {
      summary: "ecute 赤羽のきた館・みなみ館間の回遊データ取得",
      detail:
        "きた館・みなみ館に分かれた ecute 赤羽。北口・南口改札間の回遊を計測し、どちらの改札を使うユーザーがどちらの棟を利用するかをトラッキングする。コンパクトな2棟構成がPoC実証に適している。",
      verifyPoints: [
        "北口/南口改札別の入店パターン計測",
        "きた館 ↔ みなみ館の回遊率の定量化",
        "各棟固有の客層・目的別行動差異の分析",
      ],
    },
  },
] as const;

type DemoSlug = (typeof DEMO_STATIONS)[number]["slug"];

const CATEGORY_TABS = [
  "すべて",
  "飲食店",
  "ショップ",
  "サービス",
  "設備",
  "その他",
] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

// ── ユーティリティ ────────────────────────────────────

function GateAreaBadge({ area }: { area: string }) {
  if (area === "改札内")
    return (
      <span className="inline-flex items-center text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
        改札内
      </span>
    );
  if (area === "改札外")
    return (
      <span className="inline-flex items-center text-xs bg-gray-100 text-gray-400 border border-gray-200 px-2 py-0.5 rounded-full">
        改札外
      </span>
    );
  return (
    <span className="inline-flex items-center text-xs text-gray-300 border border-gray-100 px-2 py-0.5 rounded-full">
      調査中
    </span>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  飲食店: "bg-orange-50 text-orange-600 border-orange-200",
  ショップ: "bg-purple-50 text-purple-600 border-purple-200",
  サービス: "bg-teal-50 text-teal-600 border-teal-200",
  設備: "bg-gray-100 text-gray-500 border-gray-200",
  その他: "bg-gray-100 text-gray-400 border-gray-200",
};

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-400 border-gray-200";
  return (
    <span className={`inline-flex items-center text-xs border px-2 py-0.5 rounded-full ${cls}`}>
      {category}
    </span>
  );
}

function MetricCard({
  label,
  value,
  unit,
  accent = false,
  sub,
}: {
  label: string;
  value: number | string;
  unit: string;
  accent?: boolean;
  sub?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "bg-blue-50 border-blue-200"
          : "bg-white border-gray-200"
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
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── メインページ ─────────────────────────────────────

export default function JrDemoPage() {
  const [activeSlug, setActiveSlug] = useState<DemoSlug>("omiya");
  const [activeCategory, setActiveCategory] = useState<CategoryTab>("すべて");
  const [onlyGateInside, setOnlyGateInside] = useState(false);
  const [facilityStats, setFacilityStats] = useState<Record<string, number>>({});

  // stats API からチェックイン実績を取得
  useEffect(() => {
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(
        (data: { facilityStats?: { facilityId: string; count: number }[] }) => {
          const map: Record<string, number> = {};
          for (const s of data.facilityStats ?? []) {
            map[s.facilityId] = s.count;
          }
          setFacilityStats(map);
        }
      )
      .catch(() => {});
  }, []);

  // 駅切り替え時にフィルタをリセット
  function switchStation(slug: DemoSlug) {
    setActiveSlug(slug);
    setActiveCategory("すべて");
    setOnlyGateInside(false);
  }

  const stationConfig = DEMO_STATIONS.find((s) => s.slug === activeSlug)!;
  const station = getStationBySlug(activeSlug) as Station;
  if (!station) return null;

  const hasMultiBuildings = (station.buildings?.length ?? 0) >= 2;

  // ── フィルタ適用 ──────────────────────────────
  const filtered = station.facilities.filter((f) => {
    if (onlyGateInside && f.gateArea !== "改札内") return false;
    if (activeCategory !== "すべて" && f.category !== activeCategory) return false;
    return true;
  });

  // ── 主要指標 ──────────────────────────────────
  const insideCount  = station.facilities.filter((f) => f.gateArea === "改札内").length;
  const seatCount    = station.facilities.filter((f) => f.seating === "yes").length;
  const outletCount  = station.facilities.filter((f) => f.outlet === "available").length;
  const totalCheckins = station.facilities.reduce(
    (sum, f) => sum + (facilityStats[f.id] ?? 0),
    0
  );

  // カテゴリ別件数（フィルタ考慮）
  const baseForCount = station.facilities.filter(
    (f) => !onlyGateInside || f.gateArea === "改札内"
  );

  // ── 建物名ルックアップ ──────────────────────────
  const buildingNameMap = Object.fromEntries(
    (station.buildings ?? []).map((b) => [b.id, b.name])
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* ── PoC 説明バナー ──────────────────────────── */}
      <div className="border-l-4 border-gray-800 pl-5 py-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          JR東日本スタートアップ応募 / PoC デモ
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          改札内回遊・滞在価値・店舗送客の可視化デモ
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
          本ページは「改札内で今すぐ座れて充電できる/立ち寄れる場所の可視化と送客最適化」をテーマとした
          PoC 提案のデモです。実際の施設データ・チェックイン実績をもとに、駅ナカ運営 DX の価値を示します。
        </p>
      </div>

      {/* ── 駅タブ ──────────────────────────────────── */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
          PoC 実証駅
        </p>
        <div className="flex gap-2 flex-wrap">
          {DEMO_STATIONS.map((s) => (
            <button
              key={s.slug}
              onClick={() => switchStation(s.slug)}
              className={`px-5 py-2.5 rounded text-sm font-semibold border transition-all ${
                activeSlug === s.slug
                  ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-600 hover:text-gray-900"
              }`}
            >
              {s.label}
            </button>
          ))}
          <span className="self-center text-xs text-gray-400 ml-1">
            ※ 池袋・武蔵浦和は補助候補として対応可能
          </span>
        </div>
      </div>

      {/* ── PoC 文脈カード ──────────────────────────── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          この駅で検証できること
        </p>
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          {stationConfig.pocContext.summary}
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">
          {stationConfig.pocContext.detail}
        </p>
        <ul className="space-y-2">
          {stationConfig.pocContext.verifyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="shrink-0 text-gray-400 mt-0.5">▸</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* ── 主要指標 ──────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {station.name} の施設概要
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="施設数（全体）"
            value={station.facilities.length}
            unit="件"
          />
          <MetricCard
            label="改札内施設"
            value={insideCount}
            unit="件"
            accent
            sub="PoC の主対象"
          />
          <MetricCard
            label="座れる場所"
            value={seatCount}
            unit="件"
            sub="seating: yes"
          />
          <MetricCard
            label="充電スポット"
            value={outletCount}
            unit="件"
            sub="outlet: available"
          />
        </div>
      </div>

      {/* ── チェックイン実績（stats API） ─────────────── */}
      {totalCheckins > 0 && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">
              チェックイン実績（KV 集計・リアルタイム）
            </p>
            <p className="text-3xl font-bold text-green-700">
              {totalCheckins}
              <span className="text-sm font-normal text-green-500 ml-1">回</span>
            </p>
          </div>
          <p className="text-xs text-green-700 max-w-xs leading-relaxed">
            実ユーザーによるチェックインデータ。
            施設ごとの回遊行動把握・人気施設分析に活用可能。
            Vercel KV に永続化済み。
          </p>
        </div>
      )}

      {/* ── 施設一覧テーブル ─────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-bold text-gray-800 text-lg">施設一覧</h3>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyGateInside}
              onChange={(e) => setOnlyGateInside(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span>改札内のみ表示</span>
            <span className="text-gray-400">
              （{insideCount}件）
            </span>
          </label>
        </div>

        {/* カテゴリフィルタ */}
        <div className="flex gap-1.5 flex-wrap mb-5">
          {CATEGORY_TABS.map((cat) => {
            const count =
              cat === "すべて"
                ? baseForCount.length
                : baseForCount.filter((f) => f.category === cat).length;
            if (cat !== "すべて" && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                  activeCategory === cat
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-500 hover:text-gray-700"
                }`}
              >
                {cat}
                <span
                  className={`ml-1 ${
                    activeCategory === cat ? "text-gray-400" : "text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* テーブル */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    施設名
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    カテゴリ
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    エリア
                  </th>
                  {hasMultiBuildings && (
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                      棟
                    </th>
                  )}
                  <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    フロア
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    座席
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                    充電
                  </th>
                  {totalCheckins > 0 && (
                    <th className="text-center px-4 py-3 font-medium text-gray-500 whitespace-nowrap">
                      実績
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((f) => (
                  <tr
                    key={f.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      f.gateArea === "改札内" ? "" : "opacity-60"
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {f.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryBadge category={f.category} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <GateAreaBadge area={f.gateArea} />
                    </td>
                    {hasMultiBuildings && (
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {f.building ? (buildingNameMap[f.building] ?? f.building) : "–"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {f.floor}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.seating === "yes" ? (
                        <span className="text-gray-700 font-medium">✓</span>
                      ) : (
                        <span className="text-gray-200">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {f.outlet === "available" ? (
                        <span className="text-yellow-500">⚡</span>
                      ) : (
                        <span className="text-gray-200">–</span>
                      )}
                    </td>
                    {totalCheckins > 0 && (
                      <td className="px-4 py-3 text-center">
                        {facilityStats[f.id] ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {facilityStats[f.id]}回
                          </span>
                        ) : (
                          <span className="text-gray-200 text-xs">–</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        6 +
                        (hasMultiBuildings ? 1 : 0) +
                        (totalCheckins > 0 ? 1 : 0)
                      }
                      className="px-4 py-10 text-center text-gray-400"
                    >
                      条件に合う施設がありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {filtered.length} 件表示 / 全 {station.facilities.length} 件
          {onlyGateInside && "（改札内のみ）"}
        </p>
      </div>

      {/* ── 一般向けページへのリンク ──────────────────── */}
      <div className="border border-gray-200 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-gray-800 mb-1">
            施設チェックイン・UGC 更新機能（一般向け）
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            一般ユーザー向けページでは施設へのチェックイン・スタンプ収集・目的別検索が利用可能です。
            上記の実績データはこの機能から収集されています。
          </p>
        </div>
        <Link
          href={`/station/${activeSlug}`}
          className="shrink-0 inline-block text-sm font-semibold px-5 py-2.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
        >
          {station.name}の施設ページへ →
        </Link>
      </div>

      {/* ── 提案資料に戻る ─────────────────────────────── */}
      <div className="pt-4 border-t border-gray-100">
        <Link
          href="/jr"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          ← 提案資料（/jr）に戻る
        </Link>
      </div>
    </div>
  );
}
