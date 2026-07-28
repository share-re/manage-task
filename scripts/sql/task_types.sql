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
