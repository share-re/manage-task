"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TEMPLATES,
  generateFromTemplate,
  loadTaskTemplates,
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

/**
 * 定型タスク, shown over the task screen rather than replacing it: picking a
 * template is a side trip, and coming back to the same scroll position matters
 * more than having its own URL.
 *
 * Three steps in one panel — pick, name, done — so the list stays one click
 * away while naming.
 */
export default function TemplateModal({
  open,
  onClose,
  onGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onGenerated?: () => void;
}) {
  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [priorityMeta, setPriorityMeta] =
    useState<PriorityMetaMap>(DEFAULT_PRIORITY_META);
  const [taskTypeMeta, setTaskTypeMeta] = useState<TaskTypeMetaMap>(
    DEFAULT_TASK_TYPE_META,
  );

  const [picked, setPicked] = useState<TaskTemplate | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ title: string; count: number } | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    loadTaskTemplates().then(setTemplates).catch(() => {});
    loadPriorityMeta().then(setPriorityMeta).catch(() => {});
    loadTaskTypeMeta().then(setTaskTypeMeta).catch(() => {});
  }, [open]);

  // Escape closes, as with the other dialogs on this screen.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function backToList() {
    setPicked(null);
    setError(null);
    setDone(null);
  }

  function pick(t: TaskTemplate) {
    setPicked(t);
    setNameDraft(t.name);
    setError(null);
    setDone(null);
  }

  async function generate() {
    if (!picked) return;
    const title = nameDraft.trim();
    if (!title) {
      setError("名前を入力してください。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { children } = await generateFromTemplate(picked, title);
      setDone({ title, count: children.length });
      onGenerated?.();
    } catch {
      setError("作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  const childList = (t: TaskTemplate, onWhite: boolean) => (
    <ul className="mt-1.5 flex flex-col gap-0.5">
      {t.items.map((item, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span className="text-zinc-300">└</span>
          <span className="text-zinc-800">{item.title}</span>
          {item.taskType && (
            <span
              className={`rounded px-1.5 text-[0.68rem] text-zinc-500 ${
                onWhite ? "bg-zinc-100" : "bg-white ring-1 ring-zinc-200"
              }`}
            >
              {taskTypeMeta[item.taskType].label}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tpl-title"
    >
      <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="tpl-title" className="text-lg font-bold text-zinc-900">
              🧩 定型タスク
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              よくある一式を、親タスクと子タスクごとまとめて登録します。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="shrink-0 rounded-full px-2 py-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            ✕
          </button>
        </div>

        {/* ---------- step 3: created ---------- */}
        {done ? (
          <div className="rounded-xl bg-[#F3F9EC] p-4">
            <p className="text-base font-bold text-[#3B6D11]">
              🌱 「{done.title}」を作成しました
            </p>
            <p className="mt-1.5 text-sm text-zinc-600">
              子タスク {done.count} 件と一緒にタスク一覧へ追加されました。
              担当者・期限・見積は空のままなので、一覧から入力してください。
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[#3B6D11] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#2f5a0d]"
              >
                タスク一覧に戻る
              </button>
              <button
                type="button"
                onClick={backToList}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                続けて別の雛形から作る
              </button>
            </div>
          </div>
        ) : picked ? (
          /* ---------- step 2: name and confirm ---------- */
          <div>
            <button
              type="button"
              onClick={backToList}
              className="text-xs text-zinc-500 transition hover:text-zinc-800"
            >
              ← 雛形の一覧に戻る
            </button>
            <h3 className="mt-2 text-base font-bold text-zinc-900">
              「{picked.name}」から作成
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              親タスク1件と子タスク{picked.items.length}件が、タスク一覧に追加されます。
            </p>

            <label className="mt-4 flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600">
                親タスクの名前
              </span>
              <input
                autoFocus
                value={nameDraft}
                maxLength={TEMPLATE_NAME_MAX}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") generate();
                }}
                placeholder="例：ログイン機能の実装"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              />
              <span className="text-[0.7rem] text-zinc-400">
                そのままでも作れますが、何の作業か分かる名前にすると一覧で探しやすくなります。
              </span>
            </label>

            <div className="mt-4 rounded-xl bg-zinc-50 p-3">
              <p className="text-xs font-semibold text-zinc-700">作成される内容</p>
              <p className="mt-1.5 truncate text-sm font-semibold text-zinc-900">
                {nameDraft.trim() || picked.name}
              </p>
              {childList(picked, false)}
              <p className="mt-2 text-[0.72rem] leading-relaxed text-zinc-500">
                すべて<b className="text-zinc-700">未着手</b>・優先度
                <b className="text-zinc-700">
                  {priorityMeta[picked.priority].label}
                </b>
                で作られます。担当者・期限・見積は空です。
              </p>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                {error}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={backToList}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={generate}
                className="rounded-lg bg-[#3B6D11] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-[#2f5a0d] disabled:opacity-50"
              >
                {busy ? "作成中…" : "生成する"}
              </button>
            </div>
          </div>
        ) : (
          /* ---------- step 1: pick ---------- */
          <div className="flex flex-col gap-3">
            {templates.map((t) => (
              <div
                key={t.code}
                className="rounded-xl border border-zinc-200 p-3.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[0.95rem] font-semibold text-zinc-900">
                    {t.name}
                  </p>
                  <span className="text-xs text-zinc-400">
                    親1 ＋ 子{t.items.length}
                  </span>
                </div>
                {childList(t, true)}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[0.7rem] font-medium ${priorityMeta[t.priority].badgeClass}`}
                  >
                    優先 {priorityMeta[t.priority].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => pick(t)}
                    className="rounded-lg bg-[#3B6D11] px-3 py-1.5 text-sm font-medium text-white transition hover:bg-[#2f5a0d]"
                  >
                    この雛形で作る →
                  </button>
                </div>
              </div>
            ))}
            <p className="text-[0.7rem] leading-relaxed text-zinc-400">
              雛形の中身は管理画面（マスタ管理 ＞ 定型タスク）で決めます。
              担当者・期限・見積は雛形に持たせていないので、生成後に一覧から入力してください。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
