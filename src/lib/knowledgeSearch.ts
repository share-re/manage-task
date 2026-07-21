import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdmin } from "./supabaseAdmin";

// Knowledge retrieval for the assistant (issue #77, RAG).
// Embeds the user's message and asks the match_knowledge SQL function
// (scripts/sql/knowledge.sql) for chunks above the similarity threshold.
// Best-effort by design: any failure returns [] so the assistant simply
// answers without extra context (requirement FR-Q2-04).

export type KnowledgeHit = {
  sourceFile: string;
  heading: string;
  content: string;
  similarity: number;
};

const EMBED_MODEL = "gemini-embedding-001";
// Must match vector(768) in scripts/sql/knowledge.sql.
const EMBED_DIMS = 768;
// Max chunks per reply (requirements §11 #4): 4 × ~1000 chars ≈ +4k tokens.
const MAX_CHUNKS = 4;
// Measured with scripts/search.ts (2026-07-21): on-topic questions score
// ~0.74+, casual chat at most ~0.64. 0.68 splits the two; tune as needed.
const MIN_SIMILARITY = 0.68;

/** Returns relevant knowledge chunks, or [] (not relevant / search failed). */
export async function searchKnowledge(
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
      console.error("knowledge search failed:", error.message);
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
    console.error("knowledge search failed:", err);
    return [];
  }
}
