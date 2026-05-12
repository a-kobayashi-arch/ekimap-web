export const dynamic = "force-dynamic";

import Link from "next/link";
import { kv } from "@vercel/kv";
import { getAllStations } from "@/lib/stations";

// ── サーバー側データ取得 ──────────────────────────────

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

export interface PerStationStat {
  facilityCheckins: number;
  stationStamps: number;
}

export interface AllKvStats {
  totalFacilityCheckins: number;
  totalStationCheckins: number;
  facilitiesWithCheckins: number;
  stationsWithCheckins: number;
  /** stationSlug → 集計 */
  perStation: Record<string, PerStationStat>;
}

/**
 * KV から全集計データを一括取得（失敗時は null）
 * @param facilityToStation facilityId → stationSlug の逆引きマップ
 */
async function fetchAllKvStats(
  facilityToStation: Record<string, string>
): Promise<AllKvStats | null> {
  if (!KV_AVAILABLE) return null;
  try {
    const [facilityKeys, stationKeys] = await Promise.all([
      kv.keys("stats:facility:*"),
      kv.keys("stats:station:*"),
    ]);
    const [facilityCounts, stationCounts] = await Promise.all([
      facilityKeys.length > 0
        ? Promise.all(facilityKeys.map((k) => kv.get<number>(k)))
        : Promise.resolve([] as (number | null)[]),
      stationKeys.length > 0
        ? Promise.all(stationKeys.map((k) => kv.get<number>(k)))
        : Promise.resolve([] as (number | null)[]),
    ]);

    // 駅別に集計
    const perStation: Record<string, PerStationStat> = {};

    for (let i = 0; i < facilityKeys.length; i++) {
      const facilityId = facilityKeys[i].replace("stats:facility:", "");
      const slug = facilityToStation[facilityId];
      if (slug) {
        perStation[slug] ??= { facilityCheckins: 0, stationStamps: 0 };
        perStation[slug].facilityCheckins += Number(facilityCounts[i]) || 0;
      }
    }
    for (let i = 0; i < stationKeys.length; i++) {
      const slug = stationKeys[i].replace("stats:station:", "");
      perStation[slug] ??= { facilityCheckins: 0, stationStamps: 0 };
      perStation[slug].stationStamps += Number(stationCounts[i]) || 0;
    }

    return {
      totalFacilityCheckins: facilityCounts.reduce((s: number, c) => s + (Number(c) || 0), 0),
      totalStationCheckins:  stationCounts.reduce((s: number, c) => s + (Number(c) || 0), 0),
      facilitiesWithCheckins: facilityKeys.length,
      stationsWithCheckins:   stationKeys.length,
      perStation,
    };
  } catch {
    return null;
  }
}

