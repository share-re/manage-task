"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  estimateAchievement,
  leafProgress,
  leafTasks,
  listTasks,
  productivity,
  type Task,
} from "@/lib/tasks";
import { listMembers, memberLabel, type Member } from "@/lib/members";
import FeatureProgress from "@/components/FeatureProgress";

// Whole days from today until a due date (UTC day granularity). Negative =
// overdue. Same rule as the tasks page.
function dueDiffDays(due: string): number {
  const [y, m, d] = due.split("-").map(Number);
  const dueMs = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueMs - todayMs) / 86_400_000);
}

/**
 * ダッシュボード (/tasks/dashboard): the team-wide "viewing" page, split out of
 * the working task list (要確認-5 / 完成イメージ図). Shows only team/feature
 * aggregates — no per-person numbers (Q-15).
 */
export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError("タスクの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));
    listMembers()
      .then(setMembers)
      .catch((err) => console.error("メンバー一覧の読み込みに失敗:", err));
  }, []);

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, memberLabel(mem));
    return m;
  }, [members]);

  const leaves = useMemo(() => leafTasks(tasks), [tasks]);
  const progress = useMemo(() => leafProgress(tasks), [tasks]);
  const achievement = useMemo(() => estimateAchievement(leaves), [leaves]);
  const teamProductivity = useMemo(() => productivity(leaves), [leaves]);

  // At-a-glance risk across all incomplete tasks (same rule as the tasks page).
  const riskSummary = useMemo(() => {
    let overdue = 0;
    let dueToday = 0;
    let dueSoon = 0;
    let unassigned = 0;
    for (const t of tasks) {
      if (t.status === "done") continue;
      if (!t.assignee_id && !t.assignee) unassigned++;
      if (t.due_date) {
        const diff = dueDiffDays(t.due_date);
        if (diff < 0) overdue++;
        else if (diff === 0) dueToday++;
        else if (diff <= 3) dueSoon++;
      }
    }
    return { overdue, dueToday, dueSoon, unassigned };
  }, [tasks]);

  return (
    <div className="flex-1" style={{ background: "#EAF3FB" }}>
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">ダッシュボード</h1>
          <Link
            href="/tasks"
            className="text-sm hover:underline"
            style={{ color: "#3B6D11" }}
          >
            ← 進捗管理に戻る
          </Link>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {!loaded ? (
          <p className="text-sm text-zinc-400">読み込み中…</p>
        ) : (
          <>
            {/* Metric cards: 進捗率 (main) / 見積り達成率 / 生産性 (supporting) */}
            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] text-zinc-500">
                  進捗率（主指標）
                </div>
                <div className="mt-0.5 text-xl font-semibold text-zinc-900">
                  {progress.percent}
                  <span className="text-sm">%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress.percent}%`,
                      background: "#3B6D11",
                    }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-zinc-400">
                  完了リーフ {progress.done} / 全リーフ {progress.total}
                </div>
              </div>

              <div className="rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] text-zinc-500">見積り達成率</div>
                {achievement ? (
                  <>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-zinc-900">
                        {achievement.ratio.toFixed(2)}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          achievement.ratio >= 1
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {achievement.ratio >= 1
                          ? `${Math.round((achievement.ratio - 1) * 100)}%速い`
                          : `${Math.round((1 - achievement.ratio) * 100)}%超過`}
                      </span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-zinc-400">
                      基準1.0＝見積りどおり ・ 対象 {achievement.count}件
                    </div>
                  </>
                ) : (
                  <div className="mt-0.5 text-sm text-zinc-400">
                    未計測（見積り・実績つきの完了タスクなし）
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-[11px] text-zinc-500">生産性（補助）</div>
                {teamProductivity != null ? (
                  <>
                    <div className="mt-0.5 flex items-baseline gap-2">
                      <span className="text-xl font-semibold text-zinc-900">
                        {teamProductivity.toFixed(1)}
                      </span>
                      <span className="text-xs text-zinc-500">pt/時</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-zinc-400">
                      比較相手を蓄積中（非AIの基準値）・ 単体では評価しない
                    </div>
                  </>
                ) : (
                  <div className="mt-0.5 text-sm text-zinc-400">
                    未計測（実績つきの完了タスクなし）
                  </div>
                )}
              </div>
            </div>

            {/* Risk summary tiles (moved from the tasks page) */}
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

            {/* Per-feature progress with delay badges */}
            <FeatureProgress tasks={tasks} labelById={labelById} />

            <p className="mt-2 text-[11px] text-zinc-400">
              ※ ここに表示されるのはチーム・機能単位の集計のみです。個人単位の生産性は表示されません。これらの指標は業務運営・負担調整のためのもので、査定（人事評価）目的では利用しません。
            </p>
          </>
        )}
      </main>
    </div>
  );
}
