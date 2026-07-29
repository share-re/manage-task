"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { buildTaskTree, listTasks, resolveAssigneeLabel, type Task } from "@/lib/tasks";
import { listMembers, memberLabel, type Member } from "@/lib/members";
import {
  findingAuthorLabel,
  listFindingsForStats,
  PHASE_META,
  PHASE_ORDER,
  qualityState,
  summarizeFindingBody,
  type FindingPhase,
  type TaskFinding,
} from "@/lib/taskFindings";
import ForestBackground from "@/components/ForestBackground";

/**
 * 品質 (/tasks/quality): テスト以降に見つかった不具合・指摘を工程別／機能別に数える画面。
 *
 * 数字は「発見総数」（対応済みも取り消し済みも含む）。直しても消しても減らないのが
 * 品質の物差しとしての要件なので、取得は listFindingsForStats（全件）を使う。
 * 「未対応」だけは別列として出す。
 */
export default function QualityPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [findings, setFindings] = useState<TaskFinding[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [openFeature, setOpenFeature] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listTasks()
      .then((list) => {
        if (!alive) return;
        setTasks(list);
        // 記録はタスクIDで引くので、タスクを読み終えてから取得する。
        return listFindingsForStats(list.map((t) => t.id)).then((f) => {
          if (alive) setFindings(f);
        });
      })
      .catch((err) => {
        if (!alive) return;
        console.error(err);
        setError("品質の記録を読み込めませんでした。");
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });
    listMembers()
      .then((m) => {
        if (alive) setMembers(m);
      })
      .catch((err) => console.error("メンバー一覧の読み込みに失敗:", err));
    return () => {
      alive = false;
    };
  }, []);

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, memberLabel(mem));
    return m;
  }, [members]);

  const taskById = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of tasks) m.set(t.id, t);
    return m;
  }, [tasks]);

  // 機能（親タスク）ごとに、配下リーフの記録を集める。親なしのリーフは「（親なし）」へ。
  const features = useMemo(() => {
    const findingsByTask = new Map<string, TaskFinding[]>();
    for (const f of findings) {
      const list = findingsByTask.get(f.task_id) ?? [];
      list.push(f);
      findingsByTask.set(f.task_id, list);
    }

    const tree = buildTaskTree(tasks);
    const rows: {
      key: string;
      name: string;
      counts: Record<FindingPhase, number>;
      total: number;
      unresolved: number;
      unchecked: boolean;
      items: { finding: TaskFinding; task: Task | undefined }[];
    }[] = [];

    const build = (
      key: string,
      name: string,
      leaves: Task[],
    ): (typeof rows)[number] | null => {
      const counts: Record<FindingPhase, number> = {
        test: 0,
        review: 0,
        accept: 0,
        post: 0,
      };
      const items: { finding: TaskFinding; task: Task | undefined }[] = [];
      let unresolved = 0;
      let unchecked = false;
      for (const leaf of leaves) {
        const list = findingsByTask.get(leaf.id) ?? [];
        for (const f of list) {
          counts[f.phase] += 1;
          if (!f.resolved && !f.deleted_at) unresolved += 1;
          items.push({ finding: f, task: taskById.get(f.task_id) });
        }
        // 「未確認」＝まだテスト結果を記録していないリーフを含む機能。
        if (qualityState(leaf.quality_checked_at, list.length) === "unchecked")
          unchecked = true;
      }
      const total = PHASE_ORDER.reduce((s, p) => s + counts[p], 0);
      if (total === 0 && !unchecked) return null;
      return { key, name, counts, total, unresolved, unchecked, items };
    };

    const standalone: Task[] = [];
    for (const node of tree) {
      if (node.children.length > 0) {
        const row = build(node.task.id, node.task.title, node.children);
        if (row) rows.push(row);
      } else {
        standalone.push(node.task);
      }
    }
    if (standalone.length > 0) {
      const row = build("__standalone__", "（親なし）", standalone);
      if (row) rows.push(row);
    }
    return rows;
  }, [tasks, findings, taskById]);

  const totalByPhase = useMemo(() => {
    const c: Record<FindingPhase, number> = {
      test: 0,
      review: 0,
      accept: 0,
      post: 0,
    };
    for (const f of findings) c[f.phase] += 1;
    return c;
  }, [findings]);

  const grandTotal = PHASE_ORDER.reduce((s, p) => s + totalByPhase[p], 0);
  const canceled = findings.filter((f) => f.deleted_at).length;

  return (
    <div className="relative flex-1">
      <ForestBackground />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">品質</h1>
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
            {/* 工程別タイル（発見総数） */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PHASE_ORDER.map((p) => {
                const n = totalByPhase[p];
                return (
                  <div
                    key={p}
                    className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/5"
                  >
                    <div
                      className="text-xl font-semibold"
                      style={{ color: n > 0 ? PHASE_META[p].color : "#d4d4d8" }}
                    >
                      {n}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {PHASE_META[p].tileLabel}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* どの工程で見つかったか（割合バー） */}
            {grandTotal > 0 && (
              <div className="mb-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5">
                <div className="text-sm font-semibold text-zinc-800">
                  どの工程で見つかっているか
                </div>
                <p className="mb-2.5 mt-0.5 text-[11px] text-zinc-400">
                  右にいくほど「後の工程まで漏れた」＝手戻りが大きい
                </p>
                <div className="mb-2.5 flex h-3.5 overflow-hidden rounded-full bg-zinc-100">
                  {PHASE_ORDER.map((p) => {
                    const n = totalByPhase[p];
                    if (n === 0) return null;
                    return (
                      <div
                        key={p}
                        style={{
                          width: `${(n / grandTotal) * 100}%`,
                          background: PHASE_META[p].color,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-3.5 text-xs text-zinc-600">
                  {PHASE_ORDER.map((p) => (
                    <span key={p} className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: PHASE_META[p].color }}
                      />
                      {PHASE_META[p].label} {totalByPhase[p]}件（
                      {Math.round((totalByPhase[p] / grandTotal) * 100)}%）
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 機能別の内訳 */}
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-zinc-800">
                機能別の内訳
              </span>
              <span className="text-[11px] text-zinc-500">
                機能名をクリックで明細（対象の作業／見つけた人 → 担当者）
              </span>
            </div>

            {features.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-zinc-400 shadow-sm ring-1 ring-black/5">
                まだ記録がありません。進捗管理のタスク行にある「品質」から追加できます。
              </p>
            ) : (
              // 7列あるので狭い画面でははみ出す。潰さずに横スクロールさせる。
              <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                {/* table-fixed: 列幅を見出し行だけで決める。auto のままだと明細の
                    本文の長さで表全体が横に伸び、右端の列が見切れる。 */}
                <table className="w-full min-w-[640px] table-fixed text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-left text-[11px] text-zinc-500">
                      <th className="px-4 py-2 font-medium">機能</th>
                      {PHASE_ORDER.map((p) => (
                        <th
                          key={p}
                          className="w-20 px-3 py-2 text-center font-medium"
                        >
                          {PHASE_META[p].label}
                        </th>
                      ))}
                      <th className="w-16 px-3 py-2 text-center font-medium">
                        計
                      </th>
                      <th className="w-20 px-4 py-2 text-center font-medium">
                        未対応
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((f) => {
                      const open = openFeature === f.key;
                      return (
                        <Fragment key={f.key}>
                          <tr
                            className="cursor-pointer border-t border-zinc-100 hover:bg-zinc-50"
                            onClick={() => setOpenFeature(open ? null : f.key)}
                          >
                            <td className="px-4 py-2 text-zinc-800">
                              <span className="mr-1.5 text-[10px] text-zinc-400">
                                {open ? "▾" : "▸"}
                              </span>
                              {f.name}
                              {f.unchecked && (
                                <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                                  未確認
                                </span>
                              )}
                            </td>
                            {PHASE_ORDER.map((p) => (
                              <td
                                key={p}
                                className="px-3 py-2 text-center font-medium"
                                style={{
                                  color:
                                    f.counts[p] > 0
                                      ? PHASE_META[p].color
                                      : "#d4d4d8",
                                }}
                              >
                                {f.counts[p]}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-center font-semibold text-zinc-800">
                              {f.total}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {f.unresolved > 0 ? (
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                                  {f.unresolved}
                                </span>
                              ) : (
                                <span className="text-[11px] text-green-700">
                                  ✓
                                </span>
                              )}
                            </td>
                          </tr>

                          {open && (
                            <tr>
                              <td
                                colSpan={PHASE_ORDER.length + 3}
                                className="bg-zinc-50 px-4 py-2"
                              >
                                {f.items.length === 0 ? (
                                  <p className="py-2 text-xs text-zinc-400">
                                    記録はありません（未確認の作業があります）。
                                  </p>
                                ) : (
                                  <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
                                    {f.items.map(({ finding, task }, k) => (
                                      <Link
                                        key={finding.id}
                                        href={`/tasks?task=${finding.task_id}`}
                                        // 一覧は短縮表示なので、全文はツールチップで読めるようにする。
                                        title={`${finding.body}\n\n（クリックで進捗管理の該当タスクへ移動）`}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-zinc-50 ${
                                          k > 0 ? "border-t border-zinc-100" : ""
                                        }`}
                                      >
                                        <span
                                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${PHASE_META[finding.phase].badgeClass}`}
                                        >
                                          {PHASE_META[finding.phase].label}
                                        </span>
                                        {/* 本文は改行入りで数百字書けるので、一覧では
                                            短縮して出す（表が本文の長さに引きずられて
                                            横に伸びるのを防ぐ）。全文は title で読める。 */}
                                        <span
                                          className={`min-w-0 flex-1 truncate ${
                                            finding.resolved || finding.deleted_at
                                              ? "text-zinc-400 line-through"
                                              : "text-zinc-800"
                                          }`}
                                        >
                                          {summarizeFindingBody(finding.body)}
                                        </span>
                                        {/* 作業名だけでは何の機能か分からないので「親 › 子」で出す。
                                            タスク名が長い場合も表が伸びないよう幅を決めて省略する。 */}
                                        <span className="w-44 shrink-0 truncate text-[11px] text-zinc-500">
                                          {f.name}{" "}
                                          <span className="text-zinc-300">›</span>{" "}
                                          {task?.title ?? "（削除された作業）"}
                                        </span>
                                        {/* 誰から誰へ：記録者 → その作業の現在の担当者。
                                            名前が長くても見切れないよう幅を決めて省略する。 */}
                                        <span className="w-32 shrink-0 truncate text-[11px] text-zinc-800">
                                          {findingAuthorLabel(finding, labelById)}{" "}
                                          <span className="text-zinc-400">→</span>{" "}
                                          {task
                                            ? (resolveAssigneeLabel(
                                                task,
                                                labelById,
                                              ) ?? "担当なし")
                                            : "—"}
                                        </span>
                                        <span className="w-12 shrink-0 text-right text-[10px]">
                                          {finding.deleted_at ? (
                                            <span className="text-zinc-400">
                                              取消
                                            </span>
                                          ) : finding.resolved ? (
                                            <span className="text-green-700">
                                              対応済
                                            </span>
                                          ) : (
                                            <span className="text-red-700">
                                              未対応
                                            </span>
                                          )}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <p className="mt-2 text-[11px] text-zinc-400">
              ※ 件数は「発見総数」（対応済み・取り消し済みも含む）。直しても消しても減りません。
              {canceled > 0 && `（うち取り消し ${canceled}件）`}
              「未確認」＝まだテスト結果を記録していない作業を含む機能。
              これらは品質改善のための記録であり、個人の評価には利用しません。
            </p>
          </>
        )}
      </main>
    </div>
  );
}
