import type { Station } from "@/types";
import omiya from "@/data/omiya.json";
import kitaYono from "@/data/kita-yono.json";
import yonoHonmachi from "@/data/yono-honmachi.json";
import minamiYono from "@/data/minami-yono.json";
import nakaUrawa from "@/data/naka-urawa.json";
import musashiUrawa from "@/data/musashi-urawa.json";
import todaKoen from "@/data/toda-koen.json";
import toda from "@/data/toda.json";
import kitaToda from "@/data/kita-toda.json";

// 埼京線 大宮→戸田公園（埼玉県内・南行き順）
const stations: Station[] = [
  omiya,
  kitaYono,
  yonoHonmachi,
  minamiYono,
  nakaUrawa,
  musashiUrawa,
  todaKoen,
  toda,
  kitaToda,
] as Station[];

export function getAllStations(): Station[] {
  return stations;
}

export function getStationBySlug(slug: string): Station | undefined {
  return stations.find((s) => s.slug === slug);
}
