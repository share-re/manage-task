import type { Task } from "./tasks";

// フェーズ2の純関数（依存グラフ・稲妻線の計画値）。DB に触らないので
// テストしやすい。日付は "YYYY-MM-DD"（先頭10文字）で扱い、UTC日で比較する。

/** A Finish-to-Start dependency edge: predecessor must finish before successor. */
export type DependencyEdge = {
  predecessor_id: string;
  successor_id: string;
};

// Parse a "YYYY-MM-DD"(以降は無視) date string into a UTC-day timestamp.
// Returns null for missing/invalid input so callers can skip it.
function parseDay(value: string | null | undefined): number | null {
  if (typeof value !== "string" || value.length < 10) return null;
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return null;
  return Date.UTC(y, m - 1, d);
}

/**
 * Would the dependency graph contain a cycle? Checks the given edges plus an
 * optional `candidate` edge about to be added, so the UI can reject a dependency
 * before saving it (F-05). A self-edge (A→A) counts as a cycle.
 */
export function hasCycle(
  edges: DependencyEdge[],
  candidate?: DependencyEdge,
): boolean {
  const all = candidate ? [...edges, candidate] : edges;
  const adj = new Map<string, string[]>();
  for (const e of all) {
    if (e.predecessor_id === e.successor_id) return true; // self dependency
    const next = adj.get(e.predecessor_id) ?? [];
    next.push(e.successor_id);
    adj.set(e.predecessor_id, next);
  }

  // DFS with white(0)/gray(1)/black(2) coloring; a gray node reached again = cycle.
  const color = new Map<string, number>();
  const visit = (node: string): boolean => {
    if (color.get(node) === 1) return true;
    if (color.get(node) === 2) return false;
    color.set(node, 1);
    for (const nxt of adj.get(node) ?? []) {
      if (visit(nxt)) return true;
    }
    color.set(node, 2);
    return false;
  };
  for (const node of adj.keys()) {
    if (visit(node)) return true;
  }
  return false;
}

/**
 * 計画進捗率 (planned ratio) for one task at a base date: where the task *should*
 * be if it kept to its frozen baseline. `(base - start) / (due - start)`, clamped
 * to 0〜1. Uses the baseline (not the editable dates) so replanning can't erase a
 * delay (要確認-4). Returns null when the baseline dates are missing/invalid.
 * Zero-width (start == due, e.g. a same-day/milestone task) is 1 on/after the day,
 * else 0.
 */
export function plannedRatio(
  baselineStart: string | null,
  baselineDue: string | null,
  baseDate: string,
): number | null {
  const start = parseDay(baselineStart);
  const due = parseDay(baselineDue);
  const base = parseDay(baseDate);
  if (start == null || due == null || base == null) return null;
  if (due < start) return null; // bad data: end before start
  if (due === start) return base >= due ? 1 : 0;
  const ratio = (base - start) / (due - start);
  return Math.min(1, Math.max(0, ratio));
}

export type ScheduleStatus = "ahead" | "onTrack" | "behind";

/**
 * Compare a leaf's binary actual (done or not) against its planned ratio at the
 * base date. done-early = ahead; not-done-past-plan = behind; otherwise onTrack.
 * Returns null when there's no baseline to plan against.
 */
export function scheduleStatus(
  done: boolean,
  ratio: number | null,
): ScheduleStatus | null {
  if (ratio == null) return null;
  if (done) return ratio >= 1 ? "onTrack" : "ahead";
  return ratio >= 1 ? "behind" : "onTrack";
}

export type LightningProgress = {
  total: number; // eligible (scheduled, not dependency-blocked) leaves
  planned: number; // of those, how many the baseline says should be done by baseDate
  actual: number; // of those, how many are actually done
  unscheduled: number; // leaves with no baseline_due (excluded from the line)
  blocked: number; // scheduled leaves excluded because dependencies aren't met (案イ)
  plannedPercent: number;
  actualPercent: number;
};

/**
 * 稲妻線 (lightning line), count-based (要確認-4): for a set of leaf tasks, how
 * many *should* be done by the base date (planned) vs how many *are* (actual).
 * Binary actuals compared as counts avoid the smooth-vs-step mismatch of a
 * ratio line. Leaves with no baseline_due are set aside as `unscheduled`;
 * dependency-blocked leaves (ids in opts.blockedIds) are excluded from the plan
 * (案イ: "not its turn yet" is not a delay).
 */
export function lightningProgress(
  leaves: Task[],
  baseDate: string,
  opts?: { blockedIds?: Set<string> },
): LightningProgress {
  const base = parseDay(baseDate);
  const blocked = opts?.blockedIds ?? new Set<string>();
  let total = 0;
  let planned = 0;
  let actual = 0;
  let unscheduled = 0;
  let blockedCount = 0;

  for (const t of leaves) {
    const due = parseDay(t.baseline_due);
    if (due == null) {
      unscheduled++;
      continue;
    }
    if (blocked.has(t.id)) {
      blockedCount++;
      continue;
    }
    total++;
    if (base != null && due <= base) planned++;
    if (t.status === "done") actual++;
  }

  return {
    total,
    planned,
    actual,
    unscheduled,
    blocked: blockedCount,
    plannedPercent: total === 0 ? 0 : Math.round((planned / total) * 100),
    actualPercent: total === 0 ? 0 : Math.round((actual / total) * 100),
  };
}
