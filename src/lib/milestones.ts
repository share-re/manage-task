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

// --- 自由記述の種別（「サンプルローカル動作確認」など） ---
//
// DB の kind には check 制約（deadline/review/release）があり、種別を増やすには
// SQL が要る。Supabase に入れない状況でも運用できるよう、自由記述の種別名は
// 制約の無い note 列に置き、kind は deadline のままにしておく。
//
// note は他の用途で使っていない（列だけあって未使用だった）ので衝突しない。
// SQL が流せるようになったら、note の値を正式な kind へ昇格させる想定。

/** 自由記述の種別を入れておく kind。表示は note が優先されるので見た目には出ない。 */
export const CUSTOM_KIND: MilestoneKind = "deadline";

/**
 * 自由記述の種別名。note が空なら null（＝標準の3種として表示する）。
 * 前後の空白を落とし、空白だけの note は無いものとして扱う。
 */
export function customKindLabel(note: string | null): string | null {
  const trimmed = (note ?? "").trim();
  return trimmed ? trimmed : null;
}

/**
 * 自由記述の種別に割り当てるバッジ色。
 *
 * 標準3種が使う琥珀・青・緑は避ける（標準と自由記述を見分けられなくなるため）。
 * 色は名前から機械的に決めるので、同じ種別名は誰の画面でも常に同じ色になる。
 * 色数より種別が増えると色が重複するが、名前を併記しているので混同はしない。
 */
export const CUSTOM_KIND_BADGES = [
  "bg-purple-100 text-purple-700",
  "bg-teal-100 text-teal-700",
  "bg-pink-100 text-pink-700",
  "bg-orange-100 text-orange-800",
  "bg-indigo-100 text-indigo-700",
  "bg-cyan-100 text-cyan-800",
] as const;

export function customKindBadge(label: string): string {
  // 文字コードの総和で選ぶだけの単純な割り当て。分布の良さより
  // 「同じ名前なら必ず同じ色」を優先している。
  let sum = 0;
  for (let i = 0; i < label.length; i += 1) sum += label.charCodeAt(i);
  return CUSTOM_KIND_BADGES[sum % CUSTOM_KIND_BADGES.length];
}

/**
 * 既に使われている自由記述の種別を、重複を除いて古い順に返す。
 * 「毎回入力し直す」のを避けるための候補一覧（実績のある名前だけが並ぶ）。
 */
export function usedCustomKinds(
  milestones: Pick<Milestone, "note">[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of milestones) {
    const label = customKindLabel(m.note);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out;
}

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
