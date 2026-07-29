import { describe, it, expect } from "vitest";
import {
  buildWorkItems,
  workEfficiency,
  completionsPerPersonDay,
  filterWorkItems,
  distinctFeatures,
  weeklyEfficiencyTrend,
  monthlyEfficiencyTrend,
  latestDelta,
  weekWindow,
  completedWithin,
  type WorkItem,
} from "../../src/lib/productivity";
import type { Task } from "../../src/lib/tasks";

// --- builders -------------------------------------------------------------

function mkTask(p: Partial<Task> & { id: string }): Task {
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
    start_date: null,
    baseline_start: null,
    baseline_due: null,
    project_id: null,
    parent_id: null,
    created_by: null,
    created_at: "",
    completed_at: null,
    quality_checked_at: null,
    ...p,
  };
}

// A done work item with both hours (the shape that counts toward 工数効率A).
function mkItem(p: Partial<WorkItem> & { id: string }): WorkItem {
  return {
    name: "w",
    feature: "（親なし）",
    step: null,
    stepLabel: "未設定",
    estimated: null,
    actual: null,
    status: "done",
    completedAt: null,
    assigneeId: null,
    ...p,
  };
}

// --- buildWorkItems -------------------------------------------------------

describe("buildWorkItems（リーフ＋機能名＋工程の組み立て）", () => {
  it("親は除きリーフだけ。機能＝親名、工程＝task_type、親なしは『（親なし）』", () => {
    const items = buildWorkItems([
      mkTask({ id: "P", title: "ログイン機能" }),
      mkTask({
        id: "C1",
        title: "設計",
        parent_id: "P",
        task_type: "design",
        status: "done",
      }),
      mkTask({ id: "C2", title: "実装", parent_id: "P", task_type: null }),
      mkTask({ id: "S", title: "単発作業" }),
    ]);

    expect(items.map((w) => w.id).sort()).toEqual(["C1", "C2", "S"]);
    const c1 = items.find((w) => w.id === "C1")!;
    expect(c1.feature).toBe("ログイン機能");
    expect(c1.step).toBe("design");
    expect(c1.stepLabel).toBe("設計");
    const c2 = items.find((w) => w.id === "C2")!;
    expect(c2.stepLabel).toBe("未設定");
    expect(items.find((w) => w.id === "S")!.feature).toBe("（親なし）");
  });
});

// --- workEfficiency (A) ---------------------------------------------------

describe("workEfficiency（A. 工数効率＝Σ見積÷Σ実績）", () => {
  it("完了・見積>0・実績>0 のリーフだけ集計する", () => {
    const a = workEfficiency([
      mkItem({ id: "1", estimated: 4, actual: 3 }),
      mkItem({ id: "2", estimated: 12, actual: 12 }),
      mkItem({ id: "3", estimated: 5, actual: 5, status: "in_progress" }), // 未完了→除外
      mkItem({ id: "4", estimated: 0, actual: 5 }), // 見積0→除外
      mkItem({ id: "5", estimated: 5, actual: null }), // 実績なし→除外
    ]);
    expect(a).not.toBeNull();
    expect(a!.count).toBe(2);
    expect(a!.est).toBe(16);
    expect(a!.act).toBe(15);
    expect(a!.ratio).toBeCloseTo(16 / 15, 6);
  });

  it("対象0件なら null（未計測）", () => {
    expect(workEfficiency([])).toBeNull();
    expect(
      workEfficiency([mkItem({ id: "1", estimated: 5, actual: 5, status: "todo" })]),
    ).toBeNull();
  });
});

// --- completionsPerPersonDay (B) -----------------------------------------

describe("completionsPerPersonDay（B. 1人日あたり完了数）", () => {
  it("完了件数 ÷ 人日（人日＝Σ実績÷係数）", () => {
    const items = [
      mkItem({ id: "1", actual: 4 }),
      mkItem({ id: "2", actual: 4 }),
    ];
    const b = completionsPerPersonDay(items, 8);
    expect(b).not.toBeNull();
    expect(b!.count).toBe(2);
    expect(b!.personDays).toBeCloseTo(1, 6); // 8h ÷ 8
    expect(b!.value).toBeCloseTo(2, 6); // 2件 ÷ 1人日
  });

  it("人日換算係数を変えると値が変わる", () => {
    const items = [mkItem({ id: "1", actual: 4 }), mkItem({ id: "2", actual: 4 })];
    expect(completionsPerPersonDay(items, 4)!.value).toBeCloseTo(1, 6); // 8h÷4=2人日, 2件÷2
  });

  it("対象なし・係数0は null", () => {
    expect(completionsPerPersonDay([], 8)).toBeNull();
    expect(
      completionsPerPersonDay([mkItem({ id: "1", actual: 4 })], 0),
    ).toBeNull();
  });
});

// --- filter / distinct ----------------------------------------------------

