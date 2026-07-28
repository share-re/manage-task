-- フェーズ3：工数管理・生産性 ― 日次工数ログ＋簡易マスタ
-- 上位文書：クエスト_要件定義/AI活用効果測定_進捗管理_要件ドラフト.md（第15章 / 要確認-7・12 / F-09）
--
-- 決定（2026-07-28）：
--  ・actual_hours は task_time_logs の合計を“正”とする（derived）。完了時手入力も1ログとして書く。
--  ・A/推移の週月バケットは completed_at（完了日）基準。日次ログは実績合計の積み上げ用。
--
-- ※RLS は既存テーブル（projects/milestones 等）と同一スタイルに合わせる。

-- 日次工数ログ：日次入力の加算元。actual_hours はこの合計から再計算する。
create table if not exists public.task_time_logs (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  work_date  date not null,                       -- 作業日（実績を積んだ日）
  hours      numeric(5,1) not null check (hours >= 0), -- その日の実績時間（0.5h刻み）
  member_id  uuid references public.profiles(id), -- 入力者（任意・本人タブ用）
  note       text,                                -- 任意メモ
  created_at timestamptz not null default now()
);
create index if not exists task_time_logs_task_id_idx  on public.task_time_logs(task_id);
create index if not exists task_time_logs_work_date_idx on public.task_time_logs(work_date);

-- 簡易マスタ（人日換算係数など）。キー・バリューで1行ずつ持つ。
create table if not exists public.app_settings (
  key        text primary key,
  value      numeric not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value)
  values ('person_day_hours', 8)   -- 人日換算係数（時間/人日）… 第15章
  on conflict (key) do nothing;

-- 既存タスクを1本のログに backfill（actual_hours>0 かつ ログ未作成のもの）。
-- work_date は完了日、未完了なら作成日。二重投入は not exists で防ぐ。
insert into public.task_time_logs (task_id, work_date, hours)
select t.id,
       coalesce(t.completed_at::date, t.created_at::date, current_date),
       t.actual_hours
from public.tasks t
where t.actual_hours is not null
  and t.actual_hours > 0
  and not exists (
    select 1 from public.task_time_logs l where l.task_id = t.id
  );

-- RLS（既存テーブルと同一：ログインユーザーに開放＝チーム共有モデル）
alter table public.task_time_logs enable row level security;
alter table public.app_settings   enable row level security;

drop policy if exists "auth read-write task_time_logs" on public.task_time_logs;
drop policy if exists "auth read-write app_settings"   on public.app_settings;

create policy "auth read-write task_time_logs" on public.task_time_logs
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth read-write app_settings" on public.app_settings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
