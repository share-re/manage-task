import { describe, it, expect } from "vitest";
import {
  DEFAULT_TEMPLATES,
  normalizeItems,
  rowToTemplate,
  TEMPLATE_HOURS_MAX,
  TEMPLATE_ITEM_MAX,
  TEMPLATE_NAME_MAX,
  validateTemplateDraft,
} from "../../src/lib/taskTemplates";
import { isTaskPriority, isTaskType } from "../../src/lib/tasks";

// The built-in templates are what the sidebar offers before task_templates
// exists, so a bad value here would surface as a broken generate button rather
// than as a failed save.
describe("DEFAULT_TEMPLATES", () => {
  it("コードが重複していない", () => {
    const codes = DEFAULT_TEMPLATES.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("どの雛形も子タスクを持つ", () => {
    // A parent with no children would count as a leaf and quietly join the
    // progress denominator — the opposite of what a template is for.
    for (const t of DEFAULT_TEMPLATES)
      expect(t.items.length).toBeGreaterThan(0);
  });

  it("優先度と種別が既知の値になっている", () => {
    for (const t of DEFAULT_TEMPLATES) {
      expect(isTaskPriority(t.priority)).toBe(true);
      for (const item of t.items) {
        expect(item.title.trim()).not.toBe("");
        // null is allowed (種別なし); anything else must be a real code, or the
        // label lookup in the sidebar would render undefined.
        if (item.taskType !== null)
          expect(isTaskType(item.taskType)).toBe(true);
      }
    }
  });

  it("名前が入力上限に収まっている", () => {
    for (const t of DEFAULT_TEMPLATES)
      expect(t.name.length).toBeLessThanOrEqual(TEMPLATE_NAME_MAX);
  });

  it("既定の雛形は見積を持たない（従来の見た目を変えない）", () => {
    // 架空の見積は工数効率（見積÷実績）の分子にそのまま入る。既定に数字を
    // 置くと、誰も決めていない値で指標が動き出す。
    for (const t of DEFAULT_TEMPLATES)
      for (const item of t.items) expect(item.estimatedHours).toBeNull();
  });
});

describe("normalizeItems", () => {
  it("estimated_hours が無い行は見積なしとして読む", () => {
    const items = normalizeItems([{ title: "設計", task_type: "design" }]);
    expect(items).toEqual([
      { title: "設計", taskType: "design", estimatedHours: null },
    ]);
  });

  it("見積は数値でも文字列でも読める", () => {
    const items = normalizeItems([
      { title: "a", task_type: "test", estimated_hours: 2 },
      { title: "b", task_type: "test", estimated_hours: "1.5" },
    ]);
    expect(items[0].estimatedHours).toBe(2);
    expect(items[1].estimatedHours).toBe(1.5);
  });

  it("0・負数・上限超えの見積は見積なしに寄せる", () => {
    const items = normalizeItems([
      { title: "a", task_type: "test", estimated_hours: 0 },
      { title: "b", task_type: "test", estimated_hours: -3 },
      { title: "c", task_type: "test", estimated_hours: TEMPLATE_HOURS_MAX + 1 },
    ]);
    for (const i of items) expect(i.estimatedHours).toBeNull();
  });

  it("種別なしの行も落とさずに読む（保存側で必須にする）", () => {
    const items = normalizeItems([{ title: "調査" }]);
    expect(items[0].taskType).toBeNull();
  });
});

describe("rowToTemplate", () => {
  it("子タスクが0件の行は雛形として出さない", () => {
    expect(rowToTemplate({ code: "x", name: "空", items: [] })).toBeNull();
  });

  it("優先度が壊れていても中に寄せて読める", () => {
    const t = rowToTemplate({
      code: "x",
      name: "テスト",
      priority: "urgent",
      items: [{ title: "a", task_type: "design" }],
    });
    expect(t?.priority).toBe("mid");
  });
});

// 保存側は読み込み側より厳格。特に種別は必須で、空のまま保存させない。
describe("validateTemplateDraft", () => {
  const ok = {
    name: "週次ミーティング",
    priority: "mid",
    items: [{ title: "議事録の作成", task_type: "documentation", estimated_hours: 1.5 }],
  };

  it("正しい入力は通り、保存する形に整う", () => {
    const r = validateTemplateDraft(ok);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.items[0]).toEqual({
        title: "議事録の作成",
        task_type: "documentation",
        estimated_hours: 1.5,
      });
    }
  });

  it("見積は空でよい", () => {
    const r = validateTemplateDraft({
      ...ok,
      items: [{ title: "a", task_type: "design", estimated_hours: "" }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.items[0].estimated_hours).toBeNull();
  });

  it("名前が空だと弾く", () => {
    expect(validateTemplateDraft({ ...ok, name: "  " }).ok).toBe(false);
  });

  it("名前が上限を超えると弾く", () => {
    const r = validateTemplateDraft({ ...ok, name: "あ".repeat(TEMPLATE_NAME_MAX + 1) });
    expect(r.ok).toBe(false);
  });

  it("子タスクが0件だと弾く", () => {
    expect(validateTemplateDraft({ ...ok, items: [] }).ok).toBe(false);
  });

  it("子タスクが上限を超えると弾く", () => {
    const many = Array.from({ length: TEMPLATE_ITEM_MAX + 1 }, () => ({
      title: "a",
      task_type: "design",
    }));
    expect(validateTemplateDraft({ ...ok, items: many }).ok).toBe(false);
  });

  it("種別が無いと弾く", () => {
    const r = validateTemplateDraft({ ...ok, items: [{ title: "調査" }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("種別");
  });

  it("0以下・上限超え・刻み違いの見積を弾く", () => {
    for (const h of [0, -1, TEMPLATE_HOURS_MAX + 1, 1.3]) {
      const r = validateTemplateDraft({
        ...ok,
        items: [{ title: "a", task_type: "design", estimated_hours: h }],
      });
      expect(r.ok).toBe(false);
    }
  });

  it("優先度が既知の値でないと弾く", () => {
    expect(validateTemplateDraft({ ...ok, priority: "urgent" }).ok).toBe(false);
  });
});
