"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  leafProgress,
  listTasks,
  TASK_TYPE_META,
  TASK_TYPE_ORDER,
  type Task,
  type TaskType,
} from "@/lib/tasks";
import {
  buildWorkItems,
  completedWithin,
  completionsPerPersonDay,
  distinctFeatures,
  filterWorkItems,
  latestDelta,
  monthlyEfficiencyTrend,
  weekWindow,
  weeklyEfficiencyTrend,
  workEfficiency,
  type TrendPoint,
} from "@/lib/productivity";
import { getPersonDayHours } from "@/lib/settings";
import { useAuth } from "@/components/AuthProvider";
import ForestBackground from "@/components/ForestBackground";

// Whole days from today until a due date (UTC day granularity). Negative =
// overdue. Same rule as the tasks page.
function dueDiffDays(due: string): number {
  const [y, m, d] = due.split("-").map(Number);
  const dueMs = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((dueMs - todayMs) / 86_400_000);
}

// Format a possibly-fractional hour count without a trailing ".0".
function fmtHours(h: number): string {
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

type Scope = "team" | "self";

/**
 * ダッシュボード (/tasks/dashboard): チーム全体の「見る」画面。
 * 上段＝進捗率・リスク・機能別（チーム共通）。下段＝生産性セクション（工数効率A /
 * 1人日あたり完了数B / 週月の推移 / 作業一覧＋絞り込み）で、全体・本人タブで切替。
 * 非評価原則：個人のAは本人のみ。管理者にも個人Aは出さない（第15章）。
 */
export default function DashboardPage() {
  const { session } = useAuth();
  const myId = session?.user?.id ?? null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [personDayHours, setPersonDayHours] = useState(8);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();

  // 生産性セクションのタブ・絞り込み。
  const [scope, setScope] = useState<Scope>("team");
  const [filterFeature, setFilterFeature] = useState("");
  const [filterStep, setFilterStep] = useState<TaskType | "">("");
  const [baseDate] = useState(() => new Date());

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError("タスクの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));
    getPersonDayHours()
      .then(setPersonDayHours)
      .catch((err) => console.error("人日換算係数の読み込みに失敗:", err));
  }, []);

  const progress = useMemo(() => leafProgress(tasks), [tasks]);

  // At-a-glance risk across all incomplete tasks (team-wide, same rule as list).
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

  // --- 生産性セクション（タブ＝scope でスコープ、機能/工程で絞り込み） ---
  const allItems = useMemo(() => buildWorkItems(tasks), [tasks]);
  const scopedItems = useMemo(
    () =>
      scope === "self" ? allItems.filter((w) => w.assigneeId === myId) : allItems,
    [allItems, scope, myId],
  );

  // A・B・作業一覧は「今週 完了したリーフ」を対象。推移は履歴なので別（scoped 全体）。
  const thisWeek = useMemo(
    () => completedWithin(scopedItems, weekWindow(baseDate)),
    [scopedItems, baseDate],
  );
  const isFiltered = !!(filterFeature || filterStep);
  const filteredWeek = useMemo(
    () => filterWorkItems(thisWeek, { feature: filterFeature, step: filterStep }),
    [thisWeek, filterFeature, filterStep],
  );

  const efficiency = useMemo(() => workEfficiency(filteredWeek), [filteredWeek]);
  const perPersonDay = useMemo(
    () => completionsPerPersonDay(thisWeek, personDayHours),
    [thisWeek, personDayHours],
  );
  const weekly = useMemo(
    () => weeklyEfficiencyTrend(scopedItems, baseDate, 4),
    [scopedItems, baseDate],
  );
  const monthly = useMemo(
    () => monthlyEfficiencyTrend(scopedItems, baseDate, 3),
    [scopedItems, baseDate],
  );
  const delta = useMemo(() => latestDelta(weekly), [weekly]);
  const featureOptions = useMemo(() => distinctFeatures(thisWeek), [thisWeek]);

  function clearFilters() {
    setFilterFeature("");
    setFilterStep("");
  }

  const selectClass =
    "rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-800 outline-none focus:border-zinc-500";

  return (
    <div className="relative flex-1">
      <ForestBackground />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
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
            {/* 進捗率＋リスクを1行に（進捗率が左に浮かないようバランス）。
                機能別進捗は進捗管理ページへ移動。 */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-6">
              <div className="col-span-2 rounded-lg bg-white px-4 py-2.5 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">進捗率（主指標）</span>
                  <span className="text-[11px] text-zinc-400">
                    完了 {progress.done} / {progress.total}
                  </span>
                </div>
                <div className="mt-0.5 text-xl font-semibold text-zinc-900">
                  {progress.percent}
                  <span className="text-sm">%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${progress.percent}%`, background: "#3B6D11" }}
                  />
                </div>
              </div>
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

            {/* ===== 生産性セクション（全体/本人タブ） ===== */}
            <div className="mb-3 mt-8 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                生産性（工数効率）
              </h2>
              <div className="flex rounded-lg bg-zinc-100 p-0.5 text-xs">
                {(
                  [
                    ["team", "チーム全体"],
                    ["self", "本人"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setScope(key)}
                    className={`rounded-md px-3 py-1 font-medium transition ${
                      scope === key
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {scope === "self" && (
              <p className="mb-3 rounded-lg bg-[#EAF3DE] px-3 py-2 text-[11px] text-[#27500A]">
                ※ この数字は自分の担当分だけです。あなたにだけ見えており、評価（査定）には使いません。
              </p>
            )}

            {/* A / B カード */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className="rounded-xl bg-white px-4 py-3 shadow-sm"
                style={{ border: "2px solid #97C459" }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3B6D11] text-[10px] font-medium text-white">
                    主
                  </span>
                  <span className="text-sm text-zinc-800">A. 工数効率</span>
                </div>
                {efficiency ? (
                  <>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-zinc-900">
                        {efficiency.ratio.toFixed(2)}
                      </span>
                      {!isFiltered && delta != null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            delta >= 1
                              ? "bg-[#EAF3DE] text-[#3B6D11]"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {delta >= 1 ? "▲前週比 +" : "▼前週比 -"}
                          {Math.round(Math.abs(delta - 1) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-1.5 text-[11px] text-zinc-500">
                      完了{efficiency.count}件：見積{fmtHours(efficiency.est)}h ÷ 実績
                      {fmtHours(efficiency.act)}h（完了タスク基準）
                      {isFiltered && " ・絞り込み中"}
                    </div>
                  </>
                ) : (
                  <div className="mt-1.5 text-sm text-zinc-400">
                    未計測（今週、見積・実績つきの完了作業なし）
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-800">
                    B. 1人日あたり完了数{" "}
                    <span className="text-[11px] text-zinc-400">（参考）</span>
                  </span>
                  <Link
                    href="/tasks/settings"
                    className="text-[11px] text-zinc-400 hover:underline"
                  >
                    人日換算 {personDayHours}h ⚙
                  </Link>
                </div>
                {perPersonDay ? (
                  <>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-zinc-900">
                        {perPersonDay.value.toFixed(1)}
                      </span>
                      <span className="text-xs text-zinc-500">件/人日</span>
                    </div>
                    <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-1.5 text-[11px] text-zinc-500">
                      完了{perPersonDay.count}件 ÷ {perPersonDay.personDays.toFixed(1)}
                      人日
                    </div>
                  </>
                ) : (
                  <div className="mt-1.5 text-sm text-zinc-400">
                    未計測（今週、実績つきの完了作業なし）
                  </div>
                )}
              </div>
            </div>

            {/* 週 / 月 の推移 */}
            <div className="mb-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TrendCard title="週の推移（工数効率・直近4週）" points={weekly} />
              <TrendCard title="月の推移（工数効率・直近3ヶ月）" points={monthly} />
            </div>
            <p className="mb-4 text-[11px] text-zinc-400">
              ※ 推移は「{scope === "self" ? "本人" : "チーム全体"}
              」の履歴（完了日基準）。機能・工程の絞り込みには連動しません。n＝集計に使った件数。
            </p>

            {/* 今週の作業一覧＋絞り込み */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-800">
                今週の作業一覧
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={filterFeature}
                  onChange={(e) => setFilterFeature(e.target.value)}
                  className={selectClass}
                >
                  <option value="">機能：すべて</option>
                  {featureOptions.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStep}
                  onChange={(e) => setFilterStep(e.target.value as TaskType | "")}
                  className={selectClass}
                >
                  <option value="">工程：すべて</option>
                  {TASK_TYPE_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {TASK_TYPE_META[t].label}
                    </option>
                  ))}
                </select>
                {isFiltered && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border border-zinc-300 px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-[11px] text-zinc-500">
                    <th className="px-4 py-2 font-medium">作業</th>
                    <th className="px-3 py-2 font-medium">機能</th>
                    <th className="px-3 py-2 font-medium">工程</th>
                    <th className="px-3 py-2 text-right font-medium">見積</th>
                    <th className="px-3 py-2 text-right font-medium">実績</th>
                    <th className="px-4 py-2 text-right font-medium">効率</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWeek.map((w) => {
                    const eff =
                      w.estimated && w.actual && w.actual > 0
                        ? w.estimated / w.actual
                        : null;
                    return (
                      <tr key={w.id} className="border-t border-zinc-100">
                        <td className="px-4 py-2 text-zinc-800">{w.name}</td>
                        <td className="px-3 py-2 text-[#3B6D11]">{w.feature}</td>
                        <td className="px-3 py-2 text-[#185FA5]">{w.stepLabel}</td>
                        <td className="px-3 py-2 text-right text-zinc-500">
                          {w.estimated != null ? `${fmtHours(w.estimated)}h` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right text-zinc-500">
                          {w.actual != null ? `${fmtHours(w.actual)}h` : "—"}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            eff == null
                              ? "text-zinc-300"
                              : eff >= 1
                                ? "text-[#3B6D11]"
                                : "text-red-700"
                          }`}
                        >
                          {eff == null ? "—" : eff.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredWeek.length === 0 && (
                <p className="px-4 py-4 text-center text-xs text-zinc-400">
                  今週 完了した作業がありません。
                </p>
              )}
            </div>

            <p className="mt-2 text-[11px] text-zinc-400">
              ※ 機能・工程で絞ると上の「A. 工数効率」と対象件数も同じ範囲で再計算されます。これらの指標は業務運営・負担調整のためのもので、査定（人事評価）には利用しません。
            </p>
          </>
        )}
      </main>
    </div>
  );
}

// 工数効率の推移カード（自前CSS棒グラフ・最新だけ緑・n併記・n<3は前週比を断定しない）。
function TrendCard({ title, points }: { title: string; points: TrendPoint[] }) {
  const MAX = 1.3; // 基準線（見た目の上限）
  const H = 90;
  return (
    <div className="rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
      <div className="mb-2 text-[11px] text-zinc-400">{title}</div>
      <div
        className="flex items-end justify-around border-t border-dashed border-zinc-200"
        style={{ height: H + 8 }}
      >
        {points.map((p, i) => {
          const last = i === points.length - 1;
          // 上限でクランプ（異常値でも棒が枠を突き抜けないように）。MAX超は「▲振り切れ」で示す。
          const capped = p.ratio != null && p.ratio > MAX;
          const h =
            p.ratio == null
              ? 4
              : Math.max(4, Math.min(H, Math.round((p.ratio / MAX) * H)));
          const over = p.ratio != null && p.ratio >= 1;
          const color =
            p.ratio == null
              ? "#E4E4DC"
              : last
                ? over
                  ? "#639922"
                  : "#EF9F27"
                : "#C7CDB8";
          return (
            <div key={p.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-zinc-500">
                {p.ratio == null ? "—" : p.ratio.toFixed(2)}
                {capped && <span className="text-red-500"> ▲</span>}
                {p.n > 0 && <span className="text-zinc-300"> n{p.n}</span>}
              </span>
              <div
                style={{
                  width: "60%",
                  maxWidth: 30,
                  height: h,
                  borderRadius: "4px 4px 0 0",
                  background: color,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-around">
        {points.map((p) => (
          <span
            key={p.label}
            className="flex-1 text-center text-[10px] text-zinc-400"
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
