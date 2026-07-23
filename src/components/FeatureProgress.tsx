"use client";

import { useMemo, useState } from "react";
import {
  resolveAssigneeLabel,
  STATUS_META,
  type Task,
} from "@/lib/tasks";

// Whole days from today until a due date (UTC day granularity). Negative =
// overdue. Duplicated from the tasks page helper to keep this component
// self-contained.
function dueDiffDays(due: string): number {
  const [y, m, d] = due.split("-").map(Number);
  const dueMs = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueMs - todayMs) / 86_400_000);
}

// Risk classification for one incomplete child task.
type Risk =
  | { label: string; kind: "danger" }
  | { label: string; kind: "warn" }
  | { label: string; kind: "gray" }
  | null;

function taskRisk(task: Task, labelById: Map<string, string>): Risk {
  if (task.status !== "done" && task.due_date) {
    const diff = dueDiffDays(task.due_date);
    if (diff < 0) return { label: `${-diff}日超過`, kind: "danger" };
    if (diff === 0) return { label: "本日締切", kind: "danger" };
    if (diff <= 3) return { label: `あと${diff}日`, kind: "warn" };
  }
  if (task.status !== "done" && !resolveAssigneeLabel(task, labelById))
    return { label: "担当なし", kind: "gray" };
  return null;
}

const RISK_BADGE_CLASS: Record<"danger" | "warn" | "gray", string> = {
  danger: "bg-red-100 text-red-700",
  warn: "bg-amber-100 text-amber-700",
  gray: "bg-zinc-100 text-zinc-600",
};

// Format hours without a trailing ".0" (4 -> "4", 4.5 -> "4.5").
function fmtHours(h: number): string {
  return Number.isInteger(h) ? String(h) : String(Math.round(h * 10) / 10);
}

/**
 * 機能別進捗一覧 (per-feature progress list) — the first admin cross-view
 * (要確認-5). A feature = a parent task (Q-16). Each row shows the done-children
 * ratio with delay badges; clicking a badge filters the expanded list down to
 * the risky tasks only.
 */
