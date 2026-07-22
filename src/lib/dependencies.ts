import { supabase } from "./supabase";
import { hasCycle, type DependencyEdge } from "./schedule";

// タスク間の依存（Finish-to-Start のみ）… Q-07。
// 循環（A→B→A）は追加時に hasCycle で弾く（F-05）。案件をまたぐ依存は
// アプリ側の呼び出しで防ぐ想定（predecessor と successor は同一案件）。

export type TaskDependency = {
  id: string;
  predecessor_id: string;
  successor_id: string;
};

/** All dependency edges. */
export async function listDependencies(): Promise<TaskDependency[]> {
  const { data, error } = await supabase
    .from("task_dependencies")
    .select("id, predecessor_id, successor_id");
  if (error) throw error;
  return (data ?? []) as TaskDependency[];
}

/**
 * Add a "predecessor must finish before successor" edge. Rejects a self edge or
 * any edge that would create a cycle, checking against the current edges first.
 */
export async function addDependency(
  predecessorId: string,
  successorId: string,
): Promise<void> {
  const candidate: DependencyEdge = {
    predecessor_id: predecessorId,
    successor_id: successorId,
  };
  const existing = await listDependencies();
  if (hasCycle(existing, candidate)) {
    throw new Error("循環する依存は追加できません。");
  }
  const { error } = await supabase
    .from("task_dependencies")
    .insert({ predecessor_id: predecessorId, successor_id: successorId });
  if (error) throw error;
}

/** Remove a dependency edge by id. */
export async function removeDependency(id: string): Promise<void> {
  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
