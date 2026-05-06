import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

type EventName = "facility_detail_open" | "category_select" | "one_tap_status";
type OneTapStatus = "vacant" | "crowded" | "charging_available";

interface EventPayload {
  eventName: EventName;
  stationSlug?: string;
  facilityId?: string;
  category?: string;
  building?: string;
  gateArea?: string;
  status?: OneTapStatus;
  userId?: string;
  timestamp?: string;
}

const VALID_EVENTS: EventName[] = [
  "facility_detail_open",
  "category_select",
  "one_tap_status",
];

/** 現在日付を JST（UTC+9）で YYYY-MM-DD 形式で返す */
function getDateJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * POST /api/events
 * body: { eventName, stationSlug?, facilityId?, category?, status?, userId?, ... }
 *
 * KV書き込みキー（既存キーとは衝突しない新規名前空間）:
 *   event_count:{eventName}:{date}
 *   event_count:station:{stationSlug}:{eventName}:{date}
 *   event_count:facility:{facilityId}:{eventName}:{date}
 *   category_count:{category}:{date}
 *   category_count:station:{stationSlug}:{category}:{date}   ← 駅別目的ニーズ
 *   one_tap_count:{status}:{date}
 *   one_tap_count:station:{stationSlug}:{status}:{date}      ← 駅別鮮度確認
 *   one_tap_count:facility:{facilityId}:{status}:{date}      ← 施設別鮮度確認
 */
export async function POST(req: NextRequest) {
  // KV 未接続環境ではログを捨てて 200 を返す（フォールバック）
  if (!KV_AVAILABLE) return NextResponse.json({ ok: true });

  let body: EventPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { eventName, stationSlug, facilityId, category, status } = body;

  if (!eventName || !VALID_EVENTS.includes(eventName)) {
    return NextResponse.json({ error: "invalid eventName" }, { status: 400 });
  }

  const date = getDateJST();

  try {
    const ops: Promise<unknown>[] = [];

    // ── 1. イベント種別ごとの総カウンター ──
    ops.push(kv.incr(`event_count:${eventName}:${date}`));

    // ── 2. 駅別カウンター ──
    if (stationSlug) {
      ops.push(kv.incr(`event_count:station:${stationSlug}:${eventName}:${date}`));
    }

    // ── 3. 施設別カウンター（facility_detail_open / one_tap_status） ──
    if (facilityId && (eventName === "facility_detail_open" || eventName === "one_tap_status")) {
      ops.push(kv.incr(`event_count:facility:${facilityId}:${eventName}:${date}`));
    }

    // ── 4. カテゴリ別カウンター（category_select） ──
    if (eventName === "category_select" && category) {
      // 全体集計
      ops.push(kv.incr(`category_count:${category}:${date}`));
      // 駅別集計（駅ごとの目的ニーズ分析用）
      if (stationSlug) {
        ops.push(kv.incr(`category_count:station:${stationSlug}:${category}:${date}`));
      }
    }

    // ── 5. ワンタップ状態別カウンター（one_tap_status） ──
    if (eventName === "one_tap_status" && status) {
      // 全体集計
      ops.push(kv.incr(`one_tap_count:${status}:${date}`));
      // 駅別集計（駅別鮮度確認分析用）
      if (stationSlug) {
        ops.push(kv.incr(`one_tap_count:station:${stationSlug}:${status}:${date}`));
      }
      // 施設別集計（施設別鮮度確認分析用）
      if (facilityId) {
        ops.push(kv.incr(`one_tap_count:facility:${facilityId}:${status}:${date}`));
      }
    }

    await Promise.all(ops);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[events POST]", e);
    return NextResponse.json({ error: "kv error" }, { status: 500 });
  }
}
