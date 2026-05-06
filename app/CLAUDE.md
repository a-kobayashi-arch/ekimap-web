# app/ — ルーティング・ページ実装の注意点

## ページ構成

| パス | ファイル | レンダリング |
|------|---------|------------|
| `/` | `page.tsx` | SSR（searchParams で3画面切替）|
| `/station/[slug]` | `station/[slug]/page.tsx` | SSG（generateStaticParams）|
| `/stamps` | `stamps/page.tsx` | Client（localStorage + KV）|
| `/jr` | `jr/page.tsx` | SSR（KV 実績取得）|
| `/jr/demo` | `jr/demo/page.tsx` | SSR + Client |

## generateStaticParams を壊さないこと

`station/[slug]/page.tsx` は `getAllStations()` からスラッグを生成している。  
`lib/stations.ts` に新駅を追加すれば自動でビルド対象に加わる。  
**削除・変更は絶対にしない。**

## 改札内施設のみを対象とする

このアプリが扱う施設は **改札内のみ**（`gateArea === "改札内"`）。  
改札外施設のデータ追加・表示実装は応募前フェーズでは行わない。  
新しい施設データを追加するときは `gateArea` が `"改札内"` であることを確認すること。

## isTemporary の除外を必ずかける

施設を表示・カウントするページでは必ず:

```typescript
const visibleFacilities = station.facilities.filter(f => !f.isTemporary);
```

`station.facilities` をそのまま使わない。

## Client / Server の混在に注意

- `getUserId()`（`lib/userId.ts`）は localStorage 依存 → **Client component 専用**
- KV アクセスは Server component か API Route で行う
- `useCheckins` フックは Client 専用

## JR ページのデザイン方針

`jr/` 配下は B2B トーン（落ち着いた・資料転用可能な見た目）。  
スタンプ・ゲーム性の演出は入れない。  
→ 詳細: [../docs/05_jr-startup-application.md](../docs/05_jr-startup-application.md)
