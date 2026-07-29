"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  buildTaskTree,
  listTasks,
  resolveAssigneeLabel,
  type Task,
} from "@/lib/tasks";
import { listMembers, memberLabel, type Member } from "@/lib/members";
import {
  daysSince,
  groupNotesByFeature,
  listTaskNotes,
  noteAge,
  noteAuthorLabel,
  noteSummary,
  NOTE_STALE_DAYS,
  OWNER_NONE,
  setNoteResolved,
  summarizeNoteBody,
  type CrossViewNote,
  type NoteSort,
  type OwnerFilter,
  type TaskNote,
} from "@/lib/taskNotes";
import ForestBackground from "@/components/ForestBackground";

/**
 * 懸念メモ 横断一覧 (/tasks/notes)。
 *
 * 未対応の懸念を案件横断で集め、機能（親タスク）ごとにまとめて「放置が長い順」に出す。
 * 目的は品質タブのような振り返りではなく、**拾い漏れの発見**。そのため
 * 主数字は「未対応」で、対応済みにすると一覧からも数字からも消える。
 *
 * 既定は「自分が担当のもの」。まず自分の宿題を見せ、全体を見たいときだけ切り替える。
 */
export default function NotesCrossViewPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [myId, setMyId] = useState<string | null>(null);
  /** 自分のIDが分かるまでは絞り込みを決められないので、確定するまで待つ。 */
  const [ownerReady, setOwnerReady] = useState(false);
  const [owner, setOwner] = useState<OwnerFilter>(null);
  const [minDays, setMinDays] = useState(0);
  const [sort, setSort] = useState<NoteSort>("age");
  const [openFeature, setOpenFeature] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // 自分のIDを取ってから既定の絞り込みを「自分」にする。
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        const uid = data.session?.user?.id ?? null;
        setMyId(uid);
        setOwner(uid);
        setOwnerReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setOwnerReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    listTasks()
      .then((list) => {
        if (!alive) return;
        setTasks(list);
        // メモはタスクIDで引くので、タスクを読み終えてから取得する。
        return listTaskNotes(list.map((t) => t.id)).then((rows) => {
          if (alive) setNotes(rows);
        });
      })
      .catch((err) => {
        if (!alive) return;
        console.error(err);
        setError("懸念メモを読み込めませんでした。");
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
  }, [reloadKey]);

  const labelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const mem of members) m.set(mem.id, memberLabel(mem));
    return m;
  }, [members]);

  // 生のメモ行を、一覧に必要な形（作業名・機能名・担当者・経過日数）へ組み立てる。
  const rows = useMemo<CrossViewNote[]>(() => {
    const taskById = new Map(tasks.map((t) => [t.id, t]));
    const parentOf = new Map<string, Task>();
    for (const node of buildTaskTree(tasks)) {
      for (const child of node.children) parentOf.set(child.id, node.task);
    }
    return notes
      .filter((n) => !n.resolved)
      .map((n) => {
        const task = taskById.get(n.task_id);
        const parent = parentOf.get(n.task_id);
        return {
          note: n,
          taskId: n.task_id,
          taskTitle: task?.title ?? "（削除された作業）",
          featureId: parent?.id ?? null,
          featureTitle: parent?.title ?? "（親なし）",
          assigneeId: task?.assignee_id ?? null,
          assigneeLabel: task ? resolveAssigneeLabel(task, labelById) : null,
          authorLabel: noteAuthorLabel(n, labelById),
          days: daysSince(n.created_at),
        };
      });
  }, [notes, tasks, labelById]);

  const summary = useMemo(() => noteSummary(rows, owner), [rows, owner]);

  const groups = useMemo(() => {
    const filtered = rows.filter((r) => {
      if (owner === OWNER_NONE && r.assigneeId !== null) return false;
      if (owner && owner !== OWNER_NONE && r.assigneeId !== owner) return false;
      return r.days >= minDays;
    });
    return groupNotesByFeature(filtered, sort);
  }, [rows, owner, minDays, sort]);

  const scopeLabel =
    owner === null
      ? "全員"
      : owner === OWNER_NONE
        ? "担当者なし"
        : owner === myId
          ? `${labelById.get(owner) ?? "自分"}（自分）`
          : (labelById.get(owner) ?? "不明");

  const handleResolve = (id: string) => {
    setBusy(id);
    setNoteResolved(id, true)
      .then(() => setReloadKey((k) => k + 1))
      .catch((err) => {
        console.error(err);
        setError("対応済みにできませんでした。");
      })
      .finally(() => setBusy(null));
  };

  const badgeClass = (days: number) => {
    const age = noteAge(days);
    if (age === "stale") return "bg-red-100 text-red-800";
    if (age === "warn") return "bg-amber-100 text-amber-800";
    return "bg-zinc-100 text-zinc-500";
  };
  const countClass = (days: number) => {
    const age = noteAge(days);
    if (age === "stale") return "text-red-600";
    if (age === "warn") return "text-amber-700";
    return "text-zinc-800";
  };

  const tiles = [
    { label: "未対応", n: summary.open, color: "#18181b" },
    { label: `${NOTE_STALE_DAYS}日以上放置`, n: summary.stale, color: "#E24B4A" },
    { label: "担当者なし", n: summary.unassigned, color: "#BA7517" },
  ];

  return (
    <div className="relative flex-1">
      <ForestBackground />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">懸念</h1>
          <Link
            href="/tasks"
            className="text-sm hover:underline"
            style={{ color: "#3B6D11" }}
          >
            ← 進捗管理に戻る
          </Link>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {!loaded || !ownerReady ? (
          <p className="text-sm text-zinc-400">読み込み中…</p>
        ) : (
          <>
            <div className="mb-1.5 text-[11px] text-zinc-500">
              集計対象：
              <span className="font-medium text-zinc-700">{scopeLabel}</span>
              <span className="ml-1 text-zinc-400">
                （「担当者なし」だけは常に全体の件数）
              </span>
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {tiles.map((t) => (
                <div
                  key={t.label}
                  className="rounded-lg bg-white px-3 py-2 shadow-sm ring-1 ring-black/5"
                >
                  <div
                    className="text-xl font-semibold"
                    style={{ color: t.n > 0 ? t.color : "#d4d4d8" }}
                  >
                    {t.n}
                  </div>
                  <div className="text-[11px] text-zinc-500">{t.label}</div>
                </div>
              ))}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <select
                value={owner ?? ""}
                onChange={(e) => setOwner(e.target.value || null)}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[13px] text-zinc-700"
              >
                {myId && (
                  <option value={myId}>
                    担当者：{labelById.get(myId) ?? "自分"}（自分）
                  </option>
                )}
                <option value="">担当者：すべて</option>
                {members
                  .filter((m) => m.id !== myId)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      担当者：{memberLabel(m)}
                    </option>
                  ))}
                <option value={OWNER_NONE}>担当者：なし</option>
              </select>
              <select
                value={minDays}
                onChange={(e) => setMinDays(Number(e.target.value))}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[13px] text-zinc-700"
              >
                <option value={0}>経過：すべて</option>
                <option value={3}>3日以上</option>
                <option value={7}>7日以上</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as NoteSort)}
                className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-[13px] text-zinc-700"
              >
                <option value="age">並び：放置が長い順</option>
                <option value="count">未対応が多い順</option>
                <option value="name">機能名順</option>
              </select>
              <span className="ml-auto text-[11px] text-zinc-500">
                機能名をクリックで明細／明細をクリックで該当タスクへ移動
              </span>
            </div>

            {groups.length === 0 ? (
              <p className="rounded-xl bg-white px-4 py-6 text-center text-sm text-zinc-400 shadow-sm ring-1 ring-black/5">
                条件に合う未対応の懸念はありません。
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                {/* table-fixed: 列幅を見出し行だけで決める。auto のままだと明細の
                    本文の長さで表全体が横に伸び、右端の列が見切れる。 */}
                <table className="w-full min-w-[520px] table-fixed text-sm">
                  <thead>
                    <tr className="bg-zinc-50 text-left text-[11px] text-zinc-500">
                      <th className="px-4 py-2 font-medium">機能</th>
                      <th className="w-20 px-3 py-2 text-center font-medium">
                        未対応
                      </th>
                      <th className="w-24 px-3 py-2 text-center font-medium">
                        最長放置
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((g) => {
                      const open = openFeature === g.key;
                      return (
                        <tr
                          key={g.key}
                          className="border-t border-zinc-100 align-top"
                        >
                          <td colSpan={3} className="p-0">
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => setOpenFeature(open ? null : g.key)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setOpenFeature(open ? null : g.key);
                              }}
                              className="flex cursor-pointer items-center hover:bg-zinc-50"
                            >
                              <span className="flex-1 truncate px-4 py-2 text-zinc-800">
                                <span className="mr-1.5 text-[10px] text-zinc-400">
                                  {open ? "▾" : "▸"}
                                </span>
                                {g.name}
                              </span>
                              <span
                                className={`w-20 px-3 py-2 text-center font-medium ${countClass(g.maxDays)}`}
                              >
                                {g.count}
                              </span>
                              <span className="w-24 px-3 py-2 text-center">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[11px] ${badgeClass(g.maxDays)}`}
                                >
                                  {g.maxDays}日
                                </span>
                              </span>
                            </div>

                            {open &&
                              g.items.map((r) => (
                                <Link
                                  key={r.note.id}
                                  href={`/tasks?task=${r.taskId}`}
                                  className="flex items-start gap-2.5 border-t border-zinc-100 bg-zinc-50/70 py-2 pl-8 pr-4 hover:bg-[#f0f4ea]"
                                >
                                  <span
                                    className={`mt-0.5 flex-none rounded px-1.5 py-0.5 text-[11px] ${badgeClass(r.days)}`}
                                  >
                                    {r.days}日
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-zinc-800">
                                      {r.taskTitle}
                                      {/* 記録者→担当者は薄いと読めないという指摘を受けて黒寄りにしている。 */}
                                      <span className="ml-1.5 text-[11px] text-zinc-700">
                                        ／ {r.authorLabel} →{" "}
                                        {r.assigneeLabel ?? (
                                          <span className="text-amber-700">
                                            担当者なし
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                    <span
                                      className="block truncate text-xs text-zinc-600"
                                      title={r.note.body}
                                    >
                                      {summarizeNoteBody(r.note.body)}
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    disabled={busy === r.note.id}
                                    onClick={(e) => {
                                      // 行のリンクへ伝播させない（対応済みは移動ではない）。
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleResolve(r.note.id);
                                    }}
                                    className="flex-none rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700 hover:border-[#639922] hover:bg-[#f0f4ea] disabled:opacity-50"
                                  >
                                    {busy === r.note.id ? "…" : "対応済み"}
                                  </button>
                                </Link>
                              ))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
