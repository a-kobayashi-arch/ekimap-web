import { kv } from "@vercel/kv";
import { NextRequest, NextResponse } from "next/server";

/** KV が利用可能か（環境変数で判定） */
const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

interface UserData {
  checkins: string[];   // チェックイン済み施設IDの配列（全駅横断）
  createdAt: string;    // 初回記録日時
  lastSeen: string;     // 最終操作日時
}

/** GET /api/checkins?userId=xxx
 * ユーザーのチェックイン一覧を返す */
export async function GET(req: NextRequest) {
  if (!KV_AVAILABLE) return NextResponse.json({ checkins: [] });

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    const userData = await kv.get<UserData>(`user:${userId}`);
    return NextResponse.json({ checkins: userData?.checkins ?? [] });
  } catch {
    return NextResponse.json({ checkins: [] });
  }
}

/** POST /api/checkins
 * body: { userId, facilityId, stationId }
 * チェックインを保存し集計カウンターをインクリメント */
export async function POST(req: NextRequest) {
  if (!KV_AVAILABLE) return NextResponse.json({ ok: true });

  let body: { userId?: string; facilityId?: string; stationId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { userId, facilityId } = body;
  if (!userId || !facilityId) {
    return NextResponse.json({ error: "userId and facilityId required" }, { status: 400 });
  }

  try {
    const userData = await kv.get<UserData>(`user:${userId}`);
    const checkins = userData?.checkins ?? [];

    if (!checkins.includes(facilityId)) {
      checkins.push(facilityId);
      const now = new Date().toISOString();
      await kv.set(`user:${userId}`, {
        checkins,
        createdAt: userData?.createdAt ?? now,
        lastSeen: now,
      } satisfies UserData);
      // 施設ごとのチェックイン数（sorted set でランキングにも利用）
      await kv.zadd("stats:top", { incr: true }, { score: 1, member: facilityId });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[checkins POST]", e);
    return NextResponse.json({ error: "kv error" }, { status: 500 });
  }
}

/** DELETE /api/checkins
 * body: { userId, facilityId? }
 * facilityId を省略すると全チェックインを削除（リセット） */
export async function DELETE(req: NextRequest) {
  if (!KV_AVAILABLE) return NextResponse.json({ ok: true });

  let body: { userId?: string; facilityId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const { userId, facilityId } = body;
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    // facilityId なし → 全チェックインをリセット
    if (!facilityId) {
      const userData = await kv.get<UserData>(`user:${userId}`);
      if (userData?.checkins?.length) {
        // 各施設のカウンターを一括デクリメント
        for (const fid of userData.checkins) {
          await kv.zincrby("stats:top", -1, fid);
        }
      }
      await kv.del(`user:${userId}`);
      return NextResponse.json({ ok: true });
    }

    // facilityId あり → 指定のチェックインだけ削除
    const userData = await kv.get<UserData>(`user:${userId}`);
    if (!userData) return NextResponse.json({ ok: true });

    const checkins = userData.checkins.filter((id) => id !== facilityId);
    await kv.set(`user:${userId}`, {
      ...userData,
      checkins,
      lastSeen: new Date().toISOString(),
    } satisfies UserData);

    await kv.zincrby("stats:top", -1, facilityId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[checkins DELETE]", e);
    return NextResponse.json({ error: "kv error" }, { status: 500 });
  }
}
