import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { validateStatusDraft } from "@/lib/masterDrafts";

export const runtime = "nodejs";

/**
 * Rename or recolor a status. Body: { code, label, color }
 *
 * Reading needs no route — task_statuses is readable by any logged-in user
 * (RLS). Writing goes through here because the table has no write policy, so
 * the service role is the only writer.
 */
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const parsed = validateStatusDraft(
    (await req.json().catch(() => ({}))) as Record<string, unknown>,
  );
  if (!parsed.ok)
    return Response.json({ error: parsed.error }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("task_statuses").upsert({ ...parsed.value, updated_at: new Date().toISOString() });
  if (error) {
    const missing = /task_statuses/i.test(error.message);
    return Response.json(
      {
        error: missing
          ? "状態マスタのテーブルがまだありません。supabase/task_statuses.sql を Supabase で実行してください。"
          : error.message,
      },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
