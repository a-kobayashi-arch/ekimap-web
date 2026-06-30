# 運用リソース整理チェックリスト

**作成日**: 2026-06-30  
**対象**: 凍結に伴う Vercel / Upstash / GitHub の運用整理

---

## 1. Vercel

### 停止または削除

- [ ] Vercel Project のデプロイを停止（または削除）
  - プロジェクト: `ekimap-web`
  - 停止のみにする場合: Settings → Advanced → Disable Production Deployments
  - 完全削除する場合: Settings → Advanced → Delete Project
- [ ] カスタムドメインを設定している場合はドメイン設定を解除する
- [ ] 環境変数（KV_REST_API_URL 等）は削除しておく（再起動しない前提で）

### 確認事項

- [ ] 現時点で Vercel 上の KV 連携が正常終了しているか確認
- [ ] ビルドログに異常がないか最終確認

---

## 2. Upstash Redis（Vercel KV）

### データ退避

- [ ] 必要なデータがあれば事前に確認・退避する
  - `stats:facility:*` — 施設チェックイン累計
  - `stats:station:*` — 駅訪問ログ累計
  - ユーザーIDベースのデータが含まれる場合は個人情報取扱に注意
- [ ] 退避不要と判断した場合は、その旨をここに記録する

### 削除

- [ ] Upstash コンソールから Redis データベースを削除する
- [ ] Vercel の KV ストレージとの連携を解除する

---

## 3. GitHub

### Repository Archive

- [ ] 最終コミット・タグが push 済みであることを確認する
  - 最終タグ: v0.16.7（2026-06-30）
- [ ] GitHub Repository を Archive（read-only）に設定する
  - Settings → Danger Zone → Archive this repository
  - Archive 後は push・issue・PR が無効化される（read のみ）
- [ ] 必要であれば ZIP でコードをバックアップしておく

### 確認事項

- [ ] CLAUDE.md・docs/ に凍結状態が記録されているか確認
- [ ] .env.local や秘密情報がリポジトリに含まれていないか最終確認
  - .gitignore に `.env.local` が含まれているはず
  - `git log --all --full-history -- .env*` で確認可能

---

## 4. その他

- [ ] 関係者（社内）に凍結の旨を共有する
- [ ] 提案資料・審査書類をローカルまたは社内ストレージに保存する
- [ ] このチェックリストを完了したら完了日を記録する

**整理完了日**: （未完了）
