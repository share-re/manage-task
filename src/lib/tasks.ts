import { supabase } from "./supabase";

export type TaskStatus = "todo" | "in_progress" | "done";

// Single source of truth for the valid statuses. STATUS_ORDER (below) reuses
// this, and isTaskStatus() guards untrusted values (e.g. rows from the DB).
const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

export type TaskPriority = "high" | "mid" | "low";

// Valid priorities, highest first. A missing/unknown value is treated as "mid"
// (未設定＝中) in normalizeTask so every task always has a concrete priority.
const TASK_PRIORITIES = ["high", "mid", "low"] as const;

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    (TASK_PRIORITIES as readonly string[]).includes(value)
  );
}

export type TaskType =
  | "design"
  | "implementation"
  | "test"
  | "research"
  | "review"
  | "documentation";

// Valid task types. Matches the DB check constraint on tasks.task_type. English
// codes are stored; Japanese labels live in TASK_TYPE_META (same pattern as
// STATUS/PRIORITY).
const TASK_TYPES = [
  "design",
  "implementation",
  "test",
  "research",
  "review",
  "documentation",
] as const;

export function isTaskType(value: unknown): value is TaskType {
  return (
    typeof value === "string" &&
    (TASK_TYPES as readonly string[]).includes(value)
  );
}

// Difficulty is NOT stored in the DB — it is derived from estimated_hours (see
// difficultyFromEstimate). Kept as its own type for labels and comparison.
export type Difficulty = "small" | "mid" | "large" | "xlarge";

export type Task = {
  id: string;
  title: string;
  assignee: string | null; // legacy: display-name string (fallback while migrating)
  assignee_id: string | null; // new: profiles.id — source of truth for the assignee
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  task_type: TaskType | null;
  estimated_hours: number | null; // 見積工数（着手前の中立な予想・任意）
  actual_hours: number | null; // 実績時間（完了時に入力）
  start_date: string | null; // 開始日（ガントの棒の左端）… Q-08
  baseline_start: string | null; // 当初計画の開始（凍結。稲妻線を“動く的”にしない）… 要確認-4
  baseline_due: string | null; // 当初計画の期限（凍結）… 要確認-4
  project_id: string | null; // 案件（新階層）… 要確認-10
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  /** 品質チェック実施済みの日時。null＝未確認（0件と区別する）… 品質_実装手順書 */
  quality_checked_at: string | null;
};

// Default label for each status.
//
// The badge class and the row's bar color used to live here too. They now
// belong to the status master (@/lib/statuses), which reads the label and
// color from task_statuses and falls back to the labels below — keeping one
// place per piece of information.
export const STATUS_META: Record<TaskStatus, { label: string }> = {
  todo: { label: "未着手" },
  in_progress: { label: "進行中" },
  done: { label: "完了" },
};

export const STATUS_ORDER: TaskStatus[] = [...TASK_STATUSES];

// Backward-compatible label map derived from STATUS_META (other modules/branches
// still import STATUS_LABELS). STATUS_META remains the single source of truth.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: STATUS_META.todo.label,
  in_progress: STATUS_META.in_progress.label,
  done: STATUS_META.done.label,
};

// Priority defaults. A DB null is treated as "mid" (未設定＝中) via
// normalizeTask, so the UI always has a concrete value.
//
// The badge color used to live here too. It now belongs to the priority master
// (@/lib/priorities), which reads the label and color from task_priorities and
// falls back to the labels below — keeping one place per piece of information.
export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; order: number; weight: number }
> = {
  high: { label: "高", order: 0, weight: 3 },
  mid: { label: "中", order: 1, weight: 2 },
  low: { label: "低", order: 2, weight: 1 },
};

export const PRIORITY_ORDER: TaskPriority[] = [...TASK_PRIORITIES];

// Presentation for task type. English code in the DB, Japanese label in the UI
// (same pattern as STATUS_META / PRIORITY_META).
export const TASK_TYPE_META: Record<TaskType, { label: string }> = {
  design: { label: "設計" },
  implementation: { label: "実装" },
  test: { label: "テスト" },
  research: { label: "調査" },
  review: { label: "レビュー" },
  documentation: { label: "資料作成" },
};

