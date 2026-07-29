# DB作業：実行用SQL（全文）

対象ブランチ：`feature/admin-users-master`
最終更新：2026-07-28

**このファイル1つで DB 作業が完結します。** 背景や列の意味は
[DB作業_マスタ管理.md](DB作業_マスタ管理.md) を参照してください。

---

## 実行のしかた

Supabase → **SQL Editor** を開き、下の 1〜5 のコードブロックを
**上から順にそのまま貼って実行**してください。

- **新規テーブル5本だけ**です。既存テーブル（`tasks` / `profiles` / `email_settings`）への
  変更（`ALTER`）は**一切ありません**
- **何度実行しても安全**です（`if not exists` ＋ `on conflict do nothing`）
- **実行しなくてもアプリは壊れません。** テーブルが無いあいだはコード内の既定値で動きます

### ⚠ 手で書き写さないでください

各ブロックには、表形式の説明には書ききれないものが含まれています。

- **初期データ**（高/中/低 などのseed）— 無いと画面が空になります
- **RLSポリシー**（読み取りのみ許可）— 無いと誰も読めません
- **制約**（`send_as` は to/bcc のみ、メンバーか外部かの排他チェックなど）

### ⚠ 既存の `email_settings.to_recipients` / `bcc_recipients` は消さないでください

画面からは編集できなくしましたが、値は生きています。`mail_recipients` が空のあいだ、
**送信処理はこの文字列を宛先として使います。** 消すと、共有先を登録するまで
サマリメールが誰にも届かなくなります。

---

## 1. 優先度マスタ（`task_priorities`）

`supabase/task_priorities.sql`

```sql
-- Priority master (優先度マスタ) — PR1: the table and today's values.
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Only the label and color are data. The codes (high / mid / low) stay in the
-- application, because tasks.priority stores them and very likely has a CHECK
-- constraint on those three values. Nothing here touches the tasks table, so
-- this is additive: if the app cannot read this table it falls back to the
-- values compiled into src/lib/priorities.ts and looks exactly as before.

create table if not exists public.task_priorities (
  -- Matches TaskPriority in src/lib/tasks.ts and the value stored in
  -- tasks.priority. Not editable from the master screen.
  code text primary key,
  -- Shown in the badge and in every priority dropdown.
  label text not null,
  -- Color KEY, not CSS. Resolved to Tailwind classes by PRIORITY_COLORS in
  -- src/lib/priorities.ts — Tailwind only emits classes it can see in the
  -- source, so storing class names here would render unstyled.
  color text not null,
  updated_at timestamptz not null default now()
);

-- Seed the three levels exactly as they are hard-coded today, so applying this
-- migration produces no visible change.
insert into public.task_priorities (code, label, color) values
  ('high', '高', 'red'),
  ('mid',  '中', 'amber'),
  ('low',  '低', 'gray')
on conflict (code) do nothing;

alter table public.task_priorities enable row level security;

-- Logged-in users may read: every task list needs the labels. No write policy
-- exists, so the only writer is the admin API, which uses the service-role key
-- (service role bypasses RLS). Same shape as the knowledge table.
drop policy if exists "authenticated_read_task_priorities" on public.task_priorities;
create policy "authenticated_read_task_priorities"
  on public.task_priorities for select to authenticated using (true);
```

## 2. 状態マスタ（`task_statuses`）

`supabase/task_statuses.sql`

```sql
-- Status master (状態マスタ) — PR1: the table and today's values.
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Same shape as task_priorities: only the label and color are data. The codes
-- (todo / in_progress / done) stay in the application, and "done" in particular
-- is woven through progress, archiving, the forest and the parent/child sync —
-- which status counts as finished is not something a master screen can change.

create table if not exists public.task_statuses (
  -- Matches TaskStatus in src/lib/tasks.ts and the value stored in
  -- tasks.status. Not editable from the master screen.
  code text primary key,
  -- Shown in the status badge and in every status dropdown.
  label text not null,
  -- Color KEY, not CSS. Resolved by STATUS_COLORS in src/lib/statuses.ts to
  -- both a badge class and the row's left bar color.
  color text not null,
  updated_at timestamptz not null default now()
);

-- Seed exactly what is hard-coded today, so applying this changes nothing.
insert into public.task_statuses (code, label, color) values
  ('todo',        '未着手', 'gray'),
  ('in_progress', '進行中', 'blue'),
  ('done',        '完了',   'green')
on conflict (code) do nothing;

alter table public.task_statuses enable row level security;

-- Logged-in users may read: every task list needs the labels. No write policy
-- exists, so the only writer is the admin API via the service-role key.
drop policy if exists "authenticated_read_task_statuses" on public.task_statuses;
create policy "authenticated_read_task_statuses"
  on public.task_statuses for select to authenticated using (true);
```

