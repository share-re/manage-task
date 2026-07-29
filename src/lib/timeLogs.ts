import { supabase } from "./supabase";

// 日次工数ログ（task_time_logs）… 第15章 / 要確認-7。
// actual_hours はこのログ合計を“正”とする（derived）。addTimeLog / completeWithLog
// の後で必ず syncActualHours を呼び、tasks.actual_hours を再計算して一致させる。

export type TaskTimeLog = {
  id: string;
  task_id: string;
  work_date: string;
  hours: number;
  member_id: string | null;
  note: string | null;
  created_at: string;
};

const TIME_LOG_COLUMNS =
  "id, task_id, work_date, hours, member_id, note, created_at";

// DB numeric may arrive as number or string; coerce to a finite number (0 fallback).
function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function normalizeTimeLog(row: Record<string, unknown>): TaskTimeLog {
  return {
    id: String(row.id),
    task_id: String(row.task_id),
    work_date: typeof row.work_date === "string" ? row.work_date : "",
    hours: toNumber(row.hours),
    member_id: typeof row.member_id === "string" ? row.member_id : null,
    note: typeof row.note === "string" ? row.note : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/**
 * List time logs, newest work_date first. Optional filters: date window
 * [from, to] (inclusive ISO dates) and/or a single task.
 */
export async function listTimeLogs(opts?: {
  from?: string;
  to?: string;
  taskId?: string;
}): Promise<TaskTimeLog[]> {
  let q = supabase.from("task_time_logs").select(TIME_LOG_COLUMNS);
  if (opts?.from) q = q.gte("work_date", opts.from);
  if (opts?.to) q = q.lte("work_date", opts.to);
  if (opts?.taskId) q = q.eq("task_id", opts.taskId);
  const { data, error } = await q.order("work_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => normalizeTimeLog(r as Record<string, unknown>));
}

/** Σ logged hours per task, keyed by task_id. Optional date window. */
export async function sumHoursByTask(opts?: {
  from?: string;
  to?: string;
}): Promise<Map<string, number>> {
  const logs = await listTimeLogs(opts);
  const m = new Map<string, number>();
  for (const l of logs) m.set(l.task_id, (m.get(l.task_id) ?? 0) + l.hours);
  return m;
}

export type NewTimeLog = {
  taskId: string;
  workDate: string;
  hours: number;
  memberId?: string | null;
  note?: string | null;
};

/**
 * Add one daily time log, then re-derive the task's actual_hours from the sum of
 * its logs. Keeping the recompute here means every write path leaves
 * actual_hours == Σ logs (the single source of truth, per §15).
 */
export async function addTimeLog(input: NewTimeLog): Promise<void> {
  const { error } = await supabase.from("task_time_logs").insert({
    task_id: input.taskId,
    work_date: input.workDate,
    hours: input.hours,
    member_id: input.memberId ?? null,
    note: input.note ?? null,
  });
  if (error) throw error;
  await syncActualHours(input.taskId);
}

/**
 * Set the logged hours for one (task, work_date, member) cell — the grid daily
 * entry uses this so re-saving the same day never double-counts. Upserts:
 *  - hours > 0 → update the existing row, or insert one if none.
 *  - hours == 0 → delete the existing row (if any).
 * Then re-derives actual_hours (= Σ logs).
 */
export async function setDayHours(input: {
  taskId: string;
  workDate: string;
  memberId: string | null;
  hours: number;
  note?: string | null;
}): Promise<void> {
  let sel = supabase
    .from("task_time_logs")
    .select("id")
    .eq("task_id", input.taskId)
    .eq("work_date", input.workDate);
  sel = input.memberId
    ? sel.eq("member_id", input.memberId)
    : sel.is("member_id", null);
  const { data, error } = await sel;
  if (error) throw error;
  const existingId =
    data && data.length ? String((data[0] as Record<string, unknown>).id) : null;

  if (input.hours > 0) {
    if (existingId) {
      const { error: e } = await supabase
        .from("task_time_logs")
        .update({ hours: input.hours, note: input.note ?? null })
        .eq("id", existingId);
      if (e) throw e;
    } else {
      const { error: e } = await supabase.from("task_time_logs").insert({
        task_id: input.taskId,
        work_date: input.workDate,
        hours: input.hours,
        member_id: input.memberId ?? null,
        note: input.note ?? null,
      });
      if (e) throw e;
    }
  } else if (existingId) {
    const { error: e } = await supabase
      .from("task_time_logs")
      .delete()
      .eq("id", existingId);
    if (e) throw e;
  }
  await syncActualHours(input.taskId);
}

/**
 * Recompute one task's actual_hours from the sum of its time logs. Call after any
 * insert/delete of that task's logs so actual_hours never drifts from Σ logs.
 */
export async function syncActualHours(taskId: string): Promise<void> {
  const { data, error } = await supabase
    .from("task_time_logs")
    .select("hours")
    .eq("task_id", taskId);
  if (error) throw error;
  const total = (data ?? []).reduce(
    (sum, r) => sum + toNumber((r as Record<string, unknown>).hours),
    0,
  );
  const { error: upErr } = await supabase
    .from("tasks")
    .update({ actual_hours: total })
    .eq("id", taskId);
  if (upErr) throw upErr;
}
