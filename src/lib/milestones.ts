import { supabase } from "./supabase";

// マイルストーン（節目：納期/レビュー/リリース）… Q-11。
// project_id で案件スコープ。タスク紐付けは milestone_tasks（多対多）。

export type MilestoneKind = "deadline" | "review" | "release";

const MILESTONE_KINDS = ["deadline", "review", "release"] as const;

export function isMilestoneKind(value: unknown): value is MilestoneKind {
  return (
    typeof value === "string" &&
    (MILESTONE_KINDS as readonly string[]).includes(value)
  );
}

// English code in the DB, Japanese label in the UI (same pattern as tasks).
export const MILESTONE_KIND_META: Record<MilestoneKind, { label: string }> = {
  deadline: { label: "納期" },
  review: { label: "レビュー" },
  release: { label: "リリース" },
};

export const MILESTONE_KIND_ORDER: MilestoneKind[] = [...MILESTONE_KINDS];

export type Milestone = {
  id: string;
  project_id: string | null;
  title: string;
  due_date: string;
  kind: MilestoneKind;
  achieved: boolean;
  assignee_id: string | null;
  note: string | null;
  created_at: string;
};

const MILESTONE_COLUMNS =
  "id, project_id, title, due_date, kind, achieved, assignee_id, note, created_at";

function normalizeMilestone(row: Record<string, unknown>): Milestone {
  return {
    id: String(row.id),
    project_id: typeof row.project_id === "string" ? row.project_id : null,
    title: typeof row.title === "string" ? row.title : "",
    due_date: typeof row.due_date === "string" ? row.due_date : "",
    kind: isMilestoneKind(row.kind) ? row.kind : "deadline",
    achieved: row.achieved === true,
    assignee_id: typeof row.assignee_id === "string" ? row.assignee_id : null,
    note: typeof row.note === "string" ? row.note : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/** All milestones, earliest due date first. */
export async function listMilestones(): Promise<Milestone[]> {
  const { data, error } = await supabase
    .from("milestones")
    .select(MILESTONE_COLUMNS)
    .order("due_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeMilestone);
}

export type NewMilestone = {
  title: string;
  dueDate: string;
  kind: MilestoneKind;
  projectId?: string | null;
  assigneeId?: string | null;
  note?: string | null;
};

/** Create a milestone. */
export async function createMilestone(input: NewMilestone): Promise<Milestone> {
  const { data, error } = await supabase
    .from("milestones")
    .insert({
      title: input.title,
      due_date: input.dueDate,
      kind: input.kind,
      project_id: input.projectId ?? null,
      assignee_id: input.assigneeId ?? null,
      note: input.note ?? null,
    })
    .select(MILESTONE_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeMilestone(data);
}

export type MilestoneEdit = {
  title?: string;
  dueDate?: string;
  kind?: MilestoneKind;
  achieved?: boolean;
  assigneeId?: string | null;
  note?: string | null;
};

/** Update a milestone's fields (only those provided). */
export async function updateMilestone(
  id: string,
  edit: MilestoneEdit,
): Promise<Milestone> {
  const patch: Record<string, unknown> = {};
  if (edit.title !== undefined) patch.title = edit.title;
  if (edit.dueDate !== undefined) patch.due_date = edit.dueDate;
  if (edit.kind !== undefined) patch.kind = edit.kind;
  if (edit.achieved !== undefined) patch.achieved = edit.achieved;
  if (edit.assigneeId !== undefined) patch.assignee_id = edit.assigneeId;
  if (edit.note !== undefined) patch.note = edit.note;

  const { data, error } = await supabase
    .from("milestones")
    .update(patch)
    .eq("id", id)
    .select(MILESTONE_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeMilestone(data);
}

/** Delete a milestone (its milestone_tasks links cascade in the DB). */
export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from("milestones").delete().eq("id", id);
  if (error) throw error;
}

/** The task ids linked to a milestone. */
export async function listMilestoneTaskIds(
  milestoneId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("milestone_tasks")
    .select("task_id")
    .eq("milestone_id", milestoneId);
  if (error) throw error;
  return (data ?? []).map((r) => String((r as { task_id: unknown }).task_id));
}

/** Replace a milestone's linked tasks with the given set. */
export async function setMilestoneTasks(
  milestoneId: string,
  taskIds: string[],
): Promise<void> {
  const del = await supabase
    .from("milestone_tasks")
    .delete()
    .eq("milestone_id", milestoneId);
  if (del.error) throw del.error;
  if (taskIds.length === 0) return;
  const rows = taskIds.map((taskId) => ({
    milestone_id: milestoneId,
    task_id: taskId,
  }));
  const { error } = await supabase.from("milestone_tasks").insert(rows);
  if (error) throw error;
}
