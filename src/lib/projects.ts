import { supabase } from "./supabase";

// 案件（新階層）… 要確認-10。フェーズ2では中立な「既定案件」1つだけを使い、
// 新規タスクは必ずこの案件idを付けて作る（project_id を null にしない）。
// 案件の切替UI・複数案件の管理（マスタ画面）は後フェーズ。

export type Project = {
  id: string;
  name: string;
  status: "active" | "archived";
};

/** All projects, oldest first. */
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Project[];
}

/**
 * The current/default project id: the oldest active project. Until the project
 * switcher lands (PR3) this is what new tasks/milestones are attached to, so
 * project_id is never left null (要確認-10 / PR2 整合性修正).
 */
export async function getDefaultProjectId(): Promise<string | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? String((data as { id: unknown }).id) : null;
}
