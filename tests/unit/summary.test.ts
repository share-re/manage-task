import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { buildProgressSummary } from "@/lib/summary";
import type { Task } from "@/lib/tasks";

function mk(over: Partial<Task> = {}): Task {
  return {
    id: "x", title: "T", assignee: null, due_date: null, status: "todo",
    parent_id: null, created_by: null, created_at: "2026-07-01T00:00:00Z",
    completed_at: null, ...over,
  };
}

describe("buildProgressSummary", () => {
  // Deadline buckets are relative to "today" (JST) via Date.now() — freeze it.
  beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-07-09T06:00:00Z")); });
  afterAll(() => vi.useRealTimers());

  it("summarizes team progress and flags the first send", () => {
    const s = buildProgressSummary([mk({ status: "done" }), mk({ id: "2" })], { dateLabel: "2026-07-09", lastSentAt: null });
    expect(s.text).toContain("進捗サマリ (2026-07-09)");
    expect(s.text).toContain("完了 1 / 2");
    expect(s.text).toContain("初回送信のため");
  });

  it("buckets deadlines relative to today and excludes done / far tasks", () => {
    const s = buildProgressSummary([
      mk({ id: "od", title: "OD", due_date: "2026-07-07", status: "todo" }),   // -2 -> 超過
      mk({ id: "td", title: "TD", due_date: "2026-07-09", status: "todo" }),   // 0 -> 本日締切
      mk({ id: "far", title: "FARAWAY", due_date: "2026-07-20", status: "todo" }), // +11 -> excluded
      mk({ id: "dn", title: "DONEONE", due_date: "2026-07-07", status: "done" }),  // done -> excluded
    ], { dateLabel: "2026-07-09", lastSentAt: null });
    expect(s.text).toContain("2日超過");
    expect(s.text).toContain("本日締切");
    expect(s.text).not.toContain("FARAWAY");
    expect(s.text).not.toContain("DONEONE");
  });

  it("orders per-assignee with 担当者なし last", () => {
    // No due dates -> no deadline lines -> 担当者なし only appears in the per-assignee section.
    const s = buildProgressSummary([mk({ id: "1", assignee: null }), mk({ id: "2", assignee: "Bob" })], { dateLabel: "d", lastSentAt: null });
    const bob = s.text.indexOf("Bob");
    const none = s.text.indexOf("担当者なし");
    expect(bob).toBeGreaterThan(-1);
    expect(none).toBeGreaterThan(bob);
  });

  it("HTML-escapes task titles", () => {
    const s = buildProgressSummary([mk({ id: "x", title: "<b>x</b>", due_date: "2026-07-09", status: "todo" })], { dateLabel: "d", lastSentAt: null });
    expect(s.html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(s.html).not.toContain("<b>x</b>");
  });
});
