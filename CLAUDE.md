# CLAUDE.md — ekimap-web

> 新しいセッションはまずこのファイルを読む。詳細は `docs/` を参照。

---

## ⚠️ 最重要ルール（応募前フェーズ）

現在は **JR東日本スタートアッププログラム応募前** のフェーズ。以下を最優先する。

### やること（優先順）

1. 既存アプリを壊さない
2. 改札内施設データの価値を見せる
3. 探索・閲覧・目的選択・ワンタップ確認ログを取得する
4. JR向け管理画面で簡易集計を見せる
5. 応募資料に使えるスクリーンショットを作れる状態にする

### やってはいけないこと（禁止）

```
🚫 大規模リファクタリング
🚫 新路線追加
🚫 店舗データ大量追加
🚫 GPS測位
🚫 屋内地図
🚫 Suica連携
🚫 JRE ID連携
🚫 POS連携
🚫 認証機能追加
🚫 既存API破壊
🚫 既存KVキー変更
🚫 スタンプ機能の作り直し
```

→ 詳細: [docs/03_development-rules.md](./docs/03_development-rules.md)

---

## このプロジェクトは何か

**駅ナカマップ（ekimap-web）** — 駅構内施設の検索・チェックイン・スタンプ Web アプリ。  
一般ユーザー向けと **JR東日本スタートアップ応募用 PoC** の 2 本立て。

- 本番: https://ekimap-web.vercel.app
- GitHub: https://github.com/a-kobayashi-arch/ekimap-web.git
- デプロイ: `git push origin main` → Vercel 自動反映。**タグも必ず push する**

→ 詳細: [docs/01_project-overview.md](./docs/01_project-overview.md)

---

## 最重要目的

**JR東日本スタートアップ応募の PoC を完成させること。**  
`/jr` LP と `/jr/demo` デモページが応募資料に直結する。  
既存の一般向けページ・機能は壊さない。

→ 詳細: [docs/05_jr-startup-application.md](./docs/05_jr-startup-application.md)

---

## 今すぐやるべきタスク

| 優先 | タスク | ファイル |
|------|--------|---------|
| 🔴 | **赤羽駅 seating/outlet 整備**（62 件すべて未設定）| `data/akabane.json` |
| 🔴 | **新宿駅 seating/outlet 整備**（41 件中ほぼ未設定）| `data/shinjuku.json` |
| 🟡 | 現地確認後に outlet: "available" 施設を追加（現在全デモ駅で 0 件）| 各駅 JSON |

→ 詳細: [docs/06_next-implementation-plan.md](./docs/06_next-implementation-plan.md)  
→ 引き継ぎ: [docs/07_session-handover.md](./docs/07_session-handover.md)

---

## 絶対に守るルール

```
✅ isTemporary 施設は可視一覧・件数カウントから除外する
✅ outlet: "available" は現地確認済み客用コンセントのみ
✅ コンビニ・物販・座席なし施設の outlet は "none"
✅ カフェ・レストランで未確認は "unknown"
✅ KV キー設計を変更しない（ユーザーデータ破壊）
✅ lib/stations.ts の駅の並び順を変えない
✅ 変更後は必ず: tsc → lint → build → commit → tag → push
```

→ 禁止事項の全リスト: [docs/03_development-rules.md](./docs/03_development-rules.md)

---

## outlet / seating の設定方針（必読）

| カテゴリ | outlet | seating |
|----------|--------|---------|
| 飲食店（レストラン・カフェ）| `unknown`（確認済みのみ `available`）| `yes` |
| 食材・お土産 / 雑貨・文具 / ショップ | `none` | `no` |
| コンビニ・キオスク | `none` | `no` |
| 期間限定ショップ（isTemporary）| `none` | `no` |
| 設備 | 設定不要 | 設定不要 |

→ 詳細: [docs/03_development-rules.md](./docs/03_development-rules.md)

---

## 現在の駅・施設数

埼京線 12 駅 / visible 244 件 / 期間限定 19 件 / 合計 263 件  
**現在 active な路線: 埼京線のみ**

→ 詳細: [docs/02_current-status.md](./docs/02_current-status.md)

---

## コミット・タグ手順

```bash
git add <変更ファイル>          # 個別に指定（git add . は使わない）
git commit -m "feat/fix: 説明"
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

現在の最新タグ: **v0.15.5**

---

## 完了報告フォーマット

```markdown
## 修正概要
## 修正ファイル
## 検証結果
- tsc: ✅  lint: ✅  build: ✅
## デプロイ
- タグ: vX.Y.Z  push: ✅
```

---

## docs/ インデックス

| ファイル | 内容 |
|---------|------|
| [01_project-overview.md](./docs/01_project-overview.md) | プロジェクト概要・技術スタック・URL 構成 |
| [02_current-status.md](./docs/02_current-status.md) | 駅・施設データの現状・機能実装状況 |
| [03_development-rules.md](./docs/03_development-rules.md) | 禁止事項・開発フロー・outlet ルール |
| [04_data-and-api.md](./docs/04_data-and-api.md) | 型定義・JSON 構造・KV 設計・API 仕様 |
| [05_jr-startup-application.md](./docs/05_jr-startup-application.md) | JR 応募 PoC の目的・ページ構成・デモ仕様 |
| [06_next-implementation-plan.md](./docs/06_next-implementation-plan.md) | 赤羽・新宿データ整備の具体的手順 |
| [07_session-handover.md](./docs/07_session-handover.md) | 直近作業ログ・未完了タスク・次の開始手順 |
