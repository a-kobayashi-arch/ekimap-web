export type Category = "飲食店" | "ショップ" | "サービス" | "設備" | "その他";

export type GateArea = "改札内" | "改札外" | "調査中";

export interface Facility {
  id: string;
  name: string;
  category: Category;
  floor: string;
  hours: string;
  gateArea: GateArea;
  description?: string;
}

export interface StationLine {
  name: string;
  color: string;
}

export interface Station {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  building?: string | null;
  lines: StationLine[];
  facilities: Facility[];
}
