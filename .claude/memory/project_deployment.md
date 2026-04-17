---
name: Vercelデプロイ情報
description: ekimap-webの本番環境URL・GitHubリポジトリ・デプロイフロー
type: project
---

本番URL: https://ekimap-web.vercel.app

GitHubリポジトリ: https://github.com/a-kobayashi-arch/ekimap-web.git
ブランチ: main

デプロイフロー: git push origin main → Vercel自動デプロイ（手動操作不要）

**Why:** Vercel + GitHub 連携済み。pushするだけで自動反映される。
**How to apply:** 新機能実装後はpushだけでOK。Vercelダッシュボードで進捗確認できる。
