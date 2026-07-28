-- アプリ内通知（notifications）― スキーマ／RLS／列権限／懸念メモ追加トリガー／Realtime配信
-- 上位文書：クエスト_要件定義/懸念メモ_実装手順書.md（Step6 通知＋ベル）
--
-- 設計の要点：
--  ・受け取る本人だけが読める／既読にできる（RLS）。他人の通知は見えない。
--  ・クライアントからの insert は禁止。通知は懸念メモ追加トリガー（SECURITY DEFINER）だけが作る。
--  ・既読フラグ以外はクライアントに書かせない（列権限で read だけ grant）。
--  ・通知が飛ぶのは「他人が、担当者のいるタスクに懸念メモを追加したとき」だけ。
--    自分の投稿／担当者なし／旧コメントからの移行分は飛ばさない。
--
-- Supabase SQL エディタ（owner）で実行する。

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade, -- 受け取る人
  actor_id     uuid references public.profiles(id),  -- 通知の原因を作った人（メモ投稿者）
  type         text not null,                        -- 種別。今は 'concern_note' のみ
  task_id      uuid references public.tasks(id) on delete cascade,
  note_id      uuid references public.task_notes(id) on delete cascade,
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- 古い版がある場合に備えて足りない列を後から足す（create table if not exists は列を足さない）。
alter table public.notifications add column if not exists actor_id uuid references public.profiles(id);
alter table public.notifications add column if not exists task_id  uuid references public.tasks(id) on delete cascade;
alter table public.notifications add column if not exists note_id  uuid references public.task_notes(id) on delete cascade;
alter table public.notifications add column if not exists read     boolean not null default false;

-- ベルは「自分宛の未読を新しい順」で引くので、その形の索引を張る。
create index if not exists notifications_recipient_idx
  on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications(recipient_id) where read = false;

-- ---------------------------------------------------------------- RLS
alter table public.notifications enable row level security;

-- 古い版の緩いポリシーが残っていると OR 評価で制限が無効化されるため、消してから張り直す。
drop policy if exists "own read notifications"   on public.notifications;
drop policy if exists "own update notifications" on public.notifications;
drop policy if exists notifications_authenticated_all on public.notifications;

-- 読む：自分宛だけ。
create policy "own read notifications" on public.notifications
  for select using (recipient_id = auth.uid());

-- 更新：自分宛だけ（触れる列は下の grant で read 1列に絞る）。
create policy "own update notifications" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

-- 挿入・削除はクライアントに許可しない（通知はトリガーだけが作る）。
revoke insert, delete on public.notifications from authenticated;
revoke update on public.notifications from authenticated;
grant  update (read) on public.notifications to authenticated;

-- ------------------------------------------------- 懸念メモ追加 → 担当者へ通知
create or replace function public.notify_on_task_note()
returns trigger
language plpgsql
security definer          -- 他人（担当者）宛の行を作るので RLS をバイパスする
set search_path = public
as $$
declare v_assignee uuid;
begin
  -- 旧コメントからの移行分は通知しない（過去ログで一斉にベルが鳴るのを防ぐ）。
  if new.migrated_from_comment_id is not null then
    return null;
  end if;

  select assignee_id into v_assignee from public.tasks where id = new.task_id;

  -- 担当者なしは宛先がないので通知しない。将来ウォッチャー／作成者へ広げる余地あり。
  if v_assignee is null then
    return null;
  end if;

  -- 自分のタスクに自分で書いた場合は通知しない。
  if v_assignee = new.author_id then
    return null;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, task_id, note_id)
  values (v_assignee, new.author_id, 'concern_note', new.task_id, new.id);

  return null;
end;
$$;

drop trigger if exists notify_on_task_note_trg on public.task_notes;
create trigger notify_on_task_note_trg
  after insert on public.task_notes
  for each row execute function public.notify_on_task_note();

-- ---------------------------------------------------------------- Realtime
-- アプリを開いている間、自分宛の新着をベルに即時反映するため配信対象に加える。
-- 既に追加済みだとエラーになるので握りつぶす。
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when others then null;
end;
$$;
