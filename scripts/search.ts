// Manual test tool for knowledge search (issue #77).
// Embeds a query and prints the nearest chunks with similarity scores.
// Useful for tuning the similarity threshold (requirements §11 #3).
//
// Usage: node --env-file=.env.local --import tsx scripts/search.ts "質問文"

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIMS = 768;

async function main() {
  const query = process.argv[2];
  if (!query) {
    console.error('Usage: npm run search -- "質問文"');
    process.exit(1);
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: [query],
    config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: EMBED_DIMS },
  });
  const embedding = res.embeddings?.[0]?.values;
  if (!embedding) throw new Error("embedding failed");

  // min_similarity 0 on purpose: show everything so the threshold can be
  // chosen by looking at real scores.
  const { data, error } = await supabase.rpc("match_knowledge", {
    query_embedding: embedding,
    match_count: 5,
    min_similarity: 0,
  });
  if (error) throw new Error(error.message);

  for (const row of data as {
    source_file: string;
    heading: string;
    content: string;
    similarity: number;
  }[]) {
    console.log(
      `${row.similarity.toFixed(3)}  [${row.source_file}] ${row.heading}\n` +
        `       ${row.content.slice(0, 80).replaceAll("\n", " ")}...\n`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
