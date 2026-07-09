import { describe, it, expect } from "vitest";
import { isTaskStatus, taskProgress, buildTaskTree, type Task } from "@/lib/tasks";

function mk(id: string, over: Partial<Task> = {}): Task {
  return {
    id, title: "t" + id, assignee: null, due_date: null, status: "todo",
    parent_id: null, created_by: null, created_at: "2026-07-01T00:00:00Z",
    completed_at: null, ...over,
  };
}

describe("isTaskStatus", () => {
  it("accepts the three valid statuses", () => {
    expect(isTaskStatus("todo")).toBe(true);
    expect(isTaskStatus("in_progress")).toBe(true);
    expect(isTaskStatus("done")).toBe(true);
  });
  it("rejects anything else", () => {
    expect(isTaskStatus("nope")).toBe(false);
    expect(isTaskStatus(null)).toBe(false);
    expect(isTaskStatus(3)).toBe(false);
  });
});

describe("taskProgress", () => {
  it("counts done / total / percent", () => {
    const r = taskProgress([mk("1", { status: "done" }), mk("2"), mk("3", { status: "in_progress" })]);
    expect(r).toEqual({ done: 1, total: 3, percent: 33 });
  });
  it("is safe (0%) on an empty list", () => {
    expect(taskProgress([])).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe("buildTaskTree", () => {
  it("nests children under parents, preserves order, keeps each task once", () => {
    const tree = buildTaskTree([mk("p"), mk("c1", { parent_id: "p" }), mk("c2", { parent_id: "p" }), mk("r")]);
    expect(tree.map((n) => n.task.id)).toEqual(["p", "r"]);
    expect(tree[0].children.map((c) => c.id)).toEqual(["c1", "c2"]);
    const seen = tree.flatMap((n) => [n.task.id, ...n.children.map((c) => c.id)]).sort();
    expect(seen).toEqual(["c1", "c2", "p", "r"]);
  });
  it("surfaces orphans and grandchildren as roots (2-level only)", () => {
    const tree = buildTaskTree([
      mk("p"), mk("c", { parent_id: "p" }), mk("gc", { parent_id: "c" }),
      mk("orphan", { parent_id: "missing" }),
    ]);
    const roots = tree.map((n) => n.task.id);
    expect(roots).toContain("gc");     // grandchild surfaced, not dropped
    expect(roots).toContain("orphan"); // missing parent surfaced
  });
});
