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
