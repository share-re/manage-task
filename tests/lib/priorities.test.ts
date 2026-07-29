import { describe, it, expect } from "vitest";
import {
  DEFAULT_PRIORITY_META,
  PRIORITY_COLORS,
  isPriorityColor,
} from "../../src/lib/priorities";

// PR1 moves the priority label and color out of the code and into the
// task_priorities table. Its whole promise is "nothing changes on screen", so
// these lock in the exact labels and Tailwind classes the badges used before.
describe("DEFAULT_PRIORITY_META", () => {
  it("高/中/低 のラベルが従来どおり", () => {
    expect(DEFAULT_PRIORITY_META.high.label).toBe("高");
    expect(DEFAULT_PRIORITY_META.mid.label).toBe("中");
    expect(DEFAULT_PRIORITY_META.low.label).toBe("低");
  });

  it("バッジの色クラスが従来どおり（見た目が変わらないこと）", () => {
    expect(DEFAULT_PRIORITY_META.high.badgeClass).toBe(
      "bg-red-100 text-red-700",
    );
    expect(DEFAULT_PRIORITY_META.mid.badgeClass).toBe(
      "bg-amber-100 text-amber-700",
    );
    expect(DEFAULT_PRIORITY_META.low.badgeClass).toBe(
      "bg-zinc-100 text-zinc-600",
    );
  });

  it("並び順は 高→中→低", () => {
    expect(DEFAULT_PRIORITY_META.high.order).toBe(0);
    expect(DEFAULT_PRIORITY_META.mid.order).toBe(1);
    expect(DEFAULT_PRIORITY_META.low.order).toBe(2);
  });
});

describe("PRIORITY_COLORS", () => {
  it("色キーからクラスが引ける", () => {
    expect(PRIORITY_COLORS.red.badgeClass).toBe("bg-red-100 text-red-700");
  });

  // A color key that no longer exists must not reach the class lookup, or the
  // badge would render with `undefined` in its className.
  it("未知の色キーは弾く", () => {
    expect(isPriorityColor("red")).toBe(true);
    expect(isPriorityColor("chartreuse")).toBe(false);
    expect(isPriorityColor(null)).toBe(false);
    expect(isPriorityColor(123)).toBe(false);
  });
});
