"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  buildTaskTree,
  createTask,
  createTasks,
  deleteTasks,
  leafTasks,
  listTasks,
  resolveAssigneeLabel,
  taskProgress,
  updateTask,
  updateTaskStatus,
  completeTask,
  STATUS_META,
  STATUS_ORDER,
  PRIORITY_META,
  PRIORITY_ORDER,
  TASK_TYPE_META,
  TASK_TYPE_ORDER,
  DIFFICULTY_META,
  difficultyFromEstimate,
  freezeBaseline,
  type Task,
  type TaskEdit,
  type TaskStatus,
  type TaskPriority,
  type TaskType,
} from "@/lib/tasks";
import { getDefaultProjectId } from "@/lib/projects";
import {
  addTaskNote,
  listTaskNotes,
  openNoteCountByTask,
  setNoteResolved,
  softDeleteTaskNote,
  type TaskNote,
} from "@/lib/taskNotes";
import { isAdmin } from "@/lib/roles";
import NotePanel from "@/components/NotePanel";
import FindingPanel from "@/components/FindingPanel";
import {
  addTaskFinding,
  listTaskFindings,
  openFindingCountByTask,
  setFindingResolved,
  setQualityChecked,
  softDeleteTaskFinding,
  type FindingPhase,
  type TaskFinding,
} from "@/lib/taskFindings";
import { listMembers, memberLabel, type Member } from "@/lib/members";
import SkyHero from "@/components/SkyHero";
import ForestBackground from "@/components/ForestBackground";
import FeatureProgress from "@/components/FeatureProgress";

function formatDue(due: string | null): string {
  return due ? due.replaceAll("-", "/") : "期限なし";
}

