import { describe, expect, it } from "vitest";
import { countTermOccurrences, extractKeywords } from "../../src/lib/knowledgeKeywords";

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

describe("countTermOccurrences", () => {
  it("counts every occurrence of every term", () => {
    const text = "ハーネスとは何か。ハーネスの部品。Hooks と hooks。";
    expect(countTermOccurrences(text, ["ハーネス", "hooks"])).toBe(4);
  });

  it("returns 0 when no term appears", () => {
    expect(countTermOccurrences("コーヒーの話", ["ハーネス"])).toBe(0);
  });

  it("ranks a topic section above a table of contents", () => {
    // The observed failure: a TOC mentioning the term once outranked the
    // actual section. With occurrence counting the section wins.
    const toc = "1. ハーネスエンジニアリング 2. 自動化";
    const section = "ハーネスエンジニアリングとは…ハーネスエンジニアリングの構成要素は…";
    const terms = ["ハーネスエンジニアリング"];
    expect(countTermOccurrences(section, terms)).toBeGreaterThan(
      countTermOccurrences(toc, terms),
    );
  });
});
