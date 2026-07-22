-- Knowledge base for the AI assistant (issue #77).
-- Run this once in the Supabase SQL Editor. Safe to re-run.

-- pgvector: adds the "vector" column type and similarity operators.
-- Bundled with every Supabase project; this just switches it on.
create extension if not exists vector;

create table if not exists public.knowledge (
  id uuid primary key default gen_random_uuid(),
  -- Path relative to docs/knowledge/, e.g. "AI研修_研修テキスト.md".
  source_file text not null,
  -- Nearest heading above the chunk; shown as the citation label.
  heading text not null default '',
  -- Position of the chunk within its file (0, 1, 2, ...).
  chunk_index int not null,
  content text not null,
  -- Gemini embedding, truncated to 768 dimensions (see scripts/ingest.ts).
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);

alter table public.knowledge enable row level security;

-- Logged-in users may read. No insert/update/delete policy exists, so the
-- only writer is the ingest script, which uses the service-role key
-- (service role bypasses RLS).
drop policy if exists "authenticated_read_knowledge" on public.knowledge;
create policy "authenticated_read_knowledge"
  on public.knowledge for select to authenticated using (true);

-- Similarity search used by the app.
-- "<=>" is cosine distance (0 = same direction, 2 = opposite), so
-- similarity = 1 - distance. Rows below min_similarity are dropped, which
-- is what makes casual chat return zero rows (requirement FR-Q2-04).
create or replace function public.match_knowledge(
  query_embedding vector(768),
  match_count int,
  min_similarity float
) returns table (
  source_file text,
  heading text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    k.source_file,
    k.heading,
    k.content,
    1 - (k.embedding <=> query_embedding) as similarity
  from public.knowledge k
  where 1 - (k.embedding <=> query_embedding) >= min_similarity
  order by k.embedding <=> query_embedding
  limit match_count;
$$;