// ── 共通スタイル ─────────────────────────────────────

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 ${className}`}>
      {children}
    </p>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-bold text-gray-800 mb-6">{children}</h2>
  );
}

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`max-w-5xl mx-auto px-6 py-16 border-b border-gray-100 ${className}`}
    >
      {children}
    </section>
  );
}

// ── 1. ファーストビュー ──────────────────────────────

function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-[#1A7040] to-[#0d4a25] text-white">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs font-semibold text-green-200 uppercase tracking-widest mb-6">
          JR東日本スタートアップ応募 PoC 提案
        </p>
        <h1 className="text-4xl font-bold leading-tight mb-6">
          改札内の&ldquo;買う前の行動&rdquo;を可視化する<br />
          駅空間DXデータ基盤
        </h1>
        <p className="text-green-100 text-lg mb-10 max-w-2xl">
          POSに残らない検索・迷い・滞在・離脱を、施設探索UXと利用ログで可視化し、
          駅ナカ商業・交通広告・Suica/JRE ID経済圏の成長に接続するPoCです。
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/jr/demo-sample"
            className="inline-block bg-white text-[#1A7040] font-semibold px-6 py-3 rounded text-sm hover:bg-gray-100 transition-colors"
          >
            審査用デモを見る →
          </Link>
          <a
            href="#poc-theme"
            className="text-sm text-green-200 hover:text-white transition-colors"
          >
            提案内容を読む ↓
          </a>
        </div>
      </div>
    </section>
  );
}

// ── 2. JR の課題との接続 ────────────────────────────

const challenges = [
  {
    title: "改札内の回遊が可視化されていない",
    body: "どの店にどれだけの人が立ち寄り、どのルートで移動しているかのデータが取れていない。",
  },
  {
    title: "空席・充電スポットの情報が伝わらない",
    body: "利用者が「座れる場所」「充電できる場所」を探して改札外に出てしまい、駅ナカの滞在時間が短くなっている。",
  },
  {
    title: "店舗への送客手段が限定的",
    body: "ポスターや駅構内サイネージに依存しており、個別店舗へのデジタル送客の仕組みがない。",
  },
  {
    title: "情報の鮮度維持コストが高い",
    body: "施設情報の更新は駅スタッフ主導であり、UGC（利用者投稿）を活用した低コスト更新の仕組みがない。",
  },
];

function ChallengesSection() {
  return (
    <Section id="challenges">
      <SectionLabel>課題認識</SectionLabel>
      <SectionHeading>JRが抱える駅ナカ運営の課題</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((c, i) => (
          <div key={i} className="border border-[#c8e6d0] rounded-lg p-6">
            <p className="text-xs text-gray-400 mb-2">課題 {i + 1}</p>
            <h3 className="font-semibold text-gray-800 mb-2">{c.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 3. 本提案の価値 ─────────────────────────────────

const values = [
  {
    label: "回遊の可視化",
    body: "施設チェックイン・閲覧データをもとに、改札内の人の流れを可視化。",
  },
  {
    label: "滞在価値の向上",
    body: "「今すぐ座れる・充電できる」情報をリアルタイム提供し、駅ナカ滞在時間を延ばす。",
  },
  {
    label: "店舗への送客最適化",
    body: "目的別導線（座る・充電・食べる・買う）から個別店舗へのデジタル送客。",
  },
  {
    label: "低コストな情報鮮度維持",
    body: "UGC更新導線により、利用者が施設情報の鮮度を維持するサイクルを構築。",
  },
  {
    label: "Suica/JRE ID経済圏への接続",
    body: "PoC後、Suica・JRE ID・POSとの段階連携により、移動×滞在×購買の統合データ基盤へ拡張できます。",
  },
];

function ValueSection() {
  return (
    <Section id="value" className="bg-[#F6FAF7]">
      <SectionLabel>提案価値</SectionLabel>
      <SectionHeading>本提案が解決すること</SectionHeading>
      <div className="space-y-4">
        {values.map((v, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-7 h-7 rounded-full bg-[#1A7040] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div>
              <span className="font-semibold text-gray-800">{v.label}</span>
              <span className="text-gray-500 text-sm ml-2">{v.body}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 4. PoC テーマ ────────────────────────────────────

function PocThemeSection() {
  return (
    <Section id="poc-theme">
      <SectionLabel>PoCテーマ</SectionLabel>
      <SectionHeading>実証する課題と場所</SectionHeading>
      <div className="bg-[#1A7040] text-white rounded-xl p-10 mb-8">
        <p className="text-xl font-semibold leading-relaxed">
          改札内の購買前行動（探索・滞在・離脱）の可視化と
          駅ナカ商業への送客最適化
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["新宿", "大宮", "赤羽"].map((station) => (
          <div
            key={station}
            className="border border-[#c8e6d0] rounded-lg p-5 text-center"
          >
            <p className="text-2xl font-bold text-gray-800 mb-1">{station}</p>
            <p className="text-xs text-gray-400">PoC実証駅</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-4">
        ※ 池袋・武蔵浦和は補助候補として対応可能
      </p>
    </Section>
  );
}

// ── 5. 実装済み状況 ─────────────────────────────────

const implementations = [
  { status: "done", label: "駅ナカ施設データ（新宿・大宮・赤羽 等）" },
  { status: "done", label: "目的別施設一覧（座る・充電・食べる・買う）" },
  { status: "done", label: "施設チェックイン（利用ログ永続化）" },
  { status: "done", label: "駅訪問ログ（チェックイン実績の可視化・永続化）" },
  { status: "done", label: "クロスデバイス同期（ユーザーID管理）" },
  { status: "done", label: "改札内/外の区別フラグ" },
  { status: "done", label: "UGC 更新モーダル（施設情報の報告）" },
  { status: "done", label: "ワンタップ確認（UGC鮮度更新）" },
  { status: "done", label: "ログ集計・簡易管理画面" },
  { status: "done", label: "目的別導線 UI（食べる / 買う / 座る / 充電）" },
  { status: "plan", label: "リアルタイム空席・充電状況（要JR側アセット）" },
  { status: "plan", label: "Suica・JRE ID連携（将来フェーズ）" },
];

function ImplementationSection() {
  const badge = (status: string) => {
    if (status === "done") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">実装済み</span>;
    if (status === "wip")  return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">開発中</span>;
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">計画</span>;
  };

  return (
    <Section id="implementation" className="bg-[#F6FAF7]">
      <SectionLabel>実装状況</SectionLabel>
      <SectionHeading>現在のプロトタイプで動いていること</SectionHeading>
      <div className="space-y-3">
        {implementations.map((item, i) => (
          <div key={i} className="flex items-center justify-between border border-[#c8e6d0] bg-white rounded-lg px-5 py-3">
            <span className="text-sm text-gray-700">{item.label}</span>
            {badge(item.status)}
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 6. JR に求めるアセット ──────────────────────────

// ── 5.5. 開発状況・実績データ ───────────────────────

/** チェックイン・訪問ログ取得イメージ用サンプル値（全駅合計） */
const SAMPLE_CHECKIN_STATS = {
  totalFacilityCheckins:  420,
  facilitiesWithCheckins:  96,
  totalStationCheckins:   356,
  stationsWithCheckins:    12,
};

/** 駅別チェックイン・訪問ログ取得イメージ用サンプル値（合計: 施設420 / 訪問356） */
const SAMPLE_STATION_BREAKDOWN = {
  omiya:    { facilityCheckins: 156, stationVisits: 132 },
  akabane:  { facilityCheckins: 128, stationVisits: 104 },
  shinjuku: { facilityCheckins: 136, stationVisits: 120 },
} as const;

interface LiveStatsProps {
  totalStations: number;
  totalFacilities: number;
  insideFacilities: number;
  kv: AllKvStats | null;
}

function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-5 ${accent ? "border-[#1A7040] bg-[#155d35]" : "border-gray-200 bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accent ? "text-green-200" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`text-4xl font-bold ${accent ? "text-white" : "text-gray-800"}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? "text-green-200" : "text-gray-400"}`}>{sub}</p>
      )}
    </div>
  );
}

function LiveStatsSection({ totalStations, totalFacilities, insideFacilities }: LiveStatsProps) {
  return (
    <Section id="live-stats" className="bg-[#1A7040] text-white">
      {/* ヘッダー */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <SectionLabel className="text-green-200">開発状況・実績データ</SectionLabel>
          <SectionHeading>
            <span className="text-white">すでに動くプロトタイプが公開されています</span>
          </SectionHeading>
          <p className="text-green-100 text-sm leading-relaxed max-w-2xl">
            実際に動作するプロトタイプを公開中。施設データ・チェックイン機能・駅訪問ログ・
            利用ログ集計・簡易管理画面まで、PoC に必要な土台が整っています。
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/jr/demo-sample"
            className="inline-block px-4 py-2 text-sm font-semibold bg-white text-[#1A7040] rounded hover:bg-gray-100 transition-colors"
          >
            審査用デモ →
          </Link>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm font-semibold border border-green-400 text-green-100 rounded hover:border-white hover:text-white transition-colors"
          >
            一般向けサイト
          </Link>
        </div>
      </div>

      {/* 静的指標：実装状況 */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-4">
          実装状況（静的データ）
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="公開駅数"        value={totalStations}    sub="主要PoC駅 整備済み" accent />
          <Stat label="施設データ数"    value={totalFacilities}  sub="全駅合計"            accent />
          <Stat label="改札内施設"      value={insideFacilities} sub="PoC 主対象"          accent />
          <Stat label="公開状況"        value="公開中"           sub="実機デモ可能"          accent />
        </div>
      </div>

      {/* チェックイン・訪問ログ取得イメージ（サンプル値） */}
      <div>
        <p className="text-xs font-semibold text-green-200 uppercase tracking-wider mb-4">
          チェックイン・訪問ログ取得イメージ
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="施設チェックイン"   value={SAMPLE_CHECKIN_STATS.totalFacilityCheckins}  sub="累計取得イメージ"     accent />
          <Stat label="チェックイン施設数" value={SAMPLE_CHECKIN_STATS.facilitiesWithCheckins} sub="施設ユニーク数イメージ" accent />
          <Stat label="駅訪問ログ"         value={SAMPLE_CHECKIN_STATS.totalStationCheckins}   sub="累計取得イメージ"     accent />
          <Stat label="訪問駅種類"         value={SAMPLE_CHECKIN_STATS.stationsWithCheckins}   sub="駅ユニーク数イメージ" accent />
        </div>
        <p className="text-xs text-green-200 mt-3">
          ※ 一定期間運用後のサンプル値です。
        </p>
      </div>

      {/* 補足 */}
      <div className="mt-8 pt-6 border-t border-[#155d35]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-green-200 font-medium mb-1">データ永続化</p>
            <p className="text-green-100">
              利用ログとして蓄積・集計可能。クロスデバイス対応済み。
            </p>
          </div>
          <div>
            <p className="text-green-200 font-medium mb-1">今すぐ実証可能</p>
            <p className="text-green-100">
              新宿・大宮・赤羽の施設データは整備済み。
              JR 側データ連携なしでも PoC としてすぐに動かせる状態。
            </p>
          </div>
          <div>
            <p className="text-green-200 font-medium mb-1">拡張性</p>
            <p className="text-green-100">
              全国展開・多事業者対応を前提にした 3 階層ナビ構造（エリア・事業者・路線）を実装済み。
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

// ──────────────────────────────────────────────────────

// ── 5.6. 駅別サマリー ────────────────────────────────

/** PoC で見せる主要駅（路線順） */
const POC_STATIONS = [
  { slug: "omiya",    label: "大宮" },
  { slug: "akabane",  label: "赤羽" },
  { slug: "shinjuku", label: "新宿" },
] as const;

interface StationBreakdownProps {
  stationFacilityCount: Record<string, number>;
  stationInsideCount:   Record<string, number>;
  kv: AllKvStats | null;
}

function StationBreakdownSection({
  stationFacilityCount,
  stationInsideCount,
}: StationBreakdownProps) {
  return (
    <Section id="station-breakdown">
      <SectionLabel>駅別データイメージ</SectionLabel>
      <SectionHeading>主要PoC駅ごとの取得イメージ</SectionHeading>
      <p className="text-sm text-gray-500 mb-8 -mt-2">
        新宿・大宮・赤羽の3駅を対象に、一定期間運用後の施設チェックイン・駅訪問ログ取得イメージを駅単位で確認できます。
      </p>

      <div className="border border-[#c8e6d0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F6FAF7] border-b border-[#c8e6d0]">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">駅名</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">施設数</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">改札内</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">施設チェックイン</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">駅訪問ログ</th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">デモ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {POC_STATIONS.map(({ slug, label }) => {
              const facilityCount = stationFacilityCount[slug] ?? 0;
              const insideCount   = stationInsideCount[slug] ?? 0;
              const sample = SAMPLE_STATION_BREAKDOWN[slug];
              return (
                <tr key={slug} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-800">{label}</td>
                  <td className="px-5 py-4 text-center text-gray-700">{facilityCount}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                      {insideCount}件
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {sample.facilityCheckins}
                      <span className="text-xs font-normal text-gray-400 ml-1">回</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-lg font-bold text-gray-800">
                      {sample.stationVisits}
                      <span className="text-xs font-normal text-gray-400 ml-1">回</span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href="/jr/demo-sample"
                      className="text-xs text-[#1A7040] hover:text-[#0d4a25] border border-[#c8e6d0] px-2 py-1 rounded hover:border-[#1A7040] transition-all"
                    >
                      審査用デモ →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 text-right px-5 py-2 border-t border-[#c8e6d0]">
          ※ チェックイン・訪問ログは一定期間運用後のサンプル値です。
        </p>
      </div>

      <div className="mt-4 text-right">
        <Link
          href="/jr/demo-sample"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          審査用デモで詳細を確認 →
        </Link>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────

const assets = [
  {
    title: "改札内施設の公式データ提供",
    body: "現在は公開情報をもとに手動整備。正確な店舗情報・営業時間・座席数などのデータ提供があれば精度が向上する。",
  },
  {
    title: "PoC 実施駅の選定・調整",
    body: "新宿・大宮・赤羽を想定。現地での実証実験、案内掲示などの協力。",
  },
  {
    title: "リアルタイムデータの接続検討",
    body: "空席センサー・入場者数・売上データ等との連携。第一フェーズは不要だが、将来フェーズで効果測定の精度を上げられる。",
  },
  {
    title: "Suica/交通系 IC との連携可能性",
    body: "将来フェーズでの回遊行動との突合、購買データ活用の検討。",
  },
];

function AssetsSection() {
  return (
    <Section id="assets">
      <SectionLabel>JRに求めること</SectionLabel>
      <SectionHeading>PoC実施に必要なアセット</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assets.map((a, i) => (
          <div key={i} className="border border-[#c8e6d0] rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{a.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 7. 展開イメージ ─────────────────────────────────

/** 現時点で施設データ実装済みの駅名セット */
const POC_IMPLEMENTED_STATIONS = new Set(["大宮", "赤羽", "池袋", "新宿"]);

const EXPANSION_LINES = [
  {
    name: "京浜東北線",
    color: "#00B2E6",
    stations: ["大宮", "南浦和", "赤羽", "上野", "東京"],
    note: "大宮・赤羽との接続を含み、首都圏南北導線の主要駅へ展開可能",
  },
  {
    name: "湘南新宿ライン",
    color: "#E5001F",
    stations: ["大宮", "赤羽", "池袋", "新宿", "渋谷", "横浜"],
    note: "既存PoC駅との重複が多く、広域ターミナル連携を示しやすい展開候補",
  },
];

function ExpansionImageSection() {
  return (
    <Section id="expansion" className="bg-[#F6FAF7]">
      <SectionLabel>展開イメージ</SectionLabel>
      <SectionHeading>主要路線への展開イメージ</SectionHeading>
      <p className="text-sm text-gray-500 leading-relaxed mb-8 -mt-2 max-w-2xl">
        本PoCでは、大宮・赤羽・池袋・新宿などの主要PoC駅を対象に、改札内施設データ・利用ログ・管理画面までを実装済みです。
        採択後は、JR東日本の主要ターミナル駅・乗換導線・駅ナカ商業エリアへ段階的に展開し、駅空間単位のデータ基盤として拡張可能です。
      </p>

      <div className="space-y-5">
        {EXPANSION_LINES.map((line) => (
          <div
            key={line.name}
            className="border border-[#c8e6d0] rounded-lg overflow-hidden bg-white"
          >
            {/* 路線ヘッダー */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#c8e6d0] bg-[#F6FAF7]">
              <div
                className="w-1 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: line.color }}
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{line.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{line.note}</p>
              </div>
              <span className="ml-auto text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full flex-shrink-0">
                展開候補
              </span>
            </div>

            {/* 駅チップ */}
            <div className="px-5 py-4 flex flex-wrap items-center gap-2">
              {line.stations.map((station, idx) => {
                const isImpl = POC_IMPLEMENTED_STATIONS.has(station);
                return (
                  <div key={station} className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                        isImpl
                          ? "bg-green-50 border-green-200 text-green-700"
                          : "bg-white border-gray-200 text-gray-400"
                      }`}
                    >
                      {isImpl && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 align-middle" />
                      )}
                      {station}
                    </span>
                    {idx < line.stations.length - 1 && (
                      <span className="text-gray-300 text-xs select-none">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 凡例 + 注記 */}
      <div className="mt-5 flex flex-wrap items-start gap-6">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
            PoC実装済み駅
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full border border-gray-300 bg-white" />
            展開候補駅（未整備）
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-3 leading-relaxed">
        ※ 現時点では施設データ未整備の駅を含みます。採択後、JR東日本の対象駅・対象施設に合わせて段階整備します。
      </p>
    </Section>
  );
}

