## 🏷️ 種類（あてはまるものに `x` を入れる）

- [ ] 🐛 バグ・不具合（動きがおかしい）
- [x] ✨ 新しい機能・改善のお願い
- [ ] ❓ 質問・相談
- [x] 📄 ドキュメント（説明文）の修正

---

## 📝 タイトルで伝えたいこと（一言で）

DBスキーマをコードで管理する（Supabase migration 整備）

---

## 📖 くわしい内容

現状、`tasks` / `task_comments` / `email_settings` / `email_send_log` の各テーブルは
Supabase 上に手作業で作られている前提で、リポジトリ内にスキーマ定義（SQL / migration）が
一切ありません。そのため、

- 新しい環境・新しいメンバーで同じ DB を再現できない
- コード側が「テーブルが存在しないかもしれない」前提の防御コードを持っている
  （例: コメント・送信ログの取得失敗を握りつぶす箇所）

という状態です。「`main` は常に動く完成版」という運用ルールと噛み合っていないため、
スキーマをコード化（migration 化）して、リポジトリだけで DB を再現できるようにします。

対象テーブル（現行コードが参照している列）:

| テーブル | 主な列 |
|---|---|
| `tasks` | id, title, assignee, due_date, status, parent_id, created_by, created_at, completed_at |
| `task_comments` | id, task_id, author, body, created_at |
| `email_settings` | id, recipients（旧）, to_recipients, bcc_recipients, frequency, day_of_week, send_time, enabled, updated_by, updated_at, last_sent_at |
| `email_send_log` | id, recipients, subject, status, error, sent_at |

---

## 🔁 再現手順（バグのときだけ）

特になし（改善のため該当なし）

---

## 🎯 本来どうなってほしいか（期待する結果）

- `supabase/migrations/` に現行の全テーブル定義が SQL として存在する
  （列・型・制約・RLS ポリシー・Realtime publication 設定を含む）
- 空の Supabase プロジェクトに migration を適用すれば、アプリが動作する状態になる
- 既存の本番テーブルと migration 定義に差分がない（現行を正しく写し取っている）
- 「テーブルが無いかもしれない」前提の防御コードを、将来的に整理できる土台ができる

## ⚠️ 実際にどうなったか（現状）

特になし（改善のため該当なし）

---

## 🖼️ 参考（スクリーンショット・リンクなど）

- Realtime: `public.tasks` の `postgres_changes`（channel: forest-tasks / office-tasks）
- Presence: channel `office-room`
- `created_by` は DB 側で `auth.uid()` を既定値にしている想定

---

## 💻 環境（バグのときだけ）

特になし

---

## 📌 補足・メモ

- Supabase CLI の導入が前提。パスワード・接続情報などの秘匿値は migration に含めない。
- `email_settings` の旧 `recipients` 列を「廃止するか温存するか」は、別の「コード品質整理」issue と連動。
- 実行順の目安: **本 issue（migration）を最初に**。以降の機能追加の土台になる。
- ファイル削除を伴う整理を行う場合は事前確認する（リポジトリ運用ポリシー）。
