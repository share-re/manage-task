import {
  leafTasks,
  TASK_TYPE_META,
  type Task,
  type TaskStatus,
  type TaskType,
} from "./tasks";

// フェーズ3：工数管理・生産性の集計（純粋関数・Supabase非依存でテスト可能）… 第15章。
//
// 用語：
//  ・A 工数効率      ＝ Σ見積 ÷ Σ実績（完了かつ見積>0・実績>0 のリーフのみ）。1.0＝見積どおり。
//  ・B 1人日あたり完了数 ＝ 完了件数 ÷ 人日（人日＝Σ実績 ÷ 人日換算係数）。
//  ・推移            ＝ 完了日（completed_at）でリーフを週/月に振り分ける。日別按分はしない。
//  ・工程            ＝ task_type（機能＝親タスク名）。

const NO_FEATURE_LABEL = "（親なし）";
const NO_STEP_LABEL = "未設定";

/** 作業一覧の1行（リーフ＋機能名＋工程）。集計・絞り込みはこの型に対して行う。 */
export type WorkItem = {
  id: string;
  name: string; // リーフ名
  feature: string; // 親タスク名（親なしは「（親なし）」）
  step: TaskType | null; // 工程＝task_type
  stepLabel: string; // 工程の表示名（null は「未設定」）
  estimated: number | null;
  actual: number | null;
  status: TaskStatus;
  completedAt: string | null;
  assigneeId: string | null; // 担当（本人タブの絞り込み用）
};

/**
 * Build the work-item rows from a flat task list: leaves only, each carrying its
 * feature (parent title) and step (task_type). Parents that merely group
 * children are excluded so nothing is double-counted.
 */
export function buildWorkItems(tasks: Task[]): WorkItem[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return leafTasks(tasks).map((t) => {
    const parent = t.parent_id ? byId.get(t.parent_id) : undefined;
    return {
      id: t.id,
      name: t.title,
      feature: parent ? parent.title : NO_FEATURE_LABEL,
      step: t.task_type,
      stepLabel: t.task_type ? TASK_TYPE_META[t.task_type].label : NO_STEP_LABEL,
      estimated: t.estimated_hours,
      actual: t.actual_hours,
      status: t.status,
      completedAt: t.completed_at,
      assigneeId: t.assignee_id,
    };
  });
}

/** A work item counts toward 工数効率A when it is done and has both hours (>0). */
function qualifiesForEfficiency(w: WorkItem): boolean {
  return (
    w.status === "done" &&
    w.estimated != null &&
    w.estimated > 0 &&
    w.actual != null &&
    w.actual > 0
  );
}

/**
 * A. 工数効率 ＝ Σ見積 ÷ Σ実績（完了・見積>0・実績>0 のリーフ）。対象0件なら null
 * （「未計測」表示用）。est/act も返し、内訳「見積◯h÷実績◯h」に使う。
 */
export function workEfficiency(
  items: WorkItem[],
): { ratio: number; count: number; est: number; act: number } | null {
  let est = 0;
  let act = 0;
  let count = 0;
  for (const w of items) {
    if (!qualifiesForEfficiency(w)) continue;
    est += w.estimated as number;
    act += w.actual as number;
    count++;
  }
  if (count === 0 || act <= 0) return null;
  return { ratio: est / act, count, est, act };
}

/**
 * B. 1人日あたり完了数 ＝ 完了件数 ÷ 人日。人日＝Σ実績 ÷ personDayHours。
 * 実績>0 の完了リーフを対象（分子の件数と分母の人日を揃える）。対象なしは null。
 */
export function completionsPerPersonDay(
  items: WorkItem[],
  personDayHours: number,
): { value: number; count: number; personDays: number } | null {
  if (!(personDayHours > 0)) return null;
  let actualSum = 0;
  let count = 0;
  for (const w of items) {
    if (w.status !== "done" || w.actual == null || w.actual <= 0) continue;
    actualSum += w.actual;
    count++;
  }
  if (count === 0) return null;
  const personDays = actualSum / personDayHours;
  if (personDays <= 0) return null;
  return { value: count / personDays, count, personDays };
}

/** 作業一覧の絞り込み（機能＝親名の完全一致／工程＝task_type の完全一致）。 */
export function filterWorkItems(
  items: WorkItem[],
  opts: { feature?: string; step?: TaskType | "" },
): WorkItem[] {
  const { feature, step } = opts;
  return items.filter(
    (w) =>
      (!feature || w.feature === feature) && (!step || w.step === step),
  );
}

