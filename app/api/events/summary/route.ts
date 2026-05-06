import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

/** 現在日付を JST（UTC+9）で YYYY-MM-DD 形式で返す */
function getDateJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function fallback(date: string) {
  return {
    date,
    totalEvents: 0,
    eventCounts: { facility_detail_open: 0, category_select: 0, one_tap_status: 0 },
    topStations: [] as {
      stationSlug: string;
      facilityDetailOpen: number;
      categorySelect: number;
      oneTapStatus: number;
    }[],
    topFacilities: [] as { facilityId: string; facilityDetailOpen: number }[],
    categoryCounts: [] as { category: string; count: number }[],
    oneTapStatusCounts: { vacant: 0, crowded: 0, charging_available: 0 },
    // 駅別詳細（将来の駅別分析用）
    stationCategoryCounts: [] as { stationSlug: string; category: string; count: number }[],
    stationOneTapCounts: [] as { stationSlug: string; status: string; count: number }[],
  };
}

/**
 * GET /api/events/summary[?date=YYYY-MM-DD]
 * 指定日（省略時は今日 JST）の行動ログ集計を返す
 *
 * 読み取るKVキー：
 *   event_count:{eventName}:{date}
 *   event_count:station:{stationSlug}:{eventName}:{date}
 *   event_count:facility:{facilityId}:{eventName}:{date}
 *   category_count:{category}:{date}                            ← 全体目的ニーズ
 *   category_count:station:{stationSlug}:{category}:{date}      ← 駅別目的ニーズ
 *   one_tap_count:{status}:{date}                               ← 全体鮮度確認
 *   one_tap_count:station:{stationSlug}:{status}:{date}         ← 駅別鮮度確認
 */
