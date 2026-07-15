import "server-only";
import { getSupabaseAdmin } from "./supabaseAdmin";

type Result =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

// Verify the caller's `Authorization: Bearer <access_token>` and require
// app_metadata.role === "admin". This is the server-side enforcement; the UI
// gating is only a convenience and never the actual guard.
export async function requireAdmin(req: Request): Promise<Result> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { ok: false, status: 401, error: "未ログインです。" };

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user)
    return { ok: false, status: 401, error: "認証に失敗しました。" };
  if (data.user.app_metadata?.role !== "admin")
    return { ok: false, status: 403, error: "権限がありません。" };

  return { ok: true, userId: data.user.id };
}
