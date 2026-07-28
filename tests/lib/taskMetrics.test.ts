import { describe, it, expect } from "vitest";
import {
  difficultyFromEstimate,
  completionValue,
  productivity,
  leafProgress,
  estimateAchievement,
  type Task,
} from "../../src/lib/tasks";

// Build a Task with sensible defaults; override only what a test cares about.
function mk(p: Partial<Task> & { id: string }): Task {
  return {
    title: "t",
    assignee: null,
    assignee_id: null,
    due_date: null,
    status: "todo",
    priority: "mid",
    task_type: null,
    estimated_hours: null,
    actual_hours: null,
    parent_id: null,
    created_by: null,
    created_at: "",
    completed_at: null,
    ...p,
  };
}

describe("difficultyFromEstimate（見積り→難易度の自動判定）", () => {
  it("見積りなし・不正値は null（未設定）", () => {
    expect(difficultyFromEstimate(null)).toBeNull();
    expect(difficultyFromEstimate(undefined)).toBeNull();
    expect(difficultyFromEstimate(-1)).toBeNull();
    expect(difficultyFromEstimate(NaN)).toBeNull();
  });

  it("4時間未満は小（境界含む）", () => {
    expect(difficultyFromEstimate(0)).toBe("small");
    expect(difficultyFromEstimate(3.5)).toBe("small");
    expect(difficultyFromEstimate(3.99)).toBe("small");
  });

  it("4〜8時間は中（下端は中、上端は大）", () => {
    expect(difficultyFromEstimate(4)).toBe("mid");
    expect(difficultyFromEstimate(7.99)).toBe("mid");
  });

  it("8〜16時間は大（下端は大、上端は特大）", () => {
    expect(difficultyFromEstimate(8)).toBe("large");
    expect(difficultyFromEstimate(15.99)).toBe("large");
  });

  it("16時間以上は特大", () => {
    expect(difficultyFromEstimate(16)).toBe("xlarge");
    expect(difficultyFromEstimate(40)).toBe("xlarge");
  });
});

describe("completionValue（成果ポイント）", () => {
  it("完了タスクの優先度重み（高3・中2・低1）を合計する", () => {
    const tasks = [
      mk({ id: "a", status: "done", priority: "high" }), // 3
      mk({ id: "b", status: "done", priority: "low" }), // 1
      mk({ id: "c", status: "todo", priority: "high" }), // 未完了は数えない
    ];
    expect(completionValue(tasks)).toBe(4);
  });

  it("完了がなければ 0", () => {
    expect(completionValue([mk({ id: "a", status: "in_progress" })])).toBe(0);
  });
});

describe("productivity（生産性＝成果ポイント÷実績時間）", () => {
  it("完了かつ実績時間ありのタスクで算出する", () => {
    const tasks = [
      mk({ id: "a", status: "done", priority: "high", actual_hours: 3 }), // 3pt / 3h
      mk({ id: "b", status: "done", priority: "mid", actual_hours: 1 }), // 2pt / 1h
    ];
    // (3 + 2) / (3 + 1) = 1.25
    expect(productivity(tasks)).toBe(1.25);
  });

  it("実績時間がなければ null（未計測）", () => {
    const tasks = [
      mk({ id: "a", status: "done", priority: "high", actual_hours: null }),
      mk({ id: "b", status: "todo", priority: "mid", actual_hours: 5 }),
    ];
    expect(productivity(tasks)).toBeNull();
  });
});

describe("estimateAchievement（見積り達成率＝見積h÷実績h）", () => {
  it("完了かつ見積り・実績の両方があるタスクだけで算出する", () => {
    const tasks = [
      mk({ id: "a", status: "done", estimated_hours: 8, actual_hours: 6 }),
      mk({ id: "b", status: "done", estimated_hours: 4, actual_hours: 6 }),
      mk({ id: "c", status: "done", estimated_hours: null, actual_hours: 3 }), // 見積りなし→除外
      mk({ id: "d", status: "todo", estimated_hours: 5, actual_hours: 5 }), // 未完了→除外
    ];
    // (8+4) / (6+6) = 1.0、対象は2件
    expect(estimateAchievement(tasks)).toEqual({ ratio: 1, count: 2 });
  });

  it("見積りより速ければ 1.0 を上回る", () => {
    const tasks = [
      mk({ id: "a", status: "done", estimated_hours: 9, actual_hours: 6 }),
    ];
    expect(estimateAchievement(tasks)).toEqual({ ratio: 1.5, count: 1 });
  });

  it("対象が1件もなければ null（未計測）", () => {
    expect(estimateAchievement([])).toBeNull();
    expect(
      estimateAchievement([
        mk({ id: "a", status: "done", estimated_hours: null, actual_hours: 2 }),
        mk({ id: "b", status: "done", estimated_hours: 3, actual_hours: null }),
      ]),
    ).toBeNull();
  });
});

describe("leafProgress（進捗率＝完了リーフ÷総リーフ）", () => {
  it("親は数えず、末端（リーフ）だけで進捗を計算する", () => {
    const tasks = [
      mk({ id: "p" }), // 親（子を持つので除外）
      mk({ id: "c1", parent_id: "p", status: "done" }), // リーフ・完了
      mk({ id: "c2", parent_id: "p", status: "todo" }), // リーフ・未完了
      mk({ id: "s", status: "done" }), // 単独リーフ・完了
    ];
    // リーフ=3件（c1, c2, s）、完了=2件（c1, s）→ 67%
    expect(leafProgress(tasks)).toEqual({ done: 2, total: 3, percent: 67 });
  });
});
