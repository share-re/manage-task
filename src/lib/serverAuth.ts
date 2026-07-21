import { createClient } from "@supabase/supabase-js";

// Server-side auth for API routes (issue #76 / KI-01, KI-03).
// Verifies the Supabase access token sent as "Authorization: Bearer <token>"
// and resolves the display name on the server, so client-sent names are
// never trusted.

export type AuthedUser = {
  id: string;
  // profiles.name → user_metadata.name → email local part → "".
  // Same order as the office screen, so every screen addresses the user
  // by the same name.
  displayName: string;
};

/** Returns the authenticated user, or null when the token is missing/invalid. */
export async function getUserFromRequest(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  // Per-request client. auth.getUser(token) asks Supabase whether the token
  // is genuine; the Authorization header additionally makes the profiles
  // query below run under this user's RLS permissions (anon key alone is
  // enough for both — no service-role key needed).
  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const user = data.user;

  // maybeSingle: a user without a profiles row is fine (falls through).
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    (profile?.name as string | null)?.trim() ||
    (user.user_metadata?.name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "";

  return { id: user.id, displayName };
}
