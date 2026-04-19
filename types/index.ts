export type Category = "飲食店" | "ショップ" | "サービス" | "設備" | "その他";

export type GateArea = "改札内" | "改札外" | "調査中";

export type OutletStatus = "available" | "unknown";
export type SeatingStatus = "yes" | "no" | "unknown";
export type CrowdedStatus = "empty" | "normal" | "crowded" | "unknown";

export interface Facility {
  id: string;
  name: string;
  category: Category;
  floor: string;
  hours: string;
  gateArea: GateArea;
  description?: string;
  outlet?: OutletStatus;
  seating?: SeatingStatus;
  crowded?: CrowdedStatus;
  lastUpdated?: string;
  // 乗り換え時間
  nearestExit?: string;
  areaInBuilding?: string;
  distanceFromExit?: number;
  floorsToClimb?: number;
  // 複数ビルディング
  building?: string;
}

export interface StationLine {
  name: string;
  color: string;
}

export interface StationExit {
  id: string;
  name: string;
  description: string;
}

/** 路線単体（Operator 内で使用） */
export interface OperatorLine {
  name: string;          // 正式名（詳細画面で使用）
  shortName?: string;    // 短縮名（一覧カードで使用）。空文字列の場合は非表示
  color?: string;
}

/**
 * 路線グループ（新幹線・在来線など事業者内のサブ区分）
 * 大型ターミナル駅でのみ使用
 */
export interface LineGroup {
  label: string;       // "新幹線" | "在来線" | "地下鉄" | etc.
  lines: OperatorLine[];
}

/**
 * 鉄道事業者
 * - groups: 新幹線/在来線などに分けたい大型事業者
 * - lines:  グループ分け不要のシンプル事業者
 */
export interface Operator {
  name: string;         // "JR東日本" / "東武鉄道" etc.
  color: string;        // 事業者バッジ色
  url?: string;         // 事業者の駅公式ページ
  groups?: LineGroup[];
  lines?: OperatorLine[];
}

/** 駅構内の複数ビルディング（南口・北口など）定義 */
export interface Building {
  id: string;
  name: string;
  label: string;
  gate?: string;   // 対応する改札口（例: "北改札"）
}

export type BrandId = "ecute" | "beans" | "gransta" | "equia" | "emio";

export interface Station {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  building?: string | null;
  brand?: BrandId;
  brandColor?: string;
  lines: StationLine[];          // 後方互換: operators がない駅で使用
  operators?: Operator[];        // 事業者単位の豊富な路線情報
  exits?: StationExit[];
  buildings?: Building[];
  facilities: Facility[];
}
