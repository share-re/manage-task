"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  buildTaskTree,
  createTask,
  createTasks,
  deleteTasks,
  leafTasks,
  listTasks,
  taskProgress,
  updateTask,
  updateTaskStatus,
  STATUS_META,
  STATUS_ORDER,
  PRIORITY_META,
  PRIORITY_ORDER,
  type Task,
  type TaskEdit,
  type TaskStatus,
  type TaskPriority,
} from "@/lib/tasks";
import { addComment, listComments, type TaskComment } from "@/lib/comments";
import { listMembers, memberLabel, type Member } from "@/lib/members";
import SkyHero from "@/components/SkyHero";

function formatDue(due: string | null): string {
  return due ? due.replaceAll("-", "/") : "期限なし";
}

// Whole days from today until a due date (UTC day granularity). Negative = overdue.
function dueDiffDays(due: string): number {
  const [y, m, d] = due.split("-").map(Number);
  const dueMs = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueMs - todayMs) / 86_400_000);
}

// Deadline badge for an incomplete task: overdue / due today / due within 3 days.
// Returns null when there's nothing to warn about.
function dueBadge(
  task: Task,
): { label: string; className: string } | null {
  if (task.status === "done" || !task.due_date) return null;
  const diff = dueDiffDays(task.due_date);
  if (diff < 0)
    return { label: `${-diff}日超過`, className: "bg-red-100 text-red-700" };
  if (diff === 0)
    return { label: "本日締切", className: "bg-red-100 text-red-700" };
  if (diff <= 3)
    return { label: `あと${diff}日`, className: "bg-amber-100 text-amber-700" };
  return null;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Keyword search over task titles (case-insensitive, partial match). When a
// child task matches, its parent is kept too so the hit stays in context.
// Input order is preserved. An empty query returns the pool unchanged.
function filterBySearch(pool: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return pool;
  const byId = new Map(pool.map((t) => [t.id, t]));
  const keep = new Set<string>();
  for (const t of pool) {
    if (t.title.toLowerCase().includes(q)) {
      keep.add(t.id);
      if (t.parent_id && byId.has(t.parent_id)) keep.add(t.parent_id);
    }
  }
  return pool.filter((t) => keep.has(t.id));
}

type SortKey = "default" | "due" | "assignee" | "status" | "priority";

// A single task row. Shows the task, an inline status select, and a toggleable
// comment thread.
function TaskRow({
  task,
  comments,
  expanded,
  deleteMode,
  isChild,
  childCount,
  onChangeStatus,
  onToggleComments,
  onAddComment,
  onDelete,
  memberOptions,
  onSave,
}: {
  task: Task;
  comments: TaskComment[];
  expanded: boolean;
  deleteMode: boolean;
  isChild: boolean;
  childCount: number;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onToggleComments: (id: string) => void;
  onAddComment: (taskId: string, body: string) => Promise<void>;
  onDelete: (task: Task) => void;
  memberOptions: string[];
  onSave: (id: string, edit: TaskEdit) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  // Inline edit form state. Opened by the pencil button; seeded from the task.
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(task.title);
  const [eAssignee, setEAssignee] = useState(task.assignee ?? "");
  const [eDue, setEDue] = useState(task.due_date ?? "");
  const [eStatus, setEStatus] = useState<TaskStatus>(task.status);
  const [ePriority, setEPriority] = useState<TaskPriority>(task.priority);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string>();

  const fieldClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  function startEdit() {
    setETitle(task.title);
    setEAssignee(task.assignee ?? "");
    setEDue(task.due_date ?? "");
    setEStatus(task.status);
    setEPriority(task.priority);
    setEditError(undefined);
    setEditing(true);
  }

  async function saveEdit() {
    const title = eTitle.trim();
    if (!title) {
      setEditError("タイトルを入力してください。");
      return;
    }
    setSavingEdit(true);
    try {
      await onSave(task.id, {
        title,
        assignee: eAssignee,
        dueDate: eDue,
        status: eStatus,
        priority: ePriority,
      });
      setEditing(false);
    } catch {
      setEditError("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSavingEdit(false);
    }
  }

  async function submitComment() {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    try {
      await onAddComment(task.id, body);
      setDraft("");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div
      className={`rounded-lg border-l-4 shadow-sm ring-1 ring-black/5 ${
        isChild ? "bg-zinc-50" : "bg-white"
      }`}
      style={{ borderLeftColor: STATUS_META[task.status].barColor }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {isChild && <span className="shrink-0 text-zinc-400">└</span>}
            <p
              className={`truncate text-zinc-900 ${
                isChild ? "font-normal" : "font-semibold"
              }`}
            >
              {task.title}
            </p>
            {childCount > 0 && (
              <span className="shrink-0 rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                子 {childCount}
              </span>
            )}
            {!deleteMode && (
              <button
                type="button"
                onClick={() => (editing ? setEditing(false) : startEdit())}
                aria-label="編集"
                aria-expanded={editing}
                className="shrink-0 rounded-full px-1.5 py-0.5 text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                ✏️
              </button>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            <span
              className={`rounded px-1.5 py-0.5 font-medium ${PRIORITY_META[task.priority].badgeClass}`}
            >
              {PRIORITY_META[task.priority].label}
            </span>
            <span>
              {task.assignee || "担当者なし"} ・ {formatDue(task.due_date)}
            </span>
            {(() => {
              const badge = dueBadge(task);
              return badge ? (
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              ) : null;
            })()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onToggleComments(task.id)}
            aria-expanded={expanded}
            className="rounded-full px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
          >
            💬 {comments.length}
          </button>
          <select
            value={task.status}
            onChange={(e) =>
              onChangeStatus(task.id, e.target.value as TaskStatus)
            }
            aria-label="状態"
            className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ${STATUS_META[task.status].badgeClass}`}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          {deleteMode && (
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label="削除"
              className="rounded-full px-2 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600">
                タイトル
              </span>
              <input
                value={eTitle}
                onChange={(e) => setETitle(e.target.value)}
                className={fieldClass}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">
                  担当者
                </span>
                <select
                  value={eAssignee}
                  onChange={(e) => setEAssignee(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">担当者なし</option>
                  {(eAssignee && !memberOptions.includes(eAssignee)
                    ? [eAssignee, ...memberOptions]
                    : memberOptions
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">期限</span>
                <input
                  type="date"
                  value={eDue}
                  onChange={(e) => setEDue(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">状態</span>
                <select
                  value={eStatus}
                  onChange={(e) => setEStatus(e.target.value as TaskStatus)}
                  className={fieldClass}
                >
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">優先度</span>
                <select
                  value={ePriority}
                  onChange={(e) => setEPriority(e.target.value as TaskPriority)}
                  className={fieldClass}
                >
                  {PRIORITY_ORDER.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {editError && <p className="text-sm text-red-600">{editError}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit}
                className="rounded-lg bg-[#3B6D11] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2f5a0e] disabled:opacity-50"
              >
                {savingEdit ? "保存中…" : "保存する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-3">
          {comments.length === 0 ? (
            <p className="text-xs text-zinc-400">まだコメントはありません。</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="text-xs text-zinc-500">
                    {c.author || "名無し"}・{formatDateTime(c.created_at)}
                  </span>
                  <p className="whitespace-pre-wrap text-zinc-800">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="コメントを追加…"
              className="flex-1 resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={posting || !draft.trim()}
              className="rounded-lg bg-[#3B6D11] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2f5a0e] disabled:opacity-50"
            >
              {posting ? "送信中…" : "送信"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// A completed task shown in the archive tab: read-only, with a restore button.
// A parent with completed children can be expanded (onToggle) to reveal them.
function ArchivedRow({
  task,
  onRestore,
  childCount = 0,
  expanded = false,
  onToggle,
  isChild = false,
}: {
  task: Task;
  onRestore: (task: Task) => void;
  childCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  isChild?: boolean;
}) {
  const meta = (
    <p className="mt-0.5 text-xs text-zinc-400">
      {task.assignee || "担当者なし"}
      {task.completed_at ? ` ・ 完了 ${formatDateTime(task.completed_at)}` : ""}
    </p>
  );
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-sm ring-1 ring-black/5 ${
        isChild ? "bg-zinc-50" : "bg-white"
      }`}
    >
      <div className="min-w-0 flex-1">
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="flex w-full items-center gap-1.5 text-left"
          >
            <span className="shrink-0 text-zinc-400">
              {expanded ? "▾" : "▸"}
            </span>
            <span className="truncate text-zinc-500 line-through">
              {task.title}
            </span>
            <span className="shrink-0 rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
              子 {childCount}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {isChild && <span className="shrink-0 text-zinc-300">└</span>}
            <p className="truncate text-zinc-500 line-through">{task.title}</p>
          </div>
        )}
        {meta}
      </div>
      <button
        type="button"
        onClick={() => onRestore(task)}
        className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
      >
        ↩ 未完了に戻す
      </button>
    </div>
  );
}

export default function TasksPage() {
  const { session } = useAuth();
  const authorName =
    ((session?.user.user_metadata?.name as string | undefined) || "").trim() ||
    session?.user.email ||
    null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();

  // Comments, grouped by task id. Loaded once on mount.
  const [commentsByTask, setCommentsByTask] = useState<
    Record<string, TaskComment[]>
  >({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Registered users for the assignee picker (from the profiles table).
  const [members, setMembers] = useState<Member[]>([]);

  // Registration form — collapsed by default, opened with the "+" button.
  const [showForm, setShowForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [title, setTitle] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [parentId, setParentId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("mid");
  const [saving, setSaving] = useState(false);

  // Filter / sort.
  const [filterAssignee, setFilterAssignee] = useState("");
  // "" = all, a status = that status, "open" = everything except done.
  const [filterStatus, setFilterStatus] = useState<"" | TaskStatus | "open">(
    "",
  );
  const [filterPriority, setFilterPriority] = useState<"" | TaskPriority>("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  // Free-text keyword search over task titles. Shared by both tabs.
  const [search, setSearch] = useState("");

  // Which tab is shown: incomplete tasks vs. the completed archive.
  const [tab, setTab] = useState<"open" | "archive">("open");
  // Toggles the centered "変更を保存しました" dialog after an edit is saved.
  const [savedModal, setSavedModal] = useState(false);
  // The task pending deletion (opens a centered confirm dialog); null = closed.
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  // Which archived parent tasks are expanded to reveal their completed children.
  const [expandedArchive, setExpandedArchive] = useState<Set<string>>(
    new Set(),
  );

  // Today's date (YYYY-MM-DD, local) — the earliest allowed due date. Set in an
  // effect to avoid a server/client hydration mismatch.
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    const now = new Date();
    setMinDate(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );

    listTasks()
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError("タスクの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));

    // Comments are optional; a missing table shouldn't break the page.
    listComments()
      .then((all) => {
        const map: Record<string, TaskComment[]> = {};
        for (const c of all) (map[c.task_id] ??= []).push(c);
        setCommentsByTask(map);
      })
      .catch((err) => console.error("コメントの読み込みに失敗:", err));

    // Registered users for the assignee picker. A missing profiles table
    // (not yet created) shouldn't break the page — we fall back to past names.
    listMembers()
      .then(setMembers)
      .catch((err) => console.error("メンバー一覧の読み込みに失敗:", err));
  }, []);

  // Auto-dismiss the save confirmation dialog after a short moment.
  useEffect(() => {
    if (!savedModal) return;
    const id = setTimeout(() => setSavedModal(false), 2500);
    return () => clearTimeout(id);
  }, [savedModal]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    // Reject past due dates (the picker also blocks them via min=today).
    if (dueDate && minDate && dueDate < minDate) {
      setError("期限に過去の日付は指定できません。");
      return;
    }
    setSaving(true);
    try {
      if (bulkMode) {
        // Indented lines (leading space/tab/full-width space) become children of
        // the preceding non-indented line, so a parent and its children can be
        // registered together. Parents are created first to obtain their ids.
        const groups: { title: string; children: string[] }[] = [];
        for (const raw of bulkText.split("\n")) {
          if (!raw.trim()) continue;
          const isChild = /^[ \t　]/.test(raw);
          if (isChild && groups.length > 0) {
            groups[groups.length - 1].children.push(raw.trim());
          } else {
            groups.push({ title: raw.trim(), children: [] });
          }
        }
        if (groups.length === 0) {
          setSaving(false);
          return;
        }
        const shared = { assignee: assignee.trim(), dueDate, status, priority };
        const created: Task[] = [];
        for (const group of groups) {
          const parent = await createTask({
            ...shared,
            title: group.title,
            parentId: null,
          });
          created.push(parent);
          if (group.children.length > 0) {
            const kids = await createTasks(
              group.children.map((t) => ({
                ...shared,
                title: t,
                parentId: parent.id,
              })),
            );
            created.push(...kids);
          }
        }
        setTasks((prev) => [...prev, ...created]);
        setBulkText("");
      } else {
        const created = await createTask({
          title: title.trim(),
          assignee: assignee.trim(),
          dueDate,
          status,
          priority,
          parentId: parentId || null,
        });
        setTasks((prev) => [...prev, created]);
        setTitle("");
      }
      // Keep status/parent for quick repeated entry; clear the per-task fields.
      setAssignee("");
      setDueDate("");
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(id: string, next: TaskStatus) {
    // Optimistic update; roll back only this row on failure.
    const previous = tasks.find((t) => t.id === id)?.status;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: next } : t)));
    try {
      await updateTaskStatus(id, next);
      // Auto-sync the parent: when every child is done, archive the parent;
      // when a child is reopened, bring the parent back out of the archive.
      const changed = tasks.find((t) => t.id === id);
      if (changed?.parent_id) {
        const parentId = changed.parent_id;
        const parent = tasks.find((t) => t.id === parentId);
        const siblings = tasks.filter((t) => t.parent_id === parentId);
        const allDone = siblings.every(
          (t) => (t.id === id ? next : t.status) === "done",
        );
        if (parent && allDone && parent.status !== "done") {
          await updateTaskStatus(parentId, "done");
          setTasks((ts) =>
            ts.map((t) =>
              t.id === parentId
                ? {
                    ...t,
                    status: "done",
                    completed_at: new Date().toISOString(),
                  }
                : t,
            ),
          );
        } else if (parent && !allDone && parent.status === "done") {
          await updateTaskStatus(parentId, "todo");
          setTasks((ts) =>
            ts.map((t) =>
              t.id === parentId
                ? { ...t, status: "todo", completed_at: null }
                : t,
            ),
          );
        }
      }
    } catch (err) {
      console.error(err);
      if (previous !== undefined) {
        setTasks((ts) =>
          ts.map((t) => (t.id === id ? { ...t, status: previous } : t)),
        );
      }
      setError("状態の更新に失敗しました。");
    }
  }

  // Save an inline edit. Throwing on failure lets the row show its own error;
  // on success we refresh the row and pop the confirmation dialog.
  async function handleUpdate(id: string, edit: TaskEdit) {
    const updated = await updateTask(id, edit);
    setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    setSavedModal(true);
  }

  // Move a completed task back to "todo" (out of the archive).
  async function handleRestore(task: Task) {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === task.id ? { ...t, status: "todo", completed_at: null } : t,
      ),
    );
    try {
      await updateTaskStatus(task.id, "todo");
      // If this restored child has an archived parent, restore the parent too.
      if (task.parent_id) {
        const parent = tasks.find((t) => t.id === task.parent_id);
        if (parent && parent.status === "done") {
          await updateTaskStatus(task.parent_id, "todo");
          setTasks((ts) =>
            ts.map((t) =>
              t.id === task.parent_id
                ? { ...t, status: "todo", completed_at: null }
                : t,
            ),
          );
        }
      }
    } catch (err) {
      console.error(err);
      setTasks((ts) =>
        ts.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)),
      );
      setError("未完了に戻せませんでした。");
    }
  }

  function toggleComments(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleArchive(id: string) {
    setExpandedArchive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddComment(taskId: string, body: string) {
    try {
      const created = await addComment({ taskId, body, author: authorName });
      setCommentsByTask((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] ?? []), created],
      }));
    } catch (err) {
      console.error(err);
      setError(
        "コメントの追加に失敗しました（コメント用テーブル task_comments が未作成の可能性があります）。",
      );
    }
  }

  // Open the centered confirm dialog; the actual deletion runs in confirmDelete.
  function handleDelete(task: Task) {
    setDeleteTarget(task);
  }

  async function confirmDelete() {
    const task = deleteTarget;
    if (!task) return;
    const children = tasks.filter((t) => t.parent_id === task.id);
    const ids = [...children.map((c) => c.id), task.id];
    try {
      // Delete children first so the parent_id foreign key isn't violated.
      if (children.length > 0) await deleteTasks(children.map((c) => c.id));
      await deleteTasks([task.id]);
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    } catch (err) {
      console.error(err);
      setError("削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setDeleteTarget(null);
    }
  }

  // Only top-level tasks that aren't archived (done) can be a parent — keeps
  // it 2 levels and stops new tasks being filed under a completed parent.
  const parentOptions = tasks.filter(
    (t) => !t.parent_id && t.status !== "done",
  );
  const assigneeOptions = useMemo(
    () =>
      [...new Set(tasks.map((t) => t.assignee).filter(Boolean))] as string[],
    [tasks],
  );
  // Assignee choices: registered users (profiles). Before profiles is
  // populated, fall back to names already used on tasks plus the current user.
  const memberOptions = useMemo(() => {
    if (members.length > 0) return members.map(memberLabel);
    const set = new Set<string>();
    for (const t of tasks) if (t.assignee) set.add(t.assignee);
    if (authorName) set.add(authorName);
    return [...set];
  }, [members, tasks, authorName]);

  // Split by completion: incomplete tasks feed the tree/list; completed ones
  // go to the archive tab (newest completion first).
  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks],
  );
  const archivedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "done")
        .sort((a, b) =>
          (b.completed_at || "").localeCompare(a.completed_at || ""),
        ),
    [tasks],
  );
  // Archive honors the keyword search too (both tabs are searchable).
  const filteredArchive = useMemo(
    () => filterBySearch(archivedTasks, search),
    [archivedTasks, search],
  );
  // 2-level tree of the archive so a completed parent can reveal its completed
  // children on click.
  const archivedTree = useMemo(
    () => buildTaskTree(filteredArchive),
    [filteredArchive],
  );

  const filtersActive =
    filterAssignee !== "" ||
    filterStatus !== "" ||
    filterPriority !== "" ||
    sortKey !== "default" ||
    search.trim() !== "";

  // When filtering/sorting, show a flat list (the tree can't preserve an
  // arbitrary sort order). Otherwise show the 2-level tree.
  const flatList = useMemo(() => {
    let list = openTasks.slice();
    if (filterAssignee)
      list = list.filter((t) => (t.assignee || "") === filterAssignee);
    if (filterStatus && filterStatus !== "open")
      list = list.filter((t) => t.status === filterStatus);
    if (filterPriority)
      list = list.filter((t) => t.priority === filterPriority);
    // Keyword search on the title (keeps a matched child's parent for context).
    list = filterBySearch(list, search);
    const comparators: Record<SortKey, (a: Task, b: Task) => number> = {
      default: () => 0,
      due: (a, b) =>
        (a.due_date || "9999-99-99").localeCompare(b.due_date || "9999-99-99"),
      assignee: (a, b) => (a.assignee || "").localeCompare(b.assignee || ""),
      status: (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      priority: (a, b) =>
        PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order,
    };
    if (sortKey !== "default") list.sort(comparators[sortKey]);
    return list;
  }, [openTasks, filterAssignee, filterStatus, filterPriority, sortKey, search]);

  const tree = useMemo(() => buildTaskTree(openTasks), [openTasks]);
  // Progress tracks the assignee filter: pick a person to see just their
  // progress, or "すべて" for the whole team. (Status filter is intentionally
  // ignored here — filtering to "done" would always read 100%.)
  // Progress is counted over LEAF tasks (child + standalone tasks), excluding
  // parents that only group children — see leafTasks() for why.
  const leaves = useMemo(() => leafTasks(tasks), [tasks]);
  const progressScope = filterAssignee
    ? leaves.filter((t) => (t.assignee || "") === filterAssignee)
    : leaves;
  const progress = taskProgress(progressScope);
  const progressLabel = filterAssignee
    ? `${filterAssignee} の進捗`
    : "チーム全体の進捗";

  // At-a-glance risk across all incomplete tasks (team-wide; intentionally
  // ignores the assignee filter — everyone should see what's at risk).
  const riskSummary = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let dueSoon = 0;
    let unassigned = 0;
    for (const t of tasks) {
      if (t.status === "done") continue;
      if (!t.assignee) unassigned++;
      if (t.due_date) {
        const diff = dueDiffDays(t.due_date);
        if (diff < 0) overdue++;
        else if (diff === 0) dueToday++;
        else if (diff <= 3) dueSoon++;
      }
    }
    return { overdue, dueToday, dueSoon, unassigned };
  }, [tasks]);

  const renderRow = (
    task: Task,
    opts: { isChild?: boolean; childCount?: number } = {},
  ) => (
    <TaskRow
      task={task}
      comments={commentsByTask[task.id] ?? []}
      expanded={expanded.has(task.id)}
      deleteMode={deleteMode}
      isChild={opts.isChild ?? false}
      childCount={opts.childCount ?? 0}
      onChangeStatus={handleStatusChange}
      onToggleComments={toggleComments}
      onAddComment={handleAddComment}
      onDelete={handleDelete}
      memberOptions={memberOptions}
      onSave={handleUpdate}
    />
  );

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  return (
    <div className="flex-1" style={{ background: "#EAF3FB" }}>
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">進捗管理</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/tasks/mail"
            aria-label="メール共有の設定"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C0DD97] bg-white px-2.5 py-1 text-sm text-[#3B6D11] transition hover:bg-[#EAF3DE]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 8 9 6 9-6" />
            </svg>
            メール共有
          </Link>
          <Link
            href="/office"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C0DD97] bg-white px-2.5 py-1 text-sm text-[#3B6D11] transition hover:bg-[#EAF3DE]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" />
              <path d="M15 8h4a1 1 0 0 1 1 1v12" />
              <path d="M3 21h18" />
              <path d="M8 7h3M8 11h3M8 15h3" />
            </svg>
            オフィスへ
          </Link>
        </div>
      </div>

      {/* Team-wide progress (forest hero) */}
      <SkyHero
        done={progress.done}
        total={progress.total}
        percent={progress.percent}
        label={progressLabel}
      />

      {/* Risk summary — at-risk tasks at a glance (team-wide, incomplete only) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(
          [
            ["期限超過", riskSummary.overdue, "text-red-700"],
            ["本日締切", riskSummary.dueToday, "text-red-700"],
            ["期限間近", riskSummary.dueSoon, "text-amber-700"],
            ["担当なし", riskSummary.unassigned, "text-zinc-600"],
          ] as const
        ).map(([label, n, cls]) => (
          <div
            key={label}
            className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/5"
          >
            <div
              className={`text-xl font-semibold ${n > 0 ? cls : "text-zinc-300"}`}
            >
              {n}
            </div>
            <div className="text-[11px] text-zinc-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Sticky header: tabs + toolbar stay visible while the list scrolls. */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-zinc-200 bg-zinc-50 px-4 pt-1">
        <div className="flex gap-1">
          {(
            [
              ["open", "未完了", openTasks.length],
              ["archive", "アーカイブ", archivedTasks.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-3 pb-2 pt-1 text-sm transition ${
                tab === key
                  ? "border-zinc-900 font-semibold text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
              <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
                {count}
              </span>
            </button>
          ))}
        </div>
        {/* Keyword search — available on both tabs. */}
        <div className="py-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="タスク名で検索"
              aria-label="タスク名で検索"
              className={`${inputClass} w-full py-1.5 pr-9 text-sm`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="検索をクリア"
                className="absolute inset-y-0 right-2 my-auto flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                ×
              </button>
            )}
          </div>
        </div>
        {tab === "open" && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f5a0e]"
        >
          {showForm ? "× 閉じる" : "＋ タスクを追加"}
        </button>
        <button
          type="button"
          onClick={() => setDeleteMode((v) => !v)}
          aria-label={deleteMode ? "削除モードを終了" : "削除モード"}
          aria-pressed={deleteMode}
          title={deleteMode ? "削除モードを終了" : "削除モード"}
          className={`rounded-lg border px-2.5 py-2 text-sm leading-none transition ${
            deleteMode
              ? "border-red-600 bg-red-600 text-white hover:bg-red-500"
              : "border-red-300 text-red-600 hover:bg-red-50"
          }`}
        >
          🗑
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            aria-label="担当者で絞り込み"
            className={`${inputClass} max-w-[8rem] py-1.5`}
          >
            <option value="">担当者：すべて</option>
            {assigneeOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "" | TaskStatus | "open")
            }
            aria-label="状態で絞り込み"
            className={`${inputClass} max-w-[8rem] py-1.5`}
          >
            <option value="">状態：すべて</option>
            {STATUS_ORDER.filter((s) => s !== "done").map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) =>
              setFilterPriority(e.target.value as "" | TaskPriority)
            }
            aria-label="優先度で絞り込み"
            className={`${inputClass} max-w-[8rem] py-1.5`}
          >
            <option value="">優先度：すべて</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="並び替え"
            className={`${inputClass} max-w-[9rem] py-1.5`}
          >
            <option value="default">並び順：既定</option>
            <option value="due">期限が近い順</option>
            <option value="priority">優先度が高い順</option>
            <option value="assignee">担当者順</option>
            <option value="status">状態順</option>
          </select>
        </div>
          </div>
        )}
      </div>

      {tab === "open" && (
        <>
          {deleteMode && (
            <p className="mb-4 text-sm text-red-600">
              削除モード中：各タスクの「×」で削除できます（親を消すと子も一緒に削除されます）。
            </p>
          )}

      {/* Registration form (collapsible) */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-800">タスクを登録</h2>
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input
                type="checkbox"
                checked={bulkMode}
                onChange={(e) => setBulkMode(e.target.checked)}
                className="h-4 w-4"
              />
              まとめて登録
            </label>
          </div>

          {bulkMode ? (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">
                内容（1行に1タスク／行頭に空白で子タスク）
              </span>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={5}
                placeholder={
                  "例：\nログイン機能\n  画面の設計\n  APIの実装\nDBスキーマの作成"
                }
                className={`${inputClass} resize-y`}
              />
              <span className="text-xs text-zinc-400">
                行頭にスペースを入れると、直前の行の子タスクになります。担当者・期限・状態は全行に共通で適用されます。
              </span>
            </label>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">内容</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：ログイン画面の設計"
                className={inputClass}
              />
            </label>
          )}

          {!bulkMode && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">親タスク</span>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className={inputClass}
              >
                <option value="">なし（親タスクとして登録）</option>
                {parentOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">担当者</span>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={inputClass}
              >
                <option value="">担当者なし</option>
                {memberOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">期限</span>
              <input
                type="date"
                value={dueDate}
                min={minDate || undefined}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">状態</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={inputClass}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">優先度</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={inputClass}
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || (bulkMode ? !bulkText.trim() : !title.trim())}
            className="self-start rounded-lg bg-[#3B6D11] px-5 py-2 font-medium text-white transition hover:bg-[#2f5a0e] disabled:opacity-50"
          >
            {saving ? "登録中…" : "登録する"}
          </button>
        </form>
      )}
        </>
      )}

      {/* Task list */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">
          {tab === "archive"
            ? `アーカイブ（${filteredArchive.length}）`
            : `タスク一覧（${filtersActive ? flatList.length : openTasks.length}）`}
        </h2>

        {error && !showForm && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}

        {!loaded ? (
          <p className="text-sm text-zinc-400">読み込み中…</p>
        ) : tab === "archive" ? (
          archivedTasks.length === 0 ? (
            <p className="text-sm text-zinc-400">
              完了したタスクはまだありません。
            </p>
          ) : filteredArchive.length === 0 ? (
            <p className="text-sm text-zinc-400">
              条件に合うタスクはありません。
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {archivedTree.map(({ task: parent, children }) => (
                <li key={parent.id}>
                  <ArchivedRow
                    task={parent}
                    onRestore={handleRestore}
                    childCount={children.length}
                    expanded={expandedArchive.has(parent.id)}
                    onToggle={
                      children.length > 0
                        ? () => toggleArchive(parent.id)
                        : undefined
                    }
                  />
                  {children.length > 0 && expandedArchive.has(parent.id) && (
                    <ul className="mt-2 ml-5 flex flex-col gap-2 border-l-2 border-zinc-200 pl-4">
                      {children.map((child) => (
                        <li key={child.id}>
                          <ArchivedRow
                            task={child}
                            onRestore={handleRestore}
                            isChild
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : openTasks.length === 0 ? (
          <p className="text-sm text-zinc-400">
            未完了のタスクはありません。「＋ タスクを追加」から登録できます。
          </p>
        ) : filtersActive ? (
          // Flat, filtered/sorted view.
          flatList.length === 0 ? (
            <p className="text-sm text-zinc-400">
              条件に合うタスクはありません。
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {flatList.map((task) => (
                <li key={task.id}>
                  {renderRow(task, { isChild: !!task.parent_id })}
                </li>
              ))}
            </ul>
          )
        ) : (
          // Default 2-level tree view.
          <ul className="flex flex-col gap-3">
            {tree.map(({ task: parent, children }) => (
              <li key={parent.id}>
                {renderRow(parent, { childCount: children.length })}
                {children.length > 0 && (
                  <ul className="mt-2 ml-5 flex flex-col gap-2 border-l-2 border-zinc-300 pl-4">
                    {children.map((child) => (
                      <li key={child.id}>{renderRow(child, { isChild: true })}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Centered confirmation after an edit is saved. */}
      {savedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setSavedModal(false)}
        >
          <div
            className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-600">
              ✓
            </div>
            <p className="text-base font-medium text-zinc-800">
              変更を保存しました
            </p>
            <button
              type="button"
              onClick={() => setSavedModal(false)}
              className="mt-1 rounded-lg bg-[#3B6D11] px-5 py-1.5 text-sm font-medium text-white hover:bg-[#2f5a0e]"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Centered confirmation before deleting a task. */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-medium text-zinc-900">
              タスクを削除しますか？
            </p>
            <p className="text-sm text-zinc-600">
              「{deleteTarget.title}」を削除します。
              {tasks.filter((t) => t.parent_id === deleteTarget.id).length >
                0 &&
                `ぶら下がる子タスク${tasks.filter((t) => t.parent_id === deleteTarget.id).length}件も一緒に削除されます。`}
              この操作は取り消せません。
            </p>
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}
