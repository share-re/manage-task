-- AI内田さん：messages テーブルの件数上限を自動で守る仕組み
-- 方針：
--   ・messages テーブル「全体」（全ユーザー合計）の件数で判定する
--   ・400 件以上になったら Postgres ログに警告（WARNING）を出す
--   ・450 件を超えたら、一番古い会話（conversation）をまるごと削除して減らす
--     （会話を消すと、ぶら下がる messages は on delete cascade で一緒に消える）
-- 使い方：Supabase の SQL Editor に貼り付けて実行する。
--
-- しきい値を変えたいときは、下の warn_threshold / hard_limit の数字だけ直して
-- もう一度この SQL を実行し直せばよい（テストのときは 5 / 8 などに下げると試しやすい）。

create or replace function public.enforce_messages_limit()
returns trigger
language plpgsql
security definer          -- RLS を越えて「全ユーザー分」を数える／消すために必要
set search_path = public  -- security definer の安全対策（参照するスキーマを固定する）
as $$
declare
  total_count         bigint;
  oldest_conversation uuid;
  warn_threshold constant int := 400;  -- ここ以上で警告
  hard_limit     constant int := 450;  -- ここを超えたら削除
begin
  -- 今の総件数を数える
  select count(*) into total_count from public.messages;

  -- 400 件以上なら、警告をログに出す（Supabase の Logs で確認できる）
  if total_count >= warn_threshold then
    raise warning 'messages table has % rows (warn>=%, hard limit>%)',
      total_count, warn_threshold, hard_limit;
  end if;

  -- 450 件を超えている間、一番古い会話を1件ずつ消して減らす
  while total_count > hard_limit loop
    -- 「最初の発言がいちばん古い会話」を1件えらぶ
    select c.id into oldest_conversation
    from public.conversations c
    join public.messages m on m.conversation_id = c.id
    group by c.id
    order by min(m.created_at) asc
    limit 1;

    -- 念のため：消せる会話が無ければ無限ループを避けて抜ける
    exit when oldest_conversation is null;

    -- 会話を削除（ぶら下がる messages も cascade で一緒に消える）
    delete from public.conversations where id = oldest_conversation;

    -- 数え直して、まだ超えていれば次のいちばん古い会話へ
    select count(*) into total_count from public.messages;
  end loop;

  return null;  -- AFTER トリガーなので戻り値は使われない
end;
$$;

-- messages に1件 INSERT されるたびに、上の関数を走らせる
drop trigger if exists messages_limit_trigger on public.messages;
create trigger messages_limit_trigger
  after insert on public.messages
  for each row
  execute function public.enforce_messages_limit();


-- ============================================================
-- 画面（アプリ）用：全体件数を教えてくれる「窓口」
-- ・アプリの接続は RLS で自分の行しか見えないため、全体の件数を数えられない。
-- ・そこで security definer（RLS を越える権限で動く関数）を1つ用意し、
--   「全体の件数」と「しきい値」だけを返す（他人の会話の中身は返さない）。
-- ・アプリはこれを RPC（supabase.rpc）で呼び、400 件以上なら警告バナーを出す。
--
-- ※ 下の 400 / 450 は、上の enforce_messages_limit() の
--   warn_threshold / hard_limit と必ず同じ数字にそろえること。
-- ============================================================
create or replace function public.messages_status()
returns json
language sql
security definer          -- RLS を越えて「全体の件数」を数えるために必要
set search_path = public
stable                    -- データを書き換えない（読み取り専用）ことの宣言
as $$
  select json_build_object(
    'total',          (select count(*) from public.messages),
    'warn_threshold', 400,
    'hard_limit',     450
  );
$$;

-- ログイン済みユーザーだけがこの窓口を呼べるようにする
grant execute on function public.messages_status() to authenticated;
