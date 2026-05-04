# CLAUDE.md — ekimap-web プロジェクト引き継ぎ文書

> 新しい Claude Code セッションはまずこのファイルを読むこと。
> プロジェクト方針・禁止事項・優先順位はここに集約されている。

---

## プロジェクト概要

**駅ナカマップ（ekimap-web）**

駅構内施設を検索・記録できる Web アプリ。  
一般ユーザー向けの施設探し・スタンプラリーと、**JR東日本スタートアップ応募用の PoC 説明ページ**の2本立て構成。

- 本番 URL: https://ekimap-web.vercel.app
- GitHub: https://github.com/a-kobayashi-arch/ekimap-web.git
- デプロイ: `git push origin main` → Vercel 自動デプロイ（タグも必ず push する）

---

## 現在の最重要目的

**JR東日本スタートアップへの応募 PoC として完成度を高めること。**

- `/jr` LP と `/jr/demo` デモページが応募資料に直結する
- 既存の一般向けページ・機能は壊さない
- 大規模リファクタリングや全面刷新は行わない

---

## 応募前の優先タスク（未完了）

| 優先 | タスク | 背景 |
|------|--------|------|
| 🔴 高 | **赤羽駅の `seating` / `outlet` フィールド整備** | 飲食店 14 件に `seating` が未設定。JRデモの「座る」「充電」タブで機能しない |
| 🔴 高 | **新宿駅の `seating` / `outlet` フィールド整備** | 41 件中 `outlet` は 1 件のみ。飲食店 9 件の `seating` が部分設定 |
| 🟡 中 | **大宮・赤羽・新宿で `outlet: "available"` 施設を現地確認後に追加** | 現在 available = 0 件。充電タブが全駅で空表示になっている |
| 🟢 低 | **GPS 駅チェックインの精度向上**（TODO コメントあり） | `api/station-checkin/route.ts:64` に TODO あり。応募前必須ではない |

### outlet / seating 整備ルール（大宮で確立済み、他駅にも適用する）

```
seating:
  "yes"   = 座席あり（カフェ・レストラン・イートイン）
  "no"    = 座席なし（物販・テイクアウト専門）
  "unknown" = 未確認

outlet:
  "available" = 現地確認済みの客用コンセントあり（座席があり、かつ確認済みのもののみ）
  "none"      = 物販・テイクアウト・座席なし施設（コンセント利用導線がない）
  "unknown"   = 座席ありカフェ・レストランで客用コンセントが未確認

絶対に available にしてはいけないもの:
  - コンビニ・キオスク（NewDays 等）
  - 物販・テイクアウト専門店
  - seating: "no" の施設
  - 公式情報なしに「たぶんある」と判断した施設
```

---

## 既存機能一覧

| 機能 | 場所 | 状態 |
|------|------|------|
| 3 階層ナビ（エリア→事業者→路線→駅） | `app/page.tsx` | ✅ |
| 駅詳細・施設一覧（カテゴリ/改札/棟タブ） | `app/station/[slug]/page.tsx` + `FacilityTabs` | ✅ |
| 施設フィルタ（コンセント/座席） | `FacilityTabs.tsx` | ✅ |
| 施設チェックイン「行った/気になる」 | `FacilityCard.tsx` + `/api/checkins` | ✅ |
| 駅スタンプ（駅チェックイン） | `StationCheckinButton.tsx` + `/api/station-checkin` | ✅ |
| スタンプ帳 | `app/stamps/page.tsx` | ✅ |
| 情報報告モーダル（outlet/seating/crowded 3 値） | `ReportModal.tsx` | ✅ |
| 乗り換え時間計算 | `lib/transferTimeCalculator.ts` | ✅ |
| 戻るリンク（路線逆引き） | `lib/navigation.ts:getStationBackNav()` | ✅ |
| JR LP | `app/jr/page.tsx` | ✅ |
| JR デモ（目的別導線・stats） | `app/jr/demo/page.tsx` | ✅ |
| 全文検索バー | `SearchBar.tsx` | ✅ |

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 15.5.x（App Router）|
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS v4 |
| DB / KV | Vercel KV（`@vercel/kv` v3） |
| デプロイ | Vercel（GitHub push で自動） |
| レンダリング | SSG（駅詳細）/ SSR（JR ページ）/ client（stamps） |

