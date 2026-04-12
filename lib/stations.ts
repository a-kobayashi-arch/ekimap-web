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
// 大宮(JA26)→北与野(JA25)→与野本町(JA24)→南与野(JA23)→中浦和(JA22)
// →武蔵浦和(JA21)→北戸田(JA20)→戸田(JA19)→戸田公園(JA18)
const stations: Station[] = [
  omiya,
  kitaYono,
  yonoHonmachi,
  minamiYono,
  nakaUrawa,
  musashiUrawa,
  kitaToda,
  toda,
  todaKoen,
] as Station[];

export function getAllStations(): Station[] {
  return stations;
}

export function getStationBySlug(slug: string): Station | undefined {
  return stations.find((s) => s.slug === slug);
}
