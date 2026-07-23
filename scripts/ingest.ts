// Knowledge ingest for the AI assistant (issue #77).
//
// Reads every Markdown file under docs/knowledge/, splits them into chunks
// and syncs them into the Supabase "knowledge" table, keyed by file name
// (source_file). The sync is full-mirror (FR-Q2-02):
//   - a file's rows are replaced on every run (idempotent: two consecutive
//     runs yield identical tables),
//   - rows of deleted files are removed.
//
// Default mode is keyword (FR-Q2-04): chunks are stored as plain text and
// the embedding API is never called, so runs are fast and unaffected by
// the 1,000/day embedding free-tier cap.
//
// Pass --embed to also embed each chunk (vector add-on, requirements §2.1).
// Pass --skip-existing to resume an --embed run that hit the daily quota
// partway: files already in the DB are left as-is (matched by filename
// only), so after EDITING a file's contents re-run WITHOUT the flag.
//
// Run with: npm run ingest [-- --embed] [-- --skip-existing]
// Required env (.env.local): NEXT_PUBLIC_SUPABASE_URL,
//   SUPABASE_SERVICE_ROLE_KEY (writes bypass RLS); GEMINI_API_KEY is only
//   needed with --embed.

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { chunkMarkdown } from "../src/lib/knowledgeChunks";

const KNOWLEDGE_DIR = path.join(process.cwd(), "docs", "knowledge");
const EMBED_MODEL = "gemini-embedding-001";
// Must match vector(768) in scripts/sql/knowledge.sql.
const EMBED_DIMS = 768;
// Texts per embedding request / pause between requests. The free tier caps
// embeddings at ~30k tokens/min (TPM), so we keep each request small and
// space them out to stay under it: 10 chunks (~10k tokens) every 30s is
// ~20k tokens/min. Sending faster only gets requests rejected with 429 —
// and rejected requests still burn the 1,000/day quota, which is how a run
// can drain the daily budget without finishing (NFR-Q2-02).
const EMBED_BATCH = 10;
const BATCH_PAUSE_MS = 30_000;
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
  // --embed: vector add-on mode. The default (keyword) stores plain text
  // and never touches the embedding API or its daily quota.
  const embedMode = process.argv.includes("--embed");
  const ai = embedMode ? new GoogleGenAI({ apiKey: requiredEnv("GEMINI_API_KEY") }) : null;

  // Collect .md files (paths relative to docs/knowledge/, "/"-separated so
  // the DB key is OS-independent).
  const names = (await readdir(KNOWLEDGE_DIR, { recursive: true })) as string[];
  const files = names.filter((n) => n.endsWith(".md")).map((n) => n.replaceAll("\\", "/"));
  if (files.length === 0) {
    console.log(`No .md files under ${KNOWLEDGE_DIR} - nothing to do.`);
  }

  // --skip-existing: resume mode. Skip files already in the DB (matched by
  // filename) so a run interrupted by the daily quota can finish the rest
  // without re-embedding what is already there. Default stays full-mirror.
  const skipExisting = process.argv.includes("--skip-existing");

  // Files already present in the DB. One query, reused for the resume skip
  // above and for the stale-file cleanup at the end.
  const existing = await supabase.from("knowledge").select("source_file");
  if (existing.error) throw new Error(`select failed: ${existing.error.message}`);
  const ingestedFiles = new Set(existing.data.map((r) => r.source_file as string));

  let skipped = 0;
  let totalChunks = 0;
  let totalChars = 0;

  for (const file of files) {
    if (skipExisting && ingestedFiles.has(file)) {
      console.log(`${file}: already in DB, skipping (--skip-existing)`);
      skipped++;
      continue;
    }
    const markdown = await readFile(path.join(KNOWLEDGE_DIR, file), "utf8");
    const chunks = chunkMarkdown(markdown);
    console.log(`${file}: ${chunks.length} chunks`);

    // --embed only: heading + body per chunk, so the vector carries the
    // section context too. Keyword mode stores plain text and skips this.
    const vectors: number[][] = [];
    if (embedMode && ai) {
      for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
        const batch = chunks.slice(i, i + EMBED_BATCH);
        const texts = batch.map((c) => (c.heading ? `${c.heading}\n\n${c.content}` : c.content));
        vectors.push(...(await embedBatch(ai, texts)));
        process.stdout.write(`  embedded ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length}\r`);
        if (i + EMBED_BATCH < chunks.length) await sleep(BATCH_PAUSE_MS);
      }
      console.log("");
    }

    // Replace this file's rows: delete then insert (idempotent re-run).
    const del = await supabase.from("knowledge").delete().eq("source_file", file);
    if (del.error) throw new Error(`delete failed for ${file}: ${del.error.message}`);

    const rows = chunks.map((c, i) => ({
      source_file: file,
      heading: c.heading,
      chunk_index: i,
      content: c.content,
      // null in keyword mode (scripts/sql/knowledge_keyword.sql makes the
      // column nullable); filled only by the --embed vector add-on.
      embedding: embedMode ? vectors[i] : null,
    }));
    for (let i = 0; i < rows.length; i += INSERT_BATCH) {
      const ins = await supabase.from("knowledge").insert(rows.slice(i, i + INSERT_BATCH));
      if (ins.error) throw new Error(`insert failed for ${file}: ${ins.error.message}`);
    }

    totalChunks += chunks.length;
    totalChars += chunks.reduce((n, c) => n + c.content.length, 0);
  }

  // Drop rows whose source file no longer exists (mirror semantics). Reuses
  // the ingestedFiles snapshot taken at the start of the run.
  const stale = [...ingestedFiles].filter((f) => !files.includes(f));
  if (stale.length > 0) {
    console.log(`removing rows of deleted files: ${stale.join(", ")}`);
    const del = await supabase.from("knowledge").delete().in("source_file", stale);
    if (del.error) throw new Error(`stale delete failed: ${del.error.message}`);
  }

  console.log(
    `done: ${files.length} files (${skipped} skipped), ${totalChunks} chunks, ` +
      `~${Math.round(totalChars / 1000)}k chars ${embedMode ? "embedded" : "stored (keyword mode)"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
