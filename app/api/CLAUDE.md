# app/api/ — API Route 実装の注意点

## エンドポイント一覧

| パス | 用途 | 状態 |
|------|------|------|
| `/api/checkins` | 施設チェックイン（GET / POST / DELETE）| ✅ 実装済み |
| `/api/station-checkin` | 駅スタンプ（GET / POST）| ✅ 実装済み |
| `/api/stats` | 全施設・全駅の集計（GET）| ✅ 実装済み |
| `/api/events` | 行動ログ記録（POST）| 🔴 未実装・応募前に追加 |
| `/api/events/summary` | 行動ログ集計（GET）| 🔴 未実装・応募前に追加 |

## /api/events の設計方針（未実装）

既存 API・KV キーを**一切変更しない**。新規 KV キーとして追加する。

```
event:{eventId}          → EventLog（探索・目的選択・確認タップ等）
events:summary:{date}    → 日次集計
```

- `POST /api/events`: `{ userId, action, facilityId?, stationSlug?, purpose? }` を KV に書く
- `GET /api/events/summary`: JR 管理画面向け集計を返す
- 既存の `/api/checkins`・`/api/stats` は変更しない

## KV 利用の必須パターン

```typescript
const KV_AVAILABLE = !!process.env.KV_REST_API_URL;
if (!KV_AVAILABLE) return NextResponse.json({ /* フォールバック */ });
```

**ローカル開発では KV が使えない。フォールバックを必ず実装すること。**

## KV キー設計（変更禁止）

```
user:{userId}                    → UserData（施設チェックイン配列）
stats:facility:{facilityId}      → number（施設別カウンター）
station_checkin:{userId}:{slug}  → StationCheckinData
stats:station:{slug}             → number（駅別カウンター）
```

**キーを追加する場合も上記の命名規則に従う。既存キーは変更・削除しない。**

## 重複チェックインの扱い

- 施設チェックイン: 同 `userId` × 同 `facilityId` は 2 回目以降カウントしない
- 駅スタンプ: 同 `userId` × 同 `stationSlug` は `alreadyCheckedIn: true` を返す

## facilityId と stationId の関係

- `facilityId` は各駅 JSON の `facility.id`（例: `"om-001"`, `"aka-k-009"`）
- KV の `stats:facility:{facilityId}` は **isTemporary 施設も含む**  
  （過去に投稿されたデータとの整合性のため除外しない）

## TODO（未実装）

`station-checkin/route.ts:64` に GPS 判定の TODO あり。  
応募前の実装は不要。JR 提携後フェーズで対応。
