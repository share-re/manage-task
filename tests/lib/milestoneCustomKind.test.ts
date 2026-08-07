import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/lib/supabase", () => ({ supabase: {} }));

import {
  customKindBadge,
  customKindLabel,
  usedCustomKinds,
  CUSTOM_KIND_BADGES,
} from "../../src/lib/milestones";

describe("customKindLabel（自由記述の種別名）", () => {
  it("note があればそれが種別名", () => {
    expect(customKindLabel("サンプルローカル動作確認")).toBe(
      "サンプルローカル動作確認",
    );
  });

  it("前後の空白は落とす", () => {
    expect(customKindLabel("  社内デモ  ")).toBe("社内デモ");
  });

  it("null・空・空白だけは null（標準3種として表示する）", () => {
    expect(customKindLabel(null)).toBeNull();
    expect(customKindLabel("")).toBeNull();
    expect(customKindLabel("   ")).toBeNull();
  });
});

describe("customKindBadge（自由記述の色）", () => {
  // 同じ名前が人によって違う色になると、色で見分ける意味がなくなる。
  it("同じ名前なら必ず同じ色", () => {
    expect(customKindBadge("社内デモ")).toBe(customKindBadge("社内デモ"));
  });

  it("用意した色のどれかを返す", () => {
    for (const label of ["社内デモ", "環境構築", "移行リハーサル", "a", ""]) {
      expect(CUSTOM_KIND_BADGES).toContain(customKindBadge(label));
    }
  });

  // 標準3種（琥珀・青・緑）と混ざると、標準か自由記述か見分けられなくなる。
  it("標準3種の色は使わない", () => {
    const standard = ["amber", "blue", "green"];
    for (const badge of CUSTOM_KIND_BADGES) {
      for (const s of standard) expect(badge).not.toContain(s);
    }
  });
});

describe("usedCustomKinds（候補一覧）", () => {
  it("使われた種別名を重複なく返す", () => {
    expect(
      usedCustomKinds([
        { note: "社内デモ" },
        { note: "環境構築" },
        { note: "社内デモ" },
      ]),
    ).toEqual(["社内デモ", "環境構築"]);
  });

  it("標準3種（note が空）は候補に出さない", () => {
    expect(
      usedCustomKinds([{ note: null }, { note: "" }, { note: "  " }]),
    ).toEqual([]);
  });

  it("入力された順を保つ", () => {
    expect(
      usedCustomKinds([{ note: "B" }, { note: "A" }, { note: "C" }]),
    ).toEqual(["B", "A", "C"]);
  });

  it("空なら空配列", () => {
    expect(usedCustomKinds([])).toEqual([]);
  });
});
