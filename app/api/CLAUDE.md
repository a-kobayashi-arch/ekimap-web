# app/api/ — API Route 実装の注意点

## エンドポイント一覧

| パス | 用途 |
|------|------|
| `/api/checkins` | 施設チェックイン（GET / POST / DELETE）|
| `/api/station-checkin` | 駅スタンプ（GET / POST）|
| `/api/stats` | 全施設・全駅の集計（GET）|

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
