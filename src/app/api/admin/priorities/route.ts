import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isPriorityColor, PRIORITY_LABEL_MAX } from "@/lib/priorities";
import { isTaskPriority } from "@/lib/tasks";

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

  const body = (await req.json().catch(() => ({}))) as {
    code?: string;
    label?: string;
    color?: string;
  };

  // The code is not editable — it is what tasks.priority stores. Only the three
  // known levels exist, so anything else is a bad request rather than a new row.
  if (!isTaskPriority(body.code))
    return Response.json(
      { error: "優先度の種類が正しくありません。" },
      { status: 400 },
    );

  const label = typeof body.label === "string" ? body.label.trim() : "";
  if (!label)
    return Response.json({ error: "表示名を入力してください。" }, { status: 400 });
  if (label.length > PRIORITY_LABEL_MAX)
    return Response.json(
      { error: `表示名は${PRIORITY_LABEL_MAX}文字以内で入力してください。` },
      { status: 400 },
    );

  // Only known color keys: the badge resolves the key to Tailwind classes, and
  // an unknown key would render the badge with no styling at all.
  if (!isPriorityColor(body.color))
    return Response.json({ error: "色が正しくありません。" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("task_priorities")
    .upsert({
      code: body.code,
      label,
      color: body.color,
      updated_at: new Date().toISOString(),
    });
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
