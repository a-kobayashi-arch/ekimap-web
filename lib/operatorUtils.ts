import type { Operator } from "@/types";

/**
 * 事業者の路線サマリーを生成する
 * - groups あり → "新幹線 6路線 / 在来線 7路線"
 * - lines が1本 → 路線名をそのまま返す（short=true なら shortName を優先）
 * - lines が複数 → "N路線"
 * @param short true のとき一覧カード用の短縮名を使用
 */
export function summarizeOperator(op: Operator, short = false): string {
  if (op.groups && op.groups.length > 0) {
    return op.groups
      .map((g) => `${g.label} ${g.lines.length}`)
      .join(" / ");
  }
  if (op.lines && op.lines.length === 1) {
    const line = op.lines[0];
    if (short && line.shortName !== undefined) return line.shortName;
    return line.name;
  }
  if (op.lines && op.lines.length > 1) {
    return `${op.lines.length}路線`;
  }
  return "";
}

/** 事業者が展開表示を持つか（1路線のみの場合は不要） */
export function isExpandable(op: Operator): boolean {
  if (op.groups && op.groups.length > 0) return true;
  if (op.lines && op.lines.length > 1) return true;
  return false;
}
