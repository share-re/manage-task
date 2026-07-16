"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

type ManagedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin" | "general";
  banned: boolean;
  created_at: string;
};

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export default function AdminUsersPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "取得に失敗しました。");
      setUsers(json.users as ManagedUser[]);
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const adminCount = users.filter((u) => u.role === "admin").length;

  async function patch(userId: string, body: { role?: string; banned?: boolean }) {
    if (!token) return;
    setBusy(userId);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, ...body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "更新に失敗しました。");
      await load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !inviteEmail) return;
    setBusy("invite");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "招待に失敗しました。");
      setNotice(`${inviteEmail} に招待メールを送信しました。`);
      setInviteEmail("");
      await load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen" style={{ background: "#EAF3FB" }}>
      {/* Forest-theme green header */}
      <header
        className="px-6 py-5 text-white"
        style={{ background: "#2f9e77" }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">⚙ ユーザー管理</h1>
            <p className="text-xs text-white/80">管理者のみが利用できます</p>
          </div>
          <Link
            href="/office"
            className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/25"
          >
            ← オフィスへ
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-6">
        {/* Invite row (F8) */}
        <form
          onSubmit={invite}
          className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-black/5 bg-white p-3"
        >
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="招待するメールアドレス"
            className="min-w-[220px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy === "invite"}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#2f9e77" }}
          >
            {busy === "invite" ? "送信中…" : "メールで招待"}
          </button>
        </form>

        {notice && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {notice}
          </p>
        )}
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Users table (F5) */}
        <div className="overflow-x-auto rounded-xl border border-black/5 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs text-zinc-500">
                <th className="px-4 py-3">表示名</th>
                <th className="px-4 py-3">メール</th>
                <th className="px-4 py-3">ロール</th>
                <th className="px-4 py-3">状態</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    読み込み中…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-zinc-400">
                    ユーザーがいません
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isLastAdmin = u.role === "admin" && adminCount <= 1;
                  const rowBusy = busy === u.id;
                  return (
                    <tr key={u.id} className="border-b border-black/5">
                      <td className="px-4 py-3">{u.name ?? "—"}</td>
                      <td className="px-4 py-3 text-zinc-600">{u.email ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded px-2 py-0.5 text-xs font-semibold"
                          style={
                            u.role === "admin"
                              ? { background: "#EAF3DE", color: "#173404" }
                              : { background: "#F1EFE8", color: "#444" }
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.banned
                              ? "rounded px-2 py-0.5 text-xs font-semibold text-red-700"
                              : "rounded px-2 py-0.5 text-xs font-semibold text-emerald-700"
                          }
                          style={{
                            background: u.banned ? "#FCE8E8" : "#E7F5EC",
                          }}
                        >
                          {u.banned ? "無効" : "有効"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isLastAdmin ? (
                          <span className="text-xs text-zinc-400">
                            🔒 最後の管理者は変更不可
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={rowBusy}
                              onClick={() =>
                                patch(u.id, {
                                  role:
                                    u.role === "admin" ? "general" : "admin",
                                })
                              }
                              className="rounded border border-zinc-300 px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                            >
                              {u.role === "admin"
                                ? "generalにする"
                                : "adminにする"}
                            </button>
                            <button
                              disabled={rowBusy}
                              onClick={() =>
                                patch(u.id, { banned: !u.banned })
                              }
                              className="rounded border px-2 py-1 text-xs font-semibold disabled:opacity-50"
                              style={
                                u.banned
                                  ? { borderColor: "#2f9e77", color: "#173404" }
                                  : { borderColor: "#e0b4b4", color: "#a12a2a" }
                              }
                            >
                              {u.banned ? "有効に戻す" : "無効化"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
