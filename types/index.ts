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

/** 駅構内の複数ビルディング（南口・北口など）定義 */
export interface Building {
  id: string;
  name: string;
  label: string;
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
  lines: StationLine[];
  exits?: StationExit[];
  buildings?: Building[];
  facilities: Facility[];
}
