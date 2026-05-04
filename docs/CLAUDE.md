# docs/ — ドキュメントの構成と更新ルール

## ファイル一覧

| ファイル | 内容 | 更新頻度 |
|---------|------|---------|
| `01_project-overview.md` | プロジェクト概要・技術スタック・URL 構成 | 低 |
| `02_current-status.md` | 駅・施設データの現状・機能実装状況 | 中 |
| `03_development-rules.md` | 禁止事項・開発フロー・outlet ルール | 低 |
| `04_data-and-api.md` | 型定義・JSON 構造・KV 設計・API 仕様 | 低 |
| `05_jr-startup-application.md` | JR 応募 PoC の目的・ページ構成 | 低 |
| `06_next-implementation-plan.md` | 優先タスク・データ整備手順 | 高 |
| `07_session-handover.md` | 直近作業ログ・未完了タスク | **毎セッション更新** |
| `JR_POC_DIRECTION.md` | 初期設定の方針文書（参照専用）| 変更しない |

## セッション終了時の必須更新

`07_session-handover.md` を必ず更新してから push する。

```markdown
## 最終更新: vX.Y.Z (YYYY-MM-DD)

### vX.Y.Z — タスク名
**修正ファイル:** ...
**内容:** ...

## 現在の未完了タスク
...
```

## 02_current-status.md の更新タイミング

以下の変更があったとき更新する:
- 新しい駅データを追加したとき
- outlet / seating の整備状況が変わったとき
- 新機能を実装したとき

## このディレクトリに新しいファイルを作る場合

番号プレフィックス `NN_` を付け、既存番号と重複させない。  
`JR_POC_DIRECTION.md` は初期文書として保持し、内容は変更しない。
