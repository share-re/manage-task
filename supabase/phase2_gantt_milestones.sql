-- フェーズ2：ガント／マイルストーン／稲妻線の土台（PR1）
-- 要件：AI活用効果測定_進捗管理_要件ドラフト.md（Q-07/08/10/11・要確認-4/-10）
--       フェーズ2_実装手順ガイド.md（Step 1）
-- Supabase の SQL Editor に貼り付けて実行する。何度流しても安全になるよう
-- 「if not exists / drop ... if exists」で書く。
--
-- 方針：
--   - 既存の tasks 行を壊さない（追加列はすべて NULL 可）。
--   - 新テーブルには必ず RLS を付ける（tasks と同じ「ログインユーザーは全員読み書き可」モデル）。
--   - 案件（projects）は新階層。中立な既定案件を1行だけ seed し、既存タスクをそこへ backfill。
--   - 難易度と同じく、稲妻線の計画値は列に持たず、baseline とアプリ側計算で出す。

-- ============================================================
-- 1) tasks：開始日 ＋ 当初計画の凍結（baseline）
--    - start_date … ガントの棒の左端（Q-08）
--    - baseline_start / baseline_due … 稲妻線を“動く的”にしないための当初計画（要確認-4）
--      アプリ側で「初回保存時に start_date / due_date をコピー」する。既存行はここで backfill。
-- ============================================================
alter table public.tasks
  add column if not exists start_date     date,
  add column if not exists baseline_start date,
  add column if not exists baseline_due   date;

-- 既存タスクの baseline を現在値から埋める（未設定のものだけ）
update public.tasks set baseline_due   = due_date   where baseline_due   is null and due_date   is not null;
update public.tasks set baseline_start = start_date where baseline_start is null and start_date is not null;

-- ★決定待ち（要確認-6：作業の性質軸）。「足す」で確定したらコメントを外す。
-- alter table public.tasks
--   add column if not exists work_nature text;
-- alter table public.tasks
--   drop constraint if exists tasks_work_nature_check;
-- alter table public.tasks
--   add constraint tasks_work_nature_check
--   check (work_nature is null or work_nature in ('new','modify','bugfix'));

-- ============================================================
-- 2) projects：案件（新階層）＋ tasks.project_id
--    - まず中立な既定案件を1行 seed（※実案件名は入れない）。
--    - 既存タスクを既定案件へ backfill。切替UI・RLSの見せ分けは後フェーズ。
-- ============================================================
create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  status     text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now()
);

-- 既定案件を1回だけ作る（既に1件でもあれば作らない）
insert into public.projects (name, status)
select '既定案件', 'active'
where not exists (select 1 from public.projects);

alter table public.tasks
  add column if not exists project_id uuid references public.projects(id);

-- 既存タスクを一番古い案件（＝既定案件）へ寄せる
update public.tasks
set project_id = (select id from public.projects order by created_at limit 1)
where project_id is null;

create index if not exists tasks_project_id_idx on public.tasks(project_id);

-- ============================================================
-- 3) task_dependencies：依存（Finish-to-Start のみ）… Q-07
--    - 循環（A→B→A）はアプリ側の hasCycle で入力時に弾く（DBでは持たない）。
--    - 「同一案件内に限る」もアプリ側で担保（predecessor と successor の project_id 一致）。
-- ============================================================
create table if not exists public.task_dependencies (
  id             uuid primary key default gen_random_uuid(),
  predecessor_id uuid not null references public.tasks(id) on delete cascade,
  successor_id   uuid not null references public.tasks(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (predecessor_id, successor_id),
  check (predecessor_id <> successor_id)   -- 自分自身への依存を禁止
);
create index if not exists task_dependencies_pred_idx on public.task_dependencies(predecessor_id);
create index if not exists task_dependencies_succ_idx on public.task_dependencies(successor_id);

-- ============================================================
-- 4) milestones：節目（納期/レビュー/リリース）… Q-11
--    - project_id で案件スコープ。assignee_id は既存 profiles を参照。
-- ============================================================
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id),
  title       text not null,
  due_date    date not null,
  kind        text not null check (kind in ('deadline','review','release')),
  achieved    boolean not null default false,
  assignee_id uuid references public.profiles(id),
  note        text,
  created_at  timestamptz not null default now()
);
-- 古い milestones（project_id 列なし）が既にある場合に備えて後付けする
-- （create table if not exists は既存テーブルの列を足さないため）。
alter table public.milestones
  add column if not exists project_id uuid references public.projects(id);
create index if not exists milestones_project_id_idx on public.milestones(project_id);

-- 5) milestone_tasks：マイルストーン⇔タスク（多対多）… 着手前決定4
create table if not exists public.milestone_tasks (
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  task_id      uuid not null references public.tasks(id) on delete cascade,
  primary key (milestone_id, task_id)
);

-- ============================================================
-- 6) RLS：新テーブルは「ログイン済みユーザーなら全員 読み書き可」
--    （tasks と同じ共有モデル。案件ごとの見せ分けは後フェーズで RLS を足す）
-- ============================================================
alter table public.projects          enable row level security;
alter table public.task_dependencies enable row level security;
alter table public.milestones        enable row level security;
alter table public.milestone_tasks   enable row level security;

drop policy if exists "auth read-write projects"          on public.projects;
drop policy if exists "auth read-write task_dependencies" on public.task_dependencies;
drop policy if exists "auth read-write milestones"        on public.milestones;
drop policy if exists "auth read-write milestone_tasks"   on public.milestone_tasks;

create policy "auth read-write projects" on public.projects
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth read-write task_dependencies" on public.task_dependencies
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth read-write milestones" on public.milestones
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth read-write milestone_tasks" on public.milestone_tasks
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
