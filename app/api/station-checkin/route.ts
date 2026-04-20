import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

interface StationCheckinData {
  checkedInAt: string;
  stationName: string;
}

/**
 * GET /api/station-checkin?userId=xxx
 *   → { stations: ["omiya", "akabane", ...] }  ユーザーの全駅チェックイン一覧
 *
 * GET /api/station-checkin?userId=xxx&stationSlug=omiya
 *   → { checkedIn: true,  checkedInAt: "2026-04-20T..." }
 *   → { checkedIn: false }
 */
export async function GET(req: NextRequest) {
  if (!KV_AVAILABLE) {
    return NextResponse.json({ stations: [], checkedIn: false });
  }

  const userId      = req.nextUrl.searchParams.get("userId");
  const stationSlug = req.nextUrl.searchParams.get("stationSlug");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // 特定駅のみ確認
    if (stationSlug) {
      const data = await kv.get<StationCheckinData>(
        `station_checkin:${userId}:${stationSlug}`
      );
      if (data) {
        return NextResponse.json({ checkedIn: true, checkedInAt: data.checkedInAt });
      }
      return NextResponse.json({ checkedIn: false });
    }

    // 全駅チェックイン一覧
    const keys = await kv.keys(`station_checkin:${userId}:*`);
    const prefix = `station_checkin:${userId}:`;
    const stations = keys.map((k) => k.replace(prefix, ""));
    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json({ stations: [], checkedIn: false });
  }
}

/**
 * POST /api/station-checkin
 * body: { userId, stationSlug, stationName }
 *
 * 処理：
 *  1. 重複チェックイン防止（同ユーザー×同駅は1回のみ）
 *  2. KVに station_checkin:{userId}:{stationSlug} を保存
 *  3. 集計カウンター stats:station:{stationSlug} をインクリメント
 *
 * TODO: GPS判定実装予定
 *   駅の緯度経度から半径500m以内にいる場合のみチェックイン可能にする
 *   JR提携後はビーコンによる精度向上を予定
 */
export async function POST(req: NextRequest) {
  if (!KV_AVAILABLE) {
    return NextResponse.json({ success: true, checkedInAt: new Date().toISOString() });
  }

  let body: { userId?: string; stationSlug?: string; stationName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { userId, stationSlug, stationName } = body;
  if (!userId || !stationSlug) {
    return NextResponse.json(
      { error: "userId and stationSlug required" },
      { status: 400 }
    );
  }

  try {
    const key = `station_checkin:${userId}:${stationSlug}`;
    const existing = await kv.get<StationCheckinData>(key);

    // 重複チェックイン
    if (existing) {
      return NextResponse.json({
        success: false,
        alreadyCheckedIn: true,
        checkedInAt: existing.checkedInAt,
      });
    }

    const checkedInAt = new Date().toISOString();
    await kv.set(key, {
      checkedInAt,
      stationName: stationName ?? stationSlug,
    } satisfies StationCheckinData);

    // 集計カウンターのインクリメント
    await kv.incr(`stats:station:${stationSlug}`);

    return NextResponse.json({ success: true, checkedInAt });
  } catch (e) {
    console.error("[station-checkin POST]", e);
    return NextResponse.json({ error: "kv error" }, { status: 500 });
  }
}
