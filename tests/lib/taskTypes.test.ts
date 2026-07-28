import { describe, it, expect } from "vitest";
import {
  DEFAULT_TASK_TYPE_META,
  TASK_TYPE_LABEL_MAX,
} from "../../src/lib/taskTypes";
import { TASK_TYPE_ORDER } from "../../src/lib/tasks";

// Moving the labels into task_types must not change the dropdowns.
describe("DEFAULT_TASK_TYPE_META", () => {
  it("6区分のラベルが従来どおり", () => {
    expect(DEFAULT_TASK_TYPE_META.design.label).toBe("設計");
    expect(DEFAULT_TASK_TYPE_META.implementation.label).toBe("実装");
    expect(DEFAULT_TASK_TYPE_META.test.label).toBe("テスト");
    expect(DEFAULT_TASK_TYPE_META.research.label).toBe("調査");
    expect(DEFAULT_TASK_TYPE_META.review.label).toBe("レビュー");
    expect(DEFAULT_TASK_TYPE_META.documentation.label).toBe("資料作成");
  });

  // The dropdowns iterate TASK_TYPE_ORDER and index into the meta, so a code
  // present in one but not the other would render an empty option.
  it("TASK_TYPE_ORDER の全コードを網羅している", () => {
    expect(Object.keys(DEFAULT_TASK_TYPE_META).sort()).toEqual(
      [...TASK_TYPE_ORDER].sort(),
    );
  });

  it("既定ラベルは入力上限に収まっている", () => {
    for (const t of TASK_TYPE_ORDER)
      expect(DEFAULT_TASK_TYPE_META[t].label.length).toBeLessThanOrEqual(
        TASK_TYPE_LABEL_MAX,
      );
  });
});
