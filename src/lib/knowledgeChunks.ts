// Splits a Markdown document into chunks for the knowledge base (issue #77).
// Strategy (docs/requirements-ai-uchida-v2.md §5): one chunk per heading
// section; sections longer than MAX_CHUNK_CHARS are split further on
// paragraph boundaries so a chunk never exceeds the limit.

export type Chunk = {
  // Nearest heading above the text ("" for text before the first heading).
  heading: string;
  content: string;
};

// Upper bound per chunk. ~1000 Japanese chars ≈ ~1000 tokens, so with the
// retrieval limit of 4 chunks a reply carries at most ~4k extra tokens.
export const MAX_CHUNK_CHARS = 1000;

/** Splits markdown into heading-scoped chunks of at most MAX_CHUNK_CHARS. */
export function chunkMarkdown(markdown: string): Chunk[] {
  const lines = markdown.split(/\r?\n/);

  // Group lines under their nearest heading (levels 1-3).
  type Section = { heading: string; lines: string[] };
  const sections: Section[] = [{ heading: "", lines: [] }];
  for (const line of lines) {
    const m = /^#{1,3}\s+(.+)/.exec(line);
    if (m) sections.push({ heading: m[1].trim(), lines: [] });
    else sections[sections.length - 1].lines.push(line);
  }

  const chunks: Chunk[] = [];
  for (const s of sections) {
    const text = s.lines.join("\n").trim();
    if (!text) continue; // heading with no body (e.g. a parent heading)
    for (const piece of splitLongText(text)) {
      chunks.push({ heading: s.heading, content: piece });
    }
  }
  return chunks;
}

// Splits an over-long section on blank lines (paragraphs), packing as many
// paragraphs as fit into each piece.
function splitLongText(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const pieces: string[] = [];
  let buf = "";
  for (const paragraph of text.split(/\n{2,}/)) {
    for (const para of hardSplit(paragraph)) {
      if (buf && buf.length + para.length + 2 > MAX_CHUNK_CHARS) {
        pieces.push(buf);
        buf = para;
      } else {
        buf = buf ? `${buf}\n\n${para}` : para;
      }
    }
  }
  if (buf) pieces.push(buf);
  return pieces;
}

// Last resort for a single paragraph longer than the limit (e.g. a big
// table): cut at fixed positions.
function hardSplit(text: string): string[] {
  if (text.length <= MAX_CHUNK_CHARS) return [text];
  const out: string[] = [];
  for (let i = 0; i < text.length; i += MAX_CHUNK_CHARS) {
    out.push(text.slice(i, i + MAX_CHUNK_CHARS));
  }
  return out;
}
