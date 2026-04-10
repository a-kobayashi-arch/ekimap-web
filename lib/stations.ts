import type { Station } from "@/types";
import musashiUrawa from "@/data/musashi-urawa.json";

const stations: Station[] = [musashiUrawa as Station];

export function getAllStations(): Station[] {
  return stations;
}

export function getStationBySlug(slug: string): Station | undefined {
  return stations.find((s) => s.slug === slug);
}
