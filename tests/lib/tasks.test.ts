import { describe, it, expect, vi } from "vitest";

// tasks.ts imports ./supabase, which throws at import time when env vars are
// missing. resolveAssigneeLabel is a pure function, so we stub the module.
vi.mock("../../src/lib/supabase", () => ({ supabase: {} }));

import { resolveAssigneeLabel } from "../../src/lib/tasks";

describe("resolveAssigneeLabel", () => {
  const labelById = new Map<string, string>([
    ["u1", "畠山"],
    ["u2", "柴田"],
  ]);

  it("assignee_id があれば名簿(profiles.name)の名前を返す", () => {
    expect(
      resolveAssigneeLabel(
        { assignee_id: "u1", assignee: "old@example.com" },
        labelById,
      ),
    ).toBe("畠山");
  });

  it("assignee_id を旧文字列より優先する", () => {
    expect(
      resolveAssigneeLabel({ assignee_id: "u2", assignee: "旧名" }, labelById),
    ).toBe("柴田");
  });

  it("assignee_id が名簿に無ければ null", () => {
    expect(
      resolveAssigneeLabel({ assignee_id: "u9", assignee: "old" }, labelById),
    ).toBeNull();
  });

  it("assignee_id が null なら旧 assignee 文字列でフォールバック", () => {
    expect(
      resolveAssigneeLabel(
        { assignee_id: null, assignee: "hatakeyama@example.com" },
        labelById,
      ),
    ).toBe("hatakeyama@example.com");
  });

  it("両方 null なら null（担当者なし）", () => {
    expect(
      resolveAssigneeLabel({ assignee_id: null, assignee: null }, labelById),
    ).toBeNull();
  });
});