## 3. 種別マスタ（`task_types`）

`supabase/task_types.sql`

```sql
-- Task type master (種別マスタ) — PR1: the table and today's values.
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Third of the same shape as task_priorities / task_statuses. Only the label is
-- data here: unlike priority and status, a task type has no color anywhere in
-- the UI yet (it appears only in the two dropdowns), so there is nothing for a
-- color to paint. Add the column when the dashboard starts showing types.
--
-- The codes stay in the application: tasks.task_type has a CHECK constraint on
-- exactly these six values, so a seventh would need a schema change.

create table if not exists public.task_types (
  -- Matches TaskType in src/lib/tasks.ts and the value stored in
  -- tasks.task_type. Not editable from the master screen.
  code text primary key,
  -- Shown in the task type dropdown on the new-task and edit forms.
  label text not null,
  updated_at timestamptz not null default now()
);

-- Seed exactly what is hard-coded today, so applying this changes nothing.
insert into public.task_types (code, label) values
  ('design',         '設計'),
  ('implementation', '実装'),
  ('test',           'テスト'),
  ('research',       '調査'),
  ('review',         'レビュー'),
  ('documentation',  '資料作成')
on conflict (code) do nothing;

alter table public.task_types enable row level security;

-- Logged-in users may read; the admin API (service role) is the only writer.
drop policy if exists "authenticated_read_task_types" on public.task_types;
create policy "authenticated_read_task_types"
  on public.task_types for select to authenticated using (true);
```

## 4. 定型タスクマスタ（`task_templates`）

`supabase/task_templates.sql`

```sql
-- Task template master (定型タスクマスタ) — the table and the built-in templates.
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Unlike the other masters this is a new feature, not a move of existing
-- values. It is still additive: generating tasks touches only the tasks table,
-- so the built-in templates in src/lib/taskTemplates.ts already work without
-- this table. What the table adds is the ability to EDIT them.
--
-- The children live in a jsonb column rather than a second table: they are
-- always read and written together with their template, and at this scale a
-- join buys nothing.

create table if not exists public.task_templates (
  -- Stable identifier, not shown in the UI. Kept so a renamed template is
  -- still the same template.
  code text primary key,
  -- Offered in the sidebar, and the default parent task title.
  name text not null,
  -- Applied to the parent and every child on generation.
  priority text not null default 'mid',
  -- [{"title": "設計", "task_type": "design"}, ...] — task_type may be null.
  items jsonb not null default '[]'::jsonb,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- Seed the built-in templates so the table starts as a copy of what the code
-- already offers, and applying this changes nothing on screen.
insert into public.task_templates (code, name, priority, items, sort_order) values
  ('feature', '新機能の実装', 'mid', '[
     {"title": "設計",       "task_type": "design"},
     {"title": "実装",       "task_type": "implementation"},
     {"title": "単体テスト", "task_type": "test"}
   ]'::jsonb, 1),
  ('integration_test', '結合試験の実施', 'mid', '[
     {"title": "試験項目書の作成", "task_type": "documentation"},
     {"title": "試験の実施",       "task_type": "test"},
     {"title": "エビデンスの整理", "task_type": "documentation"},
     {"title": "結果の報告",       "task_type": "documentation"}
   ]'::jsonb, 2),
  ('monthly_report', '月次レポート', 'low', '[
     {"title": "実績の集計", "task_type": "research"},
     {"title": "レビュー",   "task_type": "review"}
   ]'::jsonb, 3)
on conflict (code) do nothing;

alter table public.task_templates enable row level security;

-- Everyone logged in may read: the generate button belongs to the whole team,
-- not just admins. Only the admin API (service role) may write.
drop policy if exists "authenticated_read_task_templates" on public.task_templates;
create policy "authenticated_read_task_templates"
  on public.task_templates for select to authenticated using (true);
```

