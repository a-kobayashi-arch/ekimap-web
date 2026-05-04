# 03 開発ルール・禁止事項

## ⚠️ 最重要ルール（応募前フェーズ）

現在は **JR東日本スタートアッププログラム応募前** のフェーズ。

### 優先すること

1. 既存アプリを壊さない
2. 改札内施設データの価値を見せる
3. 探索・閲覧・目的選択・ワンタップ確認ログを取得する
4. JR向け管理画面で簡易集計を見せる
5. 応募資料に使えるスクリーンショットを作れる状態にする

### 応募前フェーズの禁止事項

| 禁止項目 | 理由 |
|---------|------|
| 大規模リファクタリング | 既存機能を壊すリスクが高い |
| 新路線追加 | 応募に不要・データ整備コスト大 |
| 店舗データ大量追加 | 品質より既存データの精度向上を優先 |
| GPS 測位 | JR 提携後フェーズで実装 |
| 屋内地図 | JR 提携後フェーズで実装 |
| Suica / JRE ID / POS 連携 | JR 提携後フェーズで実装 |
| 認証機能追加 | 現行の userId 管理で十分 |
| 既存 API 破壊 | ユーザーデータ損失・KV 整合性破壊 |
| 既存 KV キー変更 | ユーザーデータ損失 |
| スタンプ機能の作り直し | 現行実装で要件を満たしている |

---

## 基本方針

1. **既存の一般向けページ・機能を壊さない**
2. **大規模リファクタリング・ディレクトリ再編は行わない**
3. **1 タスクごとに完成させ、小さく安全に進める**
4. **変更前に関連ファイルを必ず Read して全体を把握してから編集する**

---

## 禁止事項（実装上の厳守事項）

| 禁止 | 理由 |
|------|------|
| KV キー設計の変更 | 既存ユーザーのチェックインデータが消える |
| `lib/stations.ts` のステーション並び順変更 | 路線順・SSG パラメータに影響 |
| `generateStaticParams` を壊す変更 | ビルドが落ちる |
| `isTemporary` を可視件数・一覧に混入 | 期間限定ショップが通常表示に出てしまう |
| `outlet: "available"` を未確認施設に設定 | コンビニ・物販・座席なし施設は必ず `none` |
| `data/operators.json` の `lines` 配列変更 | ナビ表示と URL が壊れる |
| `types/index.ts` の既存型の破壊的変更 | TypeScript エラーが全体に波及する |
| トップ・駅詳細・スタンプ帳の大幅な UI 変更 | 一般向け体験を損なう |
| `git push --force` on main | 履歴破壊 |

---

## 開発フロー

### 施設データを追加・修正する場合

1. 対象の `data/{slug}.json` を編集
2. `isTemporary` の有無を確認し、可視件数が正しいか node で確認
3. `outlet` / `seating` は [04_data-and-api.md](./04_data-and-api.md) の対応表に従う
4. `npx tsc --noEmit` でエラーなし
5. `npx next build` でビルド確認

```bash
# 可視件数確認の例
node -e "
const d = require('./data/akabane.json');
console.log('visible:', d.facilities.filter(f=>!f.isTemporary).length);
console.log('temp:', d.facilities.filter(f=>f.isTemporary).length);
"
```

### コンポーネント・ロジックを変更する場合

1. 変更対象と関連ファイルを Read して全体を把握
2. 最小限の変更にとどめる
3. 検証を順番に実行:

```bash
npx tsc --noEmit     # 型エラーなし
npx next lint        # lint 警告なし（既存警告は許容）
npx next build       # ビルド成功・全ページ生成確認
```

4. すべてクリアしたらコミット

### 新しい駅データを追加する場合

1. `data/{slug}.json` を作成（既存駅 JSON を参照してフォーマット合わせる）
2. `lib/stations.ts` に import を追加し `stations` 配列に追加
3. `data/lines.json` の該当路線の `stations` 配列に追加
4. ビルド確認（SSG パラメータが増えていることを確認）

---

## コミット・タグ・プッシュの手順

```bash
# ファイルを明示的にステージ（git add . は使わない）
git add <変更ファイル>

# コミット（日本語・英語どちらも可）
git commit -m "feat: 内容の説明"

# タグを打つ（必須）
git tag vX.Y.Z

# プッシュ（main と タグを両方）
git push origin main
git push origin vX.Y.Z
```

### バージョン命名規則

| 変更種別 | バージョン形式 | 例 |
|----------|--------------|-----|
| 機能追加（feat）| X.Y.0 → X.(Y+1).0 | v0.15.0 → v0.16.0 |
| バグ修正・データ修正（fix）| X.Y.Z → X.Y.(Z+1) | v0.15.0 → v0.15.1 |
| ドキュメント（docs）| X.Y.Z → X.Y.(Z+1) | v0.15.2 → v0.15.3 |

**現在の最新タグ: `v0.15.3`**

---

## isTemporary パターン（必読）

`isTemporary: true` の施設は**通常一覧に表示しない**。以下を徹底する。

```typescript
// ✅ 正しい: 可視施設のみ
const visible = station.facilities.filter(f => !f.isTemporary);

// ❌ 間違い: 全件使用
const wrong = station.facilities;
```

`isTemporary` を除外すべき箇所:
- 施設件数の表示（StationCard, station 詳細ヘッダー）
- FacilityTabs に渡す `facilities` prop
- JR ページの totalFacilities カウント
- JR デモの `visibleFacilities`

**例外**: `facilityToStation` 逆引きマップは KV データとの整合性のため isTemporary も含める。

---

## outlet 設定ルール（必読）

### `available` にしてよい条件（全部満たすこと）

- 座席がある（`seating: "yes"`）
- 利用者が使える**客用**コンセントがある
- 公式情報・現地確認などで明確に確認済み

### 絶対に `available` にしてはいけないもの

- コンビニ・キオスク（NewDays 等）→ `none`
- 物販・テイクアウト専門 → `none`
- `seating: "no"` の施設 → `none`
- 「たぶんある」「よく見かける」だけで未確認 → `unknown`

### カテゴリ別デフォルト

| カテゴリ | outlet | seating |
|----------|--------|---------|
| 飲食店（レストラン）| `unknown` | `yes` |
| 飲食店（カフェ・イートイン）| `unknown`（確認済みのみ `available`）| `yes` |
| 食材・お土産 | `none` | `no` |
| 雑貨・文具 | `none` | `no` |
| ショップ（物販）| `none` | `no` |
| サービス | `none`（または `unknown`）| 施設による |
| 設備 | フィールド不要 | フィールド不要 |
| 期間限定ショップ（isTemporary）| `none` | `no` |

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
