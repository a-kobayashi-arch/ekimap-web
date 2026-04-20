import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

/** GET /api/stats
 * 施設ごとのチェックイン集計を返す（上位100件）
 * 将来的に「人気の施設」表示に使用 */
export async function GET() {
  if (!KV_AVAILABLE) {
    return NextResponse.json({ stats: [], total: 0 });
  }

  try {
    // sorted set "stats:top" からスコア降順で上位100件取得
    const results = await kv.zrange("stats:top", 0, 99, {
      rev: true,
      withScores: true,
    });

    // zrange withScores は [member, score, member, score, ...] の平坦配列を返す
    const stats: { facilityId: string; count: number }[] = [];
    for (let i = 0; i < results.length; i += 2) {
      stats.push({
        facilityId: results[i] as string,
        count: Number(results[i + 1]),
      });
    }

    return NextResponse.json({ stats, total: stats.length });
  } catch (e) {
    console.error("[stats GET]", e);
    return NextResponse.json({ stats: [], total: 0 });
  }
}
