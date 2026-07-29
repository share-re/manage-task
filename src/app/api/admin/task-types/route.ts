import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { validateTaskTypeDraft } from "@/lib/masterDrafts";

export const runtime = "nodejs";

/**
 * Rename a task type (種別). Body: { code, label }
 *
 * No color to set — see src/lib/taskTypes.ts. Reading needs no route;
 * task_types is readable by any logged-in user and has no write policy, so the
 * service role is the only writer.
 */
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const parsed = validateTaskTypeDraft(
    (await req.json().catch(() => ({}))) as Record<string, unknown>,
  );
  if (!parsed.ok)
    return Response.json({ error: parsed.error }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("task_types").upsert({ ...parsed.value, updated_at: new Date().toISOString() });
  if (error) {
    const missing = /task_types/i.test(error.message);
    return Response.json(
      {
        error: missing
          ? "種別マスタのテーブルがまだありません。supabase/task_types.sql を Supabase で実行してください。"
          : error.message,
      },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
