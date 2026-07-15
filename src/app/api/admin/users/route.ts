import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ManagedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin" | "general";
  banned: boolean;
  created_at: string;
};

// F5: list users (admin only). Small-team scale — default page (~50) is fine.
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const users: ManagedUser[] = data.users.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    name: (u.user_metadata?.name as string | undefined) ?? null,
    role: u.app_metadata?.role === "admin" ? "admin" : "general",
    banned: Boolean((u as { banned_until?: string | null }).banned_until),
    created_at: u.created_at,
  }));
  return Response.json({ users });
}

// F6/F7: change role or toggle ban. Body: { userId, role?, banned? }
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    role?: string;
    banned?: boolean;
  };
  const { userId, role, banned } = body;
  if (!userId)
    return Response.json({ error: "userId が必要です。" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();

  // F9: never demote/ban the last remaining admin.
  const isDemote = role === "general" || banned === true;
  if (isDemote) {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    const admins = data.users.filter(
      (u) => u.app_metadata?.role === "admin",
    );
    const targetIsAdmin = admins.some((u) => u.id === userId);
    if (targetIsAdmin && admins.length <= 1)
      return Response.json(
        { error: "最後の管理者は降格・無効化できません。" },
        { status: 400 },
      );
  }

  const attrs: Record<string, unknown> = {};
  if (role === "admin" || role === "general") attrs.app_metadata = { role };
  if (banned === true) attrs.ban_duration = "876000h"; // effectively permanent
  if (banned === false) attrs.ban_duration = "none"; // lift the ban
  if (Object.keys(attrs).length === 0)
    return Response.json({ error: "変更内容がありません。" }, { status: 400 });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    attrs,
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
