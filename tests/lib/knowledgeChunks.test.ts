import { describe, expect, it } from "vitest";
import { chunkMarkdown, MAX_CHUNK_CHARS } from "../../src/lib/knowledgeChunks";

describe("chunkMarkdown", () => {
  it("splits sections by headings and keeps the nearest heading", () => {
    const md = [
      "# Title",
      "intro text",
      "## Section A",
      "body of A",
      "### Sub A-1",
      "body of A-1",
    ].join("\n");
    const chunks = chunkMarkdown(md);
    expect(chunks).toEqual([
      { heading: "Title", content: "intro text" },
      { heading: "Section A", content: "body of A" },
      { heading: "Sub A-1", content: "body of A-1" },
    ]);
  });

  it("keeps text before the first heading with an empty heading", () => {
    const chunks = chunkMarkdown("preamble\n\n# H1\nbody");
    expect(chunks[0]).toEqual({ heading: "", content: "preamble" });
  });

  it("drops headings that have no body text", () => {
    const chunks = chunkMarkdown("# Parent\n## Child\nonly child has body");
    expect(chunks).toEqual([
      { heading: "Child", content: "only child has body" },
    ]);
  });

  it("splits an over-long section on paragraph boundaries", () => {
    const para = "あ".repeat(400);
    const md = `# Long\n${para}\n\n${para}\n\n${para}`; // 3 paragraphs, > 1000 chars
    const chunks = chunkMarkdown(md);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.heading).toBe("Long");
      expect(c.content.length).toBeLessThanOrEqual(MAX_CHUNK_CHARS);
    }
    // Nothing lost: total text (minus separators) is preserved.
    const joined = chunks.map((c) => c.content).join("");
    expect(joined.replace(/\n/g, "")).toBe("あ".repeat(1200));
  });

  it("hard-splits a single paragraph longer than the limit", () => {
    const huge = "い".repeat(MAX_CHUNK_CHARS * 2 + 10);
    const chunks = chunkMarkdown(`# Huge\n${huge}`);
    expect(chunks.length).toBe(3);
    for (const c of chunks) {
      expect(c.content.length).toBeLessThanOrEqual(MAX_CHUNK_CHARS);
    }
  });

  it("handles CRLF line endings", () => {
    const chunks = chunkMarkdown("# A\r\nbody line\r\n");
    expect(chunks).toEqual([{ heading: "A", content: "body line" }]);
  });
});
