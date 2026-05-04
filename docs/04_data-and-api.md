# 04 データ定義・API 仕様

## 型定義（`types/index.ts`）

### Facility

```typescript
interface Facility {
  id: string;               // 例: "om-001", "omn-001", "aka-k-001"
  name: string;
  category: Category;       // 下記参照
  subCategory?: string;     // 例: "レストラン", "カフェ＆イートイン・バー"
  officialCategory?: string;// エキュート等の公式カテゴリ名（例: "弁当・惣菜"）
  floor: string;            // 例: "2F", "1F"
  hours: string;            // 例: "月〜土 8:00〜22:00／日・祝 8:00〜20:30"
  gateArea: GateArea;       // "改札内" | "改札外" | "調査中"
  description?: string;
  outlet?: OutletStatus;    // "available" | "none" | "unknown"
  seating?: SeatingStatus;  // "yes" | "no" | "unknown"
  crowded?: CrowdedStatus;  // "empty" | "normal" | "crowded" | "unknown"
  lastUpdated?: string;     // "YYYY-MM-DD"
  isTemporary?: boolean;    // true = 期間限定ショップ（一覧非表示）
  building?: string;        // 棟 ID（多棟駅のみ。未設定時は processStation が先頭棟を注入）
  nearestExit?: string;     // 改札 ID（exits[] の id と一致）
  areaInBuilding?: string;  // 例: "西エリア（南改札）"
  distanceFromExit?: number;// 改札からの距離（m）
  floorsToClimb?: number;   // 移動階数
}

type Category = "飲食店" | "ショップ" | "サービス" | "設備" | "その他" | "食材・お土産" | "雑貨・文具";
type GateArea = "改札内" | "改札外" | "調査中";
type OutletStatus = "available" | "none" | "unknown";
type SeatingStatus = "yes" | "no" | "unknown";
type CrowdedStatus = "empty" | "normal" | "crowded" | "unknown";
```

### Station

```typescript
interface Station {
  id: string;               // 例: "omiya"
  slug: string;             // URL slug（例: "omiya"）
  name: string;             // 表示名（例: "大宮駅"）
  nameEn: string;           // 英語名（例: "Omiya"）
  building?: string | null; // 施設名称（例: "エキュート大宮"）
  brand?: BrandId;          // "ecute" | "beans" | "gransta" | "equia" | "emio"
  brandColor?: string;      // ブランドカラー（HEX）
  lines: StationLine[];     // 後方互換用（operators が定義されていない駅で使用）
  operators?: Operator[];   // 事業者・路線情報（大型ターミナル駅）
  exits?: StationExit[];    // 改札口一覧
  buildings?: Building[];   // 複数棟定義（大宮・赤羽で使用）
  facilities: Facility[];   // 全施設（isTemporary 含む）
  externalLinks?: {
    limitedShops?: string;  // 期間限定ショップ公式ページ URL
  };
}
```

---

## 駅データファイル（`data/*.json`）

### ファイル一覧

| ファイル | 駅名 | visible | temp |
|---------|------|---------|------|
| omiya.json | 大宮駅 | 83 | 17 |
| akabane.json | 赤羽駅 | 60 | 2 |
| shinjuku.json | 新宿駅 | 41 | 0 |
| ikebukuro.json | 池袋駅 | 10 | 0 |
| musashi-urawa.json | 武蔵浦和駅 | 12 | 0 |
| toda-koen.json | 戸田公園駅 | 10 | 0 |
| toda.json | 戸田駅 | 7 | 0 |
| yono-honmachi.json | 与野本町駅 | 7 | 0 |
| minami-yono.json | 南与野駅 | 4 | 0 |
| kita-yono.json | 北与野駅 | 4 | 0 |
| naka-urawa.json | 中浦和駅 | 3 | 0 |
| kita-toda.json | 北戸田駅 | 3 | 0 |

### 施設 ID の命名規則

| パターン | 意味 | 例 |
|---------|------|-----|
| `{駅略}-{3桁番号}` | 単棟駅の施設 | `aka-k-001`（赤羽改札内）|
| `om-{3桁}` | 大宮南口（エキュート大宮）| `om-001` |
| `omn-{3桁}` | 大宮北口（エキュート大宮ノース）| `omn-001` |

### 多棟駅の building フィールド

`buildings` 配列が定義されている駅（大宮・赤羽）では、`building` フィールドで棟を指定する。  
`lib/stations.ts` の `processStation()` が `building` 未設定施設に先頭棟 ID を自動注入する。