export const TASK_TYPE_ORDER: TaskType[] = [...TASK_TYPES];

// Labels for the derived difficulty (小 / 中 / 大 / 特大).
export const DIFFICULTY_META: Record<Difficulty, { label: string }> = {
  small: { label: "小" },
  mid: { label: "中" },
  large: { label: "大" },
  xlarge: { label: "特大" },
};

// Difficulty thresholds (hours), on an ~8h/day feel:
// small <4h（半日未満）, mid 4–8h（〜1日）, large 8–16h（1〜2日）, xlarge >=16h（2日超）.
const DIFFICULTY_MID_MIN_HOURS = 4;
const DIFFICULTY_LARGE_MIN_HOURS = 8;
const DIFFICULTY_XLARGE_MIN_HOURS = 16;

// Columns fetched from the DB. Listing them explicitly (instead of "*") means
// the client-side Task type and the query never silently diverge.
const TASK_COLUMNS =
  "id, title, assignee, assignee_id, due_date, status, priority, task_type, estimated_hours, actual_hours, start_date, baseline_start, baseline_due, project_id, parent_id, created_by, created_at, completed_at, quality_checked_at";

// Coerce a DB numeric (may arrive as number or string) into number | null.
function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

// Normalize an untyped DB row into a Task. An unexpected status falls back to
// "todo" so an unknown value can't break status-keyed UI (labels, colors).
function normalizeTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: typeof row.title === "string" ? row.title : "",
    assignee: typeof row.assignee === "string" ? row.assignee : null,
    assignee_id: typeof row.assignee_id === "string" ? row.assignee_id : null,
    due_date: typeof row.due_date === "string" ? row.due_date : null,
    status: isTaskStatus(row.status) ? row.status : "todo",
    priority: isTaskPriority(row.priority) ? row.priority : "mid",
    task_type: isTaskType(row.task_type) ? row.task_type : null,
    estimated_hours: toNumberOrNull(row.estimated_hours),
    actual_hours: toNumberOrNull(row.actual_hours),
    start_date: typeof row.start_date === "string" ? row.start_date : null,
    baseline_start:
      typeof row.baseline_start === "string" ? row.baseline_start : null,
    baseline_due:
      typeof row.baseline_due === "string" ? row.baseline_due : null,
    project_id: typeof row.project_id === "string" ? row.project_id : null,
    parent_id: typeof row.parent_id === "string" ? row.parent_id : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    completed_at:
      typeof row.completed_at === "string" ? row.completed_at : null,
    quality_checked_at:
      typeof row.quality_checked_at === "string" ? row.quality_checked_at : null,
  };
}

/** Fetch all tasks, oldest first. */
export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeTask);
}

export type NewTask = {
  title: string;
  assignee?: string;
  assigneeId?: string | null; // profiles.id of the assignee (preferred)
  dueDate?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  taskType?: TaskType | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  startDate?: string;
  projectId?: string | null;
  parentId?: string | null;
};

/** Create a task. created_by is filled by the DB (auth.uid()). */
export async function createTask(input: NewTask): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: input.title,
      assignee: input.assignee || null,
      assignee_id: input.assigneeId ?? null,
      due_date: input.dueDate || null,
      status: input.status,
      priority: input.priority ?? "mid",
      task_type: input.taskType ?? null,
      estimated_hours: input.estimatedHours ?? null,
      actual_hours: input.actualHours ?? null,
      start_date: input.startDate || null,
      // Freeze the baseline at creation (copy of the first plan), so later
      // date edits don't move the lightning-line's target (要確認-4).
      baseline_start: input.startDate || null,
      baseline_due: input.dueDate || null,
      project_id: input.projectId ?? null,
      parent_id: input.parentId ?? null,
      completed_at: input.status === "done" ? new Date().toISOString() : null,
    })
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeTask(data);
}

