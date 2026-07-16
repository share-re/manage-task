"use client";

import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/roles";

// Client-side guard for /admin/*. This is a convenience only — the real
// enforcement is server-side (requireAdmin on every /api/admin route).
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading } = useAuth();
  if (loading) return null; // still resolving the session

  if (!isAdmin(session)) {
    return (
      <main className="grid min-h-[60vh] place-items-center p-8 text-center">
        <div>
          <h1 className="text-xl font-bold text-red-600">権限がありません</h1>
          <p className="mt-2 text-sm text-zinc-500">
            この画面は管理者のみ利用できます。
          </p>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
