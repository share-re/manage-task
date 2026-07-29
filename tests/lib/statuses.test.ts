import { describe, it, expect } from "vitest";
import {
  DEFAULT_STATUS_META,
  STATUS_COLORS,
  isStatusColor,
} from "../../src/lib/statuses";

// Same promise as the priority master: moving the label and color into
// task_statuses must not change a single pixel. These lock in the badge
// classes and the row bar colors the task list used before.
describe("DEFAULT_STATUS_META", () => {
  it("未着手/進行中/完了 のラベルが従来どおり", () => {
    expect(DEFAULT_STATUS_META.todo.label).toBe("未着手");
    expect(DEFAULT_STATUS_META.in_progress.label).toBe("進行中");
    expect(DEFAULT_STATUS_META.done.label).toBe("完了");
  });

  it("バッジの色クラスが従来どおり", () => {
    expect(DEFAULT_STATUS_META.todo.badgeClass).toBe(
      "bg-zinc-100 text-zinc-600",
    );
    expect(DEFAULT_STATUS_META.in_progress.badgeClass).toBe(
      "bg-blue-100 text-blue-700",
    );
    expect(DEFAULT_STATUS_META.done.badgeClass).toBe(
      "bg-green-200 text-green-800",
    );
  });

  // The bar down the left edge of each row is an inline style, so its hex has
  // to survive the move too.
  it("行の左端バーの色が従来どおり", () => {
    expect(DEFAULT_STATUS_META.todo.barColor).toBe("#B4B2A9");
    expect(DEFAULT_STATUS_META.in_progress.barColor).toBe("#378ADD");
    expect(DEFAULT_STATUS_META.done.barColor).toBe("#3B6D11");
  });
});

describe("STATUS_COLORS", () => {
  it("どの色もバッジ用とバー用の両方を持つ", () => {
    for (const c of Object.values(STATUS_COLORS)) {
      expect(c.badgeClass).toMatch(/^bg-/);
      expect(c.barColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("未知の色キーは弾く", () => {
    expect(isStatusColor("green")).toBe(true);
    expect(isStatusColor("chartreuse")).toBe(false);
    expect(isStatusColor(null)).toBe(false);
  });
});
