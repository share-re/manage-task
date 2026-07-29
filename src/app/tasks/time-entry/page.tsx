"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listTasks, type Task } from "@/lib/tasks";
import { buildWorkItems } from "@/lib/productivity";
import { listTimeLogs, setDayHours, type TaskTimeLog } from "@/lib/timeLogs";
import { useAuth } from "@/components/AuthProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import ForestBackground from "@/components/ForestBackground";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
// Shift an ISO date (YYYY-MM-DD) by whole days, returning ISO.
function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
// "2026/07/22（水）"
function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${y}/${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}（${wd}）`;
}
function fmtHours(h: number): string {
  return h % 1 === 0 ? String(h) : h.toFixed(1);
}

type Row = { hours: string; note: string };

// 自分のログ配列を、行入力（next）と読み込み時点の時間（base）に落とす純粋関数。
function logsToRows(
  logs: TaskTimeLog[],
  memberId: string | null,
): { next: Record<string, Row>; base: Record<string, number> } {
  const mine = logs.filter((l) => !memberId || l.member_id === memberId);
  const next: Record<string, Row> = {};
  const base: Record<string, number> = {};
  for (const l of mine) {
    next[l.task_id] = { hours: fmtHours(l.hours), note: l.note ?? "" };
    base[l.task_id] = l.hours;
  }
  return { next, base };
}

/**
 * 工数入力 (/tasks/time-entry): 日付を選び、タスクをプルダウンで選んで行を足し、
 * その日の作業時間をまとめて入力する（第15章）。保存すると実績に加算される。
 * 同じタスク×日付は上書き（setDayHours）なので、保存し直しても二重計上されない。
 */
export default function TimeEntryPage() {
  const { session } = useAuth();
  const memberId = session?.user?.id ?? null;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);

  const [workDate, setWorkDate] = useState(todayIso);
  const [today] = useState(todayIso);
  // 表示中の行（タスクID）。その日の既存ログ＋プルダウンで足した分。
  const [rowIds, setRowIds] = useState<string[]>([]);
  const [picked, setPicked] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  // 削除確認モーダルの対象（保存済みの行のみ）。
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  // taskId -> {hours, note} 入力値。baseline は読み込み時点の時間（保存対象の絞り込み用）。
  const [inputs, setInputs] = useState<Record<string, Row>>({});
  const [baseline, setBaseline] = useState<Record<string, number>>({});

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((err) => {
        console.error(err);
        setError("タスクの読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));
  }, []);

  const workItems = useMemo(() => buildWorkItems(tasks), [tasks]);
  // プルダウンの選択肢：未完了のリーフのうち「自分の担当」＋「担当なし」。
  // 工数は自分の作業を記録する画面なので他人の担当は出さない（担当なしは
  // このアプリが許容しているので拾う）。
  const selectable = useMemo(
    () =>
      workItems.filter(
        (w) =>
          w.status !== "done" &&
          (w.assigneeId === memberId || w.assigneeId == null),
      ),
    [workItems, memberId],
  );
  const itemById = useMemo(() => {
    const m = new Map<string, (typeof workItems)[number]>();
    for (const w of workItems) m.set(w.id, w);
    return m;
  }, [workItems]);

  // 日付を変えたら、その日の自分のログを読み込んで行を復元する。
  useEffect(() => {
    let alive = true;
    listTimeLogs({ from: workDate, to: workDate })
      .then((logs) => {
        if (!alive) return;
        const { next, base } = logsToRows(logs, memberId);
        setInputs(next);
        setBaseline(base);
        setRowIds(Object.keys(base));
        setPicked("");
      })
      .catch((err) => {
        console.error("工数ログの読み込みに失敗:", err);
        setError("その日の入力の読み込みに失敗しました。");
      });
    return () => {
      alive = false;
    };
  }, [workDate, memberId]);

  function setRow(taskId: string, patch: Partial<Row>) {
    setInputs((prev) => {
      const cur = prev[taskId] ?? { hours: "", note: "" };
      return { ...prev, [taskId]: { ...cur, ...patch } };
    });
  }

  function addRow() {
    if (!picked || rowIds.includes(picked)) return;
    setRowIds((prev) => [...prev, picked]);
    setPicked("");
  }

  /** 行を画面から外すだけ（DBには触らない）。 */
  function dropRow(taskId: string) {
    setRowIds((prev) => prev.filter((id) => id !== taskId));
    setInputs((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }

  /**
   * × を押したとき。未保存の行はそのまま外す。保存済みの行は確認モーダルを開く
   * （メモ削除・タスク削除と同じ体裁）。
   */
  function requestRemoveRow(taskId: string) {
    if ((baseline[taskId] ?? 0) > 0) setRemoveTarget(taskId);
    else dropRow(taskId);
  }

  /** 保存済みの行を削除：hours=0 で setDayHours ＝ ログ削除＋実績の再計算。 */
  async function confirmRemoveRow() {
    const taskId = removeTarget;
    if (!taskId) return;
    setRemoveTarget(null);
    setRemovingId(taskId);
    setError(undefined);
    setMessage(undefined);
    try {
      await setDayHours({ taskId, workDate, memberId, hours: 0 });
      setBaseline((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      dropRow(taskId);
      setMessage("入力を削除しました。");
    } catch (err) {
      console.error(err);
      setError("削除に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setRemovingId(null);
    }
  }

  const dayTotal = useMemo(
    () =>
      rowIds.reduce((sum, id) => {
        const h = Number(inputs[id]?.hours);
        return sum + (Number.isFinite(h) && h > 0 ? h : 0);
      }, 0),
    [rowIds, inputs],
  );

  // 前日の自分のログを、今日の入力欄にコピーする（未保存）。
  async function copyPrevDay() {
    setError(undefined);
    setMessage(undefined);
    try {
      const prev = shiftIso(workDate, -1);
      const logs = await listTimeLogs({ from: prev, to: prev });
      const mine = logs.filter((l) => !memberId || l.member_id === memberId);
      if (mine.length === 0) {
        setMessage("前日の入力はありませんでした。");
        return;
      }
      setInputs((cur) => {
        const next = { ...cur };
        for (const l of mine) {
          next[l.task_id] = { hours: fmtHours(l.hours), note: l.note ?? "" };
        }
        return next;
      });
      setRowIds((cur) => [
        ...cur,
        ...mine.map((l) => l.task_id).filter((id) => !cur.includes(id)),
      ]);
      setMessage("前日の入力をコピーしました（未保存）。");
    } catch (err) {
      console.error(err);
      setError("前日のコピーに失敗しました。");
    }
  }

  async function onSave() {
    setError(undefined);
    setMessage(undefined);
    // 変更のあった行だけ保存（現在値 !== 読み込み時の値）。
    const changed = rowIds.filter((id) => {
      const h = Number(inputs[id]?.hours) || 0;
      return h !== (baseline[id] ?? 0);
    });
    if (changed.length === 0) {
      setMessage("変更はありません。");
      return;
    }
    for (const id of changed) {
      const h = Number(inputs[id]?.hours);
      if (!Number.isFinite(h) || h < 0) {
        const name = itemById.get(id)?.name ?? "タスク";
        setError(`「${name}」の時間は0以上の数値で入力してください。`);
        return;
      }
    }
    setSaving(true);
    try {
      for (const id of changed) {
        await setDayHours({
          taskId: id,
          workDate,
          memberId,
          hours: Number(inputs[id]?.hours) || 0,
          note: inputs[id]?.note?.trim() || null,
        });
      }
      // 保存後に読み直して baseline を更新（0にした行はここで消える）。
      const logs = await listTimeLogs({ from: workDate, to: workDate });
      const { next, base } = logsToRows(logs, memberId);
      setInputs(next);
      setBaseline(base);
      setRowIds(Object.keys(base));
      setMessage(`${changed.length}件の実績を保存しました。`);
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  const numClass =
    "w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";
  const noteClass =
    "w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";
  const selectClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  return (
    <div className="relative flex-1">
      <ForestBackground />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">工数入力</h1>
          <Link
            href="/tasks"
            className="text-sm hover:underline"
            style={{ color: "#3B6D11" }}
          >
            ← 進捗管理に戻る
          </Link>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mb-3 text-sm text-[#3B6D11]">{message}</p>}

        <div className="rounded-2xl bg-white p-4 shadow-md ring-1 ring-black/5">
          {/* ヘッダー：説明＋日付ナビ */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-zinc-800">工数入力</div>
              <div className="text-[11px] text-zinc-400">
                タスクを選んで追加し、その日の時間を0.5h刻みで入れます。メモは任意。
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setWorkDate((d) => shiftIso(d, -1))}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
              >
                ‹ 前日
              </button>
              <span className="px-2 text-sm font-medium text-zinc-800">
                {prettyDate(workDate)}
              </span>
              <button
                type="button"
                onClick={() => setWorkDate((d) => shiftIso(d, 1))}
                disabled={workDate >= today}
                className="rounded-lg border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 disabled:opacity-40"
              >
                翌日 ›
              </button>
            </div>
          </div>

          {/* タスク選択（プルダウン）→ 行を追加 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select
              value={picked}
              onChange={(e) => setPicked(e.target.value)}
              aria-label="タスクを選ぶ"
              className={`${selectClass} min-w-0 flex-1`}
            >
              <option value="">タスクを選ぶ…</option>
              {selectable
                .filter((w) => !rowIds.includes(w.id))
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.feature} / {w.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={addRow}
              disabled={!picked}
              className="rounded-lg border border-[#3B6D11] px-3 py-2 text-sm font-medium text-[#3B6D11] hover:bg-[#EAF3DE] disabled:opacity-40"
            >
              ＋ 追加
            </button>
          </div>

          {/* 入力行 */}
          {!loaded ? (
            <p className="text-sm text-zinc-400">読み込み中…</p>
          ) : rowIds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
              上のプルダウンからタスクを選んで「＋ 追加」してください。
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-[11px] text-zinc-500">
                    <th className="px-3 py-2 font-medium">タスク</th>
                    <th className="w-20 px-3 py-2 text-center font-medium">
                      {workDate === today ? "今日" : "この日"}
                    </th>
                    <th className="px-3 py-2 font-medium">メモ（任意）</th>
                    <th className="w-8 px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rowIds.map((id, i) => {
                    const w = itemById.get(id);
                    const saved = (baseline[id] ?? 0) > 0;
                    return (
                      <tr
                        key={id}
                        className={i > 0 ? "border-t border-zinc-100" : ""}
                      >
                        <td className="px-3 py-2">
                          <div className="text-zinc-800">
                            {w?.name ?? "（不明なタスク）"}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {w?.feature ?? "—"} ・ 見積
                            {w?.estimated != null ? fmtHours(w.estimated) : 0}h/実績
                            {w?.actual != null ? fmtHours(w.actual) : 0}h
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={inputs[id]?.hours ?? ""}
                            onChange={(e) => setRow(id, { hours: e.target.value })}
                            placeholder="0"
                            className={numClass}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={inputs[id]?.note ?? ""}
                            onChange={(e) => setRow(id, { note: e.target.value })}
                            placeholder="（空でOK）"
                            className={noteClass}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => requestRemoveRow(id)}
                            disabled={removingId === id}
                            aria-label={saved ? "この日の入力を削除" : "この行を外す"}
                            title={saved ? "この日の入力を削除" : "この行を外す"}
                            className="rounded-full px-1.5 py-0.5 text-sm text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* フッター：合計＋操作 */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-zinc-600">
              {workDate === today ? "今日" : "この日"}の合計{" "}
              <span className="text-lg font-semibold text-[#3B6D11]">
                {fmtHours(dayTotal)}
              </span>{" "}
              h
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyPrevDay}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                前日をコピー
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving || rowIds.length === 0}
                className="rounded-lg bg-[#3B6D11] px-5 py-2 text-sm font-medium text-white hover:bg-[#2f5a0e] disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            ※ 行の × で削除できます（保存済みの入力は確認のうえ、その日の記録を消して実績を戻します）。
          </p>
        </div>
      </main>

      {/* 保存済みの入力を消すときの確認（メモ・タスク削除と同じ体裁） */}
      {removeTarget && (
        <ConfirmDialog
          title="この日の入力を削除しますか？"
          message={
            <>
              「{itemById.get(removeTarget)?.name ?? "この作業"}」の
              {prettyDate(workDate)}の入力を削除します。実績時間もその分戻ります。
            </>
          }
          busy={removingId === removeTarget}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={confirmRemoveRow}
        />
      )}
    </div>
  );
}