describe("filterWorkItems / distinctFeatures（作業一覧の絞り込み）", () => {
  const items = [
    mkItem({ id: "1", feature: "ログイン機能", step: "design" }),
    mkItem({ id: "2", feature: "ログイン機能", step: "implementation" }),
    mkItem({ id: "3", feature: "DB移行", step: "design" }),
  ];

  it("機能で絞る", () => {
    expect(
      filterWorkItems(items, { feature: "ログイン機能" }).map((w) => w.id),
    ).toEqual(["1", "2"]);
  });
  it("工程で絞る", () => {
    expect(filterWorkItems(items, { step: "design" }).map((w) => w.id)).toEqual([
      "1",
      "3",
    ]);
  });
  it("機能＋工程で絞る", () => {
    expect(
      filterWorkItems(items, { feature: "ログイン機能", step: "design" }).map(
        (w) => w.id,
      ),
    ).toEqual(["1"]);
  });
  it("空指定は全件", () => {
    expect(filterWorkItems(items, {}).length).toBe(3);
  });
  it("distinctFeatures は重複なし", () => {
    expect(distinctFeatures(items)).toEqual(["DB移行", "ログイン機能"]);
  });
});

// --- trends (完了日基準) --------------------------------------------------

describe("weeklyEfficiencyTrend（週の推移・完了日基準）", () => {
  // baseDate=2026-07-22（水）→ 当該週頭は月曜 2026-07-20。
  const baseDate = new Date("2026-07-22T00:00:00Z");
  const items = [
    // 最新週（7/20〜）：3件で n>=3
    mkItem({ id: "a", estimated: 4, actual: 2, completedAt: "2026-07-21T09:00:00Z" }),
    mkItem({ id: "b", estimated: 6, actual: 6, completedAt: "2026-07-21T09:00:00Z" }),
    mkItem({ id: "c", estimated: 2, actual: 2, completedAt: "2026-07-22T09:00:00Z" }),
    // 前週（7/13〜）：1件で n<3
    mkItem({ id: "d", estimated: 10, actual: 10, completedAt: "2026-07-15T09:00:00Z" }),
  ];

  it("直近4週のラベルが週頭日付で並ぶ", () => {
    const pts = weeklyEfficiencyTrend(items, baseDate, 4);
    expect(pts.map((p) => p.label)).toEqual(["6/29〜", "7/6〜", "7/13〜", "7/20〜"]);
  });

  it("完了日で各週に振り分け、n<3 は前週比を抑制する", () => {
    const pts = weeklyEfficiencyTrend(items, baseDate, 4);
    const latest = pts[3]; // 7/20〜
    expect(latest.n).toBe(3);
    expect(latest.ratio).toBeCloseTo(12 / 10, 6);
    expect(latest.suppressDelta).toBe(false);

    const prev = pts[2]; // 7/13〜
    expect(prev.n).toBe(1);
    expect(prev.ratio).toBeCloseTo(1, 6);
    expect(prev.suppressDelta).toBe(true);

    const empty = pts[0]; // 6/29〜（該当なし）
    expect(empty.n).toBe(0);
    expect(empty.ratio).toBeNull();
  });

  it("latestDelta は最新/前週の比（最新 n>=3 のときだけ）", () => {
    const pts = weeklyEfficiencyTrend(items, baseDate, 4);
    expect(latestDelta(pts)).toBeCloseTo(1.2, 6); // 1.2 ÷ 1.0
  });
});

describe("weekWindow / completedWithin（今週の絞り込み）", () => {
  const baseDate = new Date("2026-07-22T00:00:00Z"); // 週頭は 2026-07-20（月）

  it("weekWindow は月曜〜日曜を返す", () => {
    expect(weekWindow(baseDate)).toEqual({ start: "2026-07-20", end: "2026-07-26" });
  });

  it("completedWithin は窓内に完了したリーフだけ返す", () => {
    const items = [
      mkItem({ id: "in", completedAt: "2026-07-21T09:00:00Z" }),
      mkItem({ id: "out", completedAt: "2026-07-19T09:00:00Z" }),
      mkItem({ id: "notdone", completedAt: "2026-07-21T09:00:00Z", status: "in_progress" }),
    ];
    expect(completedWithin(items, weekWindow(baseDate)).map((w) => w.id)).toEqual(["in"]);
  });
});

describe("monthlyEfficiencyTrend（月の推移・完了日基準）", () => {
  const baseDate = new Date("2026-07-22T00:00:00Z");
  const items = [
    mkItem({ id: "a", estimated: 12, actual: 10, completedAt: "2026-07-10T00:00:00Z" }),
    mkItem({ id: "b", estimated: 6, actual: 5, completedAt: "2026-06-10T00:00:00Z" }),
  ];

  it("直近3ヶ月のラベルと各月への振り分け", () => {
    const pts = monthlyEfficiencyTrend(items, baseDate, 3);
    expect(pts.map((p) => p.label)).toEqual(["5月", "6月", "7月"]);
    expect(pts[0].n).toBe(0); // 5月
    expect(pts[1].ratio).toBeCloseTo(6 / 5, 6); // 6月
    expect(pts[2].ratio).toBeCloseTo(12 / 10, 6); // 7月
  });
});
