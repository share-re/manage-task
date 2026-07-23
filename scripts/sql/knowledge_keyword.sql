-- Keyword-based knowledge search (issue #77, FR-Q2-04).
-- Run this once in the Supabase SQL Editor. Safe to re-run.

-- Keyword-mode ingest stores chunks as plain text, so the embedding column
-- must accept NULL. Rows written by the vector add-on (--embed) still fill it.
alter table public.knowledge alter column embedding drop not null;

-- Returns the chunks containing the most query terms. A row qualifies when
-- at least min_matches distinct terms appear in its heading or content
-- (ILIKE: ASCII is case-insensitive; Japanese matches literally). Ordering
-- is deterministic: more matches first, then file / position in file.
create or replace function public.match_knowledge_keyword(
  query_terms text[],
  match_count int,
  min_matches int
) returns table (
  source_file text,
  heading text,
  content text,
  matches int
)
language sql stable
as $$
  select s.source_file, s.heading, s.content, s.matches
  from (
    select
      k.source_file,
      k.heading,
      k.content,
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