---

## データ定義

### 駅 JSON（`data/*.json`）

各駅ファイルは `Station` 型（`types/index.ts`）に準拠。  
`lib/stations.ts` で全駅を import し `getAllStations()` / `getStationBySlug(slug)` で提供。

**多棟駅（大宮・赤羽）の注意点:**  
`buildings` 配列がある場合、`building` フィールド未設定の施設には `processStation()` が先頭棟の id をデフォルト注入する。  
JSON 側に `building` を書くのは 2 棟目以降のみでよい。

### Facility フィールド一覧

```typescript
interface Facility {
  id: string;               // 例: "om-001", "omn-001", "aka-k-001"
  name: string;
  category: Category;       // "飲食店"|"食材・お土産"|"雑貨・文具"|"ショップ"|"サービス"|"設備"|"その他"
  subCategory?: string;     // 例: "レストラン", "カフェ＆イートイン・バー"
  officialCategory?: string;// エキュート等の公式カテゴリ名
  floor: string;
  hours: string;
  gateArea: GateArea;       // "改札内"|"改札外"|"調査中"
  description?: string;
  outlet?: OutletStatus;    // "available"|"none"|"unknown"
  seating?: SeatingStatus;  // "yes"|"no"|"unknown"
  crowded?: CrowdedStatus;  // "empty"|"normal"|"crowded"|"unknown"
  lastUpdated?: string;     // "YYYY-MM-DD"
  isTemporary?: boolean;    // true = 期間限定ショップ（一覧に表示しない）
  building?: string;        // 棟ID（多棟駅のみ）
  nearestExit?: string;     // 改札ID
  areaInBuilding?: string;
  distanceFromExit?: number;
  floorsToClimb?: number;
}
```

### カテゴリと outlet/seating の対応方針

| カテゴリ | outlet | seating |
|----------|--------|---------|
| 飲食店（レストラン・カフェ）| unknown（確認済みのみ available）| yes |
| 食材・お土産 | none | no |
| 雑貨・文具 | none | no |
| ショップ（物販） | none | no |
| サービス | none（または unknown）| 施設による |
| 設備 | フィールド不要 | フィールド不要 |
| 期間限定ショップ（isTemporary: true）| none | no |

### isTemporary パターン

```typescript
// 可視施設（通常表示）
const visible = station.facilities.filter(f => !f.isTemporary);

// NG: 全件を使う（期間限定が混入する）
const wrong = station.facilities;
```

`isTemporary: true` の施設は以下から**必ず除外**すること:
- 施設件数の表示
- FacilityTabs への渡し方（`visibleFacilities`）
- stats カウント（jr/page.tsx の totalFacilities 等）

例外: `facilityToStation` 逆引きマップは KV データとの整合性のため isTemporary も含む。

### ナビデータ

```
data/areas.json      → エリア一覧（関東・関西・中部）
data/operators.json  → 事業者一覧（jr-east など）
data/lines.json      → 路線一覧（埼京線 12 駅分のみ active）
```

現在 active な路線: **埼京線のみ**（大宮〜新宿 12 駅）

---

## API / KV 利用方針

### KV キー設計

```
user:{userId}                    → UserData（施設チェックイン配列）
stats:facility:{facilityId}      → number（施設チェックインカウンター）
station_checkin:{userId}:{slug}  → StationCheckinData（日時・駅名）
stats:station:{slug}             → number（駅スタンプカウンター）
```

### KV 利用の注意点

- `KV_REST_API_URL` が未設定の場合、全エンドポイントがフォールバックを返す（ローカル開発で落ちない）
- KV は Vercel 本番・プレビュー環境でのみ動作する
- 新しい KV キーを追加する場合は上記の命名規則に従う

### userId 管理

`lib/userId.ts` の `getUserId()` で localStorage から UUID を取得・生成。  
SSR 側では使えない（client component 専用）。

