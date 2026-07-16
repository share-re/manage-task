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

export type Task = {
  id: string;
  title: string;
  assignee: string | null; // legacy: display-name string (fallback while migrating)
  assignee_id: string | null; // new: profiles.id — source of truth for the assignee
  due_date: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
};

// Presentation metadata for each status, kept together so the label, the
// display order, and the badge color can never drift apart across files.
export const STATUS_META: Record<
  TaskStatus,
  { label: string; badgeClass: string; barColor: string }
> = {
  todo: { label: "未着手", badgeClass: "bg-zinc-100 text-zinc-600", barColor: "#B4B2A9" },
  in_progress: { label: "進行中", badgeClass: "bg-blue-100 text-blue-700", barColor: "#378ADD" },
  done: { label: "完了", badgeClass: "bg-green-200 text-green-800", barColor: "#3B6D11" },
};

export const STATUS_ORDER: TaskStatus[] = [...TASK_STATUSES];

// Backward-compatible label map derived from STATUS_META (other modules/branches
// still import STATUS_LABELS). STATUS_META remains the single source of truth.
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: STATUS_META.todo.label,
  in_progress: STATUS_META.in_progress.label,
  done: STATUS_META.done.label,
};

// Presentation + sort order for task priority. A DB null is treated as "mid"
// (未設定＝中) via normalizeTask, so the UI always has a concrete value.
export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; badgeClass: string; order: number }
> = {
  high: { label: "高", badgeClass: "bg-red-100 text-red-700", order: 0 },
  mid: { label: "中", badgeClass: "bg-amber-100 text-amber-700", order: 1 },
  low: { label: "低", badgeClass: "bg-zinc-100 text-zinc-600", order: 2 },
};

export const PRIORITY_ORDER: TaskPriority[] = [...TASK_PRIORITIES];

// Columns fetched from the DB. Listing them explicitly (instead of "*") means
// the client-side Task type and the query never silently diverge.
const TASK_COLUMNS =
  "id, title, assignee, assignee_id, due_date, status, priority, parent_id, created_by, created_at, completed_at";

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
    parent_id: typeof row.parent_id === "string" ? row.parent_id : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    completed_at:
      typeof row.completed_at === "string" ? row.completed_at : null,
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

export type TaskEdit = {
  title: string;
  assignee?: string;
  assigneeId?: string | null; // profiles.id of the assignee (preferred)
  dueDate?: string;
  status: TaskStatus;
  priority?: TaskPriority;
};

/**
 * Update a task's editable fields at once (title / assignee / due date /
 * status) and return the refreshed row. completed_at is kept in sync with the
 * status so a task moved out of "done" no longer counts as completed.
 */
export async function updateTask(id: string, edit: TaskEdit): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: edit.title,
      assignee: edit.assignee?.trim() || null,
      assignee_id: edit.assigneeId ?? null,
      due_date: edit.dueDate || null,
      status: edit.status,
      priority: edit.priority ?? "mid",
      completed_at: edit.status === "done" ? new Date().toISOString() : null,
    })
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
