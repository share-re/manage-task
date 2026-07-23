import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { extractKeywords } from "./knowledgeKeywords";

// Knowledge retrieval for the assistant (issue #77).
//
// Primary method: keyword matching (FR-Q2-04). Content words are extracted
// from the user's message and match_knowledge_keyword
// (scripts/sql/knowledge_keyword.sql) returns the chunks containing the
// most of them. No embedding API call, so retrieval is unaffected by the
// embedding free-tier daily cap.
//
// Best-effort by design: any failure returns [] so the assistant simply
// answers without extra context (縮退動作, FR-Q2-04).

export type KnowledgeHit = {
  sourceFile: string;
  heading: string;
  content: string;
  /** Keyword mode: number of distinct query terms found in the chunk. */
  matches?: number;
  /** Vector mode: cosine similarity (add-on, see searchKnowledgeByVector). */
  similarity?: number;
};

// Max chunks per reply (requirements §11 #4): 4 × ~1000 chars ≈ +4k tokens.
const MAX_CHUNKS = 4;
// A chunk is adopted when it contains at least this many distinct query
// terms (§11 #8). Queries that only yield one term require that one.
const MIN_MATCHES = 2;

/** Returns relevant knowledge chunks, or [] (no match / search failed). */
export async function searchKnowledge(query: string): Promise<KnowledgeHit[]> {
  try {
    const terms = extractKeywords(query);
    if (terms.length === 0) return [];

    const { data, error } = await getSupabaseAdmin().rpc("match_knowledge_keyword", {
      query_terms: terms,
      match_count: MAX_CHUNKS,
      min_matches: Math.min(MIN_MATCHES, terms.length),
    });
    if (error) {
      console.error("knowledge search failed:", error.message);
      return [];
    }
    type Row = { source_file: string; heading: string; content: string; matches: number };
    return ((data ?? []) as Row[]).map((r) => ({
      sourceFile: r.source_file,
      heading: r.heading,
      content: r.content,
      matches: r.matches,
    }));
  } catch (err) {
    console.error("knowledge search failed:", err);
    return [];
  }
}

// ---- Vector search (add-on; unused while keyword is the primary) --------
// Preserved for the planned vector add-on (requirements §2.1): same
// contract as searchKnowledge, but matches by meaning via match_knowledge
// (scripts/sql/knowledge.sql). Costs one embedding API call per query,
// which counts against the embedding free-tier daily cap.

const EMBED_MODEL = "gemini-embedding-001";
// Must match vector(768) in scripts/sql/knowledge.sql.
const EMBED_DIMS = 768;
// Measured with scripts/search.ts (2026-07-21): on-topic questions score
// ~0.74+, casual chat at most ~0.64. 0.68 splits the two.
const MIN_SIMILARITY = 0.68;

/** Vector variant of searchKnowledge. Returns [] on no match / failure. */
export async function searchKnowledgeByVector(
  ai: GoogleGenAI,
  query: string,
): Promise<KnowledgeHit[]> {
  try {
    const res = await ai.models.embedContent({
      model: EMBED_MODEL,
      contents: [query],
      config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: EMBED_DIMS },
    });
    const embedding = res.embeddings?.[0]?.values;
    if (!embedding || embedding.length !== EMBED_DIMS) return [];

    const { data, error } = await getSupabaseAdmin().rpc("match_knowledge", {
      query_embedding: embedding,
      match_count: MAX_CHUNKS,
      min_similarity: MIN_SIMILARITY,
    });
    if (error) {
      console.error("knowledge vector search failed:", error.message);
      return [];
    }
    type Row = { source_file: string; heading: string; content: string; similarity: number };
    return ((data ?? []) as Row[]).map((r) => ({
      sourceFile: r.source_file,
      heading: r.heading,
      content: r.content,
      similarity: r.similarity,
    }));
  } catch (err) {
    console.error("knowledge vector search failed:", err);
    return [];
  }
}
