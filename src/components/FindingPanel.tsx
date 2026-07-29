"use client";

import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  countByPhase,
  findingAuthorLabel,
  FINDING_MAX_LENGTH,
  FINDING_SOFT_LIMIT,
  PHASE_META,
  PHASE_ORDER,
  qualityState,
  validateFindingBody,
  type FindingPhase,
  type TaskFinding,
} from "@/lib/taskFindings";

// 品質（不具合・指摘）のパネル… 品質_実装手順書 v1.1 Step3。
// 工程別の件数／明細（対応済みの切替・取り消し）／追加フォーム／「テスト実施済み」。
//
// 数え方が2つあるので注意：
//   ここに出す件数 = 発見総数（対応済みも含む）。品質の物差しなので直しても減らない
//   行のバッジ     = 未対応（親が openFindingCountByTask で集計）

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function FindingPanel({
  findings,
  qualityCheckedAt,
  labelById,
  currentUserId,
  canModerate,
  onAdd,
  onSetResolved,
  onDelete,
  onSetChecked,
}: {
  /** 取り消し済みを除いた記録（表示用）。 */
  findings: TaskFinding[];
  /** tasks.quality_checked_at。null＝まだ確認していない。 */
  qualityCheckedAt: string | null;
  labelById: Map<string, string>;
  currentUserId: string | null;
  /** 管理者は他人の記録も取り消せる（実権限はDB関数側で強制）。 */
  canModerate: boolean;
  onAdd: (phase: FindingPhase, body: string) => Promise<void>;
  onSetResolved: (findingId: string, resolved: boolean) => Promise<void>;
  onDelete: (findingId: string) => Promise<void>;
  onSetChecked: (checked: boolean) => Promise<void>;
}) {
  const [phase, setPhase] = useState<FindingPhase>("test");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);
  const [error, setError] = useState<string>();
  // 取り消し確認の中央モーダル（メモ削除と同じ体裁）。
  const [deleteTarget, setDeleteTarget] = useState<TaskFinding | null>(null);

  const problem = validateFindingBody(draft);
  const trimmedLength = draft.trim().length;
  const overSoftLimit = trimmedLength > FINDING_SOFT_LIMIT;
  const counts = countByPhase(findings);
  const unresolved = findings.filter((f) => !f.resolved).length;
  const state = qualityState(qualityCheckedAt, findings.length);

  async function submit() {
    if (problem) return;
    setPosting(true);
    setError(undefined);
    try {
      await onAdd(phase, draft);
      setDraft("");
    } catch (err) {
      console.error(err);
      setError("記録を追加できませんでした。");
    } finally {
      setPosting(false);
    }
  }

  async function run(id: string, fn: () => Promise<void>, failMsg: string) {
    setBusyId(id);
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

  async function toggleChecked(next: boolean) {
    setCheckBusy(true);
    setError(undefined);
    try {
      await onSetChecked(next);
    } catch (err) {
      console.error(err);
      setError("確認状態を変更できませんでした。");
    } finally {
      setCheckBusy(false);
    }
  }

  return (
    <div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

      {/* 工程別の件数（発見総数。対応済みでも減らさない） */}
      <div className="mb-2 grid grid-cols-4 gap-1.5">
        {PHASE_ORDER.map((p) => {
          const n = counts[p];
          return (
            <div key={p} className="rounded-lg bg-zinc-50 px-2 py-1.5">
              <div className="text-[10px] text-zinc-600">
                {PHASE_META[p].label}
              </div>
              <div
                className={`text-lg font-semibold ${n > 0 ? "text-zinc-900" : "text-zinc-300"}`}
              >
                {n}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mb-2.5 text-[11px] text-zinc-700">
        発見 {findings.length}件（対応済みも含む）／{" "}
        <span
          className={
            unresolved > 0 ? "font-medium text-red-700" : "text-green-700"
          }
        >
          未対応 {unresolved}件
        </span>
      </p>

      {findings.length === 0 ? (
        <p className="text-xs text-zinc-400">まだ記録はありません。</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {findings.map((f) => {
            // 取り消せるのは記録者本人と管理者だけ（DB関数でも強制している）。
            const canDelete =
              canModerate ||
              (currentUserId != null && f.author_id === currentUserId);
            const busy = busyId === f.id;
            return (
              <li
                key={f.id}
                className={`rounded-lg px-2.5 py-1.5 ${
                  f.resolved ? "bg-zinc-50" : "bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${PHASE_META[f.phase].badgeClass}`}
                  >
                    {PHASE_META[f.phase].label}
                  </span>
                  <p
                    className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-sm ${
                      f.resolved
                        ? "text-zinc-400 line-through"
                        : "text-zinc-800"
                    }`}
                  >
                    {f.body}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        run(
                          f.id,
                          () => onSetResolved(f.id, !f.resolved),
                          "対応状況を変更できませんでした。",
                        )
                      }
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium disabled:opacity-50 ${
                        f.resolved
                          ? "text-zinc-500 hover:bg-zinc-200"
                          : "bg-[#3B6D11] text-white hover:bg-[#2f5a0e]"
                      }`}
                    >
                      {f.resolved ? "未対応に戻す" : "対応済みにする"}
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        disabled={busy}
                        aria-label="記録を取り消す"
                        title="入力ミスの取り消し（直したときは「対応済みにする」）"
                        onClick={() => setDeleteTarget(f)}
                        className="rounded-full px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
                {/* 記録者・日付は薄すぎると読めないので濃いめにする（レビュー指摘）。 */}
                <div className="mt-0.5 text-[11px] text-zinc-700">
                  {findingAuthorLabel(f, labelById)}・{formatDate(f.found_on)}
                  {f.resolved && (
                    <span className="ml-1.5 rounded bg-green-100 px-1 text-green-700">
                      対応済
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 追加フォーム（懸念メモと同じ体裁：複数行＋文字数カウンター） */}
      <div className="mt-3 flex items-end gap-2">
        <select
          value={phase}
          onChange={(e) => setPhase(e.target.value as FindingPhase)}
          aria-label="見つけた工程"
          className="mb-5 rounded-lg border border-zinc-300 px-2 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
        >
          {PHASE_ORDER.map((p) => (
            <option key={p} value={p}>
              {PHASE_META[p].label}
            </option>
          ))}
        </select>
        <div className="flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            maxLength={FINDING_MAX_LENGTH}
            placeholder="見つけた不具合・指摘の内容…"
            className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
          <div
            className={`mt-0.5 text-[11px] ${overSoftLimit ? "text-red-600" : "text-zinc-400"}`}
          >
            {trimmedLength} / {FINDING_SOFT_LIMIT}字（目安）
            {overSoftLimit && ` ・上限${FINDING_MAX_LENGTH}字`}
          </div>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={posting || !!problem}
          className="mb-5 rounded-lg bg-[#3B6D11] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#2f5a0e] disabled:opacity-50"
        >
          {posting ? "追加中…" : "追加"}
        </button>
      </div>

      {/* テスト実施済み（0件と未確認を区別するための項目） */}
      <label className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-dashed border-zinc-200 pt-2.5 text-xs text-zinc-700">
        <input
          type="checkbox"
          checked={qualityCheckedAt != null}
          disabled={checkBusy}
          onChange={(e) => toggleChecked(e.target.checked)}
        />
        テストは実施済み（見つからなければ0件として確定）
        {state === "zero" && (
          <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">
            ✓ 0件で確定
          </span>
        )}
      </label>
      <p className="mt-1 text-[11px] text-zinc-400">
        ※ チェックが無いと「まだ確認していない」扱いです。×は入力ミスの取り消し用で、直したときは「対応済みにする」を押してください。改行して手順や再現条件も書けます（{FINDING_SOFT_LIMIT}字目安・上限{FINDING_MAX_LENGTH}字）。
      </p>

      {deleteTarget && (
        <ConfirmDialog
          title="この記録を取り消しますか？"
          message={
            <>
              「{deleteTarget.body}」を取り消します。
              <br />
              入力ミスの取り消し用です。直したときは「対応済みにする」を使ってください。
              品質の集計には、取り消し後も件数として残ります。
            </>
          }
          confirmLabel="取り消す"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            const target = deleteTarget;
            setDeleteTarget(null);
            await run(
              target.id,
              () => onDelete(target.id),
              "記録を取り消せませんでした。",
            );
          }}
        />
      )}
    </div>
  );
}
