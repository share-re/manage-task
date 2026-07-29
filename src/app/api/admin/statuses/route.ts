import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isStatusColor, STATUS_LABEL_MAX } from "@/lib/statuses";
import { isTaskStatus } from "@/lib/tasks";

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

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    label?: string;
    color?: string;
  };

  // The code is not editable, and no fourth status may be added: "done" in
  // particular is tested for throughout the app (progress, archiving, the
  // forest, the parent/child sync), so the set has to stay what the code knows.
  if (!isTaskStatus(body.code))
    return Response.json(
      { error: "状態の種類が正しくありません。" },
      { status: 400 },
    );

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label)
    return Response.json({ error: "表示名を入力してください。" }, { status: 400 });
  if (label.length > STATUS_LABEL_MAX)
    return Response.json(
      { error: `表示名は${STATUS_LABEL_MAX}文字以内で入力してください。` },
      { status: 400 },
    );

  if (!isStatusColor(body.color))
    return Response.json({ error: "色が正しくありません。" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("task_statuses").upsert({
    code: body.code,
    label,
    color: body.color,
    updated_at: new Date().toISOString(),
  });
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