/** Create several tasks at once (bulk registration). */
export async function createTasks(inputs: NewTask[]): Promise<Task[]> {
  const now = new Date().toISOString();
  const rows = inputs.map((input) => ({
    title: input.title,
    assignee: input.assignee || null,
    assignee_id: input.assigneeId ?? null,
    due_date: input.dueDate || null,
    status: input.status,
    priority: input.priority ?? "mid",
    task_type: input.taskType ?? null,
    estimated_hours: input.estimatedHours ?? null,
    actual_hours: input.actualHours ?? null,
    start_date: input.startDate || null,
    baseline_start: input.startDate || null,
    baseline_due: input.dueDate || null,
    project_id: input.projectId ?? null,
    parent_id: input.parentId ?? null,
    completed_at: input.status === "done" ? now : null,
  }));
  const { data, error } = await supabase
    .from("tasks")
    .insert(rows)
    .select(TASK_COLUMNS);
  if (error) throw error;
  return (data ?? []).map(normalizeTask);
}

/** Team-wide progress: how many tasks are done out of all tasks. */
export function taskProgress(tasks: Task[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

/**
 * The "leaf" tasks — those with no children (child tasks plus standalone
 * tasks). Parents that group children are excluded: a parent is an aggregate,
 * and its completion is auto-derived from its children (see the parent
 * auto-archive rule), so counting parents would double-count the same work and
 * inflate progress. Counting leaves reflects the real, hands-on work done.
 */
// --- まとめて登録の行解析 ---

/** まとめて登録のテキスト1行ぶん。key は行ごとの期間を覚えておくための識別子。 */
export type BulkRow = {
  /** 「何番目の親の、何番目の子か」。行を編集しても同じ行なら同じキーになる。 */
  key: string;
  title: string;
  isChild: boolean;
};

/**
 * まとめて登録のテキストを親子の並びに読み替える。
 *
 * 規則は登録処理と同じ: 空行は無視し、行頭が空白（半角/タブ/全角）なら直前の
 * 非インデント行の子になる。先頭がいきなりインデントされている場合は親として扱う
 * （親がまだ無いため）。
 *
 * 画面（行ごとの期間の入力欄）と保存処理の両方がこの関数を使う。別々に書くと
 * 「画面で設定した期間が、保存時に別の行に付く」というずれが起きるため。
 */
export function parseBulkRows(text: string): BulkRow[] {
  const rows: BulkRow[] = [];
  let parentIdx = -1;
  let childIdx = 0;
  for (const raw of text.split("\n")) {
    if (!raw.trim()) continue;
    const isChild = /^[ \t　]/.test(raw) && parentIdx >= 0;
    if (isChild) {
      childIdx += 1;
      rows.push({
        key: `${parentIdx}-${childIdx}`,
        title: raw.trim(),
        isChild: true,
      });
    } else {
      parentIdx += 1;
      childIdx = 0;
      rows.push({ key: `${parentIdx}`, title: raw.trim(), isChild: false });
    }
  }
  return rows;
}

/** 行ごとに設定された期間。未設定の行は共通の期間を使う。 */
export type BulkRange = { start: string; due: string };

/**
 * その行に使う期間を決める。個別設定があればそれを、無ければ共通の値を返す。
 * 個別設定のうち片方だけ入力されている場合、空いている方は共通で埋める
 * （開始だけ決まっている、という入力を弾かないため）。
 */
export function resolveBulkRange(
  range: BulkRange | undefined,
  shared: BulkRange,
): BulkRange {
  if (!range) return shared;
  return {
    start: range.start || shared.start,
    due: range.due || shared.due,
  };
}

export function leafTasks(tasks: Task[]): Task[] {
  const parentIds = new Set(
    tasks.map((t) => t.parent_id).filter((id): id is string => id !== null),
  );
  return tasks.filter((t) => !parentIds.has(t.id));
}

/** Delete one or more tasks by id. */
export async function deleteTasks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) throw error;
}

