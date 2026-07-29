import { isTaskPriority, isTaskStatus, isTaskType } from "./tasks";
import type { TaskPriority, TaskStatus, TaskType } from "./tasks";
import { isPriorityColor, PRIORITY_LABEL_MAX, type PriorityColor } from "./priorities";
import { isStatusColor, STATUS_LABEL_MAX, type StatusColor } from "./statuses";
import { TASK_TYPE_LABEL_MAX } from "./taskTypes";

/**
 * 呼び名マスタ（優先度・状態・種別）の保存前チェック。
 *
 * 検証が3本の API ルートに直書きされていて、走らせるには HTTP とサービスロールが
 * 要る＝テストできない形だった。純関数に出して、API とテストの両方から使う。
 * 定型タスクの validateTemplateDraft と同じ考え方。
 *
 * どのマスタも「コードは固定・表示名と色だけがデータ」。コードを増やせないのは
 * tasks 側の CHECK 制約と、"done" を直接見ている約25か所があるため。
 */

export type DraftResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** 表示名の共通チェック。前後の空白は落とす。 */
function checkLabel(raw: unknown, max: number): DraftResult<string> {
  const label = typeof raw === "string" ? raw.trim() : "";
  if (!label) return { ok: false, error: "表示名を入力してください。" };
  if (label.length > max)
    return { ok: false, error: `表示名は${max}文字以内で入力してください。` };
  return { ok: true, value: label };
}

export function validatePriorityDraft(input: {
  code?: unknown;
  label?: unknown;
  color?: unknown;
}): DraftResult<{ code: TaskPriority; label: string; color: PriorityColor }> {
  if (!isTaskPriority(input.code))
    return { ok: false, error: "優先度の種類が正しくありません。" };
  const label = checkLabel(input.label, PRIORITY_LABEL_MAX);
  if (!label.ok) return label;
  // 色は「キー」だけを受ける。未知のキーを通すと、バッジが素のまま描画される
  // （Tailwind はソースに書かれたクラスしか CSS に出さないため）。
  if (!isPriorityColor(input.color))
    return { ok: false, error: "色が正しくありません。" };
  return {
    ok: true,
    value: { code: input.code, label: label.value, color: input.color },
  };
}

export function validateStatusDraft(input: {
  code?: unknown;
  label?: unknown;
  color?: unknown;
}): DraftResult<{ code: TaskStatus; label: string; color: StatusColor }> {
  if (!isTaskStatus(input.code))
    return { ok: false, error: "状態の種類が正しくありません。" };
  const label = checkLabel(input.label, STATUS_LABEL_MAX);
  if (!label.ok) return label;
  if (!isStatusColor(input.color))
    return { ok: false, error: "色が正しくありません。" };
  return {
    ok: true,
    value: { code: input.code, label: label.value, color: input.color },
  };
}

export function validateTaskTypeDraft(input: {
  code?: unknown;
  label?: unknown;
}): DraftResult<{ code: TaskType; label: string }> {
  if (!isTaskType(input.code))
    return { ok: false, error: "種別の種類が正しくありません。" };
  const label = checkLabel(input.label, TASK_TYPE_LABEL_MAX);
  if (!label.ok) return label;
  // 種別に色は無い（プルダウンにしか出ないため）。
  return { ok: true, value: { code: input.code, label: label.value } };
}
