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
