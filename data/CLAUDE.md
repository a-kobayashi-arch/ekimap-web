# data/ — 駅・施設データの注意点

## ファイル構成

| ファイル | 用途 |
|---------|------|
| `{slug}.json` | 駅データ（Station 型）|
| `areas.json` | エリア一覧（関東・関西・中部）|
| `operators.json` | 事業者一覧 |
| `lines.json` | 路線・駅スラッグ一覧 |

駅 JSON は `lib/stations.ts` で静的 import される。追加時は **必ず同ファイルに import を追加**すること。

## outlet / seating の設定ルール（必読）

| カテゴリ | outlet | seating |
|----------|--------|---------|
| 飲食店 | `"unknown"`（確認済みのみ `"available"`）| `"yes"` |
| 食材・お土産 / 雑貨・文具 / ショップ | `"none"` | `"no"` |
| コンビニ・キオスク | `"none"` | `"no"` |
| 期間限定ショップ（isTemporary: true）| `"none"` | `"no"` |
| 設備 | 設定不要 | 設定不要 |

**`outlet: "available"` は現地確認済みの客用コンセントのみ。未確認は `"unknown"`。**

## isTemporary パターン

```json
{ "isTemporary": true }
```

`true` の施設は通常一覧・件数カウントに表示しない。  
期間限定ショップのみに付与する。現在: 大宮 17 件・赤羽 2 件。

## 多棟駅の building フィールド

大宮・赤羽は `buildings` 配列を持つ。  
先頭棟（大宮: `"south"`）は `building` フィールドを省略可能（`processStation()` が自動注入）。  
2 棟目以降は明示する: `"building": "north"`

## 施設 ID の命名規則

```
{駅略称}-{番号3桁}      # 例: aka-k-001（赤羽改札内）
om-{番号3桁}            # 大宮南口
omn-{番号3桁}           # 大宮北口
```

## 整備状況（2026-04-27 時点）

| 駅 | outlet | seating | 優先度 |
|----|--------|---------|--------|
| 大宮 | ✅ 全件 | ✅ 全件 | — |
| 赤羽 | ❌ 未設定 | ⚠️ 飲食のみ | 🔴 高 |
| 新宿 | ❌ 1 件のみ | ⚠️ 一部 | 🔴 高 |
| 武蔵浦和 | ✅ 全件 | ✅ 全件 | — |
| 与野本町 | ✅ 全件 | ✅ 全件 | — |
| 池袋・戸田系・小駅 | ❌ 未設定 | ❌/⚠️ | 🟢 低 |

→ 整備手順: [../docs/06_next-implementation-plan.md](../docs/06_next-implementation-plan.md)
