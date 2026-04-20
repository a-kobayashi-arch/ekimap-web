import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

const KV_AVAILABLE = !!process.env.KV_REST_API_URL;

/** GET /api/stats
 * 施設ごとのチェックイン集計を返す
 * キー形式: stats:facility:{facilityId} → 数値（kv.incr で管理）
 * 将来的に「人気の施設」表示に使用 */
export async function GET() {
  if (!KV_AVAILABLE) {
    return NextResponse.json({ stats: [], total: 0 });
  }

  try {
    // stats:facility:* の全キーを取得
    const keys = await kv.keys("stats:facility:*");

    if (keys.length === 0) {
      return NextResponse.json({ stats: [], total: 0 });
    }

    // 各キーのカウント値を並列取得
    const counts = await Promise.all(
      keys.map((key) => kv.get<number>(key))
    );

    const stats: { facilityId: string; count: number }[] = keys.map((key, i) => ({
      facilityId: key.replace("stats:facility:", ""),
      count: Number(counts[i] ?? 0),
    }));

    // カウント降順でソート
    stats.sort((a, b) => b.count - a.count);

    const total = stats.reduce((sum, s) => sum + s.count, 0);

    return NextResponse.json({ stats, total });
  } catch (e) {
    console.error("[stats GET]", e);
    return NextResponse.json({ stats: [], total: 0 });
  }
}
