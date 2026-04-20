import Link from "next/link";

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
  { status: "wip",  label: "目的別導線 UI（/jr/demo で整備中）" },
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

export default function JrPage() {
  return (
    <>
      <HeroSection />
      <ChallengesSection />
      <ValueSection />
      <PocThemeSection />
      <ImplementationSection />
      <AssetsSection />
      <RoadmapSection />
      <TeamSection />
    </>
  );
}
