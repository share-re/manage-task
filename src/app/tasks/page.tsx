"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  buildTaskTree,
  createTask,
  createTasks,
  deleteTasks,
  listTasks,
  taskProgress,
  updateTaskStatus,
  STATUS_META,
  STATUS_ORDER,
  type Task,
  type TaskStatus,
} from "@/lib/tasks";
import { addComment, listComments, type TaskComment } from "@/lib/comments";

function formatDue(due: string | null): string {
  return due ? due.replaceAll("-", "/") : "期限なし";
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SortKey = "default" | "due" | "assignee" | "status";

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
}) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

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
      className={`rounded-lg shadow-sm ring-1 ring-black/5 ${
        isChild ? "bg-zinc-50" : "bg-white"
      }`}
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
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">
            {task.assignee || "担当者なし"} ・ {formatDue(task.due_date)}
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
              className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {posting ? "送信中…" : "送信"}
            </button>
          </div>
        </div>
      )}
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
  const [saving, setSaving] = useState(false);

  // Filter / sort.
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | TaskStatus>("");
  const [sortKey, setSortKey] = useState<SortKey>("default");

  useEffect(() => {
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
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
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
        const shared = { assignee: assignee.trim(), dueDate, status };
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

  function toggleComments(id: string) {
    setExpanded((prev) => {
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

  async function handleDelete(task: Task) {
    const children = tasks.filter((t) => t.parent_id === task.id);
    const message =
      children.length > 0
        ? `「${task.title}」と、ぶら下がる子タスク${children.length}件を削除します。よろしいですか？`
        : `「${task.title}」を削除します。よろしいですか？`;
    if (!window.confirm(message)) return;
    const ids = [...children.map((c) => c.id), task.id];
    try {
      // Delete children first so the parent_id foreign key isn't violated.
      if (children.length > 0) await deleteTasks(children.map((c) => c.id));
      await deleteTasks([task.id]);
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    } catch (err) {
      console.error(err);
      setError("削除に失敗しました。時間をおいて再度お試しください。");
    }
  }

  // Only top-level tasks can be a parent — keeps it 2 levels.
  const parentOptions = tasks.filter((t) => !t.parent_id);
  const assigneeOptions = useMemo(
    () =>
      [...new Set(tasks.map((t) => t.assignee).filter(Boolean))] as string[],
    [tasks],
  );

  const filtersActive =
    filterAssignee !== "" || filterStatus !== "" || sortKey !== "default";

  // When filtering/sorting, show a flat list (the tree can't preserve an
  // arbitrary sort order). Otherwise show the 2-level tree.
  const flatList = useMemo(() => {
    let list = tasks.slice();
    if (filterAssignee)
      list = list.filter((t) => (t.assignee || "") === filterAssignee);
    if (filterStatus) list = list.filter((t) => t.status === filterStatus);
    const comparators: Record<SortKey, (a: Task, b: Task) => number> = {
      default: () => 0,
      due: (a, b) =>
        (a.due_date || "9999-99-99").localeCompare(b.due_date || "9999-99-99"),
      assignee: (a, b) => (a.assignee || "").localeCompare(b.assignee || ""),
      status: (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
    };
    if (sortKey !== "default") list.sort(comparators[sortKey]);
    return list;
  }, [tasks, filterAssignee, filterStatus, sortKey]);

  const tree = useMemo(() => buildTaskTree(tasks), [tasks]);
  // Progress tracks the assignee filter: pick a person to see just their
  // progress, or "すべて" for the whole team. (Status filter is intentionally
  // ignored here — filtering to "done" would always read 100%.)
  const progressScope = filterAssignee
    ? tasks.filter((t) => (t.assignee || "") === filterAssignee)
    : tasks;
  const progress = taskProgress(progressScope);
  const progressLabel = filterAssignee
    ? `${filterAssignee} の進捗`
    : "チーム全体の進捗";

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
    />
  );

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">進捗管理</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/tasks/mail"
            className="text-sm text-zinc-500 hover:underline"
          >
            メール共有の設定
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:underline">
            ← トップに戻る
          </Link>
        </div>
      </div>

      {/* Team-wide progress */}
      <div className="mb-8 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-zinc-800">
            {progressLabel}
          </h2>
          <span className="text-sm text-zinc-500">
            完了 {progress.done} / {progress.total}
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-green-600 transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-right text-sm font-medium text-zinc-700">
          {progress.percent}%
        </p>
      </div>

      {/* Toolbar: add / delete buttons + filters/sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          {showForm ? "× 閉じる" : "＋ タスクを追加"}
        </button>
        <button
          type="button"
          onClick={() => setDeleteMode((v) => !v)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            deleteMode
              ? "bg-red-600 text-white hover:bg-red-500"
              : "border border-red-300 text-red-600 hover:bg-red-50"
          }`}
        >
          {deleteMode ? "× 削除を終了" : "🗑 削除"}
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
            onChange={(e) => setFilterStatus(e.target.value as "" | TaskStatus)}
            aria-label="状態で絞り込み"
            className={`${inputClass} max-w-[7rem] py-1.5`}
          >
            <option value="">状態：すべて</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
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
            <option value="assignee">担当者順</option>
            <option value="status">状態順</option>
          </select>
        </div>
      </div>
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
              <input
                type="text"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="例：畠山"
                className={inputClass}
              />
            </label>

            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">期限</span>
              <input
                type="date"
                value={dueDate}
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
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || (bulkMode ? !bulkText.trim() : !title.trim())}
            className="self-start rounded-lg bg-zinc-900 px-5 py-2 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "登録中…" : "登録する"}
          </button>
        </form>
      )}

      {/* Task list */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">
          タスク一覧（{filtersActive ? flatList.length : tasks.length}）
        </h2>

        {error && !showForm && (
          <p className="mb-3 text-sm text-red-600">{error}</p>
        )}

        {!loaded ? (
          <p className="text-sm text-zinc-400">読み込み中…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-zinc-400">
            まだタスクがありません。「＋ タスクを追加」から登録してみましょう。
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
    </main>
  );
}
