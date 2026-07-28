"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_TEMPLATES,
  generateFromTemplate,
  loadTaskTemplates,
  TEMPLATE_NAME_MAX,
  type TaskTemplate,
} from "@/lib/taskTemplates";
import type { PriorityMetaMap } from "@/lib/priorities";
import type { TaskTypeMetaMap } from "@/lib/taskTypes";

/**
 * 定型タスク sidebar for /tasks.
 *
 * Provisional: the real screen already has its own left sidebar, so this is a
 * placeholder for the 定型タスク section rather than a finished navigation.
 *
 * The generate button lives here, not on the admin screen, on purpose —
 * templates are defined once by an admin but used by everyone, and a button
 * only admins can press would make the feature pointless.
 */
export default function TemplateSidebar({
  priorityMeta,
  taskTypeMeta,
  onGenerated,
}: {
  priorityMeta: PriorityMetaMap;
  taskTypeMeta: TaskTypeMetaMap;
  onGenerated: () => void;
}) {
  const [templates, setTemplates] = useState<TaskTemplate[]>(DEFAULT_TEMPLATES);
  const [target, setTarget] = useState<TaskTemplate | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadTaskTemplates()
      .then(setTemplates)
      .catch(() => setTemplates(DEFAULT_TEMPLATES));
  }, []);

  function open(t: TaskTemplate) {
    setTarget(t);
    setNameDraft(t.name);
    setError(null);
    setNotice(null);
  }

  async function generate() {
    if (!target) return;
    const title = nameDraft.trim();
    if (!title) {
      setError("名前を入力してください。");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { children } = await generateFromTemplate(target, title);
      setTarget(null);
      onGenerated();
      setNotice(`「${title}」を作成しました（子タスク ${children.length} 件）。`);
    } catch {
      setError("作成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <aside className="w-full shrink-0 px-4 pt-8 lg:w-64 lg:px-0 lg:pl-4">
        <div className="rounded-xl border border-[#C0DD97] bg-white/90 p-3 shadow-sm">
          <h2 className="mb-1 text-sm font-bold text-[#3B6D11]">📋 定型タスク</h2>
          <p className="mb-3 text-[0.7rem] leading-relaxed text-zinc-500">
            よくある一式を、親タスクと子タスクごとまとめて登録します。
          </p>

          {notice && (
            <p className="mb-2 rounded-lg bg-[#EAF3DE] px-2 py-1.5 text-[0.72rem] text-[#173404]">
              {notice}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {templates.map((t) => (
              <div
                key={t.code}
                className="rounded-lg border border-zinc-200 bg-white p-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[0.82rem] font-semibold text-zinc-900">
                    {t.name}
                  </p>
                  <span className="shrink-0 text-[0.68rem] text-zinc-400">
                    親1 ＋ 子{t.items.length}
                  </span>
                </div>

                {/* What pressing the button will create, before pressing it. */}
                <ul className="mt-1.5 flex flex-col gap-0.5">
                  {t.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-1 text-[0.72rem] text-zinc-600"
                    >
                      <span className="text-zinc-300">└</span>
                      <span className="truncate">{item.title}</span>
                      {item.taskType && (
                        <span className="shrink-0 rounded bg-zinc-100 px-1 text-[0.64rem] text-zinc-500">
                          {taskTypeMeta[item.taskType].label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[0.68rem] font-medium ${priorityMeta[t.priority].badgeClass}`}
                  >
                    優先 {priorityMeta[t.priority].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => open(t)}
                    className="rounded-lg bg-[#3B6D11] px-2.5 py-1 text-[0.72rem] font-semibold text-white transition hover:bg-[#2f5a0d]"
                  >
                    ＋ 生成
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[0.68rem] leading-relaxed text-zinc-400">
            担当者・期限・見積は入りません。生成後にタスク一覧から入力してください。
          </p>
        </div>
      </aside>

      {/* Generating writes several rows at once, so it confirms first and
          spells out exactly what will appear in the list. */}
      {target && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTarget(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="gen-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 id="gen-title" className="text-base font-bold text-zinc-900">
              「{target.name}」を生成します
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              親タスク1件と子タスク{target.items.length}件が、タスク一覧に追加されます。
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
                  if (e.key === "Escape") setTarget(null);
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
                {nameDraft.trim() || target.name}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {target.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-zinc-600"
                  >
                    <span className="text-zinc-300">└</span>
                    {item.title}
                    {item.taskType && (
                      <span className="rounded bg-white px-1 text-[0.68rem] text-zinc-500 ring-1 ring-zinc-200">
                        {taskTypeMeta[item.taskType].label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-zinc-500">
                すべて<b className="text-zinc-700">未着手</b>・優先度
                <b className="text-zinc-700">{priorityMeta[target.priority].label}</b>
                で作られます。担当者・期限・見積は空のままなので、生成後に入力してください。
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
                onClick={() => setTarget(null)}
                className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={generate}
                className="rounded-lg bg-[#3B6D11] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2f5a0d] disabled:opacity-50"
              >
                {busy ? "作成中…" : "生成する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
