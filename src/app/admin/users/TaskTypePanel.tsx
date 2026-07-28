"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { TASK_TYPE_ORDER, type Task, type TaskType } from "@/lib/tasks";
import {
  DEFAULT_TASK_TYPE_META,
  loadTaskTypeMeta,
  TASK_TYPE_LABEL_MAX,
  type TaskTypeMetaMap,
} from "@/lib/taskTypes";
import { C, CARD_STYLE } from "./theme";

/**
 * 種別マスタ. Labels only — a task type has no color anywhere in the UI yet.
 *
 * This is the tab the proposal mock called カテゴリ. Its suggested values
 * largely repeated task_type, and "which project is this for" is getting its
 * own layer (projects), so a third classification axis was folded into the one
 * that already exists.
 */
export default function TaskTypePanel({ tasks }: { tasks: Task[] }) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [meta, setMeta] = useState<TaskTypeMetaMap>(DEFAULT_TASK_TYPE_META);
  const [editing, setEditing] = useState<TaskType | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    loadTaskTypeMeta()
      .then(setMeta)
      .catch(() => setMeta(DEFAULT_TASK_TYPE_META));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usedByCode = useMemo(() => {
    const m = new Map<TaskType, number>();
    for (const t of tasks)
      if (t.task_type) m.set(t.task_type, (m.get(t.task_type) ?? 0) + 1);
    return m;
  }, [tasks]);

  // Tasks with no type at all. Worth surfacing: the comparison in the AI phase
  // comes from 種別 × 難易度, and untyped tasks drop out of it entirely.
  const untyped = useMemo(
    () => tasks.filter((t) => !t.task_type).length,
    [tasks],
  );

  function startEdit(code: TaskType) {
    setEditing(code);
    setLabelDraft(meta[code].label);
    setError(null);
    setNotice(null);
  }

  async function save(code: TaskType) {
    const label = labelDraft.trim();
    if (!label) {
      setError("表示名を入力してください。");
      return;
    }
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/task-types", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, label }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました。");
      setEditing(null);
      load();
      setNotice(
        `「${label}」に変更しました。タスクの登録・編集の種別プルダウンに反映されます。`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-5 py-4" style={CARD_STYLE}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.05rem] font-extrabold">🏷 種別マスタ</h2>
        <span className="text-[0.82rem]" style={{ color: C.muted }}>
          6件（固定）
        </span>
      </div>
      <p className="mb-3.5 mt-1.5 text-[0.86rem]" style={{ color: C.muted }}>
        タスク登録・編集の「種別」プルダウンに出る呼び名を変えられます。
        <b style={{ color: C.ink }}>増減はできません</b>
        （タスクに保存される値がDB側で6つに制限されているため）。
      </p>

      {untyped > 0 && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-[0.84rem]"
          style={{ background: C.warnBg, color: C.ink }}
        >
          <b style={{ color: C.warn }}>種別が未設定のタスクが {untyped} 件</b>
          あります。種別は将来のAI効果測定で「同じ条件どうしを比べる」ための軸になるので、
          未設定のタスクは比較の対象から外れます。
        </p>
      )}

      {notice && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: C.accentSoft, color: C.accentInk }}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: C.dangerBg, color: C.danger }}
        >
          {error}
        </p>
      )}

      <div
        className="overflow-x-auto rounded-xl"
        style={{ border: `1px solid ${C.line}` }}
      >
        <table className="w-full min-w-[520px] border-collapse text-[0.85rem]">
          <thead>
            <tr>
              {["表示名", "使用中", "操作"].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-2.5 text-[0.72rem] font-extrabold uppercase tracking-[0.06em]"
                  style={{
                    background: C.card2,
                    color: C.muted,
                    borderBottom: `1px solid ${C.line}`,
                    textAlign: h === "使用中" ? "right" : "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TASK_TYPE_ORDER.map((code) => {
              const isEditing = editing === code;
              return (
                <tr key={code} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td className="px-3 py-2.5 font-bold">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={labelDraft}
                        maxLength={TASK_TYPE_LABEL_MAX}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save(code);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="w-32 rounded-lg px-2 py-1 text-sm font-normal"
                        style={{
                          border: `1px solid ${C.accent}`,
                          background: C.card,
                        }}
                      />
                    ) : (
                      meta[code].label
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {usedByCode.get(code) ?? 0} 件
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => save(code)}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
                            style={{ background: C.accent }}
                          >
                            {busy ? "保存中…" : "保存"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => setEditing(null)}
                            className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                            style={{
                              border: `1px solid ${C.line}`,
                              color: C.ink,
                            }}
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={busy}
                          onClick={() => startEdit(code)}
                          className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                          style={{ border: `1px solid ${C.line}`, color: C.ink }}
                        >
                          編集
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </section>
  );
}
