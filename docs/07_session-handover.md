# 07 セッション引き継ぎ

> 新しいセッション開始時に必ず読む。実務用の引き継ぎメモ。  
> 詳細は各 `docs/` ファイルを参照。開始指示は `08_new-claude-session-start-prompt.md`。

---

## 最終更新: v0.15.7 (2026-05-06)

---

## プロジェクト目的

**駅ナカ運営DXプラットフォーム（駅ナカマップ / ekimap-web）**

改札内施設の回遊・滞在・送客を可視化し、**JR東日本スタートアッププログラム**への応募 PoC として機能させること。

- 現フェーズ: **応募前**（PoC 最小実装の完成が最優先）
- 一般向けページ（施設検索・チェックイン・スタンプ）は維持しながら、JR 向け管理画面・行動ログ基盤を追加する
- 「便利アプリ」ではなく「駅ナカ運営DX・販促基盤」として応募資料に転用できる状態にする

---

## 公開 URL・リポジトリ

| 項目 | 内容 |
|------|------|
| 本番 URL | https://ekimap-web.vercel.app |
| JR LP | https://ekimap-web.vercel.app/jr |
| JR デモ | https://ekimap-web.vercel.app/jr/demo |
| GitHub | https://github.com/a-kobayashi-arch/ekimap-web.git |
| デプロイ | `git push origin main` → Vercel 自動反映 |
| 最新タグ | `v0.15.7` |

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Next.js 15.5.x（App Router）|
| 言語 | TypeScript 5 |
| スタイリング | Tailwind CSS v4 |
| DB / KV | Vercel KV（`@vercel/kv` v3、Redis 互換）|
| レンダリング | SSG（駅詳細）/ SSR（JR ページ）/ Client（スタンプ帳）|
| デプロイ | Vercel（GitHub 連携、自動デプロイ）|

---

## 既存実装済み機能

| 機能 | パス | 状態 |
|------|------|------|
| トップ（3 階層ナビ）| `/` | ✅ |
| 駅詳細・施設一覧 | `/station/[slug]` | ✅ SSG |
| スタンプ帳 | `/stamps` | ✅ |
| JR 向け LP | `/jr` | ✅ |
| JR 向けデモ（目的別導線・stats）| `/jr/demo` | ✅ |
| 施設チェックイン | `/api/checkins` | ✅ |
| 駅スタンプ | `/api/station-checkin` | ✅ |
| 集計 API | `/api/stats` | ✅ |
| 行動ログ API | `/api/events` `/api/events/summary` | 🔴 未実装 |

---

## 既存 API エンドポイント

| パス | メソッド | 用途 |
|------|---------|------|
| `/api/checkins` | GET / POST / DELETE | 施設チェックイン |
| `/api/station-checkin` | GET / POST | 駅スタンプ |
| `/api/stats` | GET | 全施設・全駅の集計 |

**既存エンドポイントは変更・削除禁止。**

---

## 既存 KV キー設計（変更禁止）

```
user:{userId}                    → UserData（施設チェックイン配列）
stats:facility:{facilityId}      → number（施設別カウンター）
station_checkin:{userId}:{slug}  → StationCheckinData
stats:station:{slug}             → number（駅別カウンター）
```

新規キーを追加するときも既存キーには一切触れない。  
追加予定: `event:{eventId}`、`events:summary:{date}`

---

## 駅・施設データの保存場所

```
data/
├── {slug}.json          # 駅データ（Station 型）12 駅分
├── areas.json           # エリア一覧
├── operators.json       # 事業者一覧
└── lines.json           # 路線・駅スラッグ一覧
```

- 駅 JSON は `lib/stations.ts` で静的 import → **追加時は必ず import も追加**
- `data/operators.json` の `lines` 配列は変更禁止（ナビ URL が壊れる）

---

## 現在の駅・施設データ状態

**埼京線 12 駅 / visible 244 件 / 期間限定 19 件 / 合計 263 件**

| 駅 | outlet | seating | 備考 |
|----|--------|---------|------|
| 大宮 | ✅ 全件 | ✅ 全件 | available=0（未確認）|
| 赤羽 | ✅ 全件 | ✅ 全件 | v0.15.7 完了。カテゴリ基準の暫定値 |
| 新宿 | ❌ 未整備 | ⚠️ 一部 | 応募前対象外 |
| 武蔵浦和 | ✅ 全件 | ✅ 全件 | — |
| 与野本町 | ✅ 全件 | ✅ 全件 | — |
| 池袋・戸田系・小駅 | ❌ 未整備 | ❌/⚠️ | 応募前対象外 |

**JR デモ対象駅**: 新宿・大宮・赤羽（`/jr/demo` で切替表示）

---

## 改札内施設のみを対象とするルール

