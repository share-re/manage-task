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

// --- 横断一覧（/tasks/notes）用 ---
//
// 「未対応の懸念が放置されていないか」を案件横断で見る画面のための純関数。
// 品質タブ（発見総数＝直しても減らない）とは逆で、こちらは未対応だけを数える。
// 懸念は品質の物差しではなく拾い漏れ防止なので、対応したら消えてよい。

/** 一覧に出す本文の短縮長。右側の列が見切れない長さ（品質タブと揃えている）。 */
export const NOTE_SUMMARY_LENGTH = 40;

/** 放置日数のしきい値。超えると一覧のバッジが色づく。 */
export const NOTE_STALE_DAYS = 7;
export const NOTE_WARN_DAYS = 3;

/**
 * 一覧用に本文を1行へ短縮する。
 *
 * 本文は改行入りで500字まで書けるが、表は table-fixed で列幅を固定しているため
 * そのまま流すと1行に収まらない。ここで文字数を切ってから描く。
 * 全文はツールチップ（title 属性）で読める。
 */
export function summarizeNoteBody(
  body: string,
  max: number = NOTE_SUMMARY_LENGTH,
): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

/**
 * 記録日から今日までの経過日数（暦日）。
 *
 * 時刻ではなく日付で数える: 「昨日の23時」と「今日の1時」は2時間差でも
 * 利用者の感覚では1日違うため。負にはしない（未来日付は0扱い）。
 */
export function daysSince(createdAt: string, now: Date = new Date()): number {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;
  const startOf = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = startOf(now) - startOf(created);
  return Math.max(0, Math.round(diff / 86_400_000));
}

/** 放置日数の区分。バッジの色分けに使う。 */
export type NoteAge = "stale" | "warn" | "fresh";

export function noteAge(days: number): NoteAge {
  if (days >= NOTE_STALE_DAYS) return "stale";
  if (days >= NOTE_WARN_DAYS) return "warn";
  return "fresh";
}

/**
 * 担当者の絞り込み条件。
 *   null       … すべて
 *   "__none__" … 担当者が未設定のものだけ
 *   それ以外    … その profiles.id が担当のものだけ
 */
export type OwnerFilter = string | null;
export const OWNER_NONE = "__none__";

export function matchesOwner(
  assigneeId: string | null,
  filter: OwnerFilter,
): boolean {
  if (filter === null) return true;
  if (filter === OWNER_NONE) return assigneeId === null;
  return assigneeId === filter;
}

export type CrossViewNote = {
  note: TaskNote;
  /** メモが付いている作業（リーフ）。 */
  taskId: string;
  taskTitle: string;
  /** その作業の親（機能）。親が無いものは null。 */
  featureId: string | null;
  featureTitle: string;
  assigneeId: string | null;
  assigneeLabel: string | null;
  authorLabel: string;
  days: number;
};

export type NoteFeatureGroup = {
  key: string;
  name: string;
  items: CrossViewNote[];
  count: number;
  /** 配下でいちばん長く放置されている日数。たたんだままでも危険度が分かる。 */
  maxDays: number;
};

/**
 * 機能（親タスク）ごとにまとめ、放置が長い順に並べる。
 *
 * 並び順を「放置が長い順」既定にしているのは、この画面の目的が
 * 「どれが忘れられているか」を見つけることだから（機能名順だと毎回同じ順で
 * 並び、危ないものが下に埋もれる）。
 */
export type NoteSort = "age" | "count" | "name";

export function groupNotesByFeature(
  notes: CrossViewNote[],
  sort: NoteSort = "age",
): NoteFeatureGroup[] {
  const map = new Map<string, CrossViewNote[]>();
  for (const n of notes) {
    const key = n.featureId ?? "__standalone__";
    const list = map.get(key) ?? [];
    list.push(n);
    map.set(key, list);
  }

  const groups: NoteFeatureGroup[] = [...map].map(([key, items]) => {
    const sorted = [...items].sort((a, b) => b.days - a.days);
    return {
      key,
      name: sorted[0].featureTitle,
      items: sorted,
      count: sorted.length,
      maxDays: sorted[0].days,
    };
  });

  groups.sort((a, b) => {
    if (sort === "count") return b.count - a.count || b.maxDays - a.maxDays;
    if (sort === "name") return a.name.localeCompare(b.name, "ja");
    return b.maxDays - a.maxDays || b.count - a.count;
  });
  return groups;
}

/**
 * タイルに出す件数。
 *
 * 「未対応」「n日以上放置」は担当者の絞り込みに追従させる（一覧と数字が
 * 食い違うと読み手が混乱するため）。「担当者なし」だけは絞り込みに関係なく
 * 全体を数える: 自分に絞った瞬間に 0 になると、誰も拾っていない懸念が
 * 視界から消えてしまうため。
 */
export function noteSummary(
  all: CrossViewNote[],
  owner: OwnerFilter,
): { open: number; stale: number; unassigned: number } {
  const scoped = all.filter((n) => matchesOwner(n.assigneeId, owner));
  return {
    open: scoped.length,
    stale: scoped.filter((n) => n.days >= NOTE_STALE_DAYS).length,
    unassigned: all.filter((n) => n.assigneeId === null).length,
  };
}
