import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

/** 現在日付を JST（UTC+9）で YYYY-MM-DD 形式で返す */
function getDateJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * 指定日から n 日分（当日含む、過去方向）の YYYY-MM-DD 配列を返す
 * 例: getDatesRange("2026-05-07", 3) → ["2026-05-05","2026-05-06","2026-05-07"]
 */
function getDatesRange(today: string, n: number): string[] {
  const dates: string[] = [];
  const base = new Date(`${today}T00:00:00Z`);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 24 * 60 * 60 * 1000);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** range 文字列から日付配列を解決する（today / 7d / 30d それ以外は today 扱い） */
function resolveDates(range: string, today: string): string[] {
  if (range === "7d")  return getDatesRange(today, 7);
  if (range === "30d") return getDatesRange(today, 30);
  return [today]; // "today" or invalid
}

/**
 * YYYYMMDD または YYYY-MM-DD を YYYY-MM-DD に正規化する。
 * 不正値の場合は null を返す。
 */
function normalizeDateParam(s: string): string | null {
  // YYYYMMDD（8桁数字）
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }
  return null;
}

/**
 * 開始日〜終了日の YYYY-MM-DD 配列を生成する。
 * start > end の場合は swap する。最大 31 日に丸める。
 */
function getDatesFromRange(start: string, end: string): string[] {
  const MAX_DAYS = 31;
  let s = new Date(`${start}T00:00:00Z`);
  let e = new Date(`${end}T00:00:00Z`);
  // start > end なら swap
  if (s > e) { const tmp = s; s = e; e = tmp; }
  // 最大 31 日に丸める（end を start+30日 までに制限）
  const maxEnd = new Date(s.getTime() + (MAX_DAYS - 1) * 24 * 60 * 60 * 1000);
  if (e > maxEnd) e = maxEnd;

  const dates: string[] = [];
  for (let d = new Date(s); d <= e; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function fallback(date: string, range: string, startDate: string, endDate: string) {
  return {
    date,
    range,
    startDate,
    endDate,
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
    stationCategoryCounts: [] as { stationSlug: string; category: string; count: number }[],
    stationOneTapCounts: [] as { stationSlug: string; status: string; count: number }[],
  };
}

/** 数値配列の合計 */
function sumValues(vals: (number | null)[]): number {
  return vals.reduce<number>((s, v) => s + Number(v ?? 0), 0);
}

/**
 * GET /api/events/summary
 *   [?date=YYYY-MM-DD]
 *   [?start=YYYYMMDD&end=YYYYMMDD]
 *   [?start=YYYY-MM-DD&end=YYYY-MM-DD]
 *   [?range=today|7d|30d]
 *
 * 優先順位:
 *   1. ?date=YYYY-MM-DD
 *   2. ?start=...&end=... （両方必須、YYYYMMDD / YYYY-MM-DD 両形式対応）
 *   3. ?range=today|7d|30d
 *   4. 省略 → today
 *
 * 読み取るKVキー：
 *   event_count:{eventName}:{date}
 *   event_count:station:{stationSlug}:{eventName}:{date}
 *   event_count:facility:{facilityId}:{eventName}:{date}
 *   category_count:{category}:{date}
 *   category_count:station:{stationSlug}:{category}:{date}
 *   one_tap_count:{status}:{date}
 *   one_tap_count:station:{stationSlug}:{status}:{date}
 */
export async function GET(req: NextRequest) {
  const dateParam  = req.nextUrl.searchParams.get("date");
  const startParam = req.nextUrl.searchParams.get("start");
  const endParam   = req.nextUrl.searchParams.get("end");
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "today";
  const today      = getDateJST();

  // ── パラメータ解決（優先順位: date > start/end > range > today） ──
  let dates: string[];
  let range: string;

  if (dateParam) {
    // 1. ?date= 最優先
    const normalized = normalizeDateParam(dateParam) ?? today;
    dates = [normalized];
    range = "date";
  } else if (startParam && endParam) {
    // 2. ?start=&end= カスタム期間
    const s = normalizeDateParam(startParam) ?? today;
    const e = normalizeDateParam(endParam)   ?? today;
    dates = getDatesFromRange(s, e);
    range = "custom";
  } else {
    // 3. ?range= / 4. 省略
    const validRanges = ["today", "7d", "30d"];
    range = validRanges.includes(rangeParam) ? rangeParam : "today";
    dates = resolveDates(range, today);
  }

  const startDate = dates[0];
  const endDate   = dates[dates.length - 1];
  // date フィールドは後方互換のため endDate（単一日付なら指定日、複数なら最終日）
  const date      = endDate;

  if (!KV_AVAILABLE) return NextResponse.json(fallback(date, range, startDate, endDate));

  try {
    // ── 1. イベント種別ごとの総カウンター（全日付合算） ──
    const [fdoRaws, csRaws, otsRaws] = await Promise.all([
      Promise.all(dates.map((d) => kv.get<number>(`event_count:facility_detail_open:${d}`))),
      Promise.all(dates.map((d) => kv.get<number>(`event_count:category_select:${d}`))),
      Promise.all(dates.map((d) => kv.get<number>(`event_count:one_tap_status:${d}`))),
    ]);
    const fdoCount = sumValues(fdoRaws);
    const csCount  = sumValues(csRaws);
    const otsCount = sumValues(otsRaws);

    // ── 2. 駅別集計（期間内の全日付キーを取得してslugを収集） ──
    // ワイルドカードで全件取得し、対象日付でフィルタする
    const [allStFdoKeys, allStCsKeys, allStOtsKeys] = await Promise.all([
      kv.keys("event_count:station:*:facility_detail_open:*"),
      kv.keys("event_count:station:*:category_select:*"),
      kv.keys("event_count:station:*:one_tap_status:*"),
    ]);

    const dateSet = new Set(dates);

    // キーの末尾 :{date} が対象期間内かチェックしてslugを抽出
    function extractSlugFromKey(key: string, eventName: string): string | null {
      // key = "event_count:station:{slug}:{eventName}:{date}"
      const suffix = `:${eventName}:`;
      const suffixIdx = key.lastIndexOf(suffix);
      if (suffixIdx === -1) return null;
      const dateInKey = key.slice(suffixIdx + suffix.length);
      if (!dateSet.has(dateInKey)) return null;
      return key.slice("event_count:station:".length, suffixIdx);
    }

    const slugSet = new Set<string>();
    for (const k of allStFdoKeys) { const s = extractSlugFromKey(k, "facility_detail_open"); if (s) slugSet.add(s); }
    for (const k of allStCsKeys)  { const s = extractSlugFromKey(k, "category_select");      if (s) slugSet.add(s); }
    for (const k of allStOtsKeys) { const s = extractSlugFromKey(k, "one_tap_status");        if (s) slugSet.add(s); }

    const topStations = (
      await Promise.all(
        [...slugSet].map(async (slug) => {
          const [aVals, bVals, cVals] = await Promise.all([
            Promise.all(dates.map((d) => kv.get<number>(`event_count:station:${slug}:facility_detail_open:${d}`))),
            Promise.all(dates.map((d) => kv.get<number>(`event_count:station:${slug}:category_select:${d}`))),
            Promise.all(dates.map((d) => kv.get<number>(`event_count:station:${slug}:one_tap_status:${d}`))),
          ]);
          return {
            stationSlug:        slug,
            facilityDetailOpen: sumValues(aVals),
            categorySelect:     sumValues(bVals),
            oneTapStatus:       sumValues(cVals),
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

    // ── 3. 施設別閲覧ランキング（全件取得→対象日付フィルタ→合算） ──
    const allFacFdoKeys = await kv.keys("event_count:facility:*:facility_detail_open:*");
    const facFdoKeys = allFacFdoKeys.filter((k) => {
      const parts = k.split(":");
      return dateSet.has(parts[parts.length - 1]);
    });

    // facilityId → count の合算マップ
    const facMap: Record<string, number> = {};
    if (facFdoKeys.length > 0) {
      const counts = await Promise.all(facFdoKeys.map((k) => kv.get<number>(k)));
      for (let i = 0; i < facFdoKeys.length; i++) {
        const k = facFdoKeys[i];
        // key = "event_count:facility:{facilityId}:facility_detail_open:{date}"
        const inner = k
          .replace("event_count:facility:", "")
          .replace(/:facility_detail_open:[^:]+$/, "");
        facMap[inner] = (facMap[inner] ?? 0) + Number(counts[i] ?? 0);
      }
    }
    const topFacilities = Object.entries(facMap)
      .map(([facilityId, facilityDetailOpen]) => ({ facilityId, facilityDetailOpen }))
      .sort((a, b) => b.facilityDetailOpen - a.facilityDetailOpen)
      .slice(0, 5);

    // ── 4. カテゴリ別集計（全体：station:* プレフィックスを除外） ──
    const allCatAllKeys = await kv.keys("category_count:*");
    const globalCatKeys = allCatAllKeys.filter(
      (k) =>
        !k.startsWith("category_count:station:") &&
        dateSet.has(k.split(":").pop() ?? "")
    );
    const catMap: Record<string, number> = {};
    if (globalCatKeys.length > 0) {
      const counts = await Promise.all(globalCatKeys.map((k) => kv.get<number>(k)));
      for (let i = 0; i < globalCatKeys.length; i++) {
        const k = globalCatKeys[i];
        // key = "category_count:{category}:{date}"
        const category = k.replace("category_count:", "").replace(/:[^:]+$/, "");
        catMap[category] = (catMap[category] ?? 0) + Number(counts[i] ?? 0);
      }
    }
    const categoryCounts = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // ── 5. ワンタップ状態別集計（全体・全日付合算） ──
    const [vacantVals, crowdedVals, chargingVals] = await Promise.all([
      Promise.all(dates.map((d) => kv.get<number>(`one_tap_count:vacant:${d}`))),
      Promise.all(dates.map((d) => kv.get<number>(`one_tap_count:crowded:${d}`))),
      Promise.all(dates.map((d) => kv.get<number>(`one_tap_count:charging_available:${d}`))),
    ]);

    // ── 6. 駅別カテゴリ集計 ──
    const allStationCatKeys = await kv.keys("category_count:station:*");
    const stationCatKeys = allStationCatKeys.filter((k) =>
      dateSet.has(k.split(":").pop() ?? "")
    );
    const stCatMap: Record<string, Record<string, number>> = {};
    if (stationCatKeys.length > 0) {
      const counts = await Promise.all(stationCatKeys.map((k) => kv.get<number>(k)));
      for (let i = 0; i < stationCatKeys.length; i++) {
        const k = stationCatKeys[i];
        // key = "category_count:station:{stationSlug}:{category}:{date}"
        const inner = k.replace("category_count:station:", "").replace(/:[^:]+$/, "");
        const colonIdx = inner.indexOf(":");
        const slug     = inner.slice(0, colonIdx);
        const category = inner.slice(colonIdx + 1);
        if (!stCatMap[slug]) stCatMap[slug] = {};
        stCatMap[slug][category] = (stCatMap[slug][category] ?? 0) + Number(counts[i] ?? 0);
      }
    }
    const stationCategoryCounts = Object.entries(stCatMap)
      .flatMap(([stationSlug, cats]) =>
        Object.entries(cats).map(([category, count]) => ({ stationSlug, category, count }))
      )
      .sort((a, b) => b.count - a.count);

    // ── 7. 駅別ワンタップ集計 ──
    const allStationOtpKeys = await kv.keys("one_tap_count:station:*");
    const stationOtpKeys = allStationOtpKeys.filter((k) =>
      dateSet.has(k.split(":").pop() ?? "")
    );
    const stOtpMap: Record<string, Record<string, number>> = {};
    if (stationOtpKeys.length > 0) {
      const counts = await Promise.all(stationOtpKeys.map((k) => kv.get<number>(k)));
      for (let i = 0; i < stationOtpKeys.length; i++) {
        const k = stationOtpKeys[i];
        // key = "one_tap_count:station:{stationSlug}:{status}:{date}"
        const inner = k.replace("one_tap_count:station:", "").replace(/:[^:]+$/, "");
        const colonIdx = inner.indexOf(":");
        const slug   = inner.slice(0, colonIdx);
        const status = inner.slice(colonIdx + 1);
        if (!stOtpMap[slug]) stOtpMap[slug] = {};
        stOtpMap[slug][status] = (stOtpMap[slug][status] ?? 0) + Number(counts[i] ?? 0);
      }
    }
    const stationOneTapCounts = Object.entries(stOtpMap)
      .flatMap(([stationSlug, statuses]) =>
        Object.entries(statuses).map(([status, count]) => ({ stationSlug, status, count }))
      )
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      date,
      range,
      startDate,
      endDate,
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
        vacant:             sumValues(vacantVals),
        crowded:            sumValues(crowdedVals),
        charging_available: sumValues(chargingVals),
      },
      stationCategoryCounts,
      stationOneTapCounts,
    });
  } catch (e) {
    console.error("[events/summary GET]", e);
    return NextResponse.json(fallback(date, range, startDate, endDate));
  }
}
