"use client";

import type { Task } from "@/lib/tasks";

// In-forest task list: tick a task to complete it (or untick to reopen) and
// watch the garden grow without leaving the page. The actual write goes through
// the 進捗管理 feature's shared updateTaskStatus() via the page's onToggle.
export default function TaskPanel({
  tasks,
  onToggle,
  onClose,
}: {
  tasks: Task[];
  onToggle: (id: string, done: boolean) => void;
  onClose: () => void;
}) {
  const doneCount = tasks.filter((t) => t.status === "done").length;
  return (
    <div className="pointer-events-auto flex max-h-[70vh] w-72 flex-col rounded-2xl bg-white/90 p-4 shadow-md ring-1 ring-black/5 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-emerald-800">
          📋 タスク（{doneCount}/{tasks.length}）
        </h2>
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="rounded px-2 py-0.5 text-zinc-500 hover:bg-zinc-100"
        >
          ×
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-zinc-400">タスクがありません。</p>
      ) : (
        <ul className="flex flex-col gap-1 overflow-y-auto">
          {tasks.map((t) => {
            const done = t.status === "done";
            return (
              <li key={t.id}>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-emerald-50">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={(e) => onToggle(t.id, e.target.checked)}
                    className="h-4 w-4 shrink-0 accent-emerald-500"
                  />
                  <span
                    className={
                      done
                        ? "truncate text-zinc-400 line-through"
                        : "truncate text-zinc-800"
                    }
                  >
                    {t.title}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-2 text-[11px] text-zinc-400">
        チェックすると庭が育ちます（更新にはログインが必要）。
      </p>
    </div>
  );
}
