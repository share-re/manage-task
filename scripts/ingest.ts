// Knowledge ingest for the AI assistant (issue #77).
//
// Reads every Markdown file under docs/knowledge/, splits them into chunks,
// embeds each chunk with the Gemini embedding API and syncs the result into
// the Supabase "knowledge" table. The sync is full-mirror (FR-Q2-02):
//   - a file's rows are replaced on every run (no duplicates),
//   - rows of deleted files are removed.
//
// Run with: npm run ingest
// Required env (.env.local): NEXT_PUBLIC_SUPABASE_URL,
//   SUPABASE_SERVICE_ROLE_KEY (writes bypass RLS), GEMINI_API_KEY.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { chunkMarkdown } from "../src/lib/knowledgeChunks";

const KNOWLEDGE_DIR = path.join(process.cwd(), "docs", "knowledge");
const EMBED_MODEL = "gemini-embedding-001";
// Must match vector(768) in scripts/sql/knowledge.sql.
const EMBED_DIMS = 768;
// Texts per embedding request / pause between requests: stay well under the
// free-tier rate limits (NFR-Q2-02).
const EMBED_BATCH = 20;
const BATCH_PAUSE_MS = 2000;
// The free tier throttles tokens per minute; the 30s-wait retry loop is what
// actually paces the run, so be patient before giving up.
const MAX_RETRIES = 6;
const INSERT_BATCH = 100;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name} (set it in .env.local).`);
    process.exit(1);
  }
  return v;
}

async function embedBatch(ai: GoogleGenAI, texts: string[]): Promise<number[][]> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: texts,
        config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: EMBED_DIMS },
      });
      const vectors = (res.embeddings ?? []).map((e) => e.values ?? []);
      if (vectors.length !== texts.length || vectors.some((v) => v.length !== EMBED_DIMS)) {
        throw new Error("unexpected embedding response shape");
      }
      return vectors;
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;
      console.warn(`  embedding failed (attempt ${attempt}/${MAX_RETRIES}); retrying in 30s`);
      console.warn(`  reason: ${String(err).slice(0, 200)}`);
      await sleep(30_000);
    }
  }
}

async function main() {
  const supabase = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
  const ai = new GoogleGenAI({ apiKey: requiredEnv("GEMINI_API_KEY") });

  // Collect .md files (paths relative to docs/knowledge/, "/"-separated so
  // the DB key is OS-independent).
  const names = (await readdir(KNOWLEDGE_DIR, { recursive: true })) as string[];
  const files = names.filter((n) => n.endsWith(".md")).map((n) => n.replaceAll("\\", "/"));
  if (files.length === 0) {
    console.log(`No .md files under ${KNOWLEDGE_DIR} - nothing to do.`);
  }

  let totalChunks = 0;
  let totalChars = 0;

  for (const file of files) {
    const markdown = await readFile(path.join(KNOWLEDGE_DIR, file), "utf8");
    const chunks = chunkMarkdown(markdown);
    console.log(`${file}: ${chunks.length} chunks`);

    // Embed heading + body so the vector carries the section context too.
    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const batch = chunks.slice(i, i + EMBED_BATCH);
      const texts = batch.map((c) => (c.heading ? `${c.heading}\n\n${c.content}` : c.content));
      vectors.push(...(await embedBatch(ai, texts)));
      process.stdout.write(`  embedded ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length}\r`);
      if (i + EMBED_BATCH < chunks.length) await sleep(BATCH_PAUSE_MS);
    }
    console.log("");

    // Replace this file's rows: delete then insert (idempotent re-run).
    const del = await supabase.from("knowledge").delete().eq("source_file", file);
    if (del.error) throw new Error(`delete failed for ${file}: ${del.error.message}`);

    const rows = chunks.map((c, i) => ({
      source_file: file,
      heading: c.heading,
      chunk_index: i,
      content: c.content,
      embedding: vectors[i],
    }));
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const ins = await supabase.from("knowledge").insert(rows.slice(i, i + INSERT_BATCH));
      if (ins.error) throw new Error(`insert failed for ${file}: ${ins.error.message}`);
    }

    totalChunks += chunks.length;
    totalChars += chunks.reduce((n, c) => n + c.content.length, 0);
  }

  // Drop rows whose source file no longer exists (mirror semantics).
  const existing = await supabase.from("knowledge").select("source_file");
  if (existing.error) throw new Error(`select failed: ${existing.error.message}`);
  const stale = [...new Set(existing.data.map((r) => r.source_file as string))].filter(
    (f) => !files.includes(f),
  );
  if (stale.length > 0) {
    console.log(`removing rows of deleted files: ${stale.join(", ")}`);
    const del = await supabase.from("knowledge").delete().in("source_file", stale);
    if (del.error) throw new Error(`stale delete failed: ${del.error.message}`);
  }

  console.log(
    `done: ${files.length} files, ${totalChunks} chunks, ~${Math.round(totalChars / 1000)}k chars embedded`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
