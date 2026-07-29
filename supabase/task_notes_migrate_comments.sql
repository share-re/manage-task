-- 懸念メモ ― 既存コメント（task_comments）→ メモ（task_notes）移行
-- 上位文書：クエスト_要件定義/懸念メモ_実装手順書.md（v1.2 Step3）
--
-- 前提：task_notes.sql を先に適用しておくこと。
-- 実行主体：Supabase SQL エディタ（owner＝postgres）。owner は RLS をバイパスするので、
--          insert ポリシーの「author_id = auth.uid()」に縛られず他人名義の行を投入できる
--          （移行に必要な前提）。アプリのクライアントからは実行しない。
--
-- 設計の要点：
--  ・task_comments の投稿者は author(表示名テキスト)のみで author_id は存在しない。
--    → author をそのまま残しつつ、profiles の名前/メール一致で author_id を best-effort 補完。
--  ・元コメントIDを migrated_from_comment_id に保持し、何度流しても増えない（冪等）。
--  ・既存分は「対応済」で入れる＝移行直後に「！」が一斉点灯しないようにする。

insert into public.task_notes (
  task_id, body, author, author_id, resolved, resolved_at, created_at,
  migrated_from_comment_id
)
select c.task_id,
       c.body,
       c.author,          -- 表示名はそのまま残す（投稿者が消えないように）
       p.id,              -- 一致すれば profiles.id、無ければ null
       true, now(),       -- 既存分は「対応済」
       c.created_at,
       c.id               -- 冪等キー
from public.task_comments c
left join lateral (
  select pr.id
  from public.profiles pr
  where (pr.name  is not null and btrim(pr.name)  = btrim(c.author))
     or (pr.email is not null and pr.email = c.author)
  order by pr.name nulls last
  limit 1                 -- 同名が複数いても1件に絞る（行が増えない）
) p on true
where btrim(coalesce(c.body, '')) <> ''   -- 空コメントは移さない（本文制約に引っかかる）
on conflict (migrated_from_comment_id) do nothing;

-- ------------------------------------------------- 移行後の確認（必ず実行）
-- 1) 件数が一致するか（空コメントを除いた数）
select (select count(*) from public.task_comments where btrim(coalesce(body,'')) <> '') as comments,
       (select count(*) from public.task_notes  where migrated_from_comment_id is not null) as migrated;

-- 2) 投稿者を引けなかった分（名前は残っているので表示は壊れない）
select count(*) as author_id_unresolved
from public.task_notes
where migrated_from_comment_id is not null and author_id is null;
