"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { STATUS_ORDER, type Task, type TaskStatus } from "@/lib/tasks";
import {
  DEFAULT_STATUS_META,
  loadStatusMeta,
  STATUS_COLORS,
  STATUS_COLOR_ORDER,
  STATUS_LABEL_MAX,
  type StatusColor,
  type StatusMetaMap,
} from "@/lib/statuses";
import { C, CARD_STYLE } from "./theme";

/**
 * 状態マスタ. Label and color only.
 *
 * The set of statuses is not editable, and "done" least of all: progress,
 * archiving, the forest, the parent/child sync and the actual-hours rule all
 * test for it directly, so moving it would quietly break the progress figure.
 */
export default function StatusPanel({ tasks }: { tasks: Task[] }) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [meta, setMeta] = useState<StatusMetaMap>(DEFAULT_STATUS_META);
  const [editing, setEditing] = useState<TaskStatus | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [colorDraft, setColorDraft] = useState<StatusColor>("gray");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    loadStatusMeta()
      .then(setMeta)
      .catch(() => setMeta(DEFAULT_STATUS_META));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usedByCode = useMemo(() => {
    const m = new Map<TaskStatus, number>();
    for (const t of tasks) m.set(t.status, (m.get(t.status) ?? 0) + 1);
    return m;
  }, [tasks]);

  function startEdit(code: TaskStatus) {
    setEditing(code);
    setLabelDraft(meta[code].label);
    setColorDraft(meta[code].color);
    setError(null);
    setNotice(null);
  }

  async function save(code: TaskStatus) {
    const label = labelDraft.trim();
    if (!label) {
      setError("表示名を入力してください。");
      return;
    }
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/statuses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, label, color: colorDraft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました。");
      setEditing(null);
      load();
      setNotice(
        `「${label}」に変更しました。タスク一覧・プルダウン・定期サマリメールに反映されます。`,
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
        <h2 className="text-[1.05rem] font-extrabold">📊 状態マスタ</h2>
        <span className="text-[0.82rem]" style={{ color: C.muted }}>
          3件（固定）
        </span>
      </div>
      <p className="mb-3.5 mt-1.5 text-[0.86rem]" style={{ color: C.muted }}>
        変えられるのは<b style={{ color: C.ink }}>表示名と色だけ</b>です。
        状態を増やしたり、
        <b style={{ color: C.ink }}>どれを「完了」として扱うかを変えることはできません</b>
        （進捗率・アーカイブ・植林の判定が「完了」に直接つながっているため）。
      </p>

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
        <table className="w-full min-w-[680px] border-collapse text-[0.85rem]">
          <thead>
            <tr>
              {["表示名", "色", "タスク一覧での見え方", "完了扱い", "使用中", "操作"].map(
                (h) => (
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
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {STATUS_ORDER.map((code) => {
              const m = meta[code];
              const isEditing = editing === code;
              const shownLabel = isEditing ? labelDraft || "（空）" : m.label;
              const shownColor = isEditing ? colorDraft : m.color;
              const c = STATUS_COLORS[shownColor];
              return (
                <tr key={code} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td className="px-3 py-2.5 font-bold">
                    {isEditing ? (
                      <input
                        autoFocus
                        value={labelDraft}
                        maxLength={STATUS_LABEL_MAX}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") save(code);
                          if (e.key === "Escape") setEditing(null);
                        }}
                        className="w-28 rounded-lg px-2 py-1 text-sm font-normal"
                        style={{
                          border: `1px solid ${C.accent}`,
                          background: C.card,
                        }}
                      />
                    ) : (
                      m.label
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {isEditing ? (
                      <select
                        value={colorDraft}
                        onChange={(e) =>
                          setColorDraft(e.target.value as StatusColor)
                        }
                        className="rounded-lg px-2 py-1 text-sm"
                        style={{
                          border: `1px solid ${C.accent}`,
                          background: C.card,
                        }}
                      >
                        {STATUS_COLOR_ORDER.map((k) => (
                          <option key={k} value={k}>
                            {STATUS_COLORS[k].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="inline-block h-3.5 w-3.5 rounded"
                          style={{
                            background: STATUS_COLORS[m.color].swatch,
                            border: "1px solid rgba(0,0,0,.12)",
                          }}
                        />
                        {STATUS_COLORS[m.color].label}
                      </span>
                    )}
                  </td>
                  {/* A status colors two things, so the preview shows both: the
                      badge, and the bar down the left edge of a task row. */}
                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex items-center gap-2 rounded bg-white py-1 pl-2 pr-3 ring-1 ring-black/5"
                      style={{ borderLeft: `4px solid ${c.barColor}` }}
                    >
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.badgeClass}`}
                      >
                        {shownLabel}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {code === "done" ? (
                      <span style={{ color: C.accentInk }}>✅ はい</span>
                    ) : (
                      <span style={{ color: C.muted }}>いいえ</span>
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
