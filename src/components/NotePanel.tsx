"use client";

import { useState } from "react";
import {
  NOTE_MAX_LENGTH,
  NOTE_SOFT_LIMIT,
  noteAuthorLabel,
  validateNoteBody,
  type TaskNote,
} from "@/lib/taskNotes";
import ConfirmDialog from "@/components/ConfirmDialog";

// 懸念メモのパネル（タスク行を開くと出る）… 懸念メモ_実装手順書 v1.2 Step4。
// 一覧（対応済みは打消し線＋「対応済（誰が・いつ）」）／対応状況の切替／削除
// （投稿者本人か管理者のみ）／追記フォーム（100字目安・300字上限）。

function formatDateTime(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotePanel({
  notes,
  labelById,
  currentUserId,
  canModerate,
  onAdd,
  onSetResolved,
  onDelete,
}: {
  notes: TaskNote[];
  labelById: Map<string, string>;
  currentUserId: string | null;
  /** 管理者は他人のメモも削除できる（実権限はDB関数側で強制）。 */
  canModerate: boolean;
  onAdd: (body: string) => Promise<void>;
  onSetResolved: (noteId: string, resolved: boolean) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  // 削除確認の中央モーダル（タスク削除と同じ体裁）。対象メモを持つ＝開いている。
  const [deleteTarget, setDeleteTarget] = useState<TaskNote | null>(null);

  const trimmedLength = draft.trim().length;
  const overSoftLimit = trimmedLength > NOTE_SOFT_LIMIT;
  const problem = validateNoteBody(draft);

  async function submit() {
    if (problem) return;
    setPosting(true);
    setError(undefined);
    try {
      await onAdd(draft);
      setDraft("");
    } catch (err) {
      console.error(err);
      setError("メモを追加できませんでした。");
    } finally {
      setPosting(false);
    }
  }

  async function run(noteId: string, fn: () => Promise<void>, failMsg: string) {
    setBusyId(noteId);
    setError(undefined);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      setError(failMsg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {notes.length === 0 ? (
        <p className="text-xs text-zinc-400">まだメモはありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((n) => {
            // 削除できるのは投稿者本人と管理者だけ（DB関数でも強制している）。
            const canDelete =
              canModerate ||
              (currentUserId != null && n.author_id === currentUserId);
            const busy = busyId === n.id;
            return (
              <li
                key={n.id}
                className={`rounded-lg px-2.5 py-2 ${
                  n.resolved ? "bg-zinc-50" : "bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-sm ${
                      n.resolved
                        ? "text-zinc-400 line-through"
                        : "text-zinc-800"
                    }`}
                  >
                    {n.body}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          n.id,
                          () => onSetResolved(n.id, !n.resolved),
                          "対応状況を変更できませんでした。",
                        )
                      }
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium disabled:opacity-50 ${
                        n.resolved
                          ? "text-zinc-500 hover:bg-zinc-200"
                          : "bg-[#3B6D11] text-white hover:bg-[#2f5a0e]"
                      }`}
                    >
                      {n.resolved ? "未対応に戻す" : "対応済みにする"}
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        disabled={busy}
                        aria-label="メモを削除"
                        onClick={() => setDeleteTarget(n)}
                        className="rounded-full px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-0.5 text-[11px] text-zinc-400">
                  {noteAuthorLabel(n, labelById)}・
                  {formatDateTime(n.created_at)}
                  {n.resolved && (
                    <span className="ml-1.5 text-[#3B6D11]">
                      ✓ 対応済
                      {n.resolved_by
                        ? `（${labelById.get(n.resolved_by) ?? "不明"}・${formatDateTime(n.resolved_at ?? "")}）`
                        : n.migrated_from_comment_id
                          ? "（移行分）"
                          : ""}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-3 flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={NOTE_MAX_LENGTH}
            placeholder="気になっていること・引き継ぎメモなど…"
            className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          <div
            className={`mt-0.5 text-[11px] ${overSoftLimit ? "text-red-600" : "text-zinc-400"}`}
          >
            {trimmedLength} / {NOTE_SOFT_LIMIT}字（目安）
            {overSoftLimit && ` ・上限${NOTE_MAX_LENGTH}字`}
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={posting || problem != null}
          className="mb-5 rounded-lg bg-[#3B6D11] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2f5a0e] disabled:opacity-50"
        >
          {posting ? "追記中…" : "追記"}
        </button>
      </div>

      {/* 削除確認（中央モーダル・タスク削除と同じ体裁） */}
      {deleteTarget && (
        <ConfirmDialog
          title="メモを削除しますか？"
          message={
            <>
              「
              {deleteTarget.body.length > 40
                ? `${deleteTarget.body.slice(0, 40)}…`
                : deleteTarget.body}
              」を削除します。この操作は取り消せません。
            </>
          }
          busy={busyId === deleteTarget.id}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            const id = deleteTarget.id;
            setDeleteTarget(null);
            run(id, () => onDelete(id), "削除できませんでした。");
          }}
        />
      )}
    </div>
  );
}
