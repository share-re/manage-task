import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TASK_TYPE_LABEL_MAX } from "@/lib/taskTypes";
import { isTaskType } from "@/lib/tasks";

export const runtime = "nodejs";

/**
 * Rename a task type (工程). Body: { code, label }
 *
 * No color to set — see src/lib/taskTypes.ts. Reading needs no route;
 * task_types is readable by any logged-in user and has no write policy, so the
 * service role is the only writer.
 */
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    label?: string;
  };

  // tasks.task_type has a CHECK constraint on the six known codes, so a
  // seventh would be rejected by the database on the next save anyway.
  if (!isTaskType(body.code))
    return Response.json(
      { error: "工程の種類が正しくありません。" },
      { status: 400 },
    );

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label)
    return Response.json({ error: "表示名を入力してください。" }, { status: 400 });
  if (label.length > TASK_TYPE_LABEL_MAX)
    return Response.json(
      { error: `表示名は${TASK_TYPE_LABEL_MAX}文字以内で入力してください。` },
      { status: 400 },
    );

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("task_types").upsert({
    code: body.code,
    label,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    const missing = /task_types/i.test(error.message);
    return Response.json(
      {
        error: missing
          ? "工程マスタのテーブルがまだありません。scripts/sql/task_types.sql を Supabase で実行してください。"
          : error.message,
      },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