---

## 触ってよい領域

- `data/*.json` — 施設データの追加・修正
- `app/jr/page.tsx` と `app/jr/demo/page.tsx` — JR 向けページの改善
- `components/` — UI コンポーネントの改善
- `types/index.ts` — 型の追加（既存型の破壊的変更は要注意）

---

## 触ってはいけない領域・禁止事項

1. **既存の一般向けページ（`/`, `/station/*`, `/stamps`）を大きく変更しない**
2. **KV キー設計を変更しない**（既存ユーザーのデータが消える）
3. **`lib/stations.ts` のステーション並び順を変えない**（路線順・SSG パラメータに影響）
4. **`generateStaticParams` を壊さない**（ビルドが落ちる）
5. **`isTemporary` を可視施設カウント・一覧に混入させない**
6. **outlet: "available" を未確認施設に設定しない**（コンビニ・物販・座席なし施設は必ず none）
7. **`data/operators.json` の `lines` 配列を変更しない**（ナビ表示に直結）
8. **大規模リファクタリング・ディレクトリ再編は行わない**

---

## 開発手順

### 施設データを追加・修正する場合

1. 対象の `data/{slug}.json` を編集
2. `isTemporary` の有無を確認し、可視件数が正しいか確認
3. `outlet` / `seating` は上記の対応方針に従う
4. `npx tsc --noEmit` でエラーなし確認
5. `npx next build` でビルド確認

### コンポーネントや機能を変更する場合

1. 変更前に関連ファイルを Read して全体を把握する
2. 最小限の変更にとどめる
3. 以下を順番に実行:
   ```
   npx tsc --noEmit
   npx next lint
   npx next build
   ```
4. すべてクリアしたらコミット

### コミット・タグ・プッシュの手順

```bash
git add <変更ファイル>
git commit -m "feat/fix: 内容の説明"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

**バージョン命名規則:**
- `vX.Y.0` — 機能追加（feat）
- `vX.Y.Z`（Z > 0）— バグ修正・データ修正（fix）
- 現在の最新タグ: `v0.15.2`

---

## 現在の駅・施設データ状況

| 駅 | slug | visible | temp | outlet整備 | seating整備 | 備考 |
|----|------|---------|------|------------|-------------|------|
| 大宮 | omiya | 83 | 17 | ✅ 全件（available:0 / none:82 / unknown:18）| ✅ 全件 | 南口・北口 2棟 |
| 赤羽 | akabane | 60 | 2 | ❌ 未設定 | ⚠️ 飲食のみ（13/62）| 改札内・改札外 2棟 |
| 新宿 | shinjuku | 41 | 0 | ❌ 1件のみ | ⚠️ 一部（8/41）| |
| 武蔵浦和 | musashi-urawa | 12 | 0 | ✅ 全件 | ✅ 全件 | |
| 池袋 | ikebukuro | 10 | 0 | ❌ 未設定 | ⚠️ 一部（3/10）| |
| 与野本町 | yono-honmachi | 7 | 0 | ✅ 全件 | ✅ 全件 | |
| 北与野〜北戸田 | 各駅 | 3〜4 | 0 | ❌ 未設定 | ❌ 未設定 | 設備のみの小駅 |

---

## 完了報告フォーマット

タスク完了時は以下の形式で報告すること。

```markdown
## 修正概要
（何を・なぜ変更したか）

## 修正ファイル
- ファイルパス：変更内容

## 検証結果
- npx tsc --noEmit : ✅ / ❌
- npx next lint    : ✅ / ❌
- npx next build   : ✅ / ❌

## デプロイ
- コミット: {hash}
- タグ: v{X.Y.Z}
- push: ✅
```

---

## JR 向けデモページで見せる主要 3 駅

`app/jr/demo/page.tsx` の `DEMO_STATIONS` に定義されている。  
新宿・大宮・赤羽がメイン。この 3 駅のデータ品質が応募PoC の印象を決める。

---

_最終更新: v0.15.2 (2026-04-27)_
