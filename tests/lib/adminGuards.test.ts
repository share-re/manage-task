import { describe, it, expect } from "vitest";
import {
  canAdminEditName,
  denyLastAdminChange,
  denySelfLockout,
  isDemotion,
} from "../../src/lib/adminGuards";

// F107-7 / F107-8 / F107-9（P3 悪意 / ISO25010 セキュリティ・安全性）。
// どれも「締め出し」を防ぐための規則。以前はルートに直書きで、確かめるには
// 本物の管理者トークンと Supabase が要った。

const ME = "user-me";
const OTHER = "user-other";

describe("denySelfLockout — 自分で自分を締め出さない", () => {
  it("自分を無効化しようとすると拒否", () => {
    expect(denySelfLockout({ actorId: ME, targetId: ME, banned: true })).toBe(
      "自分のアカウントは無効化できません。",
    );
  });

  it("自分のロール変更は admin/general どちらの向きでも拒否", () => {
    for (const role of ["general", "admin"]) {
      expect(denySelfLockout({ actorId: ME, targetId: ME, role })).toContain(
        "自分のロールは変更できません",
      );
    }
  });

  it("自分の表示名の変更は許す（鍵にならないため）", () => {
    expect(denySelfLockout({ actorId: ME, targetId: ME })).toBeNull();
  });

  it("自分を有効化し直すのは許す（banned=false）", () => {
    expect(
      denySelfLockout({ actorId: ME, targetId: ME, banned: false }),
    ).toBeNull();
  });

  it("他人に対しては何も止めない（別の規則の担当）", () => {
    expect(
      denySelfLockout({ actorId: ME, targetId: OTHER, banned: true, role: "general" }),
    ).toBeNull();
  });
});

describe("isDemotion — 管理者を減らす操作かどうか", () => {
  it("general への降格と無効化は該当", () => {
    expect(isDemotion({ role: "general" })).toBe(true);
    expect(isDemotion({ banned: true })).toBe(true);
  });

  it("admin への昇格・有効化・表示名だけの変更は該当しない", () => {
    expect(isDemotion({ role: "admin" })).toBe(false);
    expect(isDemotion({ banned: false })).toBe(false);
    expect(isDemotion({})).toBe(false);
  });
});

describe("denyLastAdminChange — 最後の管理者を降ろさない", () => {
  it("管理者が1人のとき、その人の降格を拒否", () => {
    expect(
      denyLastAdminChange({ targetId: ME, adminIds: [ME], action: "demote" }),
    ).toBe("最後の管理者は降格・無効化できません。");
  });

  it("管理者が1人のとき、その人の削除を拒否（文言が削除用になる）", () => {
    expect(
      denyLastAdminChange({ targetId: ME, adminIds: [ME], action: "delete" }),
    ).toBe("最後の管理者は削除できません。");
  });

  it("管理者が2人いれば降格できる（境界）", () => {
    expect(
      denyLastAdminChange({ targetId: ME, adminIds: [ME, OTHER], action: "demote" }),
    ).toBeNull();
  });

  it("対象が管理者でなければ、管理者が1人でも止めない", () => {
    expect(
      denyLastAdminChange({ targetId: OTHER, adminIds: [ME], action: "demote" }),
    ).toBeNull();
  });

  it("管理者が0人の異常データでも落ちない", () => {
    expect(
      denyLastAdminChange({ targetId: ME, adminIds: [], action: "delete" }),
    ).toBeNull();
  });
});

describe("canAdminEditName — 本人が名乗った名前は本人のもの", () => {
  it("未設定なら管理者が入れてよい", () => {
    expect(canAdminEditName({ name: null })).toBeNull();
    expect(canAdminEditName({ name: "   " })).toBeNull();
  });

  it("管理者が入れた仮の名前は直してよい", () => {
    expect(canAdminEditName({ name: "シバタ", provisional: true })).toBeNull();
  });

  it("本人が設定した名前は管理者でも触れない", () => {
    expect(canAdminEditName({ name: "柴田", provisional: false })).toBe(
      "本人が設定した表示名は変更できません。",
    );
  });
});
