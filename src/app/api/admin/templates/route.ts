import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  TEMPLATE_MAX,
  validateTemplateDraft,
} from "@/lib/taskTemplates";

export const runtime = "nodejs";

/**
 * 定型タスクマスタの書き込み。POST=追加 / PATCH=更新 / DELETE=削除。
 *
 * 読み取り用の GET は無い。task_templates は全ログインユーザーが読めるので
 * （生成ボタンはチーム全員のもの）、画面は直接 Supabase から読む。書き込み
 * ポリシーは無く、サービスロールを使うここだけが書ける。
 */

const MISSING_TABLE =
  "定型タスクマスタのテーブルがまだありません。supabase/task_templates.sql を Supabase で実行してください。";

function dbError(message: string) {
  const missing = /task_templates/i.test(message);
  return Response.json(
    { error: missing ? MISSING_TABLE : message },
    { status: 500 },
  );
}

/**
 * 画面に出さない不変の名札。名前を変えても同じ雛形として扱うために要る。
 * 利用者が考える意味がない値なので自動で振る。
 */
function newCode(): string {
  return `tpl_${crypto.randomUUID().replaceAll("-", "").slice(0, 6)}`;
}

/** 追加。Body: { name, priority, items:[{title, task_type, estimated_hours}] } */
export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const parsed = validateTemplateDraft(await req.json().catch(() => ({})));
  if (!parsed.ok)
    return Response.json({ error: parsed.error }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();

  // 上限は保存の直前に数える。画面側でもボタンを止めているが、そちらは
  // 見せ方の話で、実際に止めるのはここ。
  const { count, error: countError } = await supabaseAdmin
    .from("task_templates")
    .select("code", { count: "exact", head: true });
  if (countError) return dbError(countError.message);
  if ((count ?? 0) >= TEMPLATE_MAX)
    return Response.json(
      { error: `雛形は${TEMPLATE_MAX}件までです。使っていないものを削除してください。` },
      { status: 400 },
    );

  // 並びは追加順。並べ替えのUIは無いので、末尾に足すだけでよい。
  const { data: last } = await supabaseAdmin
    .from("task_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sortOrder = ((last?.sort_order as number | undefined) ?? 0) + 1;

  // code の衝突は事実上起きないが、起きたら一度だけ引き直す。
  for (let attempt = 0; attempt < 2; attempt++) {
    const code = newCode();
    const { error } = await supabaseAdmin.from("task_templates").insert({
      code,
      ...parsed.value,
      sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    });
    if (!error) return Response.json({ ok: true, code });
    if (error.code !== "23505") return dbError(error.message);
  }
  return Response.json(
    { error: "内部IDの採番に失敗しました。もう一度お試しください。" },
    { status: 500 },
  );
}

/** 更新。Body: { code, name, priority, items } — code は変えられない。 */
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code : "";
  if (!code)
    return Response.json({ error: "対象の雛形が指定されていません。" }, { status: 400 });

  const parsed = validateTemplateDraft(body);
  if (!parsed.ok)
    return Response.json({ error: parsed.error }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("task_templates")
    .update({ ...parsed.value, updated_at: new Date().toISOString() })
    .eq("code", code)
    .select("code");
  if (error) return dbError(error.message);
  if (!data?.length)
    return Response.json(
      { error: "その雛形は見つかりませんでした。すでに削除された可能性があります。" },
      { status: 404 },
    );
  return Response.json({ ok: true });
}

/** 削除。Body: { code } — 生成済みのタスクには影響しない。 */
export async function DELETE(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const code = typeof body.code === "string" ? body.code : "";
  if (!code)
    return Response.json({ error: "対象の雛形が指定されていません。" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("task_templates")
    .delete()
    .eq("code", code);
  if (error) return dbError(error.message);
  return Response.json({ ok: true });
}
