import Link from "next/link";

// ── サンプルデータ（静的定数） ──────────────────────────
// ※ 実ログではありません。審査説明用のサンプル値です。

const SAMPLE_SUMMARY = {
  facilityDetailOpen: 1248,
  categorySelect:     842,
  oneTapStatus:       356,
};

const SAMPLE_ONE_TAP = [
  { label: "空いてた",    count: 146 },
  { label: "混んでた",    count:  98 },
  { label: "充電できた",  count: 112 },
];

const SAMPLE_CATEGORIES = [
  { category: "飲食店",          count: 312 },
  { category: "カフェ・ベーカリー", count: 226 },
  { category: "コンビニ・物販",    count: 154 },
  { category: "トイレ・設備",      count:  92 },
  { category: "座席・休憩",        count:  58 },
];

// 実在施設名（大宮・赤羽・新宿・池袋の既存データより）
const SAMPLE_RANKING = [
  { name: "BECK'S COFFEE SHOP 赤羽",      station: "赤羽",   count: 184 },
  { name: "ゴディバカフェ 大宮",            station: "大宮",   count: 156 },
  { name: "BECK'S COFFEE SHOP 新宿東口店", station: "新宿",   count: 132 },
  { name: "成城石井 赤羽きた",             station: "赤羽",   count: 118 },
  { name: "NewDays 池袋西口店",            station: "池袋",   count:  96 },
];

// ── 共通コンポーネント ────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
      {title}
    </p>
  );
}

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
          {value.toLocaleString()}
        </span>
        <span className={`text-sm ${accent ? "text-blue-400" : "text-gray-400"}`}>{unit}</span>
      </div>
    </div>
  );
}

function BarRow({ label, count, max, sub }: { label: string; count: number; max: number; sub?: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="bg-blue-300 h-2 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-semibold text-gray-700 w-12 text-right shrink-0">{count}件</span>
      {sub && <span className="text-xs text-gray-400 shrink-0">{sub}</span>}
    </div>
  );
}

// ── メインページ ─────────────────────────────────────

export default function JrDemoSamplePage() {
  const maxCat = SAMPLE_CATEGORIES[0].count;
  const maxOtp = Math.max(...SAMPLE_ONE_TAP.map((x) => x.count));
  const maxRank = SAMPLE_RANKING[0].count;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* ── タイトル ── */}
      <div className="border-l-4 border-amber-400 pl-5 py-1">
        <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
          審査説明用 / サンプルデモ
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          探索行動ログ サンプルデモ
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
          一定期間運用後の管理画面イメージとして表示しています。
        </p>
      </div>

      {/* ── 必須注記バナー ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 space-y-1">
        <p className="text-sm font-semibold text-amber-700">
          ※ このページは審査説明用のサンプルデータを含むデモ画面です。実測ログとは区別しています。
        </p>
        <p className="text-xs text-amber-600">
          実測ログ管理画面は、審査通過後の面談時に提示可能です。
        </p>
      </div>

      {/* ── サマリーカード ── */}
      <div>
        <SectionHeader title="探索行動ログサマリー（サンプル）" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="合計イベント数"
            value={SAMPLE_SUMMARY.facilityDetailOpen + SAMPLE_SUMMARY.categorySelect + SAMPLE_SUMMARY.oneTapStatus}
            unit="件"
            accent
          />
          <MetricCard label="施設詳細閲覧"      value={SAMPLE_SUMMARY.facilityDetailOpen} unit="件" />
          <MetricCard label="目的カテゴリ選択"  value={SAMPLE_SUMMARY.categorySelect}     unit="件" />
          <MetricCard label="ワンタップ確認"    value={SAMPLE_SUMMARY.oneTapStatus}       unit="件" />
        </div>
      </div>

      {/* ── 目的別ニーズ ＋ 鮮度確認ログ ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 目的別ニーズ */}
        <div className="border border-gray-200 rounded-xl p-5">
          <SectionHeader title="目的別ニーズ" />
          <div className="space-y-3">
            {SAMPLE_CATEGORIES.map((c) => (
              <BarRow key={c.category} label={c.category} count={c.count} max={maxCat} />
            ))}
          </div>
        </div>

        {/* 鮮度確認ログ */}
        <div className="border border-gray-200 rounded-xl p-5">
          <SectionHeader title="鮮度確認ログ（ワンタップ）" />
          <div className="space-y-3">
            {SAMPLE_ONE_TAP.map((item) => (
              <BarRow key={item.label} label={item.label} count={item.count} max={maxOtp} />
            ))}
          </div>
        </div>
      </div>

      {/* ── 施設別閲覧ランキング ── */}
      <div className="border border-gray-200 rounded-xl p-5">
        <SectionHeader title="施設別閲覧ランキング（TOP 5）" />
        <div className="space-y-2.5">
          {SAMPLE_RANKING.map((f, i) => (
            <div key={f.name} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{f.name}</p>
                <p className="text-xs text-gray-400">{f.station}</p>
              </div>
              <BarRow label="" count={f.count} max={maxRank} />
            </div>
          ))}
        </div>
      </div>

      {/* ── 説明カード ── */}
      <div className="bg-[#F6FAF7] border border-[#c8e6d0] rounded-xl p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          この画面で分かること
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          このサンプル画面では、施設詳細閲覧・目的カテゴリ選択・ワンタップ確認をもとに、
          駅ナカ利用者がどの施設・目的に関心を持っているかを可視化します。
          採択後は、対象駅・対象施設の実ログをもとに、送客改善・混雑緩和・施設運営判断に活用できます。
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/jr"
            className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:border-gray-400 hover:text-gray-700 transition-all"
          >
            ← 提案ページに戻る（/jr）
          </Link>
        </div>
      </div>

      {/* ── フッター注記 ── */}
      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100 space-y-1">
        <p>※ 本画面に表示されている数値はすべてサンプルデータです。実際の取得ログとは異なります。</p>
        <p>※ 実測ログ管理画面は、審査通過後の面談時に提示可能です。</p>
      </div>
    </div>
  );
}
