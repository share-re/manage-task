import { describe, expect, it } from "vitest";
import { extractKeywords } from "../../src/lib/knowledgeKeywords";

// extractKeywords is the deterministic half of keyword retrieval
// (FR-Q2-04): terms in → terms out, no DB and no embedding involved.

describe("extractKeywords", () => {
  it("extracts kanji, katakana and ASCII runs of length >= 2", () => {
    expect(extractKeywords("Claude Code のエラーの意味は？")).toEqual([
      "claude",
      "code",
      "エラー",
      "意味",
    ]);
  });

  it("skips hiragana-only fillers and single characters", () => {
    // 「辛いもの好きなんですか？」: 辛/好 are single-kanji runs, the rest
    // is hiragana — casual chat should yield no searchable terms.
    expect(extractKeywords("辛いもの好きなんですか？")).toEqual([]);
  });

  it("lowercases ASCII so matching is case-insensitive", () => {
    expect(extractKeywords("CLAUDE.mdのルール")).toEqual(["claude.md", "ルール"]);
  });

  it("deduplicates repeated terms", () => {
    expect(extractKeywords("要件定義の要件定義")).toEqual(["要件定義"]);
  });

  it("caps the number of terms at 8", () => {
    const text = "要件 設計 開発 公開 認証 検索 資料 出典 冪等 縮退";
    expect(extractKeywords(text)).toHaveLength(8);
  });

  it("returns an empty array for empty input", () => {
    expect(extractKeywords("")).toEqual([]);
  });
});