// ── 8. ロードマップ ─────────────────────────────────

const roadmap = [
  {
    phase: "Phase 1",
    title: "PoC 開始（現在）",
    period: "2026年12月〜",
    items: [
      "対象駅・対象施設の選定・調整",
      "公式施設情報の確認・補正",
      "既存Webアプリによるログ取得開始",
      "送客・UGC・管理画面活用の初期検証",
    ],
  },
  {
    phase: "Phase 2",
    title: "実証実験",
    period: "〜2027年1月",
    items: [
      "JR側データ連携（施設情報・営業状況）",
      "実際の利用者への提供開始",
      "チェックイン・回遊データの収集・分析",
      "送客効果の測定",
    ],
  },
  {
    phase: "Phase 3",
    title: "拡張・展開",
    period: "〜2027年3月",
    items: [
      "対象駅の拡大",
      "リアルタイムデータ連携",
      "Suica 連携・購買データとの突合",
      "駅ナカ販促プラットフォームへの発展",
    ],
  },
];

function RoadmapSection() {
  return (
    <Section id="roadmap" className="bg-[#F6FAF7]">
      <SectionLabel>ロードマップ</SectionLabel>
      <SectionHeading>実証から展開までの計画</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roadmap.map((r, i) => (
          <div key={i} className="bg-white border border-[#c8e6d0] rounded-lg p-6">
            <p className="text-xs text-gray-400 mb-1">{r.phase}</p>
            <h3 className="font-semibold text-gray-800 mb-1">{r.title}</h3>
            <p className="text-xs text-gray-400 mb-4">{r.period}</p>
            <ul className="space-y-2">
              {r.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-300 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 8. 実行体制 ─────────────────────────────────────

function TeamSection() {
  return (
    <Section id="team">
      <SectionLabel>実行体制</SectionLabel>
      <SectionHeading>チームとリソース</SectionHeading>
      <div className="border border-[#c8e6d0] rounded-lg p-6 max-w-2xl">
        <h3 className="font-semibold text-gray-800 mb-3">チーム体制</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          本企画・提案・開発は、弊社数名のチームを組成して対応しています。PoCフェーズについても、同チームにて機動的に推進する想定です。
        </p>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/jr/demo-sample"
          className="inline-block bg-[#1A7040] text-white font-semibold px-8 py-4 rounded text-sm hover:bg-[#155d35] transition-colors"
        >
          審査用デモを確認する →
        </Link>
      </div>
    </Section>
  );
}

// ── メインページ ─────────────────────────────────────

export default async function JrPage() {
  // ── 静的データ（ビルド時確定） ──
  const allStations     = getAllStations();
  const totalStations   = allStations.length;
  const totalFacilities = allStations.reduce(
    (s, st) => s + st.facilities.filter((f) => !f.isTemporary).length,
    0
  );
  const insideFacilities = allStations.reduce(
    (s, st) =>
      s + st.facilities.filter((f) => !f.isTemporary && f.gateArea === "改札内").length,
    0
  );

  // facilityId → stationSlug の逆引きマップを構築
  const facilityToStation: Record<string, string> = {};
  const stationFacilityCount: Record<string, number> = {};
  const stationInsideCount:   Record<string, number> = {};
  for (const station of allStations) {
    stationFacilityCount[station.slug] = station.facilities.filter(
      (f) => !f.isTemporary
    ).length;
    stationInsideCount[station.slug] = station.facilities.filter(
      (f) => !f.isTemporary && f.gateArea === "改札内"
    ).length;
    // facilityToStation は isTemporary も含めて登録（既存KVデータへの逆引き対応）
    for (const facility of station.facilities) {
      facilityToStation[facility.id] = station.slug;
    }
  }

  // ── KV 動的データ ──
  const kvData = await fetchAllKvStats(facilityToStation);

  return (
    <>
      <HeroSection />
      <ChallengesSection />
      <ValueSection />
      <PocThemeSection />
      <ImplementationSection />
      <LiveStatsSection
        totalStations={totalStations}
        totalFacilities={totalFacilities}
        insideFacilities={insideFacilities}
        kv={kvData}
      />
      <StationBreakdownSection
        stationFacilityCount={stationFacilityCount}
        stationInsideCount={stationInsideCount}
        kv={kvData}
      />
      <AssetsSection />
      <ExpansionImageSection />
      <RoadmapSection />
      <TeamSection />
    </>
  );
}
