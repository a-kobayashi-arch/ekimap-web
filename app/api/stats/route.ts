import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";
import { getAllStations } from "@/lib/stations";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

/**
 * GET /api/stats
 * 施設・駅両方のチェックイン集計を返す
 *
 * レスポンス形式：
 * {
 *   facilityStats:        [{ facilityId, count }],   // カウント降順
 *   stationStats:         [{ stationSlug, stationName, count }],
 *   totalFacilityCheckins: number,
 *   totalStationCheckins:  number,
 * }
 */
export async function GET() {
  if (!KV_AVAILABLE) {
    return NextResponse.json({
      facilityStats: [],
      stationStats: [],
      totalFacilityCheckins: 0,
      totalStationCheckins: 0,
    });
  }

  try {
    // ── 施設集計 ──────────────────────────────
    const facilityKeys = await kv.keys("stats:facility:*");
    const facilityCounts =
      facilityKeys.length > 0
        ? await Promise.all(facilityKeys.map((k) => kv.get<number>(k)))
        : [];

    const facilityStats = facilityKeys
      .map((key, i) => ({
        facilityId: key.replace("stats:facility:", ""),
        count: Number(facilityCounts[i] ?? 0),
      }))
      .sort((a, b) => b.count - a.count);

    const totalFacilityCheckins = facilityStats.reduce((s, x) => s + x.count, 0);

    // ── 駅集計 ────────────────────────────────
    const stationKeys = await kv.keys("stats:station:*");
    const stationCounts =
      stationKeys.length > 0
        ? await Promise.all(stationKeys.map((k) => kv.get<number>(k)))
        : [];

    const stationNameMap = Object.fromEntries(
      getAllStations().map((s) => [s.slug, s.name])
    );

    const stationStats = stationKeys
      .map((key, i) => {
        const slug = key.replace("stats:station:", "");
        return {
          stationSlug: slug,
          stationName: stationNameMap[slug] ?? slug,
          count: Number(stationCounts[i] ?? 0),
        };
      })
      .sort((a, b) => b.count - a.count);

    const totalStationCheckins = stationStats.reduce((s, x) => s + x.count, 0);

    return NextResponse.json({
      facilityStats,
      stationStats,
      totalFacilityCheckins,
      totalStationCheckins,
    });
  } catch (e) {
    console.error("[stats GET]", e);
    return NextResponse.json({
      facilityStats: [],
      stationStats: [],
      totalFacilityCheckins: 0,
      totalStationCheckins: 0,
    });
  }
}