export default function FeatureProgress({
  tasks,
  labelById,
}: {
  tasks: Task[];
  labelById: Map<string, string>;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [riskOnlyIds, setRiskOnlyIds] = useState<Set<string>>(new Set());

  // Features = parents that have children (built over ALL tasks so completed
  // children still count toward the progress ratio).
  const features = useMemo(() => {
    const childrenByParent = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.parent_id) continue;
      const list = childrenByParent.get(t.parent_id) ?? [];
      list.push(t);
      childrenByParent.set(t.parent_id, list);
    }
    return tasks
      .filter((t) => !t.parent_id && childrenByParent.has(t.id))
      .map((parent) => {
        const children = childrenByParent.get(parent.id)!;
        const done = children.filter((c) => c.status === "done").length;
        const pct = Math.round((done / children.length) * 100);
        // Remaining estimate over incomplete children. "+" marks that some of
        // them have no estimate yet, i.e. the true remainder is larger.
        let remain = 0;
        let missingEstimate = 0;
        for (const c of children) {
          if (c.status === "done") continue;
          if (c.estimated_hours != null && c.estimated_hours > 0)
            remain += c.estimated_hours;
          else missingEstimate++;
        }
        const risks = children
          .map((c) => ({ task: c, risk: taskRisk(c, labelById) }))
          .filter((r) => r.risk !== null);
        const nDanger = risks.filter((r) => r.risk!.kind === "danger").length;
        const nWarn = risks.filter((r) => r.risk!.kind === "warn").length;
        const nGray = risks.filter((r) => r.risk!.kind === "gray").length;
        return {
          parent,
          children,
          pct,
          done,
          remain,
          missingEstimate,
          nDanger,
          nWarn,
          nGray,
        };
      });
  }, [tasks, labelById]);

  if (features.length === 0) return null;

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Closing a row also clears its risk filter.
    setRiskOnlyIds((prev) => {
      if (!openIds.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function openRiskOnly(id: string) {
    setOpenIds((prev) => new Set(prev).add(id));
    setRiskOnlyIds((prev) => new Set(prev).add(id));
  }

  function showAll(id: string) {
    setRiskOnlyIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-800">機能別の進捗</h2>
        <span className="text-[11px] text-zinc-400">
          機能＝親タスク／バッジで危ないタスクに絞り込み
        </span>
      </div>
      {features.map((f, i) => {
        const open = openIds.has(f.parent.id);
        const riskOnly = riskOnlyIds.has(f.parent.id);
        const shown = riskOnly
          ? f.children.filter((c) => taskRisk(c, labelById) !== null)
          : f.children;
        const remainLabel =
          f.remain > 0
            ? `残 ${fmtHours(f.remain)}h${f.missingEstimate > 0 ? "+" : ""}`
            : f.pct >= 100
              ? "完了"
              : f.missingEstimate > 0
                ? "未計測"
                : "残 0h";
        return (
          <div
            key={f.parent.id}
            className={i > 0 ? "border-t border-zinc-100" : undefined}
          >
            <button
              type="button"
              onClick={() => toggleOpen(f.parent.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 py-2.5 text-left"
            >
              <span className="w-3 shrink-0 text-xs text-zinc-400">
                {open ? "▾" : "▸"}
              </span>
              <span className="w-32 shrink-0 truncate text-sm font-medium text-zinc-900">
                {f.parent.title}
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${f.pct}%`,
                    background: f.nDanger > 0 ? "#E24B4A" : "#3B6D11",
                  }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-xs text-zinc-600">
                {f.pct}%
              </span>
              <span className="w-14 shrink-0 text-right text-[11px] text-zinc-400">
                {remainLabel}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                {f.nDanger > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRiskOnly(f.parent.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        openRiskOnly(f.parent.id);
                      }
                    }}
                    className="cursor-pointer rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700"
                  >
                    ⚠ 超過/締切 {f.nDanger}
                  </span>
                )}
                {f.nWarn > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRiskOnly(f.parent.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        openRiskOnly(f.parent.id);
                      }
                    }}
                    className="cursor-pointer rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
                  >
                    間近 {f.nWarn}
                  </span>
                )}
                {f.nGray > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRiskOnly(f.parent.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        openRiskOnly(f.parent.id);
                      }
                    }}
                    className="cursor-pointer rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600"
                  >
                    担当なし {f.nGray}
                  </span>
                )}
                {f.nDanger === 0 && f.nWarn === 0 && f.nGray === 0 && (
                  <span className="text-[11px] text-green-700">✓ 順調</span>
                )}
              </span>
            </button>

            {open && (
              <div className="mb-2.5 ml-6 overflow-hidden rounded-lg border border-zinc-200">
                {riskOnly && (
                  <div className="flex items-center justify-between bg-red-50 px-3 py-1.5">
                    <span className="text-[11px] text-red-700">
                      危ないタスクだけ表示中（{shown.length}件）
                    </span>
                    <button
                      type="button"
                      onClick={() => showAll(f.parent.id)}
                      className="text-[11px] text-red-700 underline"
                    >
                      全タスクを見る
                    </button>
                  </div>
                )}
                {shown.map((c) => {
                  const risk = taskRisk(c, labelById);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 border-t border-zinc-100 px-3 py-1.5 text-xs first:border-t-0"
                    >
                      <span className="w-16 shrink-0">
                        {risk ? (
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${RISK_BADGE_CLASS[risk.kind]}`}
                          >
                            {risk.label}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          c.status === "done"
                            ? "text-zinc-400 line-through"
                            : "text-zinc-800"
                        }`}
                      >
                        {c.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-zinc-500">
                        {resolveAssigneeLabel(c, labelById) || "担当者なし"} ・{" "}
                        {c.due_date ? c.due_date.replaceAll("-", "/") : "期限なし"} ・{" "}
                        {STATUS_META[c.status].label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