/** Update a task's status. */
export async function updateTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Mark a task done and record its actual hours in one update. */
export async function completeTask(
  id: string,
  actualHours: number,
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
      actual_hours: actualHours,
    })
    .eq("id", id);
  if (error) throw error;
}

export type TaskEdit = {
  title: string;
  assignee?: string;
  assigneeId?: string | null; // profiles.id of the assignee (preferred)
  dueDate?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  // The metric fields and start_date are optional; only written when provided
  // (see updateTask), so flows that don't touch them can't null them out.
  taskType?: TaskType | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  startDate?: string;
  // Baseline is frozen once (see freezeBaseline): the caller passes these only
  // to fill an as-yet-unfrozen baseline; an already-frozen one is never sent.
  baselineStart?: string | null;
  baselineDue?: string | null;
};

/**
 * Update a task's editable fields at once (title / assignee / due date /
 * status) and return the refreshed row. completed_at is kept in sync with the
 * status so a task moved out of "done" no longer counts as completed.
 */
export async function updateTask(id: string, edit: TaskEdit): Promise<Task> {
  // Build the patch. The 3 metric fields (task_type / estimated_hours /
  // actual_hours) are only written when the caller actually provides them, so a
  // flow that doesn't touch them (e.g. the completion dialog) can't null them out.
  const patch: Record<string, unknown> = {
    title: edit.title,
    assignee: edit.assignee?.trim() || null,
    assignee_id: edit.assigneeId ?? null,
    due_date: edit.dueDate || null,
    status: edit.status,
    priority: edit.priority ?? "mid",
    completed_at: edit.status === "done" ? new Date().toISOString() : null,
  };
  if (edit.taskType !== undefined) patch.task_type = edit.taskType;
  if (edit.estimatedHours !== undefined)
    patch.estimated_hours = edit.estimatedHours;
  if (edit.actualHours !== undefined) patch.actual_hours = edit.actualHours;
  // start_date only when provided. project_id is intentionally NOT touched here
  // (the project switcher in PR3 moves it). baseline_* is written only to freeze
  // a still-empty baseline (see freezeBaseline); an already-frozen one is never
  // sent by the caller, so a replan can't move the lightning-line target.
  if (edit.startDate !== undefined) patch.start_date = edit.startDate || null;
  if (edit.baselineStart !== undefined)
    patch.baseline_start = edit.baselineStart;
  if (edit.baselineDue !== undefined) patch.baseline_due = edit.baselineDue;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select(TASK_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeTask(data);
}

export type TaskNode = { task: Task; children: Task[] };

/**
 * Group a flat task list into a 2-level tree.
 *
 * A task becomes a root when it has no parent, when its parent is missing
 * (an orphan — e.g. the parent was deleted), or when its parent is itself a
 * child (we only render 2 levels, so a "grandchild" is surfaced as a root
 * rather than being silently dropped from the list). Every task therefore
 * appears exactly once. Input order is preserved.
 */
export function buildTaskTree(tasks: Task[]): TaskNode[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const childrenByParent = new Map<string, Task[]>();
  const roots: Task[] = [];

  for (const task of tasks) {
    const parent = task.parent_id ? byId.get(task.parent_id) : undefined;
    if (!parent || parent.parent_id) {
      roots.push(task);
    } else {
      const siblings = childrenByParent.get(parent.id) ?? [];
      siblings.push(task);
      childrenByParent.set(parent.id, siblings);
    }
  }

  return roots.map((task) => ({
    task,
    children: childrenByParent.get(task.id) ?? [],
  }));
}

/**
 * Resolve the display label for a task's assignee. Prefers assignee_id looked up
 * in labelById (the current profiles.name, so name changes are reflected
 * automatically); falls back to the legacy assignee string for rows not yet
 * migrated. Returns null when there is no assignee (shown as "担当者なし").
 */
export function resolveAssigneeLabel(
  task: { assignee_id: string | null; assignee: string | null },
  labelById: Map<string, string>,
): string | null {
  if (task.assignee_id) return labelById.get(task.assignee_id) ?? null;
  return task.assignee ?? null;
}

// --- Phase 1 metrics (難易度の自動判定・成果ポイント・生産性・進捗率) ---

/**
 * Derive difficulty from the estimated hours. small <4h, mid 4–8h,
 * large 8–16h, xlarge >=16h. Returns null when there is no (valid) estimate —
 * the UI shows "未設定" and the task is left out of same-difficulty comparisons.
 */
export function difficultyFromEstimate(
  hours: number | null | undefined,
): Difficulty | null {
  if (hours == null || !Number.isFinite(hours) || hours < 0) return null;
  if (hours < DIFFICULTY_MID_MIN_HOURS) return "small";
  if (hours < DIFFICULTY_LARGE_MIN_HOURS) return "mid";
  if (hours < DIFFICULTY_XLARGE_MIN_HOURS) return "large";
  return "xlarge";
}

/**
 * 成果ポイント (completion value): the summed priority weight of DONE tasks.
 * A *supporting* metric (優先度重みは主観のため主指標にはしない). Pass leaf
 * tasks — parents that only group children would double-count.
 */
export function completionValue(tasks: Task[]): number {
  return tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + PRIORITY_META[t.priority].weight, 0);
}

