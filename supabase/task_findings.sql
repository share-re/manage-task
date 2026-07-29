-- 品質（task_findings）― テスト以降に見つかった不具合・指摘の記録
-- 上位文書：クエスト_要件定義/品質_実装手順書.md（v1.1 Step1）
--
-- 設計の要点：
--  ・記録先はリーフ（子タスク）。テストした側ではなく「テストされた作業」に付ける。
--  ・発見工程（テスト/レビュー/受入/リリース後）を1列で持つ。工程ごとにテーブルを分けない。
--  ・対応状況(resolved)は「直したか」。集計は発見総数で見るので、直しても総数は減らない。
--  ・削除は物理削除させない。ソフト削除＝「入力ミスの取り消し」専用で、集計からは除かない
--    （自分の記録を消して件数を下げられないようにするため）。
--  ・証跡(resolved_by/at)はクライアントに書かせず、トリガーが auth.uid()/now() を刻む。
--
-- Supabase SQL エディタ（owner）で実行する。何度実行しても安全。

create table if not exists public.task_findings (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  -- 発見工程。テスト以降の4区分。
  phase        text not null check (phase in ('test','review','accept','post')),
  body         text not null,                       -- 内容（1行）
  author       text,                                -- 記録者の表示名（レガシー用）
  author_id    uuid references public.profiles(id), -- 記録者（新規はこちらが正）
  found_on     date not null default current_date,  -- 発見日
  resolved     boolean not null default false,      -- 直したか
  resolved_at  timestamptz,                         -- 証跡（トリガーが刻む）
  resolved_by  uuid references public.profiles(id), -- 証跡（トリガーが刻む）
  -- 取り消し（入力ミスの取り消し専用）。集計では除外しない。
  deleted_at   timestamptz,
  created_at   timestamptz not null default now()
);

-- 既に古い版が作られている場合に備えて、足りない列を後から足す。
alter table public.task_findings add column if not exists author      text;
alter table public.task_findings add column if not exists author_id   uuid references public.profiles(id);
alter table public.task_findings add column if not exists found_on    date not null default current_date;
alter table public.task_findings add column if not exists resolved    boolean not null default false;
alter table public.task_findings add column if not exists resolved_at timestamptz;
alter table public.task_findings add column if not exists resolved_by uuid references public.profiles(id);
alter table public.task_findings add column if not exists deleted_at  timestamptz;

-- 本文のガード：空（空白のみ）は不可／上限500字（懸念メモと同じ上限に揃える）。
alter table public.task_findings drop constraint if exists task_findings_body_check;
alter table public.task_findings add constraint task_findings_body_check check (
  length(btrim(body)) > 0 and char_length(body) <= 500
);

create index if not exists task_findings_task_id_idx on public.task_findings(task_id);
-- 行のバッジは「未対応かつ未取り消し」だけを見るので部分インデックスを張る。
create index if not exists task_findings_open_idx
  on public.task_findings(task_id) where resolved = false and deleted_at is null;

-- 「テスト実施済み」フラグ。0件と未確認を区別するためにタスク側に持つ（null＝未確認）。
alter table public.tasks add column if not exists quality_checked_at timestamptz;

-- ---------------------------------------------------------------- RLS
alter table public.task_findings enable row level security;

-- 古い版の緩いポリシーが残っていると OR 評価で制限が無効化されるため、消してから張り直す。
drop policy if exists task_findings_authenticated_all on public.task_findings;
drop policy if exists "auth read task_findings"   on public.task_findings;
drop policy if exists "auth insert task_findings" on public.task_findings;
drop policy if exists "auth update task_findings" on public.task_findings;

-- 読む：全ログインユーザー（品質タブはチーム全員が見る）
create policy "auth read task_findings" on public.task_findings
  for select using (auth.uid() is not null);

-- 書く：全ログインユーザー。なりすまし防止で記録者は自分に固定。
create policy "auth insert task_findings" on public.task_findings
  for insert with check (auth.uid() is not null and author_id = auth.uid());

-- 更新：行レベルは全員可（対応済みの切替は全員できてよい）。触れる列は下の grant で絞る。
create policy "auth update task_findings" on public.task_findings
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- 物理削除は誰にも許可しない（ソフト削除のみ）。
revoke delete on public.task_findings from authenticated;

-- 本文・deleted_at・resolved_by/at をクライアントから直接いじれないようにし、
-- 更新できるのは「対応状況(resolved)」の1列だけにする。
revoke update on public.task_findings from authenticated;
grant  update (resolved) on public.task_findings to authenticated;

-- --------------------------------------------- 対応状況の刻印（サーバ側stamp）
-- resolved_by/at をクライアントに書かせると「他人が直したことにする」詐称が可能。
-- ここで機械的に刻む（列権限も渡していないので二重に防いでいる）。
create or replace function public.task_findings_stamp_resolution()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.resolved_at := case when new.resolved then now() else null end;
    new.resolved_by := case when new.resolved then auth.uid() else null end;
    return new;
  end if;

  if new.resolved is distinct from old.resolved then
    new.resolved_at := case when new.resolved then now() else null end;
    new.resolved_by := case when new.resolved then auth.uid() else null end;
  else
    -- 対応状況が変わっていないなら証跡は元の値のまま（書き換えさせない）
    new.resolved_at := old.resolved_at;
    new.resolved_by := old.resolved_by;
  end if;
  return new;
end;
$$;

drop trigger if exists task_findings_stamp_resolution_trg on public.task_findings;
create trigger task_findings_stamp_resolution_trg
  before insert or update on public.task_findings
  for each row execute function public.task_findings_stamp_resolution();

-- ------------------------------------------------------------ 取り消し（ソフト削除）
-- クライアント側の判定は迂回できるので、権限チェックはここ（DB）で強制する。
create or replace function public.soft_delete_task_finding(finding_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare f public.task_findings%rowtype;
begin
  select * into f from public.task_findings where id = finding_id;
  if not found then
    raise exception '記録が見つかりません';
  end if;
  -- 記録者本人 or 管理者（src/lib/roles.ts と同じ app_metadata.role で判定）
  if f.author_id is distinct from auth.uid()
     and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'general') <> 'admin' then
    raise exception '取り消せるのは記録した本人か管理者だけです';
  end if;
  update public.task_findings set deleted_at = now() where id = finding_id;
end;
$$;

grant execute on function public.soft_delete_task_finding(uuid) to authenticated;

-- ------------------------------------------------- 記録の追加 → 担当者へ通知
-- 既存の通知テーブル・ベルUIに合流する（新しい通知UIは作らない）。
alter table public.notifications
  add column if not exists finding_id uuid references public.task_findings(id) on delete cascade;

create or replace function public.notify_on_task_finding()
returns trigger
language plpgsql
security definer          -- 他人（担当者）宛の行を作るので RLS をバイパスする
set search_path = public
as $$
declare v_assignee uuid;
begin
  select assignee_id into v_assignee from public.tasks where id = new.task_id;

  -- 担当者なしは宛先がないので通知しない。
  if v_assignee is null then
    return null;
  end if;

  -- 自分の担当タスクに自分で記録した場合は通知しない。
  if v_assignee = new.author_id then
    return null;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, task_id, finding_id)
  values (v_assignee, new.author_id, 'finding', new.task_id, new.id);

  return null;
end;
$$;

drop trigger if exists notify_on_task_finding_trg on public.task_findings;
create trigger notify_on_task_finding_trg
  after insert on public.task_findings
  for each row execute function public.notify_on_task_finding();
