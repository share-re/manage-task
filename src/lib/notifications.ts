import { supabase } from "./supabase";

// アプリ内通知（notifications）… 懸念メモ_実装手順書 Step6。
// 「他人が、自分が担当のタスクに懸念メモを追加した」ときにDBトリガーが1件作る。
// クライアントは読む／既読にするだけ（挿入・削除はRLSで禁止）。

/** ベルに出す最大件数。古い通知まで無限に読むと重いので直近だけ見る。 */
export const NOTIFICATION_LIMIT = 50;

export type AppNotification = {
  id: string;
  type: string; // "concern_note"（懸念メモ）／"finding"（品質の記録）
  task_id: string | null;
  note_id: string | null;
  read: boolean;
  created_at: string;
  actorName: string | null; // 通知の原因を作った人の表示名
  taskTitle: string | null; // 対象タスク名
};

// actor（profiles）と task（tasks）を埋め込みで一緒に引く。行ごとに引き直すと
// N+1 になるため、PostgREST の埋め込みで1回のリクエストにまとめる。
const NOTIFICATION_COLUMNS =
  "id, type, task_id, note_id, read, created_at, actor:profiles!actor_id(name, email), task:tasks!task_id(title)";

function textOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

// 埋め込みは実装によって配列で返ることがあるので、単体に均す。
function firstRow(v: unknown): Record<string, unknown> | null {
  if (Array.isArray(v)) return (v[0] as Record<string, unknown>) ?? null;
  if (v && typeof v === "object") return v as Record<string, unknown>;
  return null;
}

/**
 * 1行を正規化する。actor/task は PostgREST の埋め込みで、実装によって単体オブジェクト
 * にも配列にもなりうるため firstRow で均す（形が変わると表示名が静かに消えるため）。
 * export しているのはテスト用。
 */
export function normalizeNotification(
  row: Record<string, unknown>,
): AppNotification {
  const actor = firstRow(row.actor);
  const task = firstRow(row.task);
  return {
    id: String(row.id),
    type: typeof row.type === "string" ? row.type : "",
    task_id: typeof row.task_id === "string" ? row.task_id : null,
    note_id: typeof row.note_id === "string" ? row.note_id : null,
    read: row.read === true,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    // 表示名が未設定のメンバーはメールで代替する（members.ts と同じ考え方）。
    actorName: actor
      ? (textOrNull(actor.name) ?? textOrNull(actor.email))
      : null,
    taskTitle: task ? textOrNull(task.title) : null,
  };
}

/**
 * 自分宛の通知を新しい順に取得。RLSで自分宛だけが返る。
 *
 * 失敗は握りつぶさず throw する: 取得できなかったことを「通知ゼロ」と同じ
 * 見た目にしてはいけない（呼び出し側でエラー表示にする）。
 */
export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);
  if (error) throw error;
  return (data ?? []).map((r) =>
    normalizeNotification(r as Record<string, unknown>),
  );
}

/** 1件を既読にする。 */
export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

/** 自分宛の未読をまとめて既読にする（RLSで自分宛だけが対象）。 */
export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) throw error;
}

// --- 純関数（テスト対象） ---

/** 未読件数（バッジの数字）。 */
export function unreadCount(list: AppNotification[]): number {
  return list.filter((n) => !n.read).length;
}

/**
 * 通知の本文。相手の表示名やタスク名が取れないことがある（退会・削除など）ので
 * 必ずフォールバックを持たせ、文言が欠けないようにする。
 */
export function notificationText(n: AppNotification): string {
  const who = n.actorName ?? "誰か";
  const task = n.taskTitle ?? "タスク";
  if (n.type === "finding")
    return `${who}さんが「${task}」に不具合・指摘を記録しました`;
  if (n.type === "concern_note")
    return `${who}さんが「${task}」に懸念メモを追加しました`;
  return `${who}さんから通知があります`;
}

/** 相対表記（たった今 / n分前 / n時間前 / n日前 / 日付）。 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diffMin = Math.floor((now.getTime() - t) / 60_000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
