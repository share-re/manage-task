import { supabase } from "./supabase";
import {
  isTaskType,
  TASK_TYPE_META,
  TASK_TYPE_ORDER,
  type TaskType,
} from "./tasks";

/**
 * Task type (工程) presentation, read from the task_types master table.
 *
 * Labels only. A task type has no color anywhere in the UI — it appears in the
 * new-task and edit dropdowns and nowhere else — so there is nothing for a
 * color to paint. The dashboard in a later phase is where one would earn its
 * keep; the master gains the column then rather than storing an unused value.
 *
 * The codes stay compiled in: tasks.task_type has a CHECK constraint on the
 * six of them, so adding a seventh is a schema change, not a master edit.
 */

// The type appears inline in a dropdown, so a long label would stretch it.
export const TASK_TYPE_LABEL_MAX = 10;

export type TaskTypeMetaMap = Record<TaskType, { label: string }>;

/** What the app showed before the master table existed; also the fallback. */
export const DEFAULT_TASK_TYPE_META: TaskTypeMetaMap = Object.fromEntries(
  TASK_TYPE_ORDER.map((code) => [code, { label: TASK_TYPE_META[code].label }]),
) as TaskTypeMetaMap;

/** Task type labels from the master table, defaults on any failure. */
export async function loadTaskTypeMeta(): Promise<TaskTypeMetaMap> {
  const { data, error } = await supabase
    .from("task_types")
    .select("code, label");
  if (error || !data?.length) return DEFAULT_TASK_TYPE_META;

  const meta: TaskTypeMetaMap = { ...DEFAULT_TASK_TYPE_META };
  for (const row of data) {
    const code = row.code;
    if (!isTaskType(code)) continue;
    if (typeof row.label === "string" && row.label.trim())
      meta[code] = { label: row.label.trim() };
  }
  return meta;
}
