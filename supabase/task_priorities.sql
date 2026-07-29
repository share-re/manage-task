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
