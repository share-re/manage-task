import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { MailRecipientRow, SendAs } from "@/lib/mailRecipients";

export const runtime = "nodejs";

/**
 * 共有先マスタ — who receives the progress summary mail.
 *
 * Everything goes through the service role: mail_recipients has a read policy
 * and no write policy, so who may change the distribution list stays a
 * server-side decision. GET also returns the member list, since the screen
 * offers members to add and needs their names either way.
 */

const LABEL_MAX = 30;

function isSendAs(v: unknown): v is SendAs {
  return v === "to" || v === "bcc";
}

// Deliberately loose: the mail server is the real judge of an address, and a
// stricter pattern here would reject valid ones (plus-addressing, long TLDs).
function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const supabaseAdmin = getSupabaseAdmin();
  const { data: recipients, error } = await supabaseAdmin
    .from("mail_recipients")
    .select("id, user_id, email, label, send_as, enabled")
    .order("sort_order", { ascending: true });
  if (error) {
    const missing = /mail_recipients/i.test(error.message);
    return Response.json(
      {
        error: missing
          ? "共有先マスタのテーブルがまだありません。scripts/sql/mail_recipients.sql を Supabase で実行してください。"
          : error.message,
      },
      { status: 500 },
    );
  }

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email")
    .order("name", { ascending: true });

  return Response.json({
    recipients: (recipients ?? []) as MailRecipientRow[],
    members: profiles ?? [],
  });
}

/** Add a recipient. Body: { userId } for a member, or { email, label } for an outside address. */
export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    email?: string;
    label?: string;
    sendAs?: string;
  };
  const sendAs: SendAs = isSendAs(body.sendAs) ? body.sendAs : "bcc";
  const supabaseAdmin = getSupabaseAdmin();

  let row: Record<string, unknown>;
  if (body.userId) {
    row = { user_id: body.userId, send_as: sendAs };
  } else {
    const email = (body.email ?? "").trim();
    if (!email)
      return Response.json(
        { error: "メールアドレスを入力してください。" },
        { status: 400 },
      );
    if (!looksLikeEmail(email))
      return Response.json(
        { error: "メールアドレスの形式が正しくありません。" },
        { status: 400 },
      );
    const label = (body.label ?? "").trim();
    if (label.length > LABEL_MAX)
      return Response.json(
        { error: `表示名は${LABEL_MAX}文字以内で入力してください。` },
        { status: 400 },
      );
    row = { email, label: label || null, send_as: sendAs };
  }

  const { error } = await supabaseAdmin.from("mail_recipients").insert(row);
  if (error) {
    // The unique indexes are what stop the same person being mailed twice.
    const dup = /duplicate|unique/i.test(error.message);
    return Response.json(
      { error: dup ? "その宛先はすでに登録されています。" : error.message },
      { status: dup ? 409 : 500 },
    );
  }
  return Response.json({ ok: true });
}

/** Toggle receiving, or switch To/Bcc. Body: { id, enabled?, sendAs? } */
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    enabled?: boolean;
    sendAs?: string;
  };
  if (!body.id)
    return Response.json({ error: "id が必要です。" }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (isSendAs(body.sendAs)) patch.send_as = body.sendAs;
  // Only updated_at: the request asked for nothing.
  if (Object.keys(patch).length === 1)
    return Response.json({ error: "変更内容がありません。" }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("mail_recipients")
    .update(patch)
    .eq("id", body.id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

/**
 * Remove a recipient. Body: { id }
 *
 * Safe to offer without the ceremony account deletion needs: this only stops a
 * mail being sent, and the row can be added back in one click.
 */
export async function DELETE(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return Response.json({ error: "id が必要です。" }, { status: 400 });

  const { error } = await getSupabaseAdmin()
    .from("mail_recipients")
    .delete()
    .eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