## 5. 共有先マスタ（`mail_recipients`）

`supabase/mail_recipients.sql`

```sql
-- Mail recipient master (共有先マスタ).
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Today the summary recipients live in email_settings as two comma-separated
-- strings, typed by hand. That is the same shape of problem the assignee field
-- had: a typo means the mail silently never arrives, and nobody can see who is
-- on the list without opening the settings screen.
--
-- Additive: the send route only uses this table when it holds at least one
-- enabled row, and otherwise keeps reading the strings. So creating the table
-- changes nothing until someone adds a recipient.

create table if not exists public.mail_recipients (
  id uuid primary key default gen_random_uuid(),
  -- A member (profiles.id). Their address comes from profiles, so it cannot
  -- drift out of date here. Null for an outside address.
  user_id uuid references public.profiles(id) on delete cascade,
  -- An address that belongs to no account — a mailing list, or someone who
  -- does not use the app. Null for a member.
  email text,
  -- Display name for an outside address. Members use their profile name.
  label text,
  -- To は宛先が互いに見える、Bcc は見えない。既定は Bcc。
  send_as text not null default 'bcc' check (send_as in ('to', 'bcc')),
  -- One flag, not two. The mock had 状態 and 定期サマリ separately, but the
  -- only thing this app sends is the summary, so "registered but not
  -- receiving" and "disabled" would mean exactly the same thing.
  enabled boolean not null default true,
  sort_order int not null default 0,
  updated_at timestamptz not null default now(),
  -- Exactly one of the two: a row is either a member or an outside address.
  constraint mail_recipients_target check ((user_id is null) <> (email is null))
);

-- A member appears at most once.
create unique index if not exists mail_recipients_user_idx
  on public.mail_recipients (user_id) where user_id is not null;
-- Case-insensitive: MEMBER@example.com and member@example.com are one address.
create unique index if not exists mail_recipients_email_idx
  on public.mail_recipients (lower(email)) where email is not null;

alter table public.mail_recipients enable row level security;

-- Logged-in users may read, so the settings screen can show who is on the
-- list. Only the admin API (service role) may write.
drop policy if exists "authenticated_read_mail_recipients" on public.mail_recipients;
create policy "authenticated_read_mail_recipients"
  on public.mail_recipients for select to authenticated using (true);
```

---

## 実行後の確認

### 優先度・状態・種別

1. `/admin/users` → 各タブ → 「編集」で表示名を変えて保存
2. **保存が成功する**（エラーが出ない）
3. `/tasks` を開き、バッジ・プルダウン・絞り込みが**すべて新しい名前**になっている
4. 元に戻す

これが通れば、読み込み側と保存側の両方が繋がっています。
**この確認はまだ誰も実施していません**（テーブルが無く実行できなかったため）。

### 定型タスク

1. `/tasks` → サイドバー「定型タスク」→ 雛形を選ぶ → 名前を入れて生成
2. 親タスク1件＋子タスクが一覧に増える（全部「未着手」、担当者・期限・見積は空）

### 共有先

1. `/admin/users` → ✉️ 共有先 → メンバーを1人追加
2. 「テスト送信」（自分にだけ届く）→ 届いたら「今すぐ送信」

⚠ **共有先を1件でも登録すると、宛先の出どころがマスタに切り替わります。**
登録が0件のあいだは、従来どおり `email_settings` の文字列へ送られます。

---

## うまくいかないときに出るメッセージ

テーブルが無い状態で保存すると、画面に原因が出ます。

> 優先度マスタのテーブルがまだありません。supabase/task_priorities.sql を Supabase で実行してください。

このメッセージが出たら、対応するブロックがまだ実行されていません。
