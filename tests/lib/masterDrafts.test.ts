import { describe, it, expect } from "vitest";
import {
  validatePriorityDraft,
  validateStatusDraft,
  validateTaskTypeDraft,
} from "../../src/lib/masterDrafts";
import { PRIORITY_LABEL_MAX } from "../../src/lib/priorities";
import { STATUS_LABEL_MAX } from "../../src/lib/statuses";
import { TASK_TYPE_LABEL_MAX } from "../../src/lib/taskTypes";

// F107-4 / F107-5。以前は3本の API ルートに直書きされていて、走らせるには
// HTTP とサービスロールが必要だった＝実質テスト不能だった箇所。

describe("validatePriorityDraft", () => {
  const ok = { code: "high", label: "最優先", color: "red" };

  it("正しい入力は通り、保存する形に整う", () => {
    const r = validatePriorityDraft(ok);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(ok);
  });

  it("前後の空白は落として保存する", () => {
    const r = validatePriorityDraft({ ...ok, label: "  最優先  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.label).toBe("最優先");
  });

  it("表示名が空・空白のみは弾く", () => {
    for (const label of ["", "   "])
      expect(validatePriorityDraft({ ...ok, label }).ok).toBe(false);
  });

  it("表示名は上限ちょうどまで通し、1文字超えたら弾く", () => {
    expect(
      validatePriorityDraft({ ...ok, label: "あ".repeat(PRIORITY_LABEL_MAX) }).ok,
    ).toBe(true);
    expect(
      validatePriorityDraft({ ...ok, label: "あ".repeat(PRIORITY_LABEL_MAX + 1) }).ok,
    ).toBe(false);
  });

  it("未知の色キーは弾く", () => {
    // 通すとバッジが素のまま描画される（Tailwind はソースに書かれたクラスしか
    // CSS に出さないため、DB の値からクラスは作れない）。
    const r = validatePriorityDraft({ ...ok, color: "bg-red-100" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("色");
  });

  it("既知の3段階以外のコードは弾く（4段階目を作れない）", () => {
    expect(validatePriorityDraft({ ...ok, code: "urgent" }).ok).toBe(false);
    expect(validatePriorityDraft({ ...ok, code: undefined }).ok).toBe(false);
  });
});

describe("validateStatusDraft", () => {
  const ok = { code: "done", label: "完了", color: "green" };

  it("正しい入力は通る", () => {
    expect(validateStatusDraft(ok).ok).toBe(true);
  });

  it("表示名の上限は STATUS_LABEL_MAX", () => {
    expect(
      validateStatusDraft({ ...ok, label: "あ".repeat(STATUS_LABEL_MAX + 1) }).ok,
    ).toBe(false);
  });

  it("未知の色キーは弾く", () => {
    expect(validateStatusDraft({ ...ok, color: "#00ff00" }).ok).toBe(false);
  });

  it("4つ目の状態は作れない", () => {
    // "done" はアプリ内の約25か所で直接判定されている。状態を増やせると
    // 「どれを完了として扱うか」が曖昧になり、進捗率が静かに壊れる。
    expect(validateStatusDraft({ ...ok, code: "pending" }).ok).toBe(false);
  });
});

describe("validateTaskTypeDraft", () => {
  const ok = { code: "design", label: "基本設計" };

  it("正しい入力は通る（色は持たない）", () => {
    const r = validateTaskTypeDraft(ok);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual(ok);
  });

  it("表示名が空だと弾く", () => {
    expect(validateTaskTypeDraft({ ...ok, label: " " }).ok).toBe(false);
  });

  it("表示名の上限は TASK_TYPE_LABEL_MAX", () => {
    expect(
      validateTaskTypeDraft({ ...ok, label: "あ".repeat(TASK_TYPE_LABEL_MAX + 1) }).ok,
    ).toBe(false);
  });

  it("7つ目の種別は作れない", () => {
    expect(validateTaskTypeDraft({ ...ok, code: "deploy" }).ok).toBe(false);
  });
});
