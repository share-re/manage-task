import { describe, it, expect } from "vitest";
import { isAdmin, roleFromUser } from "../../src/lib/roles";

describe("isAdmin / roleFromUser", () => {
  it("admin ロールは true", () => {
    expect(isAdmin({ user: { app_metadata: { role: "admin" } } })).toBe(true);
  });

  it("general ロールは false", () => {
    expect(isAdmin({ user: { app_metadata: { role: "general" } } })).toBe(false);
  });

  it("未設定・null・不正値は general(false)", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin({ user: { app_metadata: {} } })).toBe(false);
    expect(isAdmin({ user: {} })).toBe(false);
    expect(roleFromUser({ app_metadata: { role: 123 } })).toBe("general");
    expect(roleFromUser(null)).toBe("general");
  });

  it("admin 判定は完全一致（大文字や前後空白は general）", () => {
    expect(roleFromUser({ app_metadata: { role: "Admin" } })).toBe("general");
    expect(roleFromUser({ app_metadata: { role: "admin " } })).toBe("general");
  });
});
