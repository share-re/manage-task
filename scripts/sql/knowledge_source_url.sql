-- Source URL for knowledge chunks (issue #77 の出典表示 / #12).
-- Run this once in the Supabase SQL Editor. Safe to re-run.
--
-- Why: the assistant can cite which internal document an answer came from,
-- but documents summarised from an external page had no way to link back to
-- that page. This adds the original URL so the reply footer can link to it.

-- 1) Column: original page URL of the document a chunk came from.
--    NULL for internal materials that have no public URL (training texts, etc.).
alter table public.knowledge add column if not exists source_url text;

-- 2) Keyword search must return the new column too.
--    A function's return type cannot be changed in place, so drop first.
drop function if exists public.match_knowledge_keyword(text[], int, int);

create function public.match_knowledge_keyword(
  query_terms text[],
  match_count int,
  min_matches int
) returns table (
  source_file text,
  heading text,
  content text,
  source_url text,
  matches int
)
language sql stable
as $$
  select s.source_file, s.heading, s.content, s.source_url, s.matches
  from (
    select
      k.source_file,
      k.heading,
      k.content,
      k.source_url,
      k.chunk_index,
      (
        select count(*)::int
        from unnest(query_terms) as t
        where k.content ilike '%' || t || '%'
           or k.heading ilike '%' || t || '%'
      ) as matches
    from public.knowledge k
  ) as s
  where s.matches >= min_matches
  order by s.matches desc, s.source_file, s.chunk_index
  limit match_count;
$$;

-- 3) Vector search (add-on, unused while keyword is primary). Uncomment and
--    run only if the vector path is put back in front of the assistant.
-- drop function if exists public.match_knowledge(vector, int, float);
-- ...same idea: add source_url to the returned columns.
