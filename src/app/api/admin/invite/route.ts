import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

// F8: invite a new user by email. Invited users join as general
// (role unset); an admin can promote them later via PATCH.
export async function POST(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const { email } = (await req.json().catch(() => ({}))) as { email?: string };
  if (!email)
    return Response.json(
      { error: "メールアドレスが必要です。" },
      { status: 400 },
    );

  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {}, // initial user_metadata
  });
  if (error) {
    // Translate common Supabase errors into Japanese for the UI.
    const raw = error.message ?? "";
    let message = "招待に失敗しました。";
    let status = 400;
    if (/already.*registered|email.*exists/i.test(raw)) {
      message = "このメールアドレスは既に登録されています。";
      status = 409;
    } else if (/invalid.*email/i.test(raw)) {
      message = "メールアドレスの形式が正しくありません。";
    } else if (/rate limit|too many|429/i.test(raw)) {
      message = "送信回数の上限に達しました。しばらく待って再度お試しください。";
      status = 429;
    }
    return Response.json({ error: message }, { status });
  }
  return Response.json({ ok: true });
}
