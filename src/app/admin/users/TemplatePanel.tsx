"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  PRIORITY_ORDER,
  TASK_TYPE_ORDER,
  type TaskPriority,
  type TaskType,
} from "@/lib/tasks";
import {
  DEFAULT_TEMPLATES,
  loadTaskTemplates,
  TEMPLATE_HOURS_MAX,
  TEMPLATE_HOURS_STEP,
  TEMPLATE_ITEM_MAX,
  TEMPLATE_ITEM_TITLE_MAX,
  TEMPLATE_MAX,
  TEMPLATE_NAME_MAX,
  type TaskTemplate,
} from "@/lib/taskTemplates";
import {
  DEFAULT_PRIORITY_META,
  loadPriorityMeta,
  type PriorityMetaMap,
} from "@/lib/priorities";
import {
  DEFAULT_TASK_TYPE_META,
  loadTaskTypeMeta,
  type TaskTypeMetaMap,
} from "@/lib/taskTypes";
import { C, CARD_STYLE } from "./theme";

/**
 * 定型タスクマスタ。雛形の追加・編集・削除ができる。
 *
 * 他のマスタ（優先度・状態・種別）が「表示名を1つ書き換える」だけなのに対し、
 * ここは子タスクの配列を編集するので、行の編集ではなくフォームの形にしてある。
 *
 * 雛形を決めるのは管理者、使うのは全員という切り分け。生成は /tasks から
 * メンバー全員ができる。
 */

/** 編集中の子タスク。見積は入力途中を保つため文字列で持つ。 */
type DraftItem = { title: string; taskType: TaskType; hours: string };
/** code が null なら新規追加。 */
type Draft = {
  code: string | null;
  name: string;
  priority: TaskPriority;
  items: DraftItem[];
};

function toDraft(t: TaskTemplate): Draft {
  return {
    code: t.code,
    name: t.name,
    priority: t.priority,
    items: t.items.map((i) => ({
      title: i.title,
      // 保存時は種別必須。過去に種別なしで入った行は「設計」に寄せて、
      // 選び直さないと保存できない状態を作らない。
      taskType: i.taskType ?? "design",
      hours: i.estimatedHours == null ? "" : String(i.estimatedHours),
    })),
  };
}

function emptyDraft(): Draft {
  return {
    code: null,
    name: "",
    priority: "mid",
    items: [{ title: "", taskType: "design", hours: "" }],
  };
}

