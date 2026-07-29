-- 懸念メモ（task_notes）― スキーマ／RLS／列権限／ソフト削除関数／対応状況stampトリガー
-- 上位文書：クエスト_要件定義/懸念メモ_実装手順書.md（v1.2 Step1）
--
-- 設計の要点（レビュー反映）：
--  ・投稿者は author(表示名テキスト) と author_id(profiles) の二段構え（tasks の assignee と同じ）。
--  ・削除は物理削除させない。ソフト削除(deleted_at)＋「投稿者本人か管理者」だけ（DB関数で強制）。
--  ・対応状況の証跡(resolved_by/at)はクライアントに書かせず、トリガーが auth.uid()/now() を刻む。
--  ・本文は空不可・上限300字（旧コメント移行分だけ長さを免除）。
--
-- Supabase SQL エディタ（owner）で実行する。

create table if not exists public.task_notes (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  body         text not null,                       -- メモ本文（100字は目安・上限300字）
  author       text,                                -- 投稿者の表示名（旧コメント移行・レガシー用）
  author_id    uuid references public.profiles(id), -- 投稿者（新規はこちらが正）
  resolved     boolean not null default false,      -- 対応状況：false=未対応 / true=対応済
  resolved_at  timestamptz,                         -- 証跡（トリガーが刻む）
  resolved_by  uuid references public.profiles(id), -- 証跡（トリガーが刻む）
  deleted_at   timestamptz,                         -- ソフト削除（null=生きている）
  migrated_from_comment_id uuid unique,             -- 旧 task_comments.id（移行の冪等キー＋移行分の判定）
  created_at   timestamptz not null default now()
);

-- 既に古い版の task_notes が作られている場合に備えて、足りない列を後から足す。
-- （create table if not exists は既存テーブルに列を追加しないため。フェーズ2の milestones と同じ対策）
alter table public.task_notes add column if not exists author      text;
alter table public.task_notes add column if not exists author_id   uuid references public.profiles(id);
alter table public.task_notes add column if not exists resolved    boolean not null default false;
alter table public.task_notes add column if not exists resolved_at timestamptz;
alter table public.task_notes add column if not exists resolved_by uuid references public.profiles(id);
alter table public.task_notes add column if not exists deleted_at  timestamptz;
alter table public.task_notes add column if not exists migrated_from_comment_id uuid;

-- 移行の冪等キー。unique 索引があれば on conflict (migrated_from_comment_id) が使える。
create unique index if not exists task_notes_migrated_from_comment_id_key
  on public.task_notes(migrated_from_comment_id);

-- 本文のガード：空（空白のみ）は不可／上限500字。移行分は旧コメントをそのまま通す。
-- （当初300字。引き継ぎメモには窮屈という利用者レビューを受けて500字へ緩和）
alter table public.task_notes drop constraint if exists task_notes_body_check;
alter table public.task_notes add constraint task_notes_body_check check (
  length(btrim(body)) > 0
  and (char_length(body) <= 500 or migrated_from_comment_id is not null)
);

create index if not exists task_notes_task_id_idx on public.task_notes(task_id);
-- 「！」判定は「未対応かつ未削除」だけを見るので部分インデックスを張る。
create index if not exists task_notes_open_idx
  on public.task_notes(task_id) where resolved = false and deleted_at is null;

-- ---------------------------------------------------------------- RLS
alter table public.task_notes enable row level security;

-- 古い版で作った「全部OK」ポリシーが残っていると、ポリシーは OR で評価されるため
-- 新しい制限（author_id の固定など）が無効化される。必ず消してから張り直す。
drop policy if exists task_notes_authenticated_all on public.task_notes;
drop policy if exists "auth read-write task_notes" on public.task_notes;
drop policy if exists "auth read task_notes"   on public.task_notes;
drop policy if exists "auth insert task_notes" on public.task_notes;
drop policy if exists "auth update task_notes" on public.task_notes;

-- 読む：全ログインユーザー（チーム共有）
create policy "auth read task_notes" on public.task_notes
  for select using (auth.uid() is not null);

-- 書く：全ログインユーザー。なりすまし防止で author_id は自分に固定。
create policy "auth insert task_notes" on public.task_notes
  for insert with check (auth.uid() is not null and author_id = auth.uid());

-- 更新：行レベルは全員可（対応済みの切替は全員できてよい）。触れる列は下の grant で絞る。
create policy "auth update task_notes" on public.task_notes
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- ------------------------------------------------------- 列レベルの権限
-- 物理削除は誰にも許可しない（ソフト削除のみ）。
revoke delete on public.task_notes from authenticated;

-- 本文・deleted_at・resolved_by/at をクライアントから直接いじれないようにし、
-- 更新できるのは「対応状況(resolved)」の1列だけにする。
revoke update on public.task_notes from authenticated;
grant  update (resolved) on public.task_notes to authenticated;

-- --------------------------------------------- 対応状況の刻印（サーバ側stamp）
-- resolved_by/at をクライアントに書かせると「他人が対応済みにしたことにする」詐称が可能。
-- ここで機械的に刻む（列権限も渡していないので二重に防いでいる）。
create or replace function public.task_notes_stamp_resolution()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- 新規は基本 resolved=false。true で入れられても刻印は機械的に決める。
    new.resolved_at := case when new.resolved then now() else null end;
    new.resolved_by := case when new.resolved then auth.uid() else null end;
    return new;
  end if;

  if new.resolved is distinct from old.resolved then
    new.resolved_at := case when new.resolved then now() else null end;
    new.resolved_by := case when new.resolved then auth.uid() else null end;
  else
    -- 対応状況が変わっていないなら、証跡は元の値のまま（書き換えさせない）
    new.resolved_at := old.resolved_at;
    new.resolved_by := old.resolved_by;
  end if;
  return new;
end;
$$;

drop trigger if exists task_notes_stamp_resolution_trg on public.task_notes;
create trigger task_notes_stamp_resolution_trg
  before insert or update on public.task_notes
  for each row execute function public.task_notes_stamp_resolution();

-- ------------------------------------------------------------ ソフト削除
-- クライアント側の判定は迂回できるので、権限チェックはここ（DB）で強制する。
create or replace function public.soft_delete_task_note(note_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare n public.task_notes%rowtype;
begin
  select * into n from public.task_notes where id = note_id;
  if not found then
    raise exception 'メモが見つかりません';
  end if;
  -- 投稿者本人 or 管理者（src/lib/roles.ts と同じ app_metadata.role で判定）
  if n.author_id is distinct from auth.uid()
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'general') <> 'admin' then
    raise exception '削除できるのは投稿者本人か管理者だけです';
  end if;
  update public.task_notes set deleted_at = now() where id = note_id;
end;
$$;

grant execute on function public.soft_delete_task_note(uuid) to authenticated;
