# 駅ナカマップ（ekimap-web）

> **Project Status: Frozen / Archived — 2026-06-30**
>
> JR東日本スタートアッププログラムへの応募後、不採択の結果を受けて事業開発を凍結しています。
> Vercel / Upstash / GitHub 上の運用リソースは順次整理予定です。
> コードおよび調査・設計資産は、将来の以下テーマへの転用を見据えて保存します。
>
> - 駅空間DX
> - 駅ナカ送客・リテールメディア
> - 購買前行動データ基盤
> - 公共交通インフラ × 商業施設PoC

---

## プロジェクト概要

改札内施設の回遊・滞在・送客を可視化する **駅ナカ運営DXプラットフォーム** のPoC。
一般ユーザー向け施設検索・チェックインと、JR東日本スタートアップ応募用のB2B提案デモを兼ねて開発した。

- 本番URL（凍結中）: https://ekimap-web.vercel.app
- GitHub: https://github.com/a-kobayashi-arch/ekimap-web
- 最終タグ: v0.16.7（2026-06-30）

---

## 技術スタック

| 分類 | 採用技術 |
|------|---------|
| フレームワーク | Next.js 15.5 App Router |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS v4 |
| データ永続化 | Vercel KV（Upstash Redis）|
| ホスティング | Vercel |
| パッケージ管理 | npm |

---

## ディレクトリ構成（主要）

```
app/
  page.tsx           # 一般向けトップ（エリア→事業者→路線→駅）
  station/[slug]/    # 駅詳細ページ（SSG）
  stamps/            # スタンプ一覧
  jr/                # JR東日本向け提案ページ群
    page.tsx         # 提案概要（/jr）
    demo/            # 審査用デモ（/jr/demo）
    demo-sample/     # 静的サンプルデモ（/jr/demo-sample）
    logs/            # ログ確認（/jr/logs）
lib/
  stations.ts        # 駅・施設マスタデータ
  navigation.ts      # エリア・事業者・路線ナビ構造
components/          # 共通UIコンポーネント
docs/                # 設計ドキュメント・アーカイブ
```

---

## アーカイブ資料

凍結経緯・再開条件・運用整理については以下を参照。

| ファイル | 内容 |
|---------|------|
| [docs/archive/2026-06-30-project-freeze.md](./docs/archive/2026-06-30-project-freeze.md) | 凍結メモ・背景・資産評価 |
| [docs/archive/ops-cleanup-checklist.md](./docs/archive/ops-cleanup-checklist.md) | 運用リソース整理チェックリスト |
| [docs/archive/restart-conditions.md](./docs/archive/restart-conditions.md) | 再開トリガー・条件一覧 |

---

## ローカル起動（参考）

```bash
npm install
cp .env.example .env.local  # 環境変数を設定する
npm run dev
```

必要な環境変数は `.env.example` を参照。

---

## ライセンス

Private — 社内調査・提案用途のみ。外部公開・商用利用不可。