export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const date = dateParam ?? getDateJST();

  if (!KV_AVAILABLE) return NextResponse.json(fallback(date));

  try {
    // ── 1. イベント種別ごとの総カウンター ──
    const [fdo, cs, ots] = await Promise.all([
      kv.get<number>(`event_count:facility_detail_open:${date}`),
      kv.get<number>(`event_count:category_select:${date}`),
      kv.get<number>(`event_count:one_tap_status:${date}`),
    ]);
    const fdoCount = Number(fdo ?? 0);
    const csCount  = Number(cs  ?? 0);
    const otsCount = Number(ots ?? 0);

    // ── 2. 駅別集計（event_count:station:* キー） ──
    const [stFdoKeys, stCsKeys, stOtsKeys] = await Promise.all([
      kv.keys(`event_count:station:*:facility_detail_open:${date}`),
      kv.keys(`event_count:station:*:category_select:${date}`),
      kv.keys(`event_count:station:*:one_tap_status:${date}`),
    ]);

    const slugSet = new Set<string>();
    const extractStationSlug = (key: string, eventName: string) =>
      key.replace("event_count:station:", "").replace(`:${eventName}:${date}`, "");

    for (const k of stFdoKeys) slugSet.add(extractStationSlug(k, "facility_detail_open"));
    for (const k of stCsKeys)  slugSet.add(extractStationSlug(k, "category_select"));
    for (const k of stOtsKeys) slugSet.add(extractStationSlug(k, "one_tap_status"));

    const topStations = (
      await Promise.all(
        [...slugSet].map(async (slug) => {
          const [a, b, c] = await Promise.all([
            kv.get<number>(`event_count:station:${slug}:facility_detail_open:${date}`),
            kv.get<number>(`event_count:station:${slug}:category_select:${date}`),
            kv.get<number>(`event_count:station:${slug}:one_tap_status:${date}`),
          ]);
          return {
            stationSlug:        slug,
            facilityDetailOpen: Number(a ?? 0),
            categorySelect:     Number(b ?? 0),
            oneTapStatus:       Number(c ?? 0),
          };
        })
      )
    )
      .sort(
        (a, b) =>
          (b.facilityDetailOpen + b.categorySelect + b.oneTapStatus) -
          (a.facilityDetailOpen + a.categorySelect + a.oneTapStatus)
      )
      .slice(0, 5);

    // ── 3. 施設別閲覧ランキング（facility_detail_open） ──
    const facFdoKeys = await kv.keys(`event_count:facility:*:facility_detail_open:${date}`);
    const facFdoCounts =
      facFdoKeys.length > 0
        ? await Promise.all(facFdoKeys.map((k) => kv.get<number>(k)))
        : [];

    const topFacilities = facFdoKeys
      .map((k, i) => ({
        facilityId:
          k
            .replace("event_count:facility:", "")
            .replace(`:facility_detail_open:${date}`, ""),
        facilityDetailOpen: Number(facFdoCounts[i] ?? 0),
      }))
      .sort((a, b) => b.facilityDetailOpen - a.facilityDetailOpen)
      .slice(0, 5);

    // ── 4. カテゴリ別集計（全体：category_count:{category}:{date} のみ） ──
    // NOTE: category_count:station:* キーも同パターンにヒットするため
    //       "station:" プレフィックスを持つキーを除外して全体集計のみ取得する
    const allCatKeys = await kv.keys(`category_count:*:${date}`);
    const globalCatKeys = allCatKeys.filter(
      (k) => !k.startsWith("category_count:station:")
    );
    const globalCatCounts =
      globalCatKeys.length > 0
        ? await Promise.all(globalCatKeys.map((k) => kv.get<number>(k)))
        : [];

    const categoryCounts = globalCatKeys
      .map((k, i) => ({
        category: k.replace("category_count:", "").replace(`:${date}`, ""),
        count:    Number(globalCatCounts[i] ?? 0),
      }))
      .sort((a, b) => b.count - a.count);

    // ── 5. ワンタップ状態別集計（全体） ──
    const [vacant, crowded, charging] = await Promise.all([
      kv.get<number>(`one_tap_count:vacant:${date}`),
      kv.get<number>(`one_tap_count:crowded:${date}`),
      kv.get<number>(`one_tap_count:charging_available:${date}`),
    ]);

    // ── 6. 駅別カテゴリ集計（category_count:station:*）将来の駅別分析用 ──
    const stationCatKeys = await kv.keys(`category_count:station:*:${date}`);
    const stationCatCounts =
      stationCatKeys.length > 0
        ? await Promise.all(stationCatKeys.map((k) => kv.get<number>(k)))
        : [];

    // key: category_count:station:{stationSlug}:{category}:{date}
    const stationCategoryCounts = stationCatKeys
      .map((k, i) => {
        const inner = k
          .replace("category_count:station:", "")
          .replace(`:${date}`, "");
        // inner = "{stationSlug}:{category}" - stationSlug にコロンは含まれない
        const colonIdx = inner.indexOf(":");
        return {
          stationSlug: inner.slice(0, colonIdx),
          category:    inner.slice(colonIdx + 1),
          count:       Number(stationCatCounts[i] ?? 0),
        };
      })
      .sort((a, b) => b.count - a.count);

    // ── 7. 駅別ワンタップ集計（one_tap_count:station:*）将来の駅別分析用 ──
    const stationOtpKeys = await kv.keys(`one_tap_count:station:*:${date}`);
    const stationOtpCounts =
      stationOtpKeys.length > 0
        ? await Promise.all(stationOtpKeys.map((k) => kv.get<number>(k)))
        : [];

    // key: one_tap_count:station:{stationSlug}:{status}:{date}
    const stationOneTapCounts = stationOtpKeys
      .map((k, i) => {
        const inner = k
          .replace("one_tap_count:station:", "")
          .replace(`:${date}`, "");
        // inner = "{stationSlug}:{status}"
        const colonIdx = inner.indexOf(":");
        return {
          stationSlug: inner.slice(0, colonIdx),
          status:      inner.slice(colonIdx + 1),
          count:       Number(stationOtpCounts[i] ?? 0),
        };
      })
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      date,
      totalEvents: fdoCount + csCount + otsCount,
      eventCounts: {
        facility_detail_open: fdoCount,
        category_select:      csCount,
        one_tap_status:       otsCount,
      },
      topStations,
      topFacilities,
      categoryCounts,
      oneTapStatusCounts: {
        vacant:             Number(vacant   ?? 0),
        crowded:            Number(crowded  ?? 0),
        charging_available: Number(charging ?? 0),
      },
      // 駅別詳細データ（将来の駅別分析 UI 用 — 現行 UI では未使用）
      stationCategoryCounts,
      stationOneTapCounts,
    });
  } catch (e) {
    console.error("[events/summary GET]", e);
    return NextResponse.json(fallback(date));
  }
}
