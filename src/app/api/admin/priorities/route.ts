import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { validatePriorityDraft } from "@/lib/masterDrafts";

export const runtime = "nodejs";

/**
 * Rename or recolor a priority level. Body: { code, label, color }
 *
 * Reading needs no route — task_priorities is readable by any logged-in user
 * (RLS), so the task list loads it directly. Writing goes through here because
 * the table has no write policy at all: the service role is the only writer,
 * which keeps "who may edit the master" a server-side decision.
 */
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  // 入力チェックは純関数へ（テストから直接呼べるようにするため）。
  const parsed = validatePriorityDraft(
    (await req.json().catch(() => ({}))) as Record<string, unknown>,
  );
  if (!parsed.ok)
    return Response.json({ error: parsed.error }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("task_priorities")
    .upsert({ ...parsed.value, updated_at: new Date().toISOString() });
  if (error) {
    // The table is created by supabase/task_priorities.sql, which has to be
    // run once in the Supabase SQL editor. Say so rather than leaking the
    // Postgres error, since this is the likely cause on a fresh environment.
    const missing = /task_priorities/i.test(error.message);
    return Response.json(
      {
        error: missing
          ? "優先度マスタのテーブルがまだありません。supabase/task_priorities.sql を Supabase で実行してください。"
          : error.message,
      },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
