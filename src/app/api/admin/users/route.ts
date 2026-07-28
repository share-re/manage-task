import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type ManagedUser = {
  id: string;
  email: string | null;
  name: string | null;
  // True while the name is a placeholder an admin typed in. Cleared as soon as
  // the owner saves their own name from the office screen.
  provisional: boolean;
  role: "admin" | "general";
  banned: boolean;
  created_at: string;
};

// Display names are limited to the same length the user-facing editor allows
// (see the office screen), so an admin can't set a name the owner couldn't.
const NAME_MAX = 20;

// Marker kept in user_metadata rather than a profiles column, so this needs no
// migration. Absent means "the owner chose this name".
const PROVISIONAL_KEY = "name_provisional";

function isProvisional(meta: Record<string, unknown> | undefined): boolean {
  return meta?.[PROVISIONAL_KEY] === true;
}

// F5: list users (admin only). Small-team scale — default page (~50) is fine.
export async function GET(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // profiles.name is the source of truth for the assignee label shown across
  // the app, so prefer it here too — otherwise this screen could show a name
  // that differs from the one on the task list. user_metadata.name is the
  // fallback for rows that predate the profiles table.
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, name");
  const profileName = new Map<string, string | null>();
  for (const p of profiles ?? [])
    profileName.set(p.id as string, (p.name as string | null) ?? null);

  const users: ManagedUser[] = data.users.map((u) => {
    const name =
      profileName.get(u.id) ??
      (u.user_metadata?.name as string | undefined) ??
      null;
    return {
      id: u.id,
      email: u.email ?? null,
      name,
      provisional: Boolean(name) && isProvisional(u.user_metadata),
      role: u.app_metadata?.role === "admin" ? "admin" : "general",
      banned: Boolean((u as { banned_until?: string | null }).banned_until),
      created_at: u.created_at,
    };
  });
  return Response.json({ users });
}

// F6/F7: change role or toggle ban, and set the display name.
// Body: { userId, role?, banned?, name? }
export async function PATCH(req: Request) {
  const g = await requireAdmin(req);
  if (!g.ok) return Response.json({ error: g.error }, { status: g.status });

  const body = (await req.json().catch(() => ({}))) as {
    userId?: string;
    role?: string;
    banned?: boolean;
    name?: string;
  };
  const { userId, role, banned } = body;
  if (!userId)
    return Response.json({ error: "userId が必要です。" }, { status: 400 });

  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  if (name !== undefined) {
    if (!name)
      return Response.json({ error: "表示名を入力してください。" }, { status: 400 });
    if (name.length > NAME_MAX)
      return Response.json(
        { error: `表示名は${NAME_MAX}文字以内で入力してください。` },
        { status: 400 },
      );
  }

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

  // An admin may only fill in a missing name, or correct a placeholder they
  // typed earlier. Once the owner has named themselves, the name is theirs.
  // Enforced here rather than in the UI: hiding the button is not a rule.
  let nameMeta: Record<string, unknown> | undefined;
  if (name !== undefined) {
    const { data: target, error: tErr } =
      await supabaseAdmin.auth.admin.getUserById(userId);
    if (tErr || !target.user)
      return Response.json(
        { error: "対象のユーザーが見つかりません。" },
        { status: 404 },
      );
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .maybeSingle();
    const meta = target.user.user_metadata ?? {};
    const current =
      ((prof?.name as string | null) ??
        (meta.name as string | undefined) ??
        "").trim();
    if (current && !isProvisional(meta))
      return Response.json(
        {
          error:
            "本人が設定した表示名は変更できません。仮の表示名を設定できるのは、未設定の人だけです。",
        },
        { status: 403 },
      );
    // Spread the existing metadata so unrelated keys survive the update.
    nameMeta = { ...meta, name, [PROVISIONAL_KEY]: true };
  }

  const attrs: Record<string, unknown> = {};
  if (role === "admin" || role === "general") attrs.app_metadata = { role };
  if (banned === true) attrs.ban_duration = "876000h"; // effectively permanent
  if (banned === false) attrs.ban_duration = "none"; // lift the ban
  if (nameMeta) attrs.user_metadata = nameMeta;
  if (Object.keys(attrs).length === 0)
    return Response.json({ error: "変更内容がありません。" }, { status: 400 });

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    attrs,
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Mirror the name into profiles, which is what the rest of the app reads for
  // the assignee label. This has to run server-side: RLS only lets a user write
  // their own profiles row, so an admin renaming someone else needs service
  // role. Written after the auth update so a rejected name never lands here.
  if (name !== undefined) {
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, name });
    if (pErr) return Response.json({ error: pErr.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
