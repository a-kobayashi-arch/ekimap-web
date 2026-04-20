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
