"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listTasks, type Task } from "@/lib/tasks";
import { buildWorkItems, type WorkItem } from "@/lib/productivity";
import { listTimeLogs, setDayHours, type TaskTimeLog } from "@/lib/timeLogs";
import { useAuth } from "@/components/AuthProvider";
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
 * 工数入力 (/tasks/time-entry): 日付を選び、1タスク＝1行で「今日やった時間」をまとめて
 * 入力→保存すると実績に加算される（第15章）。同じタスク×日付は上書き（setDayHours）
 * なので、保存し直しても二重計上されない。
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
  // taskId -> {hours, note} 入力値。baseline は「読み込んだ時点の時間」で、保存対象の絞り込みに使う。
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

  // 入力対象の行：自分の担当の未完了リーフ。無ければ全未完了リーフにフォールバック。
  const workItems = useMemo(() => buildWorkItems(tasks), [tasks]);
  const incompleteLeaves = useMemo(
    () => workItems.filter((w) => w.status !== "done"),
    [workItems],
  );
  const rows = useMemo(() => {
    const mine = incompleteLeaves.filter((w) => w.assigneeId === memberId);
    return mine.length ? mine : incompleteLeaves;
  }, [incompleteLeaves, memberId]);
  const showingAll = useMemo(
    () =>
      incompleteLeaves.length > 0 &&
      incompleteLeaves.filter((w) => w.assigneeId === memberId).length === 0,
    [incompleteLeaves, memberId],
  );

  // 指定日の自分のログを読み込み、各行の入力欄に反映する（イベントからの再読込用）。
  async function reloadDay(date: string) {
    const logs = await listTimeLogs({ from: date, to: date });
    const { next, base } = logsToRows(logs, memberId);
    setInputs(next);
    setBaseline(base);
  }

  useEffect(() => {
    let alive = true;
    listTimeLogs({ from: workDate, to: workDate })
      .then((logs) => {
        if (!alive) return;
        const { next, base } = logsToRows(logs, memberId);
        setInputs(next);
        setBaseline(base);
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

  const dayTotal = useMemo(
    () =>
      rows.reduce((sum, w) => {
        const h = Number(inputs[w.id]?.hours);
        return sum + (Number.isFinite(h) && h > 0 ? h : 0);
      }, 0),
    [rows, inputs],
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
    const changed = rows.filter((w) => {
      const h = Number(inputs[w.id]?.hours) || 0;
      return h !== (baseline[w.id] ?? 0);
    });
    if (changed.length === 0) {
      setMessage("変更はありません。");
      return;
    }
    // 負の数などの不正値チェック。
    for (const w of changed) {
      const h = Number(inputs[w.id]?.hours);
      if (!Number.isFinite(h) || h < 0) {
        setError(`「${w.name}」の時間は0以上の数値で入力してください。`);
        return;
      }
    }
    setSaving(true);
    try {
      for (const w of changed) {
        await setDayHours({
          taskId: w.id,
          workDate,
          memberId,
          hours: Number(inputs[w.id]?.hours) || 0,
          note: inputs[w.id]?.note?.trim() || null,
        });
      }
      await reloadDay(workDate);
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
                今日やった時間を0.5h刻みで。メモは任意（空でOK）。
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

          {showingAll && (
            <p className="mb-2 text-[11px] text-zinc-400">
              ※ あなたの担当の未完了タスクがないため、全タスクを表示しています。
            </p>
          )}

          {/* グリッド */}
          {!loaded ? (
            <p className="text-sm text-zinc-400">読み込み中…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-zinc-400">
              入力できる未完了タスクがありません。
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 text-left text-[11px] text-zinc-500">
                    <th className="px-3 py-2 font-medium">タスク</th>
                    <th className="w-20 px-3 py-2 text-center font-medium">今日</th>
                    <th className="px-3 py-2 font-medium">メモ（任意）</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((w: WorkItem, i) => (
                    <tr
                      key={w.id}
                      className={i > 0 ? "border-t border-zinc-100" : ""}
                    >
                      <td className="px-3 py-2">
                        <div className="text-zinc-800">{w.name}</div>
                        <div className="text-[11px] text-zinc-400">
                          {w.feature} ・ 見積
                          {w.estimated != null ? fmtHours(w.estimated) : 0}h/実績
                          {w.actual != null ? fmtHours(w.actual) : 0}h
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={inputs[w.id]?.hours ?? ""}
                          onChange={(e) => setRow(w.id, { hours: e.target.value })}
                          placeholder="0"
                          className={numClass}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={inputs[w.id]?.note ?? ""}
                          onChange={(e) => setRow(w.id, { note: e.target.value })}
                          placeholder="（空でOK）"
                          className={noteClass}
                        />
                      </td>
                    </tr>
                  ))}
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
                disabled={saving || rows.length === 0}
                className="rounded-lg bg-[#3B6D11] px-5 py-2 text-sm font-medium text-white hover:bg-[#2f5a0e] disabled:opacity-50"
              >
                {saving ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
