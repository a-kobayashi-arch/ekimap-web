export type Category = "飲食" | "コンビニ" | "ATM" | "トイレ" | "その他";

export interface Facility {
  id: string;
  name: string;
  category: Category;
  floor: string;
  hours: string;
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
