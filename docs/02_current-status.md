# 02 現在の実装状況

## 機能実装状況

| 機能 | 状態 | 主なファイル |
|------|------|------------|
| 3 階層ナビ（エリア→事業者→路線→駅）| ✅ 完了 | `app/page.tsx`, `lib/navigation.ts` |
| 駅詳細・施設一覧（カテゴリ/改札/棟タブ）| ✅ 完了 | `app/station/[slug]/page.tsx`, `FacilityTabs.tsx` |
| 施設フィルタ（コンセント/座席）| ✅ 完了 | `FacilityTabs.tsx` |
| 施設チェックイン「行った/気になる」| ✅ 完了 | `FacilityCard.tsx`, `/api/checkins` |
| 駅スタンプ（駅チェックイン）| ✅ 完了 | `StationCheckinButton.tsx`, `/api/station-checkin` |
| スタンプ帳 | ✅ 完了 | `app/stamps/page.tsx` |
| 情報報告モーダル（outlet/seating/crowded）| ✅ 完了 | `ReportModal.tsx`（outlet は 3 値対応済）|
| 乗り換え時間計算 | ✅ 完了 | `lib/transferTimeCalculator.ts` |
| 戻るリンク（路線逆引き）| ✅ 完了 | `lib/navigation.ts:getStationBackNav()` |
| 全文検索バー | ✅ 完了 | `SearchBar.tsx` |
| JR LP | ✅ 完了 | `app/jr/page.tsx` |
| JR デモ（目的別導線・stats）| ✅ 完了 | `app/jr/demo/page.tsx` |
| GPS 駅チェックイン精度向上 | 🔲 未着手 | `api/station-checkin/route.ts:64` に TODO |
| リアルタイム空席・充電状況 | 🔲 計画中 | JR 側アセット必要 |

---

## 駅・施設データ状況

### 全体サマリ

| 指標 | 数値 |
|------|------|
| 駅数 | 12 駅 |
| 可視施設（!isTemporary）| 244 件 |
| 期間限定施設（isTemporary）| 19 件（大宮 17・赤羽 2）|
| 全施設合計 | 263 件 |

### 駅別詳細

| 駅 | slug | visible | temp | outlet 整備 | seating 整備 | 備考 |
|----|------|---------|------|------------|-------------|------|
| 大宮 | omiya | 83 | 17 | ✅ 全件 | ✅ 全件 | 南口/北口 2 棟。outlet: available=0, none=82, unknown=18 |
| 赤羽 | akabane | 60 | 2 | ❌ 全件未設定 | ⚠️ 飲食 13/62 のみ | 改札内/外 2 棟。物販系 seating も未設定 |
| 新宿 | shinjuku | 41 | 0 | ❌ 1 件のみ | ⚠️ 8/41 のみ | 飲食 9 件中 seating 設定済みは一部 |
| 武蔵浦和 | musashi-urawa | 12 | 0 | ✅ 全件 | ✅ 全件 | available 3 件 |
| 池袋 | ikebukuro | 10 | 0 | ❌ 未設定 | ⚠️ 3/10 のみ | |
| 与野本町 | yono-honmachi | 7 | 0 | ✅ 全件 | ✅ 全件 | available 1 件 |
| 北与野〜北戸田（6 駅）| 各駅 | 3〜4 | 0 | ❌ 未設定 | ❌ 未設定 | 設備のみの小駅 |
| 戸田・戸田公園 | 各駅 | 7〜10 | 0 | ❌ 未設定 | ❌ 未設定 | |

### outlet: "available" 施設（全駅合計）

現在 `available` は武蔵浦和 3 件・与野本町 1 件の**計 4 件のみ**。  
JR デモ主力 3 駅（新宿・大宮・赤羽）はすべて **available = 0 件**。  
→ JRデモの「⚡充電」タブが全デモ駅で空表示になっている。

---

## カテゴリ分布（主要 3 駅）

### 大宮駅（visible 83 件）

| カテゴリ | 件数 |
|----------|------|
| 食材・お土産 | 56 |
| 飲食店 | 17 |
| 雑貨・文具 | 4 |
| その他 | 5 |
| サービス | 1 |

### 赤羽駅（visible 60 件）

| カテゴリ | 件数 |
|----------|------|
| 食材・お土産 | 37 |
| 飲食店 | 14 |
| 雑貨・文具 | 7 |
| その他 | 2 |

### 新宿駅（visible 41 件）

| カテゴリ | 件数 |
|----------|------|
| ショップ | 22 |
| 飲食店 | 9 |
| サービス | 4 |
| 設備 | 6 |

---

## 直近のバージョン履歴

| タグ | 内容 |
|------|------|
| v0.15.3 | CLAUDE.md 追加（引き継ぎ文書）|
| v0.15.2 | コンセント 0 件時の空表示文言を専用メッセージに変更 |
| v0.15.1 | 大宮 outlet available 補正（コンビニ等を none/unknown に修正）|
| v0.15.0 | outlet 3 値化（available/none/unknown）+ 大宮データ補正 |
| v0.14.1 | 駅詳細ページの「戻る」リンクを路線逆引きに改修 |
| v0.14.0 | 大宮駅データ整備・isTemporary 対応全体適用 |
| v0.13.x | JR デモ目的別導線・赤羽データ整備 |

---

## 関連ドキュメント

- [06_next-implementation-plan.md](./06_next-implementation-plan.md) — 次のタスク詳細
- [07_session-handover.md](./07_session-handover.md) — 直近セッションの引き継ぎ
