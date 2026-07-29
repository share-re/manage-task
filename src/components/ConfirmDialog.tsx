"use client";

/**
 * 中央に出す確認ダイアログ（タスク削除のモーダルと同じ体裁）。
 * 破棄的な操作の前に挟む。背景クリックでキャンセルできる。
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "削除する",
  cancelLabel = "キャンセル",
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
          !
        </div>
        <p className="text-base font-medium text-zinc-900">{title}</p>
        <p className="text-center text-sm text-zinc-600">{message}</p>
        <div className="mt-1 flex justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-5 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