- このアプリが扱う施設は `gateArea === "改札内"` のみ
- 改札外施設の追加・表示は応募前フェーズでは行わない

---

## 応募前に次に実装する最小改修

### 🔴 P1: 行動ログ API（未実装）

| 項目 | 内容 |
|------|------|
| 対象ファイル | `app/api/events/route.ts`（新規）、`app/api/events/summary/route.ts`（新規）|
| POST `/api/events` | `{ userId, action, facilityId?, stationSlug?, purpose? }` を KV に書く |
| GET `/api/events/summary` | JR 管理画面向け集計を返す |
| KV キー | `event:{eventId}`（新規追加）、`events:summary:{date}`（新規追加）|
| 制約 | 既存 API・KV キーは変更しない。KV 未使用環境ではフォールバックを返す |

### 🔴 P2: JR 管理画面 簡易ダッシュボード

| 項目 | 内容 |
|------|------|
| 対象ファイル | `app/jr/page.tsx` |
| 追加内容 | 目的別タップ数・施設別閲覧数・駅別アクティブ数の集計パネル |
| データソース | `/api/events/summary`（P1 実装後）+ 既存 `/api/stats` |
| 制約 | B2B トーン維持。大幅な UI 変更は不可 |

---

## 絶対にやらないこと（応募前フェーズ）

```
🚫 大規模リファクタリング
🚫 新路線追加・追加駅整備
🚫 新宿・他駅 seating/outlet 整備
🚫 店舗データ大量追加
🚫 改札外施設の追加
🚫 GPS測位・屋内地図
🚫 Suica / JRE ID / POS 連携
🚫 CSV 出力
🚫 認証機能追加
🚫 既存 API 変更・KV キー変更
🚫 スタンプ機能の作り直し
🚫 generateStaticParams の削除・変更
```

---

## 新セッション開始時に確認するコマンド

```bash
# 1. 最新コミット確認
git log --oneline -5

# 2. 作業中ファイルがないか確認
git status

# 3. ビルドが通ることを確認（任意）
npx tsc --noEmit
```

---

## 新セッション開始指示

`docs/08_new-claude-session-start-prompt.md` をそのまま投入する。

---

## 直近セッション作業ログ

### v0.15.7 — 赤羽駅 seating / outlet 一括設定（2026-05-06）

**修正:** `data/akabane.json`  
62 件全件に seating/outlet を設定。飲食店 14 件 → unknown/yes、物販等 48 件 → none/no。  
カテゴリ基準の暫定値。tsc / build ✅。

### v0.15.6 — 応募前フェーズ最重要ルール追加（2026-05-06）

**修正:** `CLAUDE.md`、`docs/03_development-rules.md`  
優先事項 5 項目・禁止事項 12 項目を冒頭に追記。

### v0.15.5 — サブディレクトリ CLAUDE.md 追加（2026-04-27）

`app/`・`app/api/`・`data/`・`docs/` に各 CLAUDE.md を新規作成。

### v0.15.4 — docs/ 引き継ぎドキュメント整備（2026-04-27）

`docs/01〜07` を新規作成。ルート CLAUDE.md を要点化。

### v0.15.2 — コンセント空表示文言改善（2026-04-27）

`FacilityTabs.tsx`・`jr/demo/page.tsx` で outlet=0 件時の専用メッセージを追加。

### v0.15.1 — 大宮 outlet available 補正（2026-04-27）

`data/omiya.json`: available=8 を全件 none/unknown に修正。現在 available=0。

### v0.15.0 — outlet 3 値化（2026-04-27）

`OutletStatus` を `available|unknown` → `available|none|unknown` に拡張。  
大宮 100 件一括補正。ReportModal・FacilityCard 更新。

### v0.14.1 — 戻るリンク修正（2026-04-27）

`lib/navigation.ts` に `getStationBackNav()` を追加。駅詳細の戻り先を路線別に動的生成。

---

## 過去バージョン一覧

| タグ | 内容 |
|------|------|
| v0.15.7 | 赤羽 seating/outlet 一括設定 |
| v0.15.6 | 応募前ルール追加 |
| v0.15.5 | サブディレクトリ CLAUDE.md |
| v0.15.4 | docs/ 整備 |
| v0.15.3 | ルート CLAUDE.md 作成 |
| v0.15.2 | コンセント空表示改善 |
| v0.15.1 | 大宮 outlet 補正 |
| v0.15.0 | outlet 3 値化 |
| v0.14.x | 大宮データ整備・戻るリンク修正 |
| v0.13.x | JRデモ目的別導線・赤羽データ整備 |
| v0.12.x | JRデモ駅切替・実績表示 |
| v0.11.x 以前 | JR LP・スタンプ・チェックイン初期実装 |
