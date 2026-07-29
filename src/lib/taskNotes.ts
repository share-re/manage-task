import { supabase } from "./supabase";

// 懸念メモ（task_notes）… 懸念メモ_実装手順書 v1.2。
// タスクごとに懸念事項を自由メモで複数追記し、未対応が1件以上あるタスクに「！」を出す。
// 既存のコメント機能（comments.ts）を置き換える。

export const NOTE_SOFT_LIMIT = 100; // 目安（超えたらカウンターを赤くするだけ）
// ハード上限（DBの check 制約と一致させる）。引き継ぎメモに手順や背景を書くと
// 300字では窮屈という利用者レビューを受けて500字に緩めた。
export const NOTE_MAX_LENGTH = 500;

export type TaskNote = {
  id: string;
  task_id: string;
  body: string;
  author: string | null; // レガシー表示名（旧コメント移行分のフォールバック）
  author_id: string | null; // 新規はこちらが正
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null; // 誰が対応済みにしたか（DBトリガーが刻む）
  migrated_from_comment_id: string | null; // 非nullなら旧コメント由来
  created_at: string;
};

const NOTE_COLUMNS =
  "id, task_id, body, author, author_id, resolved, resolved_at, resolved_by, migrated_from_comment_id, created_at";

function normalizeNote(row: Record<string, unknown>): TaskNote {
  return {
    id: String(row.id),
    task_id: String(row.task_id),
    body: typeof row.body === "string" ? row.body : "",
    author: typeof row.author === "string" ? row.author : null,
    author_id: typeof row.author_id === "string" ? row.author_id : null,
    resolved: row.resolved === true,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    resolved_by: typeof row.resolved_by === "string" ? row.resolved_by : null,
    migrated_from_comment_id:
      typeof row.migrated_from_comment_id === "string"
        ? row.migrated_from_comment_id
        : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/**
 * 指定タスク群の「生きている」メモを取得（古い順）。案件スコープは呼び出し側が
 * 現在の案件のタスクIDを渡すことで担保する。
 *
 * 失敗は握りつぶさず throw する: 取得できなかったことを「懸念なし」と同じ見た目に
 * してはいけない（呼び出し側で「!?」表示にする）。
 */
export async function listTaskNotes(taskIds: string[]): Promise<TaskNote[]> {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from("task_notes")
    .select(NOTE_COLUMNS)
    .in("task_id", taskIds)
    .is("deleted_at", null) // ソフト削除は除外
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => normalizeNote(r as Record<string, unknown>));
}

/** 本文の検証（UI とデータ層の両方で使う）。問題なければ null、あればメッセージ。 */
export function validateNoteBody(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return "メモを入力してください。";
  if (trimmed.length > NOTE_MAX_LENGTH)
    return `メモは${NOTE_MAX_LENGTH}字以内で入力してください。`;
  return null;
}

/** メモを追記する。author_id は自分のIDのみ（DBの insert ポリシーで強制される）。 */
export async function addTaskNote(
  taskId: string,
  body: string,
  authorId: string | null,
): Promise<TaskNote> {
  const problem = validateNoteBody(body);
  if (problem) throw new Error(problem);
  const { data, error } = await supabase
    .from("task_notes")
    .insert({ task_id: taskId, body: body.trim(), author_id: authorId })
    .select(NOTE_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeNote(data as Record<string, unknown>);
}

/**
 * 対応状況の切替（対応済み↔未対応）。
 * resolved_by / resolved_at は送らない: DBトリガーが auth.uid() / now() を刻む
 * （クライアントには resolved 列の更新権限しか無いので、送れば権限エラーになる）。
 */
export async function setNoteResolved(
  id: string,
  resolved: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("task_notes")
    .update({ resolved })
    .eq("id", id);
  if (error) throw error;
}

/**
 * ソフト削除（DBからは消さず deleted_at を立てる）。
 * 「投稿者本人か管理者か」の判定は DB 関数側で強制されるので、ここでは呼ぶだけ。
 */
export async function softDeleteTaskNote(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_task_note", {
    note_id: id,
  });
  if (error) throw error;
}

// --- 純関数（テスト対象） ---

/**
 * タスクごとの未対応メモ件数。一覧を描く前に1回だけ作り、各行はこの Map を引く
 * （タスクごとに全メモを走査すると O(タスク×メモ) になるため）。
 */
export function openNoteCountByTask(notes: TaskNote[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const n of notes) {
    if (n.resolved) continue;
    m.set(n.task_id, (m.get(n.task_id) ?? 0) + 1);
  }
  return m;
}

/**
 * 投稿者の表示名：author_id からメンバー名を引き、無ければ旧 author 文字列に
 * フォールバックする（移行分は author_id が埋まらないことがあるため）。
 */
export function noteAuthorLabel(
  note: Pick<TaskNote, "author" | "author_id">,
  labelById: Map<string, string>,
): string {
  if (note.author_id) return labelById.get(note.author_id) ?? note.author ?? "不明";
  return note.author ?? "不明";
}
