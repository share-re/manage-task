import { supabase } from "./supabase";

// 品質（task_findings）… 品質_実装手順書 v1.1。
// テスト以降に見つかった不具合・指摘を1行ずつ記録し、工程別・機能別に数える。
// バグを直す管理ツールではなく「品質の物差しを取るための記録」。
//
// 数え方が2種類あるので混同しないこと：
//   発見総数 … 対応済みも取り消しも含めた合計。品質タブの主数字。直しても減らない
//   未対応   … まだ直していない件数。タスク行のバッジ。直すと減る

// 目安（超えたらカウンターを赤くするだけ）。1行で書ける程度を想定。
export const FINDING_SOFT_LIMIT = 100;
// ハード上限。DBの check 制約と一致させる（懸念メモと同じ）。
export const FINDING_MAX_LENGTH = 500;

export type FindingPhase = "test" | "review" | "accept" | "post";

export const PHASE_ORDER: FindingPhase[] = ["test", "review", "accept", "post"];

// 英語コードはDB、日本語ラベルはUI（tasks.ts の STATUS_META と同じ形）。
export const PHASE_META: Record<
  FindingPhase,
  { label: string; tileLabel: string; color: string; badgeClass: string }
> = {
  test: {
    label: "テスト",
    tileLabel: "テスト不具合",
    color: "#E24B4A",
    badgeClass: "bg-red-100 text-red-700",
  },
  review: {
    label: "レビュー",
    tileLabel: "レビュー指摘",
    color: "#378ADD",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  accept: {
    label: "受入",
    tileLabel: "受入指摘",
    color: "#9333EA",
    badgeClass: "bg-purple-100 text-purple-700",
  },
  post: {
    label: "リリース後",
    tileLabel: "リリース後不具合",
    color: "#BA7517",
    badgeClass: "bg-amber-100 text-amber-800",
  },
};

export function isFindingPhase(value: unknown): value is FindingPhase {
  return (
    typeof value === "string" &&
    (PHASE_ORDER as readonly string[]).includes(value)
  );
}

export type TaskFinding = {
  id: string;
  task_id: string;
  phase: FindingPhase;
  body: string;
  author: string | null; // レガシー表示名（将来の移行用フォールバック）
  author_id: string | null; // 新規はこちらが正
  found_on: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null; // 誰が対応済みにしたか（DBトリガーが刻む）
  deleted_at: string | null; // 取り消し（入力ミスの取り消し専用）
  created_at: string;
};

const FINDING_COLUMNS =
  "id, task_id, phase, body, author, author_id, found_on, resolved, resolved_at, resolved_by, deleted_at, created_at";

function normalizeFinding(row: Record<string, unknown>): TaskFinding {
  return {
    id: String(row.id),
    task_id: String(row.task_id),
    phase: isFindingPhase(row.phase) ? row.phase : "test",
    body: typeof row.body === "string" ? row.body : "",
    author: typeof row.author === "string" ? row.author : null,
    author_id: typeof row.author_id === "string" ? row.author_id : null,
    found_on: typeof row.found_on === "string" ? row.found_on : "",
    resolved: row.resolved === true,
    resolved_at: typeof row.resolved_at === "string" ? row.resolved_at : null,
    resolved_by: typeof row.resolved_by === "string" ? row.resolved_by : null,
    deleted_at: typeof row.deleted_at === "string" ? row.deleted_at : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
  };
}

/**
 * 入力パネル用：取り消し済みを除いた記録を古い順で取得。
 *
 * 失敗は握りつぶさず throw する: 取得できなかったことを「不具合ゼロ」と同じ
 * 見た目にしてはいけない（呼び出し側でエラー表示にする）。
 */
export async function listTaskFindings(
  taskIds: string[],
): Promise<TaskFinding[]> {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from("task_findings")
    .select(FINDING_COLUMNS)
    .in("task_id", taskIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => normalizeFinding(r as Record<string, unknown>));
}

/**
 * 品質タブ（集計）用：取り消し済みも含めて取得する。
 *
 * 集計から取り消し分を除くと、「自分が記録した不具合を自分で取り消して件数を下げる」
 * ことができてしまい、品質の物差しとして壊れる。そのため集計だけ全件を見る。
 */
export async function listFindingsForStats(
  taskIds: string[],
): Promise<TaskFinding[]> {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase
    .from("task_findings")
    .select(FINDING_COLUMNS)
    .in("task_id", taskIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => normalizeFinding(r as Record<string, unknown>));
}

/** 本文の検証（UI とデータ層の両方で使う）。問題なければ null、あればメッセージ。 */
export function validateFindingBody(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return "内容を入力してください。";
  if (trimmed.length > FINDING_MAX_LENGTH)
    return `内容は${FINDING_MAX_LENGTH}字以内で入力してください。`;
  return null;
}

/** 記録を追加する。author_id は自分のIDのみ（DBの insert ポリシーで強制される）。 */
export async function addTaskFinding(
  taskId: string,
  phase: FindingPhase,
  body: string,
  authorId: string | null,
): Promise<TaskFinding> {
  const problem = validateFindingBody(body);
  if (problem) throw new Error(problem);
  const { data, error } = await supabase
    .from("task_findings")
    .insert({
      task_id: taskId,
      phase,
      body: body.trim(),
      author_id: authorId,
    })
    .select(FINDING_COLUMNS)
    .single();
  if (error) throw error;
  return normalizeFinding(data as Record<string, unknown>);
}

/**
 * 対応状況の切替（対応済み↔未対応）。
 * resolved_by / resolved_at は送らない: DBトリガーが auth.uid() / now() を刻む
 * （クライアントには resolved 列の更新権限しか無いので、送れば権限エラーになる）。
 */
export async function setFindingResolved(
  id: string,
  resolved: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("task_findings")
    .update({ resolved })
    .eq("id", id);
  if (error) throw error;
}

/**
 * 取り消し（ソフト削除）。入力ミスの取り消し専用で、直したときは対応済みにする。
 * 「記録者本人か管理者か」の判定は DB 関数側で強制されるので、ここでは呼ぶだけ。
 */
export async function softDeleteTaskFinding(id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_task_finding", {
    finding_id: id,
  });
  if (error) throw error;
}

