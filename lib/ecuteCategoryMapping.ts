/**
 * エキュート系施設のカテゴリマッピング定義
 *
 * 分類優先順位：
 *  1. officialCategory（エキュート公式サイトのカテゴリ）
 *  2. 現地確認情報（席あり・イートイン確認）
 *  3. description（店舗説明文）
 *  4. 店舗名からの推測
 *
 * 注意：
 *  - officialCategory が「カフェ＆イートイン・バー」の場合、
 *    description に「デリ」「ベーカリー」等が含まれていても飲食店側を優先する
 *  - officialCategory が不明で現地確認もない場合、
 *    description だけで強引に飲食店へ寄せない
 */

import type { Category } from "@/types";

// ── 公式カテゴリの定義 ──────────────────────────────

/** エキュート公式サイトで使われるカテゴリ名 */
export type EcuteOfficialCategory =
  | "和菓子"
  | "洋菓子"
  | "ベーカリー"
  | "弁当・惣菜"
  | "生鮮・グロッサリー"
  | "スーパー・コンビニ・キオスク"
  | "服飾雑貨・衣料品"
  | "ベビー・子供服"
  | "雑貨・インテリア"
  | "フラワー・グリーン"
  | "書店・ステーショナリー"
  | "レストラン"
  | "カフェ＆イートイン・バー"
  | "サービス"
  | "期間限定ショップ"
  | "ドラッグ・コスメ"
  | "お酒";

// ── マッピングルール ─────────────────────────────────

export interface CategoryMapping {
  category: Category;
  subCategory: string;
}

/**
 * エキュート公式カテゴリ → アプリ内カテゴリ のマッピング
 *
 * A. 飲食店
 *    公式: レストラン / カフェ＆イートイン・バー
 *    → category: "飲食店", subCategory: officialCategory
 *
 * B. 食材・お土産（持ち帰り食品・物販食品系）
 *    公式: 和菓子 / 洋菓子 / ベーカリー / 弁当・惣菜 / 生鮮・グロッサリー / お酒
 *    → category: "食材・お土産", subCategory: "食材・お土産"
 *
 * C. 雑貨・文具（食品以外の物販）
 *    公式: 服飾雑貨・衣料品 / ベビー・子供服 / 雑貨・インテリア /
 *          フラワー・グリーン / 書店・ステーショナリー / ドラッグ・コスメ
 *    → category: "雑貨・文具", subCategory: "雑貨・文具"
 *
 * D. その他
 *    公式: スーパー・コンビニ・キオスク / サービス / 期間限定ショップ
 *    → category: "その他", subCategory: "その他"
 */
export const ECUTE_CATEGORY_MAPPING: Record<EcuteOfficialCategory, CategoryMapping> = {
  // A. 飲食店
  レストラン:             { category: "飲食店",      subCategory: "レストラン" },
  "カフェ＆イートイン・バー": { category: "飲食店",  subCategory: "カフェ＆イートイン・バー" },

  // B. 食材・お土産
  和菓子:                 { category: "食材・お土産", subCategory: "食材・お土産" },
  洋菓子:                 { category: "食材・お土産", subCategory: "食材・お土産" },
  ベーカリー:             { category: "食材・お土産", subCategory: "食材・お土産" },
  "弁当・惣菜":           { category: "食材・お土産", subCategory: "食材・お土産" },
  "生鮮・グロッサリー":   { category: "食材・お土産", subCategory: "食材・お土産" },
  お酒:                   { category: "食材・お土産", subCategory: "食材・お土産" },

  // C. 雑貨・文具
  "服飾雑貨・衣料品":     { category: "雑貨・文具",   subCategory: "雑貨・文具" },
  "ベビー・子供服":       { category: "雑貨・文具",   subCategory: "雑貨・文具" },
  "雑貨・インテリア":     { category: "雑貨・文具",   subCategory: "雑貨・文具" },
  "フラワー・グリーン":   { category: "雑貨・文具",   subCategory: "雑貨・文具" },
  "書店・ステーショナリー": { category: "雑貨・文具", subCategory: "雑貨・文具" },
  "ドラッグ・コスメ":     { category: "雑貨・文具",   subCategory: "雑貨・文具" },

  // D. その他
  "スーパー・コンビニ・キオスク": { category: "その他", subCategory: "その他" },
  サービス:               { category: "その他",        subCategory: "その他" },
  期間限定ショップ:       { category: "その他",        subCategory: "その他" },
};

/**
 * officialCategory からアプリ内カテゴリを解決する
 * officialCategory が未設定 or 未知の場合は null を返す
 */
export function resolveEcuteCategory(
  officialCategory: string | undefined
): CategoryMapping | null {
  if (!officialCategory) return null;
  return ECUTE_CATEGORY_MAPPING[officialCategory as EcuteOfficialCategory] ?? null;
}
