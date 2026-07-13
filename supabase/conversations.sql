-- AI内田さん：会話履歴の保存用テーブル（Issue 10 / 要件定義 FT-01）
-- Supabase の SQL Editor に貼り付けて実行する。
-- 方針：本人だけが自分の会話を読み書きできる（RLS で保護）。

-- 1) 会話の単位（1スレッド）
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) 会話の中の1発言（user=利用者 / model=AI内田さん）
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'model')),
  text            text not null,
  created_at      timestamptz not null default now()
);

-- 3) 並び替え・絞り込みを速くするためのインデックス
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at);
create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);

-- 4) RLS（行レベルセキュリティ）を有効化
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- 5) ポリシー：conversations は「本人の行」だけ全操作OK
drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6) ポリシー：messages は「親の会話が本人のもの」だけ全操作OK
drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