/** 「テスト実施済み」フラグの切替（0件と未確認を区別するため）。 */
export async function setQualityChecked(
  taskId: string,
  checked: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ quality_checked_at: checked ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) throw error;
}

// --- 純関数（テスト対象） ---

/**
 * タスクごとの「未対応」件数（行のバッジ用）。取り消し済みは数えない。
 * 一覧を描く前に1回だけ作り、各行はこの Map を引く。
 */
export function openFindingCountByTask(
  findings: TaskFinding[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const f of findings) {
    if (f.resolved || f.deleted_at) continue;
    m.set(f.task_id, (m.get(f.task_id) ?? 0) + 1);
  }
  return m;
}

/**
 * タスクごとの「発見総数」（集計用）。対応済みも取り消し済みも含める。
 * 直しても消しても減らないのが、品質の物差しとしての要件。
 */
export function findingCountByTask(
  findings: TaskFinding[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const f of findings) {
    m.set(f.task_id, (m.get(f.task_id) ?? 0) + 1);
  }
  return m;
}

/** 工程ごとの件数（発見総数）。品質タブのタイルと割合バーで使う。 */
export function countByPhase(
  findings: TaskFinding[],
): Record<FindingPhase, number> {
  const counts: Record<FindingPhase, number> = {
    test: 0,
    review: 0,
    accept: 0,
    post: 0,
  };
  for (const f of findings) counts[f.phase] += 1;
  return counts;
}

/**
 * 「未確認 / 0件 / n件」の表示状態を1つに決める。
 *
 * ⚠ 第2引数には必ず「発見総数（対応済み・取り消し済みを含む）」を渡すこと。
 * 誤って「未対応件数」を渡すと、不具合を全部直したタスクが "zero"（＝✓0件で確定）
 * になり、実際は不具合があったのに「最初からゼロ」に見える。
 */
export function qualityState(
  checkedAt: string | null,
  totalFound: number,
): "unchecked" | "zero" | "has" {
  if (totalFound > 0) return "has";
  return checkedAt ? "zero" : "unchecked";
}

/**
 * 一覧に出す本文の短縮形の既定長。
 * 右側の「作業／記録者 → 担当者」が見切れない長さに合わせている。
 */
export const FINDING_SUMMARY_LENGTH = 40;

/**
 * 一覧用に本文を1行へ短縮する。
 *
 * 本文は改行入りで数百字書けるが、一覧の表は中身に合わせて広がるため（table-layout
 * が auto）、CSS の truncate だけでは表そのものが横に伸びてしまう。ここで文字数を
 * 切ってから描くことで、レイアウトが本文の長さに引きずられないようにする。
 * 全文はツールチップ（title 属性）とパネル側で読める。
 */
export function summarizeFindingBody(
  body: string,
  max: number = FINDING_SUMMARY_LENGTH,
): string {
  // 改行・連続スペースは1つの空白に潰す（1行で見せるため）。
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

/**
 * 記録者の表示名：author_id からメンバー名を引き、無ければ author 文字列に
 * フォールバックする（taskNotes.noteAuthorLabel と同じ考え方）。
 */
export function findingAuthorLabel(
  finding: Pick<TaskFinding, "author" | "author_id">,
  labelById: Map<string, string>,
): string {
  if (finding.author_id)
    return labelById.get(finding.author_id) ?? finding.author ?? "不明";
  return finding.author ?? "不明";
}
