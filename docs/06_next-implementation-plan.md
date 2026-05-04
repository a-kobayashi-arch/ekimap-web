# 06 次の実装計画（応募前優先順位）

## 優先タスク一覧

| 優先 | タスク | 対象ファイル | 難易度 |
|------|--------|------------|--------|
| 🔴 P1 | 赤羽駅 seating / outlet フィールド整備 | `data/akabane.json` | 中 |
| 🔴 P1 | 新宿駅 seating / outlet フィールド整備 | `data/shinjuku.json` | 中 |
| 🟡 P2 | 主要 3 駅で outlet: "available" 施設を現地確認後に追加 | 各駅 JSON | 低（現地確認依存）|
| 🟢 P3 | 池袋・戸田公園・戸田の seating 補完 | 各駅 JSON | 低 |
| 🔲 将来 | GPS 駅チェックイン精度向上 | `api/station-checkin/route.ts` | 高 |

---

## P1: 赤羽駅データ整備

### 現状

- 全 62 件（visible 60 + temp 2）に `outlet` フィールドが存在しない
- `seating` は飲食店 13 件のみ設定済み（`yes`）、物販系は未設定

### 整備方針

大宮駅で確立したルールをそのまま適用する。

```
seating:
  飲食店（seating フィールドなし → yes で設定済みのはず。確認すること）
  食材・お土産 → no
  雑貨・文具 → no
  その他 → no

outlet:
  食材・お土産 → none
  雑貨・文具 → none
  その他（コンビニ NewDays 等）→ none
  飲食店 → unknown（現地確認済みのみ available）
  期間限定（isTemporary）→ none
```

### 赤羽の施設構成（visible 60 件）

| カテゴリ | 件数 | outlet 方針 |
|----------|------|------------|
| 食材・お土産 | 37 | → `none` |
| 飲食店 | 14 | → `unknown`（seating: yes）|
| 雑貨・文具 | 7 | → `none` |
| その他 | 2 | → `none` |

### 整備手順

1. `data/akabane.json` を開き、各施設に以下を追加:
   - `seating` フィールド（飲食店は確認・物販系は `"no"` 追加）
   - `outlet` フィールド（上記方針に従って `"none"` または `"unknown"`）
2. Node スクリプトで一括適用するのが効率的:

```javascript
// 参考: 大宮の補正と同じアプローチ
data.facilities = data.facilities.map(f => ({
  ...f,
  seating: f.seating ?? (f.category === '飲食店' ? 'unknown' : 'no'),
  outlet: f.outlet !== undefined ? f.outlet :
          f.category === '飲食店' ? 'unknown' : 'none',
}));
```

3. 既存 `seating: "yes"` の飲食店 13 件は上書きしないよう注意
4. `npx tsc --noEmit` → `npx next build` 確認

---

## P1: 新宿駅データ整備

### 現状

- 41 件中 `outlet` 設定ありは 1 件のみ（`unknown`）
- `seating` は 8/41 のみ設定済み（飲食店の一部）

### 新宿の施設構成（visible 41 件）

| カテゴリ | 件数 | outlet 方針 | seating 方針 |
|----------|------|------------|-------------|
| ショップ（物販）| 22 | → `none` | → `no` |
| 飲食店 | 9 | → `unknown` | → `yes` |
| サービス | 4 | → `none` | → サービス内容による |
| 設備 | 6 | フィールド不要 | フィールド不要 |

### 整備手順

1. `data/shinjuku.json` を確認（現在 1 件だけ `outlet: "unknown"` が設定済み）
2. 全施設に `seating` と `outlet` を補完
3. 設備カテゴリ（6 件）は outlet/seating フィールド不要（または未設定のまま）
4. 整備後: `npx tsc --noEmit` → `npx next build`

---

## P2: outlet: "available" 施設の追加

現状、JR デモ主力 3 駅で `available` = 0 件。

**方針: 現地確認なしに `available` を設定しない。** 以下の場合のみ設定してよい:

1. 公式サイトにコンセント席の記載がある
2. 実際に現地で客用コンセントを目視確認した
3. 広く知られた情報（例: スターバックスの特定店舗がコンセントあり）かつ確認できる

**候補施設（確認推奨）:**

| 駅 | 施設 | 根拠 |
|----|------|------|
| 大宮 | スターバックス 大宮ノース（omn-001）| Starbucks は国内多数店でコンセントあり |
| 大宮 | ゴディバカフェ（om-029）| カフェ業態、現地確認推奨 |
| 赤羽 | BECK'S COFFEE SHOP（aka-k-009）| JR 系カフェ、多くの店舗でコンセントあり |

---

## P3: 小駅の seating 補完

対象: 池袋・戸田公園・戸田・北与野〜北戸田（小駅）

小駅は施設数が少ないため、手動で `seating` フィールドを補完するだけでよい。  
`outlet` は `none`/`unknown` のみで `available` は設定しない（現地確認不要の方針）。

---

## 将来タスク（応募前不要）

### GPS 駅チェックイン精度向上

`app/api/station-checkin/route.ts:64` に TODO コメントがある。

```typescript
// TODO: GPS判定実装予定
//   駅の緯度経度から半径500m以内にいる場合のみチェックイン可能にする
//   JR提携後はビーコンによる精度向上を予定
```

実装ステップ（将来）:
1. 各駅 JSON に `lat` / `lng` フィールドを追加
2. API 側でリクエストの位置情報と比較
3. 半径 500m 以外のチェックインを拒否

### Suica 連携・購買データ分析

JR 提携後のフェーズ 3 以降。現時点では不要。

---

## 作業完了後の確認チェックリスト

```
□ npx tsc --noEmit → エラーなし
□ npx next build → 22 ページ正常生成
□ 対象駅の visible 件数が変わっていないこと
□ isTemporary 施設が一覧に混入していないこと
□ outlet: "available" にコンビニ・物販が含まれていないこと
□ git tag vX.Y.Z → push
```
