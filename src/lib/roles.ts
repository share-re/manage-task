// Role helpers for the admin/RBAC feature.
// The role lives in Supabase Auth `app_metadata.role` (not user-editable,
// carried in the JWT). Anything other than "admin" is treated as "general".

export type Role = "admin" | "general";

// Safely derive the role from a user object. Unknown/missing -> "general".
export function roleFromUser(
  user: { app_metadata?: Record<string, unknown> | null } | null | undefined,
): Role {
  return user?.app_metadata?.role === "admin" ? "admin" : "general";
}

// Whether the given session belongs to an admin. Null-safe.
export function isAdmin(
  session:
    | { user?: { app_metadata?: Record<string, unknown> | null } }
    | null
    | undefined,
): boolean {
  return roleFromUser(session?.user ?? null) === "admin";
}