```json
// 大宮の場合
"buildings": [
  { "id": "south", "name": "南口", "label": "エキュート大宮" },
  { "id": "north", "name": "北口", "label": "エキュート大宮ノース" }
]
// → building 未設定の施設は自動的に "south" になる
// → 北口施設は明示的に "building": "north" を指定
```

---

## ナビデータファイル

### `data/areas.json`

```json
[
  { "id": "kanto", "name": "関東", "status": "active", "operators": ["jr-east", ...] },
  { "id": "kansai", "status": "coming_soon", ... },
  { "id": "chubu",  "status": "coming_soon", ... }
]
```

### `data/operators.json`

```json
[
  { "id": "jr-east", "name": "JR東日本", "area": "kanto", "status": "active", "lines": ["saikyo"] },
  // 他事業者は status: "coming_soon", lines: []
]
```

### `data/lines.json`

```json
[
  {
    "id": "saikyo", "name": "埼京線", "operator": "jr-east", "status": "active",
    "stations": [
      { "slug": "omiya", "name": "大宮" },
      // ... 12 駅
    ]
  }
]
```

**現在 active な路線: 埼京線のみ**

---

## lib/stations.ts

```typescript
// 全駅データを返す（路線順）
getAllStations(): Station[]

// slug から駅データを返す
getStationBySlug(slug: string): Station | undefined
```

全 JSON を静的 import しているため、ビルド時に解決される。

---

## lib/navigation.ts

```typescript
// ナビ用
getAreas(): Area[]
getOperatorsByArea(areaId: string): NavOperator[]
getOperatorById(operatorId: string): NavOperator | undefined
getLinesByOperator(operatorId: string): NavLine[]
getStationsByLine(lineId: string): StationEntry[]

// 駅詳細ページの「戻る」リンク生成
getStationBackNav(slug: string): StationBackNav
// → { href: "/?area=kanto&operator=jr-east", label: "埼京線の駅一覧へ" }
```

---

## Vercel KV（Redis）設計

### キー一覧

| キー | 型 | 内容 |
|------|-----|------|
| `user:{userId}` | JSON | `{ checkins: string[], createdAt: string, lastSeen: string }` |
| `stats:facility:{facilityId}` | number | 施設チェックイン累計カウンター |
| `station_checkin:{userId}:{stationSlug}` | JSON | `{ checkedInAt: string, stationName: string }` |
| `stats:station:{stationSlug}` | number | 駅スタンプ累計カウンター |

### 利用方針

- `KV_REST_API_URL` が未設定のとき全 API がフォールバックを返す（ローカル開発で落ちない）
- KV は Vercel 本番・プレビュー環境でのみ動作する
- **キー設計は変更しない**（既存ユーザーデータが消える）
- `facilityId` はすべての駅 JSON の `id` フィールドと一致する

---

## API エンドポイント

### `GET /api/checkins?userId=xxx`

ユーザーの施設チェックイン一覧を返す。

```json
{ "checkins": ["om-001", "om-029", ...] }
```

### `POST /api/checkins`

```json
// body
{ "userId": "...", "facilityId": "om-001", "stationId": "omiya" }
// response
{ "ok": true }
```

### `DELETE /api/checkins`

```json
// body（facilityId 省略 = 全リセット）
{ "userId": "...", "facilityId": "om-001" }
```

### `GET /api/station-checkin?userId=xxx[&stationSlug=omiya]`

```json
// stationSlug あり
{ "checkedIn": true, "checkedInAt": "2026-04-20T..." }
// stationSlug なし（全駅）
{ "stations": ["omiya", "akabane"] }
```

### `POST /api/station-checkin`

```json
// body
{ "userId": "...", "stationSlug": "omiya", "stationName": "大宮駅" }
// response（新規）
{ "success": true, "checkedInAt": "..." }
// response（重複）
{ "success": false, "alreadyCheckedIn": true, "checkedInAt": "..." }
```

### `GET /api/stats`

```json
{
  "facilityStats": [{ "facilityId": "om-001", "count": 5 }],
  "stationStats": [{ "stationSlug": "omiya", "stationName": "大宮駅", "count": 12 }],
  "totalFacilityCheckins": 42,
  "totalStationCheckins": 15
}
```

---

## hooks/useCheckins.ts

施設チェックイン状態を管理する Client hook。  
localStorage（即時）と `/api/checkins`（KV 同期）の 2 層構成。

```typescript
const { checkedIds, toggle } = useCheckins(stationId);
// checkedIds: Set<string>  チェックイン済み施設 ID の集合
// toggle(facilityId): void  チェックイン/解除を切り替え
```

---

## lib/userId.ts

```typescript
getUserId(): string
// localStorage から UUID を取得。未存在の場合は生成・保存。
// SSR 側では使用不可（Client component 専用）。
```
