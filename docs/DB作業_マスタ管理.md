# DB作業：マスタ管理・定型タスク・共有先

対象ブランチ：`feature/admin-users-master`
最終更新：2026-07-28

コード側の引き継ぎ → **[引き継ぎ_マスタ管理.md](引き継ぎ_マスタ管理.md)**

---

## まず結論

- **実行するのは新規テーブル 5本だけ**です
- **既存テーブル（`tasks` / `profiles` / `email_settings`）への変更は一切ありません**（`ALTER` なし）
- **実行しなくてもアプリは壊れません。** テーブルが無いときはコード内の既定値で動きます
- 実行順は任意です。ただし `mail_recipients` だけ `profiles` を参照します（既存なので問題なし）
- どれも **何度実行しても安全**（`create table if not exists` ＋ `on conflict do nothing`）

---

## 実行手順

Supabase → **SQL Editor** で、以下のファイルの中身をそのまま貼って実行します。

| # | ファイル | テーブル | 無いとどうなるか |
|---|---|---|---|
| 1 | `scripts/sql/task_priorities.sql` | `task_priorities` | 優先度タブの保存が失敗。表示は既定値（高/中/低）で正常 |
| 2 | `scripts/sql/task_statuses.sql` | `task_statuses` | 状態タブの保存が失敗。表示は既定値で正常 |
| 3 | `scripts/sql/task_types.sql` | `task_types` | 種別タブの保存が失敗。表示は既定値で正常 |
| 4 | `scripts/sql/task_templates.sql` | `task_templates` | 雛形の**編集**ができない。**生成は既定の雛形で動く** |
| 5 | `scripts/sql/mail_recipients.sql` | `mail_recipients` | 共有先を登録できない。**送信は従来どおり `email_settings` の文字列で動く** |

保存に失敗したときは、画面に原因が出るようにしてあります。

> 優先度マスタのテーブルがまだありません。scripts/sql/task_priorities.sql を Supabase で実行してください。

---

## 各テーブルの中身

### 1. `task_priorities`（優先度マスタ）

| 列 | 型 | 説明 |
|---|---|---|
| `code` | text PK | `high` / `mid` / `low`。**編集不可** |
| `label` | text | 表示名（高／中／低） |
| `color` | text | **色キー**（`red` / `amber` / `green` / `blue` / `purple` / `gray`） |
| `updated_at` | timestamptz | |

seed：`high,高,red` / `mid,中,amber` / `low,低,gray` ← **いまのコードと同じ値**なので、実行しても見た目は変わりません。

### 2. `task_statuses`（状態マスタ）

列は `task_priorities` と同じ構成です。

seed：`todo,未着手,gray` / `in_progress,進行中,blue` / `done,完了,green`

⚠ 状態の色キーは**バッジの色と、タスク行の左端の縦線の色の2つ**に展開されます
（`src/lib/statuses.ts` の `STATUS_COLORS`）。

### 3. `task_types`（種別マスタ）

| 列 | 型 | 説明 |
|---|---|---|
| `code` | text PK | `design` / `implementation` / `test` / `research` / `review` / `documentation` |
| `label` | text | 表示名 |
| `updated_at` | timestamptz | |

**色の列はありません。** 種別はプルダウンにしか出ないためです（ダッシュボードで種別別集計を出すときに追加）。

### 4. `task_templates`（定型タスクマスタ）

| 列 | 型 | 説明 |
|---|---|---|
| `code` | text PK | 内部ID。名前を変えても同じ雛形として扱うため |
| `name` | text | 雛形名。親タスク名の既定値にもなる |
| `priority` | text | 生成する親子タスクに適用 |
| `items` | jsonb | 子タスク配列 `[{"title":"設計","task_type":"design"}, ...]` |
| `sort_order` | int | |
| `updated_at` | timestamptz | |

子タスクを別テーブルにせず `jsonb` にしています。**常に雛形とセットで読み書きするので、
分けても結合が増えるだけ**だからです。

seed：新機能の実装（子3）／結合試験の実施（子4）／月次レポート（子2）

### 5. `mail_recipients`（共有先マスタ）

| 列 | 型 | 説明 |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid NULL | **メンバー**の場合 `profiles.id`（外部なら NULL） |
| `email` | text NULL | **外部アドレス**の場合のみ（メンバーなら NULL） |
| `label` | text NULL | 外部アドレスの表示名 |
| `send_as` | text | `to` / `bcc`（既定 `bcc`） |
| `enabled` | boolean | 定期サマリを受け取るか |
| `sort_order` | int | |

制約が2つあります。

- `user_id` は `profiles(id)` を参照（`on delete cascade`）
  → **メンバーを削除すると宛先からも自動で消えます**
- `check ((user_id is null) <> (email is null))`
  → **メンバーか外部アドレスのどちらか一方**しか入りません

メンバーのメールアドレスをこの表に持たないのは、**`profiles` にある値の2つ目のコピーを作らないため**です（古くなって食い違う）。

---

## RLS（アクセス制御）の方針

5本とも同じです。

```sql
alter table public.<テーブル名> enable row level security;

-- ログインユーザーは読める（タスク一覧がラベルを必要とするため）
create policy "authenticated_read_..." on public.<テーブル名>
  for select to authenticated using (true);
```

**書き込みポリシーは意図的に作っていません。**

書けるのは**サービスロールを使うサーバ（`/api/admin/*`）だけ**になり、
「誰がマスタを編集してよいか」の判断がサーバ側に固定されます。
ブラウザから直接書き換えることはできません。

---

## 実行後の確認手順

SQL を流したら、以下を1回ずつ試してください。**ここが未検証のまま残っている部分です。**

### 優先度・状態・種別

1. `/admin/users` → 各タブ → 「編集」で表示名を変えて保存
2. **保存が成功する**（エラーが出ない）
3. `/tasks` を開き、**バッジ・プルダウン・絞り込みがすべて新しい名前になっている**
4. 元に戻す

これが通れば、読み込み側（PR1相当）と保存側（PR2相当）の両方が繋がっています。

### 定型タスク

1. `/tasks` → サイドバー「定型タスク」→ 雛形を選ぶ → 名前を入れて生成
2. **親タスク1件＋子タスクが一覧に増える**
3. 全部「未着手」、担当者・期限・見積は空

### 共有先

1. `/admin/users` → ✉️ 共有先 → メンバーを1人追加
2. 「テスト送信」（自分にだけ届く）
3. 届いたら「今すぐ送信」

⚠ **共有先を1件でも登録すると、宛先の出どころがマスタに切り替わります。**
登録が0件のあいだは、従来どおり `email_settings` に保存済みの文字列へ送られます。

---

## 触ってはいけないもの

### `email_settings` の `to_recipients` / `bcc_recipients` を消さないこと

画面からは編集できなくしましたが、**値は残してあります。**

`mail_recipients` が空のあいだ、**送信処理はこの文字列を宛先として使います**。
消すと、共有先を登録するまでサマリメールが誰にも届かなくなります。

共有先の運用が始まって、送信が問題なく回るのを確認してから消してください。

### `tasks` テーブルの CHECK 制約

`priority` / `status` / `task_type` には「この値しか入れられない」制約が付いています。
**マスタで4つ目を作れないのはこのためです。** 外すと、
`"done"` を前提にしている約25か所（進捗率・アーカイブ・植林・親子の自動完了）が壊れます。

増やす必要が出たときは、**制約の変更だけでなくアプリ側の判定を全部洗い出してから**にしてください。
