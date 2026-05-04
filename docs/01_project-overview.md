# 01 プロジェクト概要

## アプリ名・目的

**駅ナカマップ（ekimap-web）**

駅構内施設を検索・記録できる Web アプリ。以下の 2 本立て構成。

| 対象 | 目的 |
|------|------|
| 一般ユーザー | 駅ナカ施設の検索・チェックイン・スタンプラリー |
| JR東日本スタートアップ | 改札内回遊・滞在価値・店舗送客を可視化する PoC 提案 |

---

## 本番環境・リポジトリ

| 項目 | 内容 |
|------|------|
| 本番 URL | https://ekimap-web.vercel.app |
| GitHub | https://github.com/a-kobayashi-arch/ekimap-web.git |
| ブランチ | `main` |
| デプロイ | `git push origin main` で Vercel 自動デプロイ |
| タグ | 機能追加・修正ごとに `vX.Y.Z` タグを打って push する |

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

## URL 構成

| パス | 用途 | レンダリング |
|------|------|------------|
| `/` | エリア→事業者→路線→駅一覧（3 階層ナビ） | SSR（searchParams）|
| `/station/[slug]` | 駅詳細・施設一覧 | SSG |
| `/stamps` | スタンプ帳 | Client |
| `/jr` | JR 向け LP（応募用）| SSR（KV 実績表示）|
| `/jr/demo` | JR 向けデモ（目的別導線・stats）| SSR + Client |

---

## ディレクトリ構成

```
ekimap-web/
├── app/
│   ├── page.tsx                    # トップ（3 階層ナビ）
│   ├── station/[slug]/page.tsx     # 駅詳細
│   ├── stamps/page.tsx             # スタンプ帳
│   ├── jr/
│   │   ├── page.tsx                # JR LP
│   │   ├── demo/page.tsx           # JR デモ
│   │   └── layout.tsx
│   └── api/
│       ├── checkins/route.ts       # 施設チェックイン CRUD
│       ├── station-checkin/route.ts # 駅スタンプ
│       └── stats/route.ts          # 集計
├── components/                     # UI コンポーネント群
├── data/                           # 駅 JSON × 12 + ナビデータ
├── lib/                            # stations / navigation / utils
├── hooks/useCheckins.ts
├── types/index.ts                  # 型定義
├── CLAUDE.md                       # セッション引き継ぎ（要点）
└── docs/                           # 詳細ドキュメント（本ディレクトリ）
```

---

## 現在の対応路線・駅

**埼京線のみ（12 駅）**

大宮 → 北与野 → 与野本町 → 南与野 → 中浦和 → 武蔵浦和  
→ 北戸田 → 戸田 → 戸田公園 → 赤羽 → 池袋 → 新宿

他路線（東京メトロ・東武・西武・京王・小田急）は `operators.json` に定義されているが `status: "coming_soon"` で非表示。

---

## 関連ドキュメント

- [02_current-status.md](./02_current-status.md) — 駅・施設データの現状
- [05_jr-startup-application.md](./05_jr-startup-application.md) — JR 応募 PoC の詳細
- [JR_POC_DIRECTION.md](./JR_POC_DIRECTION.md) — 開発方針（初期設定文書）
