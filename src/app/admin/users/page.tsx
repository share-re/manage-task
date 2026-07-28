"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { listTasks, type Task } from "@/lib/tasks";

type ManagedUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin" | "general";
  banned: boolean;
  created_at: string;
};

// Palette lifted from the master-screen mock so this page reads as part of the
// same family as /tasks. Kept as constants rather than Tailwind classes because
// the surrounding admin code already styles with inline colors.
const C = {
  card: "#ffffff",
  card2: "#f7faf5",
  ink: "#1c2419",
  muted: "#6b7568",
  line: "#e4ebdf",
  accent: "#3b6d11",
  accentSoft: "#eaf3de",
  accentInk: "#173404",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  warn: "#c2410c",
  warnBg: "#ffedd5",
  info: "#1d4ed8",
  infoBg: "#dbeafe",
};
const SHADOW = "0 1px 2px rgba(31,50,25,.06), 0 8px 24px rgba(31,50,25,.08)";
const NAME_MAX = 20;

const CARD_STYLE: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  boxShadow: SHADOW,
};

// The other master tabs from the mock. They have no data behind them yet, so
// they render disabled rather than linking somewhere that doesn't exist.
const PLANNED_TABS = [
  { emoji: "🚩", label: "優先度" },
  { emoji: "📊", label: "状態" },
  { emoji: "🏷", label: "カテゴリ" },
  { emoji: "📋", label: "定型タスク" },
  { emoji: "✉️", label: "共有先" },
];

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function Pill({
  children,
  bg,
  color,
  outlined,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
  outlined?: boolean;
}) {
  return (
    <span
      className="inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-extrabold"
      style={{
        background: bg,
        color,
        border: outlined ? `1px solid ${C.line}` : undefined,
      }}
    >
      {children}
    </span>
  );
}

function Finding({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "bad" | "warn" | "calm";
}) {
  const color = tone === "bad" ? C.danger : tone === "warn" ? C.warn : C.muted;
  return (
    <li
      className="rounded-xl px-3 py-2.5"
      style={{ background: C.card2, border: `1px solid ${C.line}` }}
    >
      <div className="text-2xl font-extrabold tabular-nums leading-tight" style={{ color }}>
        {n}
      </div>
      <div className="text-xs font-semibold" style={{ color: C.muted }}>
        {label}
      </div>
    </li>
  );
}

