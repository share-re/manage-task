# manage-task

進捗管理アプリ。ログインして利用し、ログイン後のトップ画面から各機能
（進捗管理・AI内田さん・植林）へ移動できるようにする。

## セットアップ（ローカル開発）

1. 依存をインストール: `npm install`
2. 環境変数ファイルを用意: `cp .env.local.example .env.local`
3. `.env.local` に実際の値を記入（下の「環境変数」表を参照）
4. 開発サーバーを起動: `npm run dev` → http://localhost:3000

> `.env.local` は Git 管理外（`.gitignore` 済み）。**実際の値は絶対にコミットしない**。
> `.env.local` を編集したら開発サーバーを **再起動** する（Next.js は環境変数をホットリロードしない）。

## 環境変数

### 最低限で起動できる
まず **`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` の 2 つ** があればアプリは起動する
（この 2 つが未設定だと、起動時にエラーになり全画面が表示できない）。
残りは使う機能ごとに設定すればよい。

### 一覧

| 変数 | 用途 | 必須性 | 取得先 | 未設定だと |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 接続（認証・DB） | **必須（最低限）** | Supabase: Settings > API | アプリ全体が起動不可 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー | **必須（最低限）** | Supabase: Settings > API | アプリ全体が起動不可 |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバーが全タスクを参照（RLS バイパス） | 必須（サーバー処理） | Supabase: Settings > API | メール集計 API 等が 500 |
| `GEMINI_API_KEY` | AI内田さん（`/assistant`） | 任意（AI 機能） | Google AI Studio | `/assistant` が 500（office チャットは簡易応答に退避） |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASSWORD` | 進捗サマリのメール送信 | 任意（メール機能） | 利用中の SMTP プロバイダ | メール送信が 500 |
| `SMTP_PORT` | SMTP ポート | 任意（既定 587） | 同上 | 587 を使用 |
| `SMTP_FROM` | 送信元アドレス | 任意（既定 = `SMTP_USER`） | 同上 | `SMTP_USER` を使用 |
| `CRON_SECRET` | 定期メール送信の認可シークレット | 任意（定期送信時） | 自分でランダム生成（`openssl rand -hex 32`） | スケジューラ経由の送信が不可 |
| `APP_URL` | メール本文内リンクの URL | 任意（既定あり） | 自サイトの URL | 既定の本番 URL にフォールバック |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` と `GEMINI_API_KEY` は強力な秘密情報。
> **ブラウザに出さない**（`NEXT_PUBLIC_` を付けない）。**漏洩したら即ローテート** する。

### 本番・プレビュー（Vercel）への設定
ローカルの `.env.local` は **手元専用**。本番／プレビューで動かすには、同じ変数を
**Vercel の Project Settings → Environment Variables** に登録する必要がある。

- **Production / Preview / Development** の各スコープに設定する（必要なスコープを外すと、その環境で動かない）。
- **`NEXT_PUBLIC_*` はビルド時にコードへ焼き込まれる**。未設定のままビルドすると、
  **プレビューを含めアプリ全体がクラッシュ** する（実行時ではなくビルド時に値が固定されるため）。
  → デプロイ前に、対象スコープへ必ず設定しておくこと。
- `APP_URL` は本番では実サイトの URL を設定する（未設定だと `src/lib/summary.ts` の既定 URL に
  フォールバックし、メール内リンクが意図しない先を指す場合がある）。

## 開発ルール
運用ルール・ブランチ戦略・コーディング規約は [CLAUDE.md](./CLAUDE.md) を参照。

要点:
- `main` は常に動く完成版。`main` への反映は必ず PR 経由（直接 push 禁止）。
- 作業は `main` から `feature/<機能名>` ブランチを切って行う。
- 公開は Vercel（`main` マージで本番反映、PR ごとにプレビュー URL を自動生成）。

## 開発の流れ
1. `main` を最新にする（`git switch main` → `git pull`）
2. `main` から作業ブランチを切る（例: `git switch -c feature/login`）
3. 開発し、こまめにコミットする
4. 区切りがついたら PR を作る
5. 他のメンバーが軽くレビューする
6. OK なら `main` にマージ → Vercel が自動で本番へ反映
