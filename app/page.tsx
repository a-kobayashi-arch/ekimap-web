import Link from "next/link";
import { getAllStations } from "@/lib/stations";
import {
  getAreas,
  getOperatorsByArea,
  getOperatorById,
  getLinesByOperator,
  getStationsByLine,
  type Area,
  type NavOperator,
  type NavLine,
  type StationEntry,
} from "@/lib/navigation";
import SearchBar from "@/components/SearchBar";
import StationCard from "@/components/StationCard";

interface Props {
  searchParams: Promise<{ area?: string; operator?: string }>;
}

// ── 小コンポーネント ─────────────────────────────────

/** パンくずナビ */
function Breadcrumb({
  area,
  operator,
}: {
  area?: Area;
  operator?: NavOperator;
}) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-400 flex-wrap">
      <Link href="/" className="hover:text-green-600 transition-colors font-medium">
        🗾 トップ
      </Link>
      {area && (
        <>
          <span>/</span>
          {operator ? (
            <Link
              href={`/?area=${area.id}`}
              className="hover:text-green-600 transition-colors"
            >
              {area.name}
            </Link>
          ) : (
            <span className="text-gray-600 font-medium">{area.name}</span>
          )}
        </>
      )}
      {operator && (
        <>
          <span>/</span>
          <span className="text-gray-600 font-medium">{operator.name}</span>
        </>
      )}
    </nav>
  );
}

/** 「近日公開」バッジ */
function ComingSoonBadge() {
  return (
    <span className="text-xs font-medium bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
      近日公開
    </span>
  );
}

// ── 画面1：エリア選択 ────────────────────────────────

function AreaScreen({ areas }: { areas: Area[] }) {
  return (
    <div className="space-y-6">
      {/* ヒーロー */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-3xl font-bold text-gray-800">駅ナカマップ</h1>
        <p className="text-gray-500 text-sm">エリアを選んでスタンプを集めよう</p>
      </div>

      <SearchBar stations={getAllStations()} />

      {/* エリアカード */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          エリアを選ぶ
        </h2>
        <div className="flex flex-col gap-3">
          {areas.map((area) =>
            area.status === "active" ? (
              <Link key={area.id} href={`/?area=${area.id}`} className="block">
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 border-l-4 border-l-green-500 hover:border-l-green-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{area.emoji}</span>
                    <div>
                      <p className="text-xl font-bold text-gray-800">{area.name}</p>
                      <p className="text-sm text-gray-400">{area.nameEn}</p>
                    </div>
                  </div>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </Link>
            ) : (
              <div
                key={area.id}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 border-l-4 border-l-gray-200 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl grayscale">{area.emoji}</span>
                  <div>
                    <p className="text-xl font-bold text-gray-500">{area.name}</p>
                    <p className="text-sm text-gray-400">{area.nameEn}</p>
                  </div>
                </div>
                <ComingSoonBadge />
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

// ── 画面2：事業者選択 ────────────────────────────────

function OperatorScreen({
  area,
  operators,
}: {
  area: Area;
  operators: NavOperator[];
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb area={area} />

      <div>
        <h1 className="text-2xl font-bold text-gray-800">{area.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">事業者を選んでください</p>
      </div>

      <SearchBar stations={getAllStations()} />

      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          鉄道事業者
        </h2>
        <div className="flex flex-col gap-3">
          {operators.map((op) =>
            op.status === "active" ? (
              <Link
                key={op.id}
                href={`/?area=${area.id}&operator=${op.id}`}
                className="block"
              >
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* 事業者カラーの縦アクセント */}
                    <div
                      className="w-1.5 h-12 rounded-full shrink-0"
                      style={{ backgroundColor: op.color }}
                    />
                    <div>
                      <p className="text-lg font-bold text-gray-800">{op.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {op.lines.length}路線
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </Link>
            ) : (
              <div
                key={op.id}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-12 rounded-full shrink-0 opacity-40"
                    style={{ backgroundColor: op.color }}
                  />
                  <div>
                    <p className="text-lg font-bold text-gray-500">{op.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">準備中</p>
                  </div>
                </div>
                <ComingSoonBadge />
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}

// ── 画面3：路線・駅一覧 ──────────────────────────────

function LineBlock({
  line,
  entries,
}: {
  line: NavLine;
  entries: StationEntry[];
}) {
  return (
    <div className="space-y-3">
      {/* 路線ヘッダー */}
      <div className="flex items-center gap-2">
        <div
          className="h-1 w-6 rounded-full"
          style={{ backgroundColor: line.color }}
        />
        <h3 className="font-bold text-gray-700" style={{ color: line.color }}>
          {line.name}
        </h3>
        <span className="text-xs text-gray-400">{entries.length}駅</span>
      </div>

      {/* 駅カード */}
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
    </div>
  );
}

function StationScreen({
  area,
  operator,
  lines,
}: {
  area: Area;
  operator: NavOperator;
  lines: NavLine[];
}) {
  return (
    <div className="space-y-6">
      <Breadcrumb area={area} operator={operator} />

      <div>
        <h1 className="text-2xl font-bold text-gray-800">{operator.name}</h1>
        <p className="text-sm text-gray-400 mt-0.5">路線・駅を選んでください</p>
      </div>

      <SearchBar stations={getAllStations()} />

      {lines.map((line) => {
        const entries = getStationsByLine(line.id);
        return <LineBlock key={line.id} line={line} entries={entries} />;
      })}
    </div>
  );
}

// ── メインページ ─────────────────────────────────────

export default async function HomePage({ searchParams }: Props) {
  const { area: areaId, operator: operatorId } = await searchParams;
  const areas = getAreas();

  // 画面3：事業者まで選択済み → 路線・駅一覧
  if (areaId && operatorId) {
    const area     = areas.find((a) => a.id === areaId);
    const operator = getOperatorById(operatorId);
    if (!area || !operator) return <AreaScreen areas={areas} />;
    const lines = getLinesByOperator(operatorId);
    return <StationScreen area={area} operator={operator} lines={lines} />;
  }

  // 画面2：エリアのみ選択済み → 事業者一覧
  if (areaId) {
    const area = areas.find((a) => a.id === areaId);
    if (!area) return <AreaScreen areas={areas} />;
    const operators = getOperatorsByArea(areaId);
    return <OperatorScreen area={area} operators={operators} />;
  }

  // 画面1：何も選択なし → エリア選択
  return <AreaScreen areas={areas} />;
}
