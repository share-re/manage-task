# 軽微な修正の一覧（まとめて 1 つの issue にする用）

各 issue の作業中に見つけた「軽微だが直したい点」を貯めておく場所。
小さな issue を量産しないため、ある程度たまったら **まとめて 1 つの issue** として起票する。

## 未対応

### 1. `APP_URL` のハードコード既定を見直す
- **場所**: `src/lib/summary.ts:84` — `process.env.APP_URL ?? "https://manage-task-drab.vercel.app"`
- **問題**: `APP_URL` 未設定時に特定 URL を直書き。ドメイン変更やプレビュー環境で、
  メール本文内リンクが誤った先を指す（エラーは出ない“静かなバグ”）。
- **案**: Vercel の `VERCEL_URL` をフォールバックに使う、または `APP_URL` を必須化する。
- **優先度**: 低（現状は直書き URL が正しいため実害なし）
- **出所**: #18 の設計レビュー

### 2. リポジトリ全体で `npm run lint` が失敗している
- **場所**: `login/page.tsx`, `forest/page.tsx`, `tasks/page.tsx`, `office/World.tsx`,
  `components/PasskeyRegisterButton.tsx` ほか（origin/main の時点で発生）。
- **問題**: strict な react-hooks ルール（`react-hooks/set-state-in-effect`, `react-hooks/refs`）で
  16 件のエラー。既存コードが該当し、`npm run lint` が赤いまま。
- **案**: 各箇所を修正する / ルールを緩める（`eslint` 設定）/ 方針を決める。
- **優先度**: 低〜中（アプリの動作・ビルドには影響しないが、lint をゲートにできない）
- **出所**: #20 の実装時に検知

## 対応済み

（なし）
