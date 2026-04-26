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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
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
    <section className="bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          JR東日本スタートアップ応募 PoC 提案
        </p>
        <h1 className="text-4xl font-bold leading-tight mb-6">
          改札内の回遊・滞在・送客を<br />
          データで可視化する駅ナカ運営基盤
        </h1>
        <p className="text-gray-300 text-lg mb-10 max-w-2xl">
          「今すぐ座れる場所」「充電できる場所」「立ち寄れる店」を
          リアルタイムに案内し、改札内の回遊と店舗送客を最適化するPoCです。
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/jr/demo"
            className="inline-block bg-white text-gray-900 font-semibold px-6 py-3 rounded text-sm hover:bg-gray-100 transition-colors"
          >
            動くデモを見る →
          </Link>
          <a
            href="#poc-theme"
            className="text-sm text-gray-400 hover:text-white transition-colors"
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
          <div key={i} className="border border-gray-200 rounded-lg p-6">
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
    label: "将来の拡張性",
    body: "流通・サービス領域でPoC後、Suica連携・購買データ・金融サービスへの接続が可能。",
  },
];

function ValueSection() {
  return (
    <Section id="value" className="bg-gray-50">
      <SectionLabel>提案価値</SectionLabel>
      <SectionHeading>本提案が解決すること</SectionHeading>
      <div className="space-y-4">
        {values.map((v, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-7 h-7 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
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
      <div className="bg-gray-950 text-white rounded-xl p-10 mb-8">
        <p className="text-xl font-semibold leading-relaxed">
          「改札内で今すぐ座れて充電できる/立ち寄れる場所」の
          可視化と送客最適化
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["新宿", "大宮", "赤羽"].map((station) => (
          <div
            key={station}
            className="border border-gray-200 rounded-lg p-5 text-center"
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
  { status: "done", label: "施設チェックイン（Vercel KV 永続化）" },
  { status: "done", label: "駅スタンプ（チェックイン実績の可視化）" },
  { status: "done", label: "クロスデバイス同期（ユーザーID管理）" },
  { status: "done", label: "改札内/外の区別フラグ" },
  { status: "done", label: "UGC 更新モーダル（施設情報の報告）" },
  { status: "done", label: "stats API（チェックイン集計）" },
  { status: "done", label: "目的別導線 UI（食べる / 買う / 座る / 充電）" },
  { status: "plan", label: "リアルタイム空席・充電状況（要JR側アセット）" },
  { status: "plan", label: "Suica 連携・購買データ分析" },
];

function ImplementationSection() {
  const badge = (status: string) => {
    if (status === "done") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">実装済み</span>;
    if (status === "wip")  return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">開発中</span>;
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">計画</span>;
  };

  return (
    <Section id="implementation" className="bg-gray-50">
      <SectionLabel>実装状況</SectionLabel>
      <SectionHeading>現在のプロトタイプで動いていること</SectionHeading>
      <div className="space-y-3">
        {implementations.map((item, i) => (
          <div key={i} className="flex items-center justify-between border border-gray-200 bg-white rounded-lg px-5 py-3">
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
    <div className={`rounded-lg border p-5 ${accent ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accent ? "text-gray-400" : "text-gray-400"}`}>
        {label}
      </p>
      <p className={`text-4xl font-bold ${accent ? "text-white" : "text-gray-800"}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? "text-gray-500" : "text-gray-400"}`}>{sub}</p>
      )}
    </div>
  );
}

function LiveStatsSection({ totalStations, totalFacilities, insideFacilities, kv: kvData }: LiveStatsProps) {
  const hasKvData = kvData !== null;
  const hasCheckins = hasKvData && (kvData.totalFacilityCheckins + kvData.totalStationCheckins) > 0;

  return (
    <Section id="live-stats" className="bg-gray-950 text-white">
      {/* ヘッダー */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-10">
        <div>
          <SectionLabel>開発状況・実績データ</SectionLabel>
          <SectionHeading>
            <span className="text-white">すでに動くプロトタイプが公開されています</span>
          </SectionHeading>
          <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
            実際に動作するプロトタイプを Vercel 上で稼働中。施設データ・チェックイン機能・駅スタンプ・KV 集計まで、
            PoC に必要な土台が整っています。
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/jr/demo"
            className="inline-block px-4 py-2 text-sm font-semibold bg-white text-gray-900 rounded hover:bg-gray-200 transition-colors"
          >
            デモを見る →
          </Link>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-sm font-semibold border border-gray-600 text-gray-300 rounded hover:border-gray-400 hover:text-white transition-colors"
          >
            一般向けサイト
          </Link>
        </div>
      </div>

      {/* 静的指標：実装状況 */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          実装状況（静的データ）
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="公開駅数"        value={totalStations}    sub="埼京線全駅対応済み" accent />
          <Stat label="施設データ数"    value={totalFacilities}  sub="全駅合計"            accent />
          <Stat label="改札内施設"      value={insideFacilities} sub="PoC 主対象"          accent />
          <Stat label="稼働環境"        value="Vercel"           sub="本番公開中"          accent />
        </div>
      </div>

      {/* 動的指標：KV 実績 */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          実績データ（Vercel KV リアルタイム集計）
        </p>
        {hasCheckins ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat
              label="施設チェックイン"
              value={kvData!.totalFacilityCheckins}
              sub="累計回数"
              accent
            />
            <Stat
              label="チェックイン施設数"
              value={kvData!.facilitiesWithCheckins}
              sub="施設ユニーク数"
              accent
            />
            <Stat
              label="駅スタンプ"
              value={kvData!.totalStationCheckins}
              sub="累計取得数"
              accent
            />
            <Stat
              label="訪問駅種類"
              value={kvData!.stationsWithCheckins}
              sub="駅ユニーク数"
              accent
            />
          </div>
        ) : hasKvData ? (
          /* KV は繋がっているが実績データがまだない */
          <div className="border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">
              KV 接続済み・データ蓄積中。
              <Link href="/jr/demo" className="text-gray-300 underline ml-1 hover:text-white">
                デモページ
              </Link>
              でチェックインすると実績が反映されます。
            </p>
          </div>
        ) : (
          /* KV 未接続（ローカル環境等） */
          <div className="border border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">
              KV 未接続環境のため実績データは非表示です（本番環境では表示されます）。
            </p>
          </div>
        )}
      </div>

      {/* 補足 */}
      <div className="mt-8 pt-6 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 font-medium mb-1">データ永続化</p>
            <p className="text-gray-500">
              チェックイン実績は Vercel KV（Redis 互換）に永続保存。
              匿名 UUID によるユーザー識別・クロスデバイス同期済み。
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">今すぐ実証可能</p>
            <p className="text-gray-500">
              新宿・大宮・赤羽の施設データは整備済み。
              JR 側データ連携なしでも PoC としてすぐに動かせる状態。
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">拡張性</p>
            <p className="text-gray-500">
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
  kv,
}: StationBreakdownProps) {
  const hasKv = kv !== null;

  return (
    <Section id="station-breakdown">
      <SectionLabel>駅別実績データ</SectionLabel>
      <SectionHeading>主要PoC駅ごとの状況</SectionHeading>
      <p className="text-sm text-gray-500 mb-8 -mt-2">
        新宿・大宮・赤羽の3駅を対象に、施設データとチェックイン実績を駅単位で確認できます。
      </p>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-500">駅名</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">施設数</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">改札内</th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">
                施設チェックイン
                {!hasKv && <span className="text-gray-300 font-normal ml-1">※</span>}
              </th>
              <th className="text-center px-5 py-3 font-medium text-gray-500">
                駅スタンプ
                {!hasKv && <span className="text-gray-300 font-normal ml-1">※</span>}
              </th>
              <th className="text-left px-5 py-3 font-medium text-gray-500">デモ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {POC_STATIONS.map(({ slug, label }) => {
              const facilityCount = stationFacilityCount[slug] ?? 0;
              const insideCount   = stationInsideCount[slug] ?? 0;
              const stat          = kv?.perStation[slug];
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
                    {hasKv ? (
                      stat?.facilityCheckins ? (
                        <span className="text-lg font-bold text-gray-800">
                          {stat.facilityCheckins}
                          <span className="text-xs font-normal text-gray-400 ml-1">回</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">–</span>
                      )
                    ) : (
                      <span className="text-gray-300 text-sm">–</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {hasKv ? (
                      stat?.stationStamps ? (
                        <span className="text-lg font-bold text-gray-800">
                          {stat.stationStamps}
                          <span className="text-xs font-normal text-gray-400 ml-1">回</span>
                        </span>
                      ) : (
                        <span className="text-gray-300 text-sm">–</span>
                      )
                    ) : (
                      <span className="text-gray-300 text-sm">–</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/jr/demo?station=${slug}`}
                      className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded hover:border-gray-400 transition-all"
                    >
                      デモを見る →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!hasKv && (
          <p className="text-xs text-gray-400 text-right px-5 py-2 border-t border-gray-100">
            ※ KV未接続環境のためチェックイン実績は非表示（本番環境では表示）
          </p>
        )}
      </div>

      <div className="mt-4 text-right">
        <Link
          href="/jr/demo"
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          /jr/demo で詳細データを確認 →
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
          <div key={i} className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-2">{a.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{a.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ── 7. ロードマップ ─────────────────────────────────

const roadmap = [
  {
    phase: "Phase 1",
    title: "PoC 開始（現在）",
    period: "〜 2025 Q3",
    items: [
      "新宿・大宮・赤羽での施設データ整備",
      "/jr/demo ページの完成",
      "目的別導線・stats 表示の実装",
      "応募資料・スクリーンショット整備",
    ],
  },
  {
    phase: "Phase 2",
    title: "実証実験",
    period: "2025 Q4 〜",
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
    period: "2026 〜",
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
    <Section id="roadmap" className="bg-gray-50">
      <SectionLabel>ロードマップ</SectionLabel>
      <SectionHeading>実証から展開までの計画</SectionHeading>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roadmap.map((r, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">開発・設計</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            本プロトタイプの設計・実装を担当。Next.js + Vercel KV を使った
            フルスタック開発を1名で推進。PoC フェーズは小チームで機動的に動ける体制。
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-3">PoC 実施にあたって</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            JR東日本側から「施設データ・実証駅選定・現地調整」の協力を得ることで、
            Phase 1 → Phase 2 への移行を最短で行える体制を想定。
          </p>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/jr/demo"
          className="inline-block bg-gray-900 text-white font-semibold px-8 py-4 rounded text-sm hover:bg-gray-700 transition-colors"
        >
          実際に動くデモを確認する →
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
      <RoadmapSection />
      <TeamSection />
    </>
  );
}
