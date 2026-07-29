import { describe, it, expect } from "vitest";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_NAME_MAX,
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
});