export default function AdminUsersPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  // Inline display-name editing: which row is open, and its draft value.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

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

  // Tasks drive the "担当タスク" column and the data-health counts. A failure
  // here must not break user management, so it degrades to zero counts.
  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch(() => setTasks([]));
  }, []);

  const adminCount = users.filter((u) => u.role === "admin").length;

  const taskCountById = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tasks)
      if (t.assignee_id) m.set(t.assignee_id, (m.get(t.assignee_id) ?? 0) + 1);
    return m;
  }, [tasks]);

  const health = useMemo(() => {
    // A task whose assignee is still only a free-text string: it predates
    // assignee_id and is what makes raw addresses show up on the task list.
    const legacy = tasks.filter((t) => !t.assignee_id && t.assignee).length;
    return {
      noName: users.filter((u) => !u.name).length,
      legacy,
      unassigned: tasks.filter((t) => !t.assignee_id && !t.assignee).length,
      disabled: users.filter((u) => u.banned).length,
    };
  }, [users, tasks]);

  async function patch(
    userId: string,
    body: { role?: string; banned?: boolean; name?: string },
  ) {
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
      return true;
    } catch (e) {
      setError(errMessage(e));
      return false;
    } finally {
      setBusy(null);
    }
  }

  function startEdit(u: ManagedUser) {
    setEditingId(u.id);
    setNameDraft(u.name ?? "");
    setError(null);
  }

  async function saveName(userId: string) {
    const next = nameDraft.trim();
    if (!next) {
      setError("表示名を入力してください。");
      return;
    }
    const ok = await patch(userId, { name: next });
    if (ok) {
      setEditingId(null);
      setNotice("表示名を更新しました。タスク一覧の担当者名にも反映されます。");
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

  const needsAttention = health.noName;

  return (
    <main
      className="min-h-screen pb-14"
      style={{
        color: C.ink,
        background: `linear-gradient(180deg,#dceffb 0,#f3faff 180px,${C.card2} 180px)`,
      }}
    >
      <div className="mx-auto max-w-[1120px] px-5">
        {/* App bar — breadcrumb + actions, mirroring the /tasks header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 pt-6">
          <div>
            <div className="text-[0.82rem] font-semibold" style={{ color: C.muted }}>
              進捗管理 ／ 設定 ／ マスタ管理
            </div>
            <h1 className="text-[1.35rem] font-extrabold">
              メンバー（担当者）マスタ
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tasks"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.84rem] font-bold"
              style={{
                border: `1px solid ${C.accent}`,
                color: C.accentInk,
                background: C.card,
              }}
            >
              ✅ 進捗管理へ戻る
            </Link>
            <Link
              href="/office"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.84rem] font-bold"
              style={{
                border: `1px solid ${C.accent}`,
                color: C.accentInk,
                background: C.card,
              }}
            >
              ← オフィスへ
            </Link>
          </div>
        </div>

        {/* Why this screen exists */}
        <div className="mb-4 px-5 py-4 text-[0.93rem]" style={CARD_STYLE}>
          <p>
            <strong style={{ color: C.accentInk }}>ねらい：</strong>
            タスクの担当者名は、この画面の<strong>表示名</strong>がそのまま使われます。
            表示名が空のメンバーは、担当者欄に<strong>メールアドレスがそのまま出ます</strong>。
            ここで設定すれば、タスク一覧にも定期サマリメールにも反映されます。
          </p>
          <p className="mt-2 text-[0.86rem]" style={{ color: C.muted }}>
            管理者のみが利用できます。表示名は本人以外（管理者）からも設定できます。
          </p>
        </div>

        {/* Data health — the numbers that say whether this screen has work to do */}
        <div
          className="mb-5 px-5 py-4"
          style={{ ...CARD_STYLE, borderLeft: `5px solid ${C.warn}` }}
        >
          <h2 className="mb-2.5 text-[0.95rem] font-extrabold">
            ⚠ いまのデータの状態
          </h2>
          <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5 p-0">
            <Finding n={health.noName} label="表示名が未設定のメンバー" tone="bad" />
            <Finding n={health.legacy} label="担当者が旧表記のままのタスク" tone="warn" />
            <Finding n={health.unassigned} label="担当者なしのタスク" tone="warn" />
            <Finding n={health.disabled} label="無効になっているメンバー" tone="calm" />
          </ul>
          <p className="mt-3 text-[0.8rem]" style={{ color: C.muted }}>
            「旧表記のまま」が 0 件なら、過去データの移行（名寄せ）は不要です。
          </p>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[244px_1fr]">
          {/* Master categories. Only members exists today. */}
          <nav className="p-2.5" style={CARD_STYLE} aria-label="マスタの種類">
            <h3
              className="mx-2 mb-2 mt-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.09em]"
              style={{ color: C.muted }}
            >
              マスタ
            </h3>
            <div
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.86rem] font-bold text-white"
              style={{ background: C.accent }}
              aria-current="page"
            >
              <span className="w-[1.15em] text-center">👤</span>メンバー
            </div>
            {PLANNED_TABS.map((t) => (
              <div
                key={t.label}
                className="flex w-full cursor-not-allowed items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.86rem] font-bold opacity-55"
                title="今後追加予定です"
              >
                <span className="w-[1.15em] text-center">{t.emoji}</span>
                {t.label}
                <span className="ml-auto text-[0.72rem]" style={{ color: C.muted }}>
                  今後
                </span>
              </div>
            ))}
          </nav>

          <section className="px-5 py-4" style={CARD_STYLE}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[1.05rem] font-extrabold">👤 メンバー一覧</h2>
              <span className="text-[0.82rem]" style={{ color: C.muted }}>
                {loading
                  ? "読み込み中…"
                  : needsAttention > 0
                    ? `${users.length}件中 ${needsAttention}件が要整備`
                    : `${users.length}件`}
              </span>
            </div>
            <p className="mb-3.5 mt-1.5 text-[0.86rem]" style={{ color: C.muted }}>
              <b style={{ color: C.ink }}>表示名が空の行が要整備です。</b>
              「表示名を設定」から入力すると、タスク一覧の担当者欄がメールアドレスから名前に変わります。
            </p>

            {/* Invite (F8) */}
            <form
              onSubmit={invite}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-xl p-2.5"
              style={{ background: C.card2, border: `1px solid ${C.line}` }}
            >
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="招待するメールアドレス"
                className="min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm"
                style={{ border: `1px solid ${C.line}`, background: C.card }}
              />
              <button
                type="submit"
                disabled={busy === "invite"}
                className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: C.accent }}
              >
                {busy === "invite" ? "送信中…" : "＋ メールで招待"}
              </button>
            </form>

            {notice && (
              <p
                className="mb-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: C.accentSoft, color: C.accentInk }}
              >
                {notice}
              </p>
            )}
            {error && (
              <p
                className="mb-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: C.dangerBg, color: C.danger }}
              >
                {error}
              </p>
            )}

            <div
              className="overflow-x-auto rounded-xl"
              style={{ border: `1px solid ${C.line}` }}
            >
              <table className="w-full min-w-[680px] border-collapse text-[0.85rem]">
                <thead>
                  <tr>
                    {["表示名", "ログインアカウント", "ロール", "状態", "担当タスク", "操作"].map(
                      (h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap px-3 py-2.5 text-left text-[0.72rem] font-extrabold uppercase tracking-[0.06em]"
                          style={{
                            background: C.card2,
                            color: C.muted,
                            borderBottom: `1px solid ${C.line}`,
                            textAlign: h === "担当タスク" ? "right" : "left",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center" style={{ color: C.muted }}>
                        読み込み中…
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center" style={{ color: C.muted }}>
                        ユーザーがいません
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isLastAdmin = u.role === "admin" && adminCount <= 1;
                      const rowBusy = busy === u.id;
                      const editing = editingId === u.id;
                      const attn = !u.name;
                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: `1px solid ${C.line}`,
                            background: attn ? "#fff7ed" : undefined,
                          }}
                        >
                          <td className="px-3 py-2.5 font-bold">
                            {editing ? (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <input
                                  autoFocus
                                  value={nameDraft}
                                  maxLength={NAME_MAX}
                                  onChange={(e) => setNameDraft(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveName(u.id);
                                    if (e.key === "Escape") setEditingId(null);
                                  }}
                                  placeholder="表示名"
                                  className="w-32 rounded-lg px-2 py-1 text-sm font-normal"
                                  style={{ border: `1px solid ${C.accent}`, background: C.card }}
                                />
                                <button
                                  disabled={rowBusy}
                                  onClick={() => saveName(u.id)}
                                  className="rounded-lg px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
                                  style={{ background: C.accent }}
                                >
                                  {rowBusy ? "保存中…" : "保存"}
                                </button>
                                <button
                                  disabled={rowBusy}
                                  onClick={() => setEditingId(null)}
                                  className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                                  style={{ border: `1px solid ${C.line}`, color: C.ink }}
                                >
                                  取消
                                </button>
                              </div>
                            ) : u.name ? (
                              u.name
                            ) : (
                              <Pill bg={C.warnBg} color={C.warn}>
                                表示名なし
                              </Pill>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[0.8rem]" style={{ color: C.muted }}>
                            {u.email ?? "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            {u.role === "admin" ? (
                              <Pill bg={C.infoBg} color={C.info}>
                                管理者
                              </Pill>
                            ) : (
                              <Pill bg={C.card2} color={C.muted} outlined>
                                一般
                              </Pill>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            {u.banned ? (
                              <Pill bg={C.dangerBg} color={C.danger}>
                                無効
                              </Pill>
                            ) : (
                              <Pill bg={C.accentSoft} color={C.accentInk}>
                                有効
                              </Pill>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {taskCountById.get(u.id) ?? 0}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-wrap gap-1.5">
                              {!editing && (
                                <button
                                  disabled={rowBusy}
                                  onClick={() => startEdit(u)}
                                  className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                                  style={
                                    attn
                                      ? {
                                          border: `1px solid ${C.accent}`,
                                          color: C.accentInk,
                                          background: C.accentSoft,
                                        }
                                      : { border: `1px solid ${C.line}`, color: C.ink }
                                  }
                                >
                                  {attn ? "表示名を設定" : "編集"}
                                </button>
                              )}
                              {isLastAdmin ? (
                                <span className="text-xs" style={{ color: C.muted }}>
                                  🔒 最後の管理者は変更不可
                                </span>
                              ) : (
                                <>
                                  <button
                                    disabled={rowBusy}
                                    onClick={() =>
                                      patch(u.id, {
                                        role: u.role === "admin" ? "general" : "admin",
                                      })
                                    }
                                    className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                                    style={{ border: `1px solid ${C.line}`, color: C.ink }}
                                  >
                                    {u.role === "admin" ? "一般にする" : "管理者にする"}
                                  </button>
                                  <button
                                    disabled={rowBusy}
                                    onClick={() => patch(u.id, { banned: !u.banned })}
                                    className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                                    style={
                                      u.banned
                                        ? { border: `1px solid ${C.accent}`, color: C.accentInk }
                                        : { border: "1px solid #e0b4b4", color: "#a12a2a" }
                                    }
                                  >
                                    {u.banned ? "有効に戻す" : "無効化"}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p
              className="mt-3.5 rounded-xl px-3 py-2.5 text-[0.82rem]"
              style={{ background: C.card2, border: `1px dashed ${C.line}`, color: C.muted }}
            >
              <b style={{ color: C.ink }}>表示名の反映先：</b>
              タスクの担当者プルダウン・担当者での絞り込み・定期サマリメールの「担当:」欄。
              変更すると、これらすべてに同じ名前が出ます。
            </p>
            <p
              className="mt-2 rounded-xl px-3 py-2.5 text-[0.82rem]"
              style={{ background: C.card2, border: `1px dashed ${C.line}`, color: C.muted }}
            >
              <b style={{ color: C.ink }}>無効化について：</b>
              無効にしたメンバーはログインできなくなりますが、
              <b style={{ color: C.ink }}>過去タスクの担当者名はそのまま残ります</b>（削除ではないため）。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
