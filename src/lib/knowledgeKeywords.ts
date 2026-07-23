// Pure keyword-extraction logic for knowledge retrieval (FR-Q2-04).
// Kept free of server-only imports so it stays unit-testable.

// Cap on terms sent to SQL, so very long messages stay cheap.
export const MAX_TERMS = 8;

/**
 * Extracts content words for keyword matching: runs of 2+ kanji, 2+
 * katakana, or 2+ ASCII word characters. Hiragana runs are skipped on
 * purpose — they are mostly particles and inflections, so skipping them
 * lets casual chat naturally match nothing (FR-Q2-04).
 */
export function extractKeywords(text: string): string[] {
  const runs = text.match(/[一-龠々]{2,}|[ァ-ヴー]{2,}|[A-Za-z0-9_.-]{2,}/g) ?? [];
  const seen = new Set<string>();
  for (const run of runs) {
    seen.add(run.toLowerCase());
    if (seen.size >= MAX_TERMS) break;
  }
  return [...seen];
}
