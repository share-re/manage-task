import { describe, it, expect } from "vitest";
import {
  hasCycle,
  plannedRatio,
  scheduleStatus,
  lightningProgress,
  type DependencyEdge,
} from "../../src/lib/schedule";
import type { Task } from "../../src/lib/tasks";

const e = (predecessor_id: string, successor_id: string): DependencyEdge => ({
  predecessor_id,
  successor_id,
});

// Build a leaf Task with sensible defaults; override only what matters.
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
    start_date: null,
    baseline_start: null,
    baseline_due: null,
    project_id: null,
    parent_id: null,
    created_by: null,
    created_at: "",
    completed_at: null,
    ...p,
  };
}

describe("hasCycle（依存の循環検出）", () => {
  it("非循環のチェーンは false", () => {
    expect(hasCycle([e("A", "B"), e("B", "C")])).toBe(false);
  });

  it("自分自身への依存は循環", () => {
    expect(hasCycle([e("A", "A")])).toBe(true);
  });

  it("直接の往復 A→B→A は循環", () => {
    expect(hasCycle([e("A", "B"), e("B", "A")])).toBe(true);
  });

  it("間接の一周 A→B→C→A は循環", () => {
    expect(hasCycle([e("A", "B"), e("B", "C"), e("C", "A")])).toBe(true);
  });

  it("candidate を足すと循環になるケースを事前に検出", () => {
    const existing = [e("A", "B"), e("B", "C")];
    expect(hasCycle(existing, e("C", "A"))).toBe(true); // 追加で一周する
    expect(hasCycle(existing, e("C", "D"))).toBe(false); // 追加しても無循環
  });
});

describe("plannedRatio（稲妻線の計画位置・clampと境界）", () => {
  it("baseline が欠けていれば null", () => {
    expect(plannedRatio(null, "2026-07-20", "2026-07-15")).toBeNull();
    expect(plannedRatio("2026-07-10", null, "2026-07-15")).toBeNull();
  });

  it("期間の途中はそのままの比率", () => {
    // 7/10〜7/20（10日）の真ん中 7/15 → 0.5
    expect(plannedRatio("2026-07-10", "2026-07-20", "2026-07-15")).toBeCloseTo(
      0.5,
    );
  });

  it("開始前は 0、期限後は 1 に丸める（clamp）", () => {
    expect(plannedRatio("2026-07-10", "2026-07-20", "2026-07-05")).toBe(0);
    expect(plannedRatio("2026-07-10", "2026-07-20", "2026-07-25")).toBe(1);
  });

  it("ゼロ幅（開始==期限）は当日から 1、前日までは 0", () => {
    expect(plannedRatio("2026-07-10", "2026-07-10", "2026-07-09")).toBe(0);
    expect(plannedRatio("2026-07-10", "2026-07-10", "2026-07-10")).toBe(1);
  });

  it("期限が開始より前（不正データ）は null", () => {
    expect(plannedRatio("2026-07-20", "2026-07-10", "2026-07-15")).toBeNull();
  });
});

describe("scheduleStatus（計画対実績の判定）", () => {
  it("計画できない（ratio=null）は null", () => {
    expect(scheduleStatus(false, null)).toBeNull();
  });
  it("予定より早く完了は ahead", () => {
    expect(scheduleStatus(true, 0.5)).toBe("ahead");
  });
  it("予定どおり期限到来で完了は onTrack", () => {
    expect(scheduleStatus(true, 1)).toBe("onTrack");
  });
  it("期限を過ぎても未完了は behind", () => {
    expect(scheduleStatus(false, 1)).toBe("behind");
  });
  it("まだ期限前で未完了は onTrack（遅れ扱いしない）", () => {
    expect(scheduleStatus(false, 0.4)).toBe("onTrack");
  });
});

describe("lightningProgress（件数ベースの稲妻線）", () => {
  const baseDate = "2026-07-15";

  it("baseline_due が無いリーフは unscheduled として除外", () => {
    const leaves = [
      mk({ id: "a", baseline_due: "2026-07-10", status: "done" }),
      mk({ id: "b" }), // 日付なし
    ];
    const r = lightningProgress(leaves, baseDate);
    expect(r.total).toBe(1);
    expect(r.unscheduled).toBe(1);
    expect(r.actual).toBe(1);
    expect(r.planned).toBe(1); // 7/10 <= 7/15
  });

  it("計画は「期限が基準日以前」の本数、実績は完了本数", () => {
    const leaves = [
      mk({ id: "a", baseline_due: "2026-07-10", status: "done" }), // 予定済・完了
      mk({ id: "b", baseline_due: "2026-07-12", status: "todo" }), // 予定済・未完（遅れ）
      mk({ id: "c", baseline_due: "2026-07-20", status: "todo" }), // まだ先
    ];
    const r = lightningProgress(leaves, baseDate);
    expect(r.total).toBe(3);
    expect(r.planned).toBe(2); // 7/10, 7/12
    expect(r.actual).toBe(1); // a のみ
    expect(r.plannedPercent).toBe(67);
    expect(r.actualPercent).toBe(33);
  });

  it("依存未充足（blockedIds）のリーフは計画から除外（案イ）", () => {
    const leaves = [
      mk({ id: "a", baseline_due: "2026-07-10", status: "done" }),
      mk({ id: "b", baseline_due: "2026-07-12", status: "todo" }), // 依存待ち
    ];
    const r = lightningProgress(leaves, baseDate, {
      blockedIds: new Set(["b"]),
    });
    expect(r.total).toBe(1);
    expect(r.blocked).toBe(1);
    expect(r.planned).toBe(1);
    expect(r.actual).toBe(1);
  });

  it("対象ゼロなら 0%（ゼロ除算しない）", () => {
    const r = lightningProgress([], baseDate);
    expect(r.total).toBe(0);
    expect(r.plannedPercent).toBe(0);
    expect(r.actualPercent).toBe(0);
  });
});