/** 絞り込み用：作業一覧に現れる機能名（親タスク名）の一覧（昇順・重複なし）。 */
export function distinctFeatures(items: WorkItem[]): string[] {
  return [...new Set(items.map((w) => w.feature))].sort((a, b) =>
    a.localeCompare(b, "ja"),
  );
}

/** 推移の1点：期間ラベル・効率・件数n・n<3で前週比を抑制するフラグ。 */
export type TrendPoint = {
  label: string;
  ratio: number | null;
  n: number;
  suppressDelta: boolean;
};

// n<3 は件数が少なく比率が跳ねやすいので、前週比の断定（矢印）を出さない… 第15章。
const MIN_N_FOR_DELTA = 3;

// --- date helpers (UTC・ISO日付文字列で比較して tz ずれを避ける) ---

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function utcDate(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}
// ISO週（月曜始まり）の週頭。
function startOfWeek(d: Date): Date {
  const base = utcDate(d);
  const sinceMonday = (base.getUTCDay() + 6) % 7; // 0=Sun..6=Sat → Monからの日数
  return addDays(base, -sinceMonday);
}
// 完了日（completed_at）の日付部分。無ければ null。
function completedDay(w: WorkItem): string | null {
  return w.completedAt ? w.completedAt.slice(0, 10) : null;
}

/** baseDate が属する週（月曜〜日曜）の窓を ISO 日付文字列で返す。 */
export function weekWindow(baseDate: Date): { start: string; end: string } {
  const start = startOfWeek(baseDate);
  return { start: ymd(start), end: ymd(addDays(start, 6)) };
}

/** 完了リーフのうち、完了日が窓 [start, end]（両端含む）に入るものだけ返す。 */
export function completedWithin(
  items: WorkItem[],
  window: { start: string; end: string },
): WorkItem[] {
  return items.filter((w) => {
    if (w.status !== "done") return false;
    const day = completedDay(w);
    return day != null && day >= window.start && day <= window.end;
  });
}

// 与えた窓 [startStr, endStr]（両端含む）に完了したリーフで A を計算し1点にまとめる。
function trendPoint(
  items: WorkItem[],
  label: string,
  startStr: string,
  endStr: string,
): TrendPoint {
  const inWindow = items.filter((w) => {
    if (!qualifiesForEfficiency(w)) return false;
    const day = completedDay(w);
    return day != null && day >= startStr && day <= endStr;
  });
  const eff = workEfficiency(inWindow);
  const n = eff?.count ?? 0;
  return {
    label,
    ratio: eff ? eff.ratio : null,
    n,
    suppressDelta: n < MIN_N_FOR_DELTA,
  };
}

/**
 * 週の推移（既定 直近4週）。completed_at 基準で各週に振り分け、古い週→新しい週の順で返す。
 * ラベルは週頭日付（例「7/20〜」）。baseDate の属する週を最新とする。
 */
export function weeklyEfficiencyTrend(
  items: WorkItem[],
  baseDate: Date,
  weeks = 4,
): TrendPoint[] {
  const currentWeekStart = startOfWeek(baseDate);
  const points: TrendPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(currentWeekStart, -i * 7);
    const end = addDays(start, 6);
    const label = `${start.getUTCMonth() + 1}/${start.getUTCDate()}〜`;
    points.push(trendPoint(items, label, ymd(start), ymd(end)));
  }
  return points;
}

/**
 * 月の推移（既定 直近3ヶ月）。completed_at 基準で各暦月に振り分け、古い月→新しい月の順。
 * ラベルは「7月」。baseDate の属する月を最新とする。
 */
export function monthlyEfficiencyTrend(
  items: WorkItem[],
  baseDate: Date,
  months = 3,
): TrendPoint[] {
  const baseYear = baseDate.getUTCFullYear();
  const baseMonth = baseDate.getUTCMonth(); // 0-based
  const points: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(baseYear, baseMonth - i, 1));
    const end = new Date(Date.UTC(baseYear, baseMonth - i + 1, 0)); // 月末日
    const label = `${start.getUTCMonth() + 1}月`;
    points.push(trendPoint(items, label, ymd(start), ymd(end)));
  }
  return points;
}

/**
 * 前週比（推移の最新2点から）。両方に効率があり、最新点が n>=3 のときだけ比率を返す。
 * 返り値 ratio は「1.14＝+14%」の意味。抑制時は null。
 */
export function latestDelta(points: TrendPoint[]): number | null {
  if (points.length < 2) return null;
  const latest = points[points.length - 1];
  const prev = points[points.length - 2];
  if (latest.suppressDelta) return null;
  if (latest.ratio == null || prev.ratio == null || prev.ratio === 0)
    return null;
  return latest.ratio / prev.ratio;
}