export default function TemplatePanel() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [fromDb, setFromDb] = useState(false);
  const [priorityMeta, setPriorityMeta] =
    useState<PriorityMetaMap>(DEFAULT_PRIORITY_META);
  const [taskTypeMeta, setTaskTypeMeta] = useState<TaskTypeMetaMap>(
    DEFAULT_TASK_TYPE_META,
  );

  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskTemplate | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    loadTaskTemplates()
      .then((r) => {
        setTemplates(r.templates);
        setFromDb(r.fromDb);
      })
      .catch(() => {
        setTemplates(DEFAULT_TEMPLATES);
        setFromDb(false);
      });
  }, []);

  useEffect(() => {
    load();
    loadPriorityMeta().then(setPriorityMeta).catch(() => {});
    loadTaskTypeMeta().then(setTaskTypeMeta).catch(() => {});
  }, [load]);

  const atLimit = templates.length >= TEMPLATE_MAX;

  function startNew() {
    setDraft(emptyDraft());
    setError(null);
    setNotice(null);
  }

  function startEdit(t: TaskTemplate) {
    setDraft(toDraft(t));
    setError(null);
    setNotice(null);
  }

  function patchItem(index: number, patch: Partial<DraftItem>) {
    setDraft((d) =>
      d
        ? {
            ...d,
            items: d.items.map((it, i) =>
              i === index ? { ...it, ...patch } : it,
            ),
          }
        : d,
    );
  }

  function addItem() {
    setDraft((d) =>
      d && d.items.length < TEMPLATE_ITEM_MAX
        ? { ...d, items: [...d.items, { title: "", taskType: "design", hours: "" }] }
        : d,
    );
  }

  function removeItem(index: number) {
    setDraft((d) =>
      d ? { ...d, items: d.items.filter((_, i) => i !== index) } : d,
    );
  }

  /** 子タスクの並べ替え。生成されるタスクの順序がそのまま変わる。 */
  function move(index: number, delta: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const to = index + delta;
      if (to < 0 || to >= d.items.length) return d;
      const items = [...d.items];
      [items[index], items[to]] = [items[to], items[index]];
      return { ...d, items };
    });
  }

  async function save() {
    if (!draft || !token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates", {
        method: draft.code ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: draft.code ?? undefined,
          name: draft.name,
          priority: draft.priority,
          items: draft.items.map((i) => ({
            title: i.title,
            task_type: i.taskType,
            estimated_hours: i.hours.trim() === "" ? null : Number(i.hours),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "保存に失敗しました。");
      const name = draft.name.trim();
      setDraft(null);
      load();
      setNotice(
        `「${name}」を保存しました。進捗管理の「＋ 定型タスクから追加」に反映されます。`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleteTarget || !token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/templates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: deleteTarget.code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "削除に失敗しました。");
      const name = deleteTarget.name;
      setDeleteTarget(null);
      load();
      setNotice(`「${name}」を削除しました。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const btn = "rounded-lg px-3 py-1.5 text-[0.82rem] font-bold transition";

  return (
    <section className="px-5 py-4" style={CARD_STYLE}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.05rem] font-extrabold">📋 定型タスクマスタ</h2>
        <span className="text-[0.82rem]" style={{ color: C.muted }}>
          {templates.length} / {TEMPLATE_MAX} 件
        </span>
      </div>
      <p className="mb-3.5 mt-1.5 text-[0.86rem]" style={{ color: C.muted }}>
        毎回同じ手順で登録している作業の雛形です。
        <b style={{ color: C.ink }}>
          進捗管理の「＋ 定型タスクから追加」からメンバー全員が生成できます
        </b>
        ── 雛形を決めるのは管理者、使うのは全員、という切り分けです。
      </p>

      {!fromDb && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-[0.84rem]"
          style={{ background: C.warnBg, color: C.ink }}
        >
          <b style={{ color: C.warn }}>
            いまはコード内の既定テンプレートを表示しています。
          </b>
          編集するには{" "}
          <span className="font-mono">supabase/task_templates.sql</span> を
          Supabase で実行してください。実行前でも
          <b style={{ color: C.ink }}>生成は使えます</b>。
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

      {/* ---------- 編集フォーム ---------- */}
      {draft && (
        <div
          className="mb-4 rounded-xl px-4 py-3.5"
          style={{ background: C.card2, border: `1px solid ${C.accent}` }}
        >
          <p className="mb-3 text-[0.95rem] font-extrabold">
            {draft.code ? "雛形を編集" : "新しい雛形"}
          </p>

          <label className="mb-3 block">
            <span className="text-[0.78rem]" style={{ color: C.muted }}>
              雛形の名前（{draft.name.length}/{TEMPLATE_NAME_MAX}）
            </span>
            <input
              autoFocus
              value={draft.name}
              maxLength={TEMPLATE_NAME_MAX}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, name: e.target.value } : d))
              }
              placeholder="例：週次ミーティング"
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm"
              style={{ border: `1px solid ${C.line}`, background: C.card }}
            />
          </label>

          <div className="mb-3">
            <span className="text-[0.78rem]" style={{ color: C.muted }}>
              優先度（生成時の初期値。あとから変更できます）
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft((d) => (d ? { ...d, priority: p } : d))}
                  className={`${btn} text-[0.8rem]`}
                  style={
                    draft.priority === p
                      ? { background: C.accent, color: "#fff" }
                      : {
                          background: C.card,
                          color: C.ink,
                          border: `1px solid ${C.line}`,
                        }
                  }
                >
                  {priorityMeta[p].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-[0.78rem]" style={{ color: C.muted }}>
              子タスク（{draft.items.length}/{TEMPLATE_ITEM_MAX}）
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {draft.items.map((item, i) => (
              <div key={i} className="flex flex-wrap items-center gap-1.5">
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="上へ"
                    className="px-1 text-[0.7rem] leading-none disabled:opacity-25"
                    style={{ color: C.muted }}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === draft.items.length - 1}
                    aria-label="下へ"
                    className="px-1 text-[0.7rem] leading-none disabled:opacity-25"
                    style={{ color: C.muted }}
                  >
                    ▼
                  </button>
                </div>
                <input
                  value={item.title}
                  maxLength={TEMPLATE_ITEM_TITLE_MAX}
                  onChange={(e) => patchItem(i, { title: e.target.value })}
                  placeholder="子タスクの名前"
                  aria-label={`子タスク${i + 1}の名前`}
                  className="min-w-[10rem] flex-1 rounded-lg px-2.5 py-1.5 text-sm"
                  style={{ border: `1px solid ${C.line}`, background: C.card }}
                />
                <select
                  value={item.taskType}
                  onChange={(e) =>
                    patchItem(i, { taskType: e.target.value as TaskType })
                  }
                  aria-label={`子タスク${i + 1}の種別`}
                  className="rounded-lg px-2 py-1.5 text-sm"
                  style={{ border: `1px solid ${C.line}`, background: C.card }}
                >
                  {TASK_TYPE_ORDER.map((t) => (
                    <option key={t} value={t}>
                      {taskTypeMeta[t].label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={TEMPLATE_HOURS_STEP}
                    max={TEMPLATE_HOURS_MAX}
                    step={TEMPLATE_HOURS_STEP}
                    value={item.hours}
                    onChange={(e) => patchItem(i, { hours: e.target.value })}
                    placeholder="見積"
                    aria-label={`子タスク${i + 1}の見積（時間・任意）`}
                    className="w-[4.5rem] rounded-lg px-2 py-1.5 text-sm"
                    style={{ border: `1px solid ${C.line}`, background: C.card }}
                  />
                  <span className="text-[0.78rem]" style={{ color: C.muted }}>
                    h
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={draft.items.length <= 1}
                  aria-label={`子タスク${i + 1}を外す`}
                  className="rounded-full px-1.5 py-0.5 text-sm disabled:opacity-25"
                  style={{ color: C.muted }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={draft.items.length >= TEMPLATE_ITEM_MAX}
            className={`${btn} mt-2 disabled:opacity-40`}
            style={{ background: C.card, color: C.accentInk, border: `1px solid ${C.accent}` }}
          >
            ＋ 子タスクを追加
          </button>

          <p className="mt-2.5 text-[0.76rem] leading-relaxed" style={{ color: C.muted }}>
            見積は<b style={{ color: C.ink }}>空のままで構いません</b>。
            入れると生成したタスクにその値が入り、そのまま工数効率（見積 ÷ 実績）の
            計算に使われます。実態と違う場合は登録後に直してください。
          </p>

          <div className="mt-3.5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className={btn}
              style={{ background: C.card, color: C.muted, border: `1px solid ${C.line}` }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className={`${btn} disabled:opacity-50`}
              style={{ background: C.accent, color: "#fff" }}
            >
              {busy ? "保存中…" : "保存する"}
            </button>
          </div>
        </div>
      )}

      {/* ---------- 一覧 ---------- */}
      {fromDb && templates.length === 0 ? (
        <p
          className="rounded-xl px-4 py-6 text-center text-[0.86rem]"
          style={{ background: C.card2, color: C.muted }}
        >
          雛形がありません。「＋ 新しい雛形」から作成してください。
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <div
              key={t.code}
              className="rounded-xl px-3.5 py-3"
              style={{ background: C.card2, border: `1px solid ${C.line}` }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[0.95rem] font-extrabold">{t.name}</p>
                <span className="text-[0.78rem]" style={{ color: C.muted }}>
                  親1 ＋ 子{t.items.length}・優先度 {priorityMeta[t.priority].label}
                </span>
              </div>
              <ul className="mt-1.5 flex flex-col gap-0.5">
                {t.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex flex-wrap items-center gap-1.5 text-[0.82rem]"
                    style={{ color: C.muted }}
                  >
                    <span style={{ color: C.line }}>└</span>
                    <span style={{ color: C.ink }}>{item.title}</span>
                    {item.taskType && (
                      <span
                        className="rounded px-1.5 text-[0.7rem]"
                        style={{ background: C.card, border: `1px solid ${C.line}` }}
                      >
                        {taskTypeMeta[item.taskType].label}
                      </span>
                    )}
                    {item.estimatedHours != null && (
                      <span className="text-[0.74rem]">
                        見積 {item.estimatedHours}h
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {fromDb && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    className={btn}
                    style={{
                      background: C.card,
                      color: C.accentInk,
                      border: `1px solid ${C.accent}`,
                    }}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(t)}
                    className={btn}
                    style={{
                      background: C.card,
                      color: C.danger,
                      border: `1px solid ${C.dangerBg}`,
                    }}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {fromDb && !draft && (
        <>
          <button
            type="button"
            onClick={startNew}
            disabled={atLimit}
            className={`${btn} mt-3.5 disabled:opacity-40`}
            style={{ background: C.accent, color: "#fff" }}
          >
            ＋ 新しい雛形
          </button>
          {atLimit && (
            <span className="ml-2 text-[0.78rem]" style={{ color: C.muted }}>
              上限の{TEMPLATE_MAX}件です。使っていないものを削除してください。
            </span>
          )}
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="この雛形を削除しますか？"
          message={
            <>
              「{deleteTarget.name}」を削除します。
              <b>すでに生成済みのタスクには影響しません。</b>
              この操作は取り消せません。
            </>
          }
          busy={busy}
          onConfirm={remove}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}