// Format hours without a trailing ".0" (4 -> "4", 4.5 -> "4.5").
function formatHours(h: number): string {
  return Number.isInteger(h) ? String(h) : String(Math.round(h * 10) / 10);
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

// useSyncExternalStore 用のヘルパー（「今日」はセッション中変わらないので購読は不要）。
// 同じ文字列を返す限り再描画されない。
function subscribeNever(): () => void {
  return () => {};
}
function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
function getEmptyString(): string {
  return "";
}
// 品質タブなどから /tasks?task=<id> で飛んできたときの対象タスク。
// 別ページからの遷移で毎回マウントし直されるので、購読は不要（effect も使わない）。
function getFocusTaskId(): string {
  return new URLSearchParams(window.location.search).get("task") ?? "";
}

// A single task row. Shows the task, an inline status select, and a toggleable
// 懸念メモ panel (replaces the old comment thread).
function TaskRow({
  task,
  notes,
  openCount,
  notesFailed,
  expanded,
  deleteMode,
  isChild,
  childCount,
  onChangeStatus,
  onToggleNotes,
  onAddNote,
  onSetNoteResolved,
  onDeleteNote,
  findings,
  openFindingCount,
  findingsFailed,
  findingsExpanded,
  onToggleFindings,
  onAddFinding,
  onSetFindingResolved,
  onDeleteFinding,
  onSetQualityChecked,
  onDelete,
  members,
  labelById,
  currentUserId,
  canModerate,
  onSave,
  childActualHours = 0,
  highlight = false,
}: {
  task: Task;
  notes: TaskNote[];
  /** 未対応メモ件数。親が openNoteCountByTask で1回だけ集計した結果を受け取る。 */
  openCount: number;
  /** メモを読み込めなかったとき: 「懸念なし」と区別して「!?」を出す。 */
  notesFailed: boolean;
  expanded: boolean;
  deleteMode: boolean;
  isChild: boolean;
  childCount: number;
  onChangeStatus: (id: string, status: TaskStatus) => void;
  onToggleNotes: (id: string) => void;
  onAddNote: (taskId: string, body: string) => Promise<void>;
  onSetNoteResolved: (noteId: string, resolved: boolean) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  /** 品質（不具合・指摘）。取り消し済みを除いた表示用の記録。 */
  findings: TaskFinding[];
  /** 未対応の記録数。親が openFindingCountByTask で1回だけ集計した結果。 */
  openFindingCount: number;
  /** 読み込めなかったとき: 「不具合なし」と区別して控えめな「－」を出す。 */
  findingsFailed: boolean;
  findingsExpanded: boolean;
  onToggleFindings: (id: string) => void;
  onAddFinding: (
    taskId: string,
    phase: FindingPhase,
    body: string,
  ) => Promise<void>;
  onSetFindingResolved: (findingId: string, resolved: boolean) => Promise<void>;
  onDeleteFinding: (findingId: string) => Promise<void>;
  onSetQualityChecked: (taskId: string, checked: boolean) => Promise<void>;
  onDelete: (task: Task) => void;
  members: Member[];
  labelById: Map<string, string>;
  currentUserId: string | null;
  canModerate: boolean;
  onSave: (id: string, edit: TaskEdit) => Promise<void>;
  childActualHours?: number;
  /** 品質タブなどから飛んできた対象。見つけやすいよう枠を強調する。 */
  highlight?: boolean;
}) {

  // Inline edit form state. Opened by the pencil button; seeded from the task.
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(task.title);
  const [eAssigneeId, setEAssigneeId] = useState(task.assignee_id ?? "");
  const [eStart, setEStart] = useState(task.start_date ?? "");
  const [eDue, setEDue] = useState(task.due_date ?? "");
  const [eStatus, setEStatus] = useState<TaskStatus>(task.status);
  const [ePriority, setEPriority] = useState<TaskPriority>(task.priority);
  const [eTaskType, setETaskType] = useState<TaskType | "">(
    task.task_type ?? "",
  );
  const [eEstimatedHours, setEEstimatedHours] = useState<string>(
    task.estimated_hours != null ? String(task.estimated_hours) : "",
  );
  const [eActualHours, setEActualHours] = useState<string>(
    task.actual_hours != null ? String(task.actual_hours) : "",
  );
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string>();

  const fieldClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  function startEdit() {
    setETitle(task.title);
    setEAssigneeId(task.assignee_id ?? "");
    setEStart(task.start_date ?? "");
    setEDue(task.due_date ?? "");
    setEStatus(task.status);
    setEPriority(task.priority);
    setETaskType(task.task_type ?? "");
    setEEstimatedHours(
      task.estimated_hours != null ? String(task.estimated_hours) : "",
    );
    setEActualHours(
      task.actual_hours != null ? String(task.actual_hours) : "",
    );
    setEditError(undefined);
    setEditing(true);
  }

  async function saveEdit() {
    const title = eTitle.trim();
    if (!title) {
      setEditError("タイトルを入力してください。");
      return;
    }
    // Completing a leaf requires its actual hours (Phase 1 rule).
    if (eStatus === "done" && childCount === 0 && !eActualHours.trim()) {
      setEditError("完了にするには実績時間を入力してください。");
      return;
    }
    // Start date must not be after the due date (要確認-4 / PR2).
    if (eStart && eDue && eStart > eDue) {
      setEditError("開始日は期限より前にしてください。");
      return;
    }
    setSavingEdit(true);
    try {
      await onSave(task.id, {
        title,
        assigneeId: eAssigneeId || null,
        startDate: eStart,
        dueDate: eDue,
        status: eStatus,
        priority: ePriority,
        taskType: eTaskType || null,
        estimatedHours: eEstimatedHours.trim() ? Number(eEstimatedHours) : null,
        actualHours: eActualHours.trim() ? Number(eActualHours) : null,
        // Freeze the baseline on first save if it's still empty (要確認-4).
        ...freezeBaseline(task, eStart, eDue),
      });
      setEditing(false);
    } catch {
      setEditError("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div
      id={`task-${task.id}`}
      className={`rounded-lg border-l-4 shadow-sm ${
        highlight
          ? "ring-2 ring-[#639922]"
          : "ring-1 ring-black/5"
      } ${isChild ? "bg-zinc-50" : "bg-white"}`}
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
              優先 {PRIORITY_META[task.priority].label}
            </span>
            {/* Difficulty tag: outlined (vs. the filled priority badge) so the
                two "中" labels can never be confused. Shown only when an
                estimate exists. */}
            {task.estimated_hours != null &&
              (() => {
                const d = difficultyFromEstimate(task.estimated_hours);
                return d ? (
                  <span className="rounded border border-zinc-300 px-1.5 py-0.5 text-zinc-500">
                    見積 {formatHours(task.estimated_hours)}h・
                    {DIFFICULTY_META[d].label}
                  </span>
                ) : null;
              })()}
            <span>
              {resolveAssigneeLabel(task, labelById) || "担当者なし"} ・{" "}
              {task.start_date
                ? `${task.start_date.replaceAll("-", "/")} 〜 `
                : ""}
              {formatDue(task.due_date)}
              {childCount > 0 &&
                childActualHours > 0 &&
                ` ・ 実績合計 ${formatHours(childActualHours)}h`}
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
          {/* 懸念メモ: 未対応>0→「! n」／メモありで全対応済→「✓ 対応済」／
              メモなし→「＋メモ」。読み込み失敗時は状態が不明なので、緑や「＋メモ」で
              「懸念なし」に見せず、控えめな「－」にする（説明と再読込は上のエラー帯）。 */}
          <button
            type="button"
            onClick={() => onToggleNotes(task.id)}
            aria-expanded={expanded}
            aria-label={notesFailed ? "懸念メモ（読み込めませんでした）" : "懸念メモ"}
            title={
              notesFailed ? "懸念メモを読み込めませんでした" : undefined
            }
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              notesFailed
                ? "border border-zinc-200 text-zinc-300"
                : openCount > 0
                  ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                  : notes.length > 0
                    ? "bg-[#EAF3DE] text-[#27500A] hover:bg-[#dcecc9]"
                    : "border border-dashed border-zinc-300 text-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {notesFailed
              ? "－"
              : openCount > 0
                ? `! ${openCount}`
                : notes.length > 0
                  ? "✓ 対応済"
                  : "＋メモ"}
          </button>
          {/* 品質（不具合・指摘）: 懸念メモとは別ボタン。未対応>0→赤「不具合 n」／
              記録ありで全対応済→緑「✓ 対応済」／記録なし→「＋品質」。
              読み込み失敗時は「不具合ゼロ」に見せず控えめな「－」にする。 */}
          <button
            type="button"
            onClick={() => onToggleFindings(task.id)}
            aria-expanded={findingsExpanded}
            aria-label={
              findingsFailed
                ? "品質（読み込めませんでした）"
                : "品質（不具合・指摘）"
            }
            title={findingsFailed ? "品質の記録を読み込めませんでした" : undefined}
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              findingsFailed
                ? "border border-zinc-200 text-zinc-300"
                : openFindingCount > 0
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : findings.length > 0
                    ? "bg-[#EAF3DE] text-[#27500A] hover:bg-[#dcecc9]"
                    : "border border-dashed border-zinc-300 text-zinc-400 hover:bg-zinc-50"
            }`}
          >
            {findingsFailed
              ? "－"
              : openFindingCount > 0
                ? `不具合 ${openFindingCount}`
                : findings.length > 0
                  ? "✓ 対応済"
                  : "＋品質"}
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">
                  担当者
                </span>
                <select
                  value={eAssigneeId}
                  onChange={(e) => setEAssigneeId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">担当者なし</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {memberLabel(m)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">開始日</span>
                <input
                  type="date"
                  value={eStart}
                  onChange={(e) => setEStart(e.target.value)}
                  className={fieldClass}
                />
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
                {/* 未対応の懸念を残したまま完了にしようとしたときの一言。 */}
                {eStatus === "done" && openCount > 0 && (
                  <span className="text-[11px] text-amber-700">
                    未対応の懸念が{openCount}件あります
                  </span>
                )}
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">種別</span>
                <select
                  value={eTaskType}
                  onChange={(e) => setETaskType(e.target.value as TaskType | "")}
                  className={fieldClass}
                >
                  <option value="">種別なし</option>
                  {TASK_TYPE_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {TASK_TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">
                  見積工数（時間・任意）
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={eEstimatedHours}
                  onChange={(e) => setEEstimatedHours(e.target.value)}
                  placeholder="例：6"
                  className={fieldClass}
                />
                <span className="text-[11px] text-zinc-400">
                  {(() => {
                    const d = difficultyFromEstimate(
                      eEstimatedHours.trim() ? Number(eEstimatedHours) : null,
                    );
                    return d
                      ? `難易度：${DIFFICULTY_META[d].label}（自動）`
                      : "難易度：未設定";
                  })()}
                </span>
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs font-medium text-zinc-600">
                  実績時間（時間）
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={eActualHours}
                  onChange={(e) => setEActualHours(e.target.value)}
                  placeholder="完了時に入力"
                  className={fieldClass}
                />
                <span className="text-[11px] text-zinc-400">
                  完了にするには入力が必要です
                </span>
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
          <NotePanel
            notes={notes}
            labelById={labelById}
            currentUserId={currentUserId}
            canModerate={canModerate}
            onAdd={(body) => onAddNote(task.id, body)}
            onSetResolved={onSetNoteResolved}
            onDelete={onDeleteNote}
          />
        </div>
      )}

      {findingsExpanded && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-zinc-500">
            品質（テスト以降に見つかった不具合・指摘）
          </p>
          <FindingPanel
            findings={findings}
            qualityCheckedAt={task.quality_checked_at}
            labelById={labelById}
            currentUserId={currentUserId}
            canModerate={canModerate}
            onAdd={(phase, body) => onAddFinding(task.id, phase, body)}
            onSetResolved={onSetFindingResolved}
            onDelete={onDeleteFinding}
            onSetChecked={(checked) => onSetQualityChecked(task.id, checked)}
          />
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
  labelById,
}: {
  task: Task;
  onRestore: (task: Task) => void;
  childCount?: number;
  expanded?: boolean;
  onToggle?: () => void;
  isChild?: boolean;
  labelById: Map<string, string>;
}) {
  const meta = (
    <p className="mt-0.5 text-xs text-zinc-400">
      {resolveAssigneeLabel(task, labelById) || "担当者なし"}
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

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  // Current project for new tasks (the default project until the switcher lands
  // in PR3), so a new task's project_id is never left null (要確認-10).
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);

  // 懸念メモ, grouped by task id. Loaded after the tasks (needs their ids).
  const [notesByTask, setNotesByTask] = useState<Record<string, TaskNote[]>>(
    {},
  );
  // 取得に失敗したかどうか。失敗を「懸念ゼロ」と同じ見た目にしないために持つ。
  const [notesFailed, setNotesFailed] = useState(false);
  // 未対応メモ件数（「！」判定）。行ごとに全メモを走査しないよう1回だけ集計する。
  const openCountByTask = useMemo(
    () => openNoteCountByTask(Object.values(notesByTask).flat()),
    [notesByTask],
  );
  // 品質（不具合・指摘）。メモと同じく、タスク読み込み後にまとめて取得する。
  const [findingsByTask, setFindingsByTask] = useState<
    Record<string, TaskFinding[]>
  >({});
  // 取得に失敗したかどうか。失敗を「不具合ゼロ」と同じ見た目にしないために持つ。
  const [findingsFailed, setFindingsFailed] = useState(false);
  // 未対応の記録数（行のバッジ）。行ごとに全件を走査しないよう1回だけ集計する。
  const openFindingCountByTaskMap = useMemo(
    () => openFindingCountByTask(Object.values(findingsByTask).flat()),
    [findingsByTask],
  );
  const [findingsExpanded, setFindingsExpanded] = useState<Set<string>>(
    new Set(),
  );

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // Registered users for the assignee picker (from the profiles table).
  const [members, setMembers] = useState<Member[]>([]);
  // profiles.id -> current display label, used to render task.assignee_id.
  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, memberLabel(mem));
    return m;
  }, [members]);

  // Registration form — collapsed by default, opened with the "+" button.
  const [showForm, setShowForm] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [title, setTitle] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [parentId, setParentId] = useState<string>("");
  const [priority, setPriority] = useState<TaskPriority>("mid");
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [estimatedHours, setEstimatedHours] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Filter / sort.
  const [filterAssigneeId, setFilterAssigneeId] = useState("");
  // "" = all, a status = that status, "open" = everything except done.
  const [filterStatus, setFilterStatus] = useState<"" | TaskStatus | "open">(
    "",
  );
  const [filterPriority, setFilterPriority] = useState<"" | TaskPriority>("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  // Free-text keyword search over task titles. Shared by both tabs.
  const [search, setSearch] = useState("");

  // Which tab is shown: incomplete tasks vs. the completed archive.
  // 明示的にタブを押したらその値。押していなければ、?task= の対象が完了済みかで決める
  // （effect 内で setState せずにタブを合わせるため、状態ではなく導出にしている）。
  const [tabOverride, setTabOverride] = useState<"open" | "archive" | null>(
    null,
  );
  // Toggles the centered "変更を保存しました" dialog after an edit is saved.
  const [savedModal, setSavedModal] = useState(false);
  // The task pending deletion (opens a centered confirm dialog); null = closed.
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  // Leaf task pending completion — opens a dialog that requires actual hours.
  const [completionTarget, setCompletionTarget] = useState<Task | null>(null);
  const [completionHours, setCompletionHours] = useState("");
  const [completionError, setCompletionError] = useState<string>();
  const [completingBusy, setCompletingBusy] = useState(false);
  // Which archived parent tasks are expanded to reveal their completed children.
  const [expandedArchive, setExpandedArchive] = useState<Set<string>>(
    new Set(),
  );

  // Today's date (YYYY-MM-DD, local) — the earliest allowed due date.
  // サーバでは空文字、クライアントでは実際の日付を返すことで、hydration の
  // ズレを避けつつ effect 内で setState しないで済ませる。
  const minDate = useSyncExternalStore(
    subscribeNever,
    getTodayIso,
    getEmptyString,
  );

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError("タスクの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));

    // Registered users for the assignee picker. A missing profiles table
    // (not yet created) shouldn't break the page — we fall back to past names.
    listMembers()
      .then(setMembers)
      .catch((err) => console.error("メンバー一覧の読み込みに失敗:", err));

    // The default project new tasks are attached to (until the PR3 switcher).
    getDefaultProjectId()
      .then(setDefaultProjectId)
      .catch((err) => console.error("案件の読み込みに失敗:", err));
  }, []);

  // 懸念メモは task の id が要るので、タスク読み込み後にまとめて1回取得する。
  // 失敗は握りつぶさず notesFailed を立て、一覧の上にエラー帯＋再読込を出す
  // （行ごとに警告を出すと画面が騒がしいため。利用者レビュー反映）。
  const taskIdsKey = tasks.map((t) => t.id).join(",");
  const [notesReloadKey, setNotesReloadKey] = useState(0);
  useEffect(() => {
    const ids = taskIdsKey ? taskIdsKey.split(",") : [];
    if (ids.length === 0) return;
    let alive = true;
    listTaskNotes(ids)
      .then((all) => {
        if (!alive) return;
        const map: Record<string, TaskNote[]> = {};
        for (const n of all) (map[n.task_id] ??= []).push(n);
        setNotesByTask(map);
        setNotesFailed(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("懸念メモの読み込みに失敗:", err);
        setNotesFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [taskIdsKey, notesReloadKey]);

  // 品質の記録も同じ形で取得する（表示用なので取り消し済みは除く）。
  const [findingsReloadKey, setFindingsReloadKey] = useState(0);
  useEffect(() => {
    const ids = taskIdsKey ? taskIdsKey.split(",") : [];
    if (ids.length === 0) return;
    let alive = true;
    listTaskFindings(ids)
      .then((all) => {
        if (!alive) return;
        const map: Record<string, TaskFinding[]> = {};
        for (const f of all) (map[f.task_id] ??= []).push(f);
        setFindingsByTask(map);
        setFindingsFailed(false);
      })
      .catch((err) => {
        if (!alive) return;
        console.error("品質の記録の読み込みに失敗:", err);
        setFindingsFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [taskIdsKey, findingsReloadKey]);

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
    // Registering directly as "done" would bypass the actual-hours requirement.
    if (status === "done") {
      setError(
        "「完了」での登録はできません。登録後に一覧から完了してください（実績時間の入力が必要です）。",
      );
      return;
    }
    // Start date must not be after the due date (要確認-4 / PR2).
    if (startDate && dueDate && startDate > dueDate) {
      setError("開始日は期限より前にしてください。");
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
        const shared = {
          assigneeId: assigneeId || null,
          startDate,
          dueDate,
          status,
          priority,
          taskType: taskType || null,
          estimatedHours: estimatedHours.trim() ? Number(estimatedHours) : null,
          projectId: defaultProjectId,
        };
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
          assigneeId: assigneeId || null,
          startDate,
          dueDate,
          status,
          priority,
          taskType: taskType || null,
          estimatedHours: estimatedHours.trim() ? Number(estimatedHours) : null,
          parentId: parentId || null,
          projectId: defaultProjectId,
        });
        setTasks((prev) => [...prev, created]);
        setTitle("");
      }
      // Keep status/parent for quick repeated entry; clear the per-task fields.
      setAssigneeId("");
      setStartDate("");
      setDueDate("");
      setTaskType("");
      setEstimatedHours("");
    } catch (err) {
      console.error(err);
      setError("登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  // Parent auto-archive/reopen after a child's status changes: when every child
  // is done, archive the parent; when a child is reopened, bring it back.
  async function syncParentAfterChange(childId: string, childNext: TaskStatus) {
    const changed = tasks.find((t) => t.id === childId);
    if (!changed?.parent_id) return;
    const parentId = changed.parent_id;
    const parent = tasks.find((t) => t.id === parentId);
    const siblings = tasks.filter((t) => t.parent_id === parentId);
    const allDone = siblings.every(
      (t) => (t.id === childId ? childNext : t.status) === "done",
    );
    if (parent && allDone && parent.status !== "done") {
      await updateTaskStatus(parentId, "done");
      setTasks((ts) =>
        ts.map((t) =>
          t.id === parentId
            ? { ...t, status: "done", completed_at: new Date().toISOString() }
            : t,
        ),
      );
    } else if (parent && !allDone && parent.status === "done") {
      await updateTaskStatus(parentId, "todo");
      setTasks((ts) =>
        ts.map((t) =>
          t.id === parentId ? { ...t, status: "todo", completed_at: null } : t,
        ),
      );
    }
  }

  // When a parent is archived (done), cascade its incomplete children to done
  // too (bulk archive of the whole feature). Children are archived without
  // requiring actual hours — closing out a feature is an organizational action;
  // children left without hours simply stay out of the metrics (NFR-09).
  async function cascadeChildrenDone(parentId: string) {
    const children = tasks.filter(
      (t) => t.parent_id === parentId && t.status !== "done",
    );
    if (children.length === 0) return;
    const nowIso = new Date().toISOString();
    setTasks((ts) =>
      ts.map((t) =>
        t.parent_id === parentId && t.status !== "done"
          ? { ...t, status: "done", completed_at: nowIso }
          : t,
      ),
    );
    await Promise.all(children.map((c) => updateTaskStatus(c.id, "done")));
  }

  async function handleStatusChange(id: string, next: TaskStatus) {
    const task = tasks.find((t) => t.id === id);
    const isLeaf = !tasks.some((t) => t.parent_id === id);
    // Completing a leaf requires its actual hours first — open the dialog
    // instead of completing now (parents auto-complete, so no prompt for them).
    if (next === "done" && task && isLeaf && task.actual_hours == null) {
      setCompletionHours("");
      setCompletionError(undefined);
      setCompletionTarget(task);
      return;
    }
    // Optimistic update; roll back only this row on failure.
    const previous = task?.status;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: next } : t)));
    try {
      await updateTaskStatus(id, next);
      // Parent archived → cascade its children to the archive too.
      if (next === "done" && !isLeaf) await cascadeChildrenDone(id);
      await syncParentAfterChange(id, next);
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

  // Confirm the completion dialog: record actual hours and mark the leaf done.
  async function confirmCompletion() {
    const task = completionTarget;
    if (!task) return;
    const hours = Number(completionHours);
    if (!completionHours.trim() || !Number.isFinite(hours) || hours < 0) {
      setCompletionError("実績時間（0以上の数値）を入力してください。");
      return;
    }
    setCompletingBusy(true);
    const previous = task.status;
    const nowIso = new Date().toISOString();
    setTasks((ts) =>
      ts.map((t) =>
        t.id === task.id
          ? { ...t, status: "done", actual_hours: hours, completed_at: nowIso }
          : t,
      ),
    );
    try {
      await completeTask(task.id, hours);
      await syncParentAfterChange(task.id, "done");
      setCompletionTarget(null);
    } catch (err) {
      console.error(err);
      setTasks((ts) =>
        ts.map((t) => (t.id === task.id ? { ...t, status: previous } : t)),
      );
      setCompletionError(
        "完了の保存に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setCompletingBusy(false);
    }
  }

  // Save an inline edit. Throwing on failure lets the row show its own error;
  // on success we refresh the row and pop the confirmation dialog.
  async function handleUpdate(id: string, edit: TaskEdit) {
    const updated = await updateTask(id, edit);
    setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    // Editing a parent to "done" also archives its children.
    const isParent = tasks.some((t) => t.parent_id === id);
    if (updated.status === "done" && isParent) await cascadeChildrenDone(id);
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

  function toggleNotes(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleFindings(id: string) {
    setFindingsExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /** 記録を追加。失敗は FindingPanel 側で表示するので throw する。 */
  async function handleAddFinding(
    taskId: string,
    phase: FindingPhase,
    body: string,
  ) {
    const created = await addTaskFinding(
      taskId,
      phase,
      body,
      session?.user?.id ?? null,
    );
    setFindingsByTask((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), created],
    }));
  }

  /** 対応済み↔未対応。resolved_by/at はDBトリガーが刻むので再取得する。 */
  async function handleSetFindingResolved(
    findingId: string,
    resolved: boolean,
  ) {
    await setFindingResolved(findingId, resolved);
    setFindingsReloadKey((k) => k + 1);
  }

  /** 取り消し（ソフト削除・権限チェックはDB関数側）。表示から取り除く。 */
  async function handleDeleteFinding(findingId: string) {
    await softDeleteTaskFinding(findingId);
    setFindingsByTask((prev) => {
      const next: Record<string, TaskFinding[]> = {};
      for (const [taskId, list] of Object.entries(prev)) {
        next[taskId] = list.filter((f) => f.id !== findingId);
      }
      return next;
    });
  }

  /** 「テスト実施済み」の切替。0件と未確認を区別するためタスク側に持つ。 */
  async function handleSetQualityChecked(taskId: string, checked: boolean) {
    await setQualityChecked(taskId, checked);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              quality_checked_at: checked ? new Date().toISOString() : null,
            }
          : t,
      ),
    );
  }

  function toggleArchive(id: string) {
    setExpandedArchive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // --- 懸念メモ（追記・対応状況・削除）。失敗は NotePanel 側で表示するため throw する。 ---

  async function handleAddNote(taskId: string, body: string) {
    const created = await addTaskNote(taskId, body, session?.user?.id ?? null);
    setNotesByTask((prev) => ({
      ...prev,
      [taskId]: [...(prev[taskId] ?? []), created],
    }));
  }

  /** 対応済み↔未対応。resolved_by/at はDBトリガーが刻むので、表示用に再取得する。 */
  async function handleSetNoteResolved(noteId: string, resolved: boolean) {
    await setNoteResolved(noteId, resolved);
    const ids = tasks.map((t) => t.id);
    const all = await listTaskNotes(ids);
    const map: Record<string, TaskNote[]> = {};
    for (const n of all) (map[n.task_id] ??= []).push(n);
    setNotesByTask(map);
  }

  /** ソフト削除（権限チェックはDB関数側）。成功したら一覧から取り除く。 */
  async function handleDeleteNote(noteId: string) {
    await softDeleteTaskNote(noteId);
    setNotesByTask((prev) => {
      const next: Record<string, TaskNote[]> = {};
      for (const [taskId, list] of Object.entries(prev)) {
        next[taskId] = list.filter((n) => n.id !== noteId);
      }
      return next;
    });
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
    filterAssigneeId !== "" ||
    filterStatus !== "" ||
    filterPriority !== "" ||
    sortKey !== "default" ||
    search.trim() !== "";

  // When filtering/sorting, show a flat list (the tree can't preserve an
  // arbitrary sort order). Otherwise show the 2-level tree.
  const flatList = useMemo(() => {
    let list = openTasks.slice();
    if (filterAssigneeId)
      list = list.filter((t) => t.assignee_id === filterAssigneeId);
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
      assignee: (a, b) =>
        (resolveAssigneeLabel(a, labelById) || "").localeCompare(
          resolveAssigneeLabel(b, labelById) || "",
        ),
      status: (a, b) =>
        STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
      priority: (a, b) =>
        PRIORITY_META[a.priority].order - PRIORITY_META[b.priority].order,
    };
    if (sortKey !== "default") list.sort(comparators[sortKey]);
    return list;
  }, [
    openTasks,
    filterAssigneeId,
    filterStatus,
    filterPriority,
    sortKey,
    search,
    labelById,
  ]);

  const tree = useMemo(() => buildTaskTree(openTasks), [openTasks]);
  // Progress tracks the assignee filter: pick a person to see just their
  // progress, or "すべて" for the whole team. (Status filter is intentionally
  // ignored here — filtering to "done" would always read 100%.)
  // Progress is counted over LEAF tasks (child + standalone tasks), excluding
  // parents that only group children — see leafTasks() for why.
  // 品質タブなどから ?task=<id> で飛んできた対象。行を強調してそこまでスクロールする。
  const focusTaskId = useSyncExternalStore(
    subscribeNever,
    getFocusTaskId,
    getEmptyString,
  );
  const focusTask = focusTaskId
    ? tasks.find((t) => t.id === focusTaskId)
    : undefined;
  // 明示操作が優先。無ければ、対象が完了済みならアーカイブ側を開く。
  const tab: "open" | "archive" =
    tabOverride ?? (focusTask?.status === "done" ? "archive" : "open");

  // 対象の行までスクロールする（setState はしないので effect で問題ない）。
  useEffect(() => {
    if (!focusTaskId || !focusTask) return;
    const el = document.getElementById(`task-${focusTaskId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusTaskId, focusTask]);

  const leaves = useMemo(() => leafTasks(tasks), [tasks]);
  const progressScope = filterAssigneeId
    ? leaves.filter((t) => t.assignee_id === filterAssigneeId)
    : leaves;
  const progress = taskProgress(progressScope);
  const progressLabel = filterAssigneeId
    ? `${labelById.get(filterAssigneeId) ?? "担当者"} の進捗`
    : "チーム全体の進捗";

  // 本日の進捗（SkyHero）と機能別の進捗（FeatureProgress）の表示切替。
  const [progressView, setProgressView] = useState<"today" | "feature">("today");

  // Sum of a parent's children actual hours (parent roll-up display, Q-04).
  const childActualSum = (parentId: string) =>
    tasks
      .filter((t) => t.parent_id === parentId)
      .reduce((sum, t) => sum + (t.actual_hours ?? 0), 0);

  const renderRow = (
    task: Task,
    opts: { isChild?: boolean; childCount?: number } = {},
  ) => (
    <TaskRow
      task={task}
      highlight={task.id === focusTaskId}
      notes={notesByTask[task.id] ?? []}
      openCount={openCountByTask.get(task.id) ?? 0}
      notesFailed={notesFailed}
      expanded={expanded.has(task.id)}
      deleteMode={deleteMode}
      isChild={opts.isChild ?? false}
      childCount={opts.childCount ?? 0}
      childActualHours={
        (opts.childCount ?? 0) > 0 ? childActualSum(task.id) : 0
      }
      onChangeStatus={handleStatusChange}
      onToggleNotes={toggleNotes}
      findings={findingsByTask[task.id] ?? []}
      openFindingCount={openFindingCountByTaskMap.get(task.id) ?? 0}
      findingsFailed={findingsFailed}
      findingsExpanded={findingsExpanded.has(task.id)}
      onToggleFindings={toggleFindings}
      onAddFinding={handleAddFinding}
      onSetFindingResolved={handleSetFindingResolved}
      onDeleteFinding={handleDeleteFinding}
      onSetQualityChecked={handleSetQualityChecked}
      onAddNote={handleAddNote}
      onSetNoteResolved={handleSetNoteResolved}
      onDeleteNote={handleDeleteNote}
      onDelete={handleDelete}
      members={members}
      labelById={labelById}
      currentUserId={session?.user?.id ?? null}
      canModerate={isAdmin(session)}
      onSave={handleUpdate}
    />
  );

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";
  // Compact selects for the list-heading row: small enough that the four
  // filters share ONE line with the heading (they shrink, never wrap).
  const filterSelectClass =
    "rounded-md border border-zinc-300 bg-white px-1.5 py-1 text-[11px] text-zinc-700 outline-none focus:border-zinc-500";

  return (
    // AI内田さん（/assistant）と同じ背景を使うため、常にライト表示に固定する。
    <div className="relative flex-1" style={{ colorScheme: "light" }}>
      {/* 植林（/forest）トーンの背景。AI内田さん（/assistant）と共通のコンポーネント。 */}
      <ForestBackground />
      {/* 進捗バーとタスク一覧が窮屈だったので、ダッシュボードと同じ幅に広げる。 */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
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

      {/* 本日の進捗 / 機能別の進捗 の切替 */}
      <div className="mb-2 flex justify-end">
        <div className="flex rounded-lg bg-zinc-100 p-0.5 text-xs">
          {(
            [
              ["today", "本日の進捗"],
              ["feature", "機能別の進捗"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setProgressView(key)}
              className={`rounded-md px-3 py-1 font-medium transition ${
                progressView === key
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {progressView === "today" ? (
        <SkyHero
          done={progress.done}
          total={progress.total}
          percent={progress.percent}
          label={progressLabel}
        />
      ) : (
        <FeatureProgress
          tasks={tasks}
          labelById={labelById}
          openNoteCountByTask={openCountByTask}
        />
      )}

      {/* Toolbar: add / delete-mode / filters (open tab only). */}
        {tab === "open" && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
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

          </div>
        )}

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

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">担当者</span>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={inputClass}
              >
                <option value="">担当者なし</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberLabel(m)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">開始日</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
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
                {/* "完了" is excluded: completing requires actual hours, so a task
                    is completed from the list/edit, not registered as done. */}
                {STATUS_ORDER.filter((s) => s !== "done").map((s) => (
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

          <div className="flex flex-col gap-4 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">種別</span>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as TaskType | "")}
                className={inputClass}
              >
                <option value="">種別なし</option>
                {TASK_TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>
                    {TASK_TYPE_META[t].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">
                見積工数（時間・任意）
              </span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="例：6"
                className={inputClass}
              />
              <span className="text-xs text-zinc-400">
                {(() => {
                  const d = difficultyFromEstimate(
                    estimatedHours.trim() ? Number(estimatedHours) : null,
                  );
                  return d
                    ? `難易度：${DIFFICULTY_META[d].label}（自動判定）`
                    : "難易度：未設定（見積りを入れると自動で決まります）";
                })()}
              </span>
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

      {/* 懸念メモを読み込めなかったときの帯（行ごとに警告を出すと騒がしいので1本にまとめる）。 */}
      {notesFailed && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <p className="text-sm text-amber-800">
            懸念メモを読み込めませんでした。各タスクに懸念があるかどうかは分かりません。
          </p>
          <button
            type="button"
            onClick={() => setNotesReloadKey((k) => k + 1)}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            再読込
          </button>
        </div>
      )}

      {/* Task list card: tabs (card header) + search + filters + rows all on
          one rounded white card, floating over the forest background. */}
      <section className="rounded-2xl bg-white shadow-md ring-1 ring-black/5">
        {/* Tabs + search, pinned to the top of the viewport while the list
            scrolls (sticky, white so it blends with the card). */}
        <div className="sticky top-0 z-20 rounded-t-2xl border-b border-zinc-200 bg-white px-5 pt-2">
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
                onClick={() => setTabOverride(key)}
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
        </div>

        <div className="px-5 pb-5 pt-4">
        {/* Heading + filters on ONE row (filters shrink instead of wrapping). */}
        <div className="mb-3 flex items-center gap-2">
          <h2 className="shrink-0 text-base font-semibold text-zinc-800">
            {tab === "archive"
              ? `アーカイブ（${filteredArchive.length}）`
              : `タスク一覧（${filtersActive ? flatList.length : openTasks.length}）`}
          </h2>
          {tab === "open" && (
            <div className="ml-auto flex min-w-0 shrink items-center gap-1.5">
              <select
                value={filterAssigneeId}
                onChange={(e) => setFilterAssigneeId(e.target.value)}
                aria-label="担当者で絞り込み"
                className={`${filterSelectClass} max-w-[6.5rem]`}
              >
                <option value="">担当者：すべて</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {memberLabel(m)}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "" | TaskStatus | "open")
                }
                aria-label="状態で絞り込み"
                className={`${filterSelectClass} max-w-[6rem]`}
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
                className={`${filterSelectClass} max-w-[6.5rem]`}
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
                className={`${filterSelectClass} max-w-[7rem]`}
              >
                <option value="default">並び順：既定</option>
                <option value="due">期限が近い順</option>
                <option value="priority">優先度が高い順</option>
                <option value="assignee">担当者順</option>
                <option value="status">状態順</option>
              </select>
            </div>
          )}
        </div>

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
                    labelById={labelById}
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
                            labelById={labelById}
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
        </div>
      </section>

      {/* Completion dialog: a leaf task requires its actual hours to be done. */}
      {completionTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !completingBusy && setCompletionTarget(null)}
        >
          <div
            className="flex w-full max-w-xs flex-col gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-medium text-zinc-900">
              実績時間を入力して完了
            </p>
            <p className="text-sm text-zinc-600">
              「{completionTarget.title}」を完了にします。かかった時間（実績）を入力してください。
            </p>
            {/* 未対応の懸念を残したまま完了（＝アーカイブ）してしまうのを防ぐ一言。 */}
            {(openCountByTask.get(completionTarget.id) ?? 0) > 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                未対応の懸念が{openCountByTask.get(completionTarget.id)}
                件あります。完了にするとアーカイブへ移り、この一覧から見えなくなります。よろしいですか？
              </p>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600">
                実績時間（時間）
              </span>
              <input
                type="number"
                min={0}
                step={0.5}
                autoFocus
                value={completionHours}
                onChange={(e) => {
                  setCompletionHours(e.target.value);
                  setCompletionError(undefined);
                }}
                placeholder="例：3"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              />
              {completionTarget.estimated_hours != null && (
                <span className="text-[11px] text-zinc-400">
                  見積り：{completionTarget.estimated_hours} 時間
                </span>
              )}
            </label>
            {completionError && (
              <p className="text-sm text-red-600">{completionError}</p>
            )}
            <div className="mt-1 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletionTarget(null)}
                disabled={completingBusy}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmCompletion}
                disabled={completingBusy || !completionHours.trim()}
                className="rounded-lg bg-[#3B6D11] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2f5a0e] disabled:opacity-50"
              >
                {completingBusy ? "保存中…" : "完了する"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
              !
            </div>
            <p className="text-base font-medium text-zinc-900">
              タスクを削除しますか？
            </p>
            <p className="text-center text-sm text-zinc-600">
              「{deleteTarget.title}」を削除します。
              {tasks.filter((t) => t.parent_id === deleteTarget.id).length >
                0 &&
                `ぶら下がる子タスク${tasks.filter((t) => t.parent_id === deleteTarget.id).length}件も一緒に削除されます。`}
              この操作は取り消せません。
            </p>
            <div className="mt-1 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-zinc-300 px-5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-red-500"
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