/**
 * 生産性 (productivity): completion value per actual hour, over DONE tasks that
 * have a recorded actual_hours. Returns null when there are no usable hours, so
 * the UI can show "未計測" instead of a misleading 0. Pass leaf tasks.
 */
export function productivity(tasks: Task[]): number | null {
  let value = 0;
  let hours = 0;
  for (const t of tasks) {
    if (t.status !== "done" || t.actual_hours == null || t.actual_hours <= 0)
      continue;
    value += PRIORITY_META[t.priority].weight;
    hours += t.actual_hours;
  }
  if (hours <= 0) return null;
  return value / hours;
}

/**
 * 進捗率 (main progress): done leaves ÷ total leaves. Counting leaves (not the
 * grouping parents) matches the on-the-ground feel. This is the MAIN progress
 * number; 成果ポイント/生産性 are supporting metrics.
 */
export function leafProgress(tasks: Task[]): {
  done: number;
  total: number;
  percent: number;
} {
  return taskProgress(leafTasks(tasks));
}

/**
 * 見積り達成率 (estimate achievement, EVM-CPI-like): Σestimated ÷ Σactual over
 * DONE tasks that carry both hours. 1.0 = right on estimate; above = faster.
 * Returns null (「未計測」) when no task qualifies — estimates are optional, so
 * the count n is included for the "based on n tasks" caption. Pass leaf tasks.
 */
export function estimateAchievement(
  tasks: Task[],
): { ratio: number; count: number } | null {
  let est = 0;
  let act = 0;
  let count = 0;
  for (const t of tasks) {
    if (
      t.status !== "done" ||
      t.estimated_hours == null ||
      t.estimated_hours <= 0 ||
      t.actual_hours == null ||
      t.actual_hours <= 0
    )
      continue;
    est += t.estimated_hours;
    act += t.actual_hours;
    count++;
  }
  if (count === 0 || act <= 0) return null;
  return { ratio: est / act, count };
}

/**
 * Freeze-once baseline (要確認-4 / PR2 整合性修正): compute which baseline fields
 * to fill on save. Only an *empty* baseline is filled — from the current
 * start/due — so a task created without dates, then dated later, still gets a
 * baseline; an already-frozen baseline is left alone (never overwritten by a
 * replan). Returns just the fields to set, ready to spread into a TaskEdit.
 */
export function freezeBaseline(
  task: { baseline_start: string | null; baseline_due: string | null },
  startDate: string | null | undefined,
  dueDate: string | null | undefined,
): { baselineStart?: string; baselineDue?: string } {
  const out: { baselineStart?: string; baselineDue?: string } = {};
  if (task.baseline_start == null && startDate) out.baselineStart = startDate;
  if (task.baseline_due == null && dueDate) out.baselineDue = dueDate;
  return out;
}
