import areasData    from "@/data/areas.json";
import operatorsData from "@/data/operators.json";
import linesData     from "@/data/lines.json";
import { getAllStations } from "@/lib/stations";

// ── 型定義 ───────────────────────────────────────────

export interface Area {
  id: string;
  name: string;
  nameEn: string;
  emoji: string;
  status: "active" | "coming_soon";
  operators: string[];
}

export interface NavOperator {
  id: string;
  name: string;
  shortName: string;
  color: string;
  area: string;
  status: "active" | "coming_soon";
  lines: string[];
}

export interface LineStation {
  slug: string;
  name: string;
}

export interface NavLine {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  operator: string;
  status: "active" | "coming_soon";
  stations: LineStation[];
}

// ── ユーティリティ ────────────────────────────────────

export function getAreas(): Area[] {
  return areasData as Area[];
}

export function getOperatorsByArea(areaId: string): NavOperator[] {
  return (operatorsData as NavOperator[]).filter((o) => o.area === areaId);
}

export function getOperatorById(operatorId: string): NavOperator | undefined {
  return (operatorsData as NavOperator[]).find((o) => o.id === operatorId);
}

export function getLinesByOperator(operatorId: string): NavLine[] {
  return (linesData as NavLine[]).filter((l) => l.operator === operatorId);
}

export interface StationEntry {
  slug: string;
  name: string;
  /** DB に駅データが存在する場合のみセット */
  station: ReturnType<typeof getAllStations>[number] | null;
}

// ── 駅詳細ページの「戻る」リンク ────────────────────────

export interface StationBackNav {
  /** 戻り先 URL（例: /?area=kanto&operator=jr-east） */
  href: string;
  /** リンクラベル（例: 埼京線の駅一覧へ） */
  label: string;
}

/**
 * 駅 slug から「どの路線/事業者一覧に戻るか」を逆引きで決定する。
 * - lines.json の stations 配列を走査して該当行を特定
 * - operator.area + operator.id から一覧ページ URL を生成
 * - 見つからない場合はトップページにフォールバック
 */
export function getStationBackNav(slug: string): StationBackNav {
  const lines = linesData as NavLine[];
  const operators = operatorsData as NavOperator[];

  for (const line of lines) {
    if (line.stations.some((s) => s.slug === slug)) {
      const operator = operators.find((op) => op.id === line.operator);
      if (operator) {
        return {
          href: `/?area=${operator.area}&operator=${operator.id}`,
          label: `${line.name}の駅一覧へ`,
        };
      }
    }
  }

  // フォールバック：路線が見つからない場合はトップへ
  return { href: "/", label: "駅一覧へ" };
}

// ── 路線・駅一覧 ────────────────────────────────────────

/**
 * 路線 ID から駅一覧を路線順で返す。
 * DB に存在しない駅は station: null で返す（将来の準備中駅対応）。
 */
export function getStationsByLine(lineId: string): StationEntry[] {
  const line = (linesData as NavLine[]).find((l) => l.id === lineId);
  if (!line) return [];
  const allStations = getAllStations();
  return line.stations.map(({ slug, name }) => ({
    slug,
    name,
    station: allStations.find((s) => s.slug === slug) ?? null,
  }));
}
