import { supabase } from "./supabase";
import {
  createTask,
  createTasks,
  isTaskPriority,
  isTaskType,
  type Task,
  type TaskPriority,
  type TaskType,
} from "./tasks";

/**
 * 定型タスク (task templates): a parent plus its usual children, created in one
 * click so a recurring piece of work is registered the same way every time.
 *
 * Same shape as the other masters — defaults compiled in, the task_templates
 * table overrides them. That matters more here than elsewhere: generating uses
 * only the existing tasks table, so the whole feature works before the master
 * table exists. Until then the built-in templates are simply not editable.
 */

export type TemplateItem = {
  title: string;
  // 種別. Pre-filling it is half the value: an untyped task drops out of the
  // 種別 × 難易度 comparison the AI measurement phase depends on.
  //
  // 保存時は必須（API が null を弾く）。読み込みを null 許容のままにしてあるのは、
  // 種別なしで入った過去の行も表示できるようにするため（受けは寛容、出しは厳格）。
  taskType: TaskType | null;
  // 見積（時間）。任意。null＝生成後に手入力する、という従来どおりの動き。
  //
  // 入れた値はそのまま工数効率（見積 ÷ 実績）の分子になる。案件ごとに規模が
  // 違う作業に固定値を置くと指標が濁るので、「毎回だいたい同じ」と言い切れる
  // 雛形にだけ入れる想定。
  estimatedHours: number | null;
};

export type TaskTemplate = {
  code: string;
  name: string;
  priority: TaskPriority;
  items: TemplateItem[];
};

export const TEMPLATE_NAME_MAX = 50;
export const TEMPLATE_ITEM_TITLE_MAX = 50;
/** 雛形の数の上限。無制限だと一覧が壊れる。 */
export const TEMPLATE_MAX = 20;
/** 1雛形あたりの子タスク数の上限。 */
export const TEMPLATE_ITEM_MAX = 20;
/** 見積の上限（時間）。刻みは 0.5。 */
export const TEMPLATE_HOURS_MAX = 999;
export const TEMPLATE_HOURS_STEP = 0.5;

/**
 * Built-in templates. Deliberately carry no estimated hours: a made-up
 * estimate would flow straight into 工数効率 (見積 ÷ 実績) and quietly bias it.
 * Whoever generates the tasks enters the real numbers.
 */
export const DEFAULT_TEMPLATES: TaskTemplate[] = [
  {
    code: "feature",
    name: "新機能の実装",
    priority: "mid",
    items: [
      { title: "設計", taskType: "design", estimatedHours: null },
      { title: "実装", taskType: "implementation", estimatedHours: null },
      { title: "単体テスト", taskType: "test", estimatedHours: null },
    ],
  },
  {
    code: "integration_test",
    name: "結合試験の実施",
    priority: "mid",
    items: [
      { title: "試験項目書の作成", taskType: "documentation", estimatedHours: null },
      { title: "試験の実施", taskType: "test", estimatedHours: null },
      { title: "エビデンスの整理", taskType: "documentation", estimatedHours: null },
      { title: "結果の報告", taskType: "documentation", estimatedHours: null },
    ],
  },
  {
    code: "monthly_report",
    name: "月次レポート",
    priority: "low",
    items: [
      { title: "実績の集計", taskType: "research", estimatedHours: null },
      { title: "レビュー", taskType: "review", estimatedHours: null },
    ],
  },
];

/** 見積として受け入れられる値か。0 と負数は「入力なし」と同じ扱いで null にする。 */
function toHoursOrNull(raw: unknown): number | null {
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : NaN;
  if (!Number.isFinite(n) || n <= 0 || n > TEMPLATE_HOURS_MAX) return null;
  return n;
}

export function normalizeItems(raw: unknown): TemplateItem[] {
  if (!Array.isArray(raw)) return [];
  const items: TemplateItem[] = [];
  for (const r of raw) {
    const title =
      r && typeof r === "object" && typeof (r as { title?: unknown }).title === "string"
        ? (r as { title: string }).title.trim()
        : "";
    if (!title) continue;
    const t = (r as { task_type?: unknown }).task_type;
    items.push({
      title,
      taskType: isTaskType(t) ? t : null,
      estimatedHours: toHoursOrNull((r as { estimated_hours?: unknown }).estimated_hours),
    });
  }
  return items;
}

/** DB の1行を雛形に直す。列が壊れていても既定値へ寄せて落とさない。 */
export function rowToTemplate(row: {
  code: unknown;
  name?: unknown;
  priority?: unknown;
  items?: unknown;
}): TaskTemplate | null {
  const items = normalizeItems(row.items);
  // 子のいない雛形はただのタスク。雛形として出す意味がない。
  if (!items.length) return null;
  return {
    code: String(row.code),
    name: typeof row.name === "string" ? row.name : String(row.code),
    priority: isTaskPriority(row.priority) ? row.priority : "mid",
    items,
  };
}

export type TemplateLoad = {
  templates: TaskTemplate[];
  /**
   * DB から読めたか。false＝テーブルが無い／読めないので既定を表示している。
   *
   * 0 件と読めなかったのを区別するために要る。以前は「空なら既定を返す」
   * だったため、編集画面で雛形を全部消しても既定3件が復活して見えた。
   */
  fromDb: boolean;
};

/** Templates from the master table, built-in defaults when it cannot be read. */
export async function loadTaskTemplates(): Promise<TemplateLoad> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("code, name, priority, items, sort_order")
    .order("sort_order", { ascending: true });
  // テーブルが無い／読めない → 従来どおり既定へフォールバック
  if (error || !data) return { templates: DEFAULT_TEMPLATES, fromDb: false };

  // 読めたなら 0 件でも DB の答えとして扱う（既定に戻さない）
  const templates: TaskTemplate[] = [];
  for (const row of data) {
    const t = rowToTemplate(row);
    if (t) templates.push(t);
  }
  return { templates, fromDb: true };
}

/** 保存する形（DB の列にそのまま入る）。items は jsonb にそのまま載る。 */
export type TemplatePayload = {
  name: string;
  priority: TaskPriority;
  items: {
    title: string;
    task_type: TaskType;
    estimated_hours: number | null;
  }[];
};

export type TemplateValidation =
  | { ok: true; value: TemplatePayload }
  | { ok: false; error: string };

/**
 * 保存前の検証。API とテストの両方から使う純関数にしてある。
 *
 * 読み込み側（normalizeItems）が寛容なのに対し、ここは厳格。特に種別は
 * 必須で、空のまま保存させない（ダッシュボードの 種別 × 難易度 の集計から
 * 抜け落ちるため）。
 */
export function validateTemplateDraft(input: unknown): TemplateValidation {
  const body = (input ?? {}) as {
    name?: unknown;
    priority?: unknown;
    items?: unknown;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return { ok: false, error: "雛形の名前を入力してください。" };
  if (name.length > TEMPLATE_NAME_MAX)
    return {
      ok: false,
      error: `雛形の名前は${TEMPLATE_NAME_MAX}文字以内で入力してください。`,
    };

  if (!isTaskPriority(body.priority))
    return { ok: false, error: "優先度が正しくありません。" };

  if (!Array.isArray(body.items) || body.items.length === 0)
    return { ok: false, error: "子タスクを1件以上追加してください。" };
  if (body.items.length > TEMPLATE_ITEM_MAX)
    return {
      ok: false,
      error: `子タスクは${TEMPLATE_ITEM_MAX}件までです。`,
    };

  const items: TemplatePayload["items"] = [];
  for (const raw of body.items) {
    const r = (raw ?? {}) as {
      title?: unknown;
      task_type?: unknown;
      estimated_hours?: unknown;
    };
    const title = typeof r.title === "string" ? r.title.trim() : "";
    if (!title)
      return { ok: false, error: "子タスクの名前を入力してください。" };
    if (title.length > TEMPLATE_ITEM_TITLE_MAX)
      return {
        ok: false,
        error: `子タスクの名前は${TEMPLATE_ITEM_TITLE_MAX}文字以内で入力してください。`,
      };
    if (!isTaskType(r.task_type))
      return { ok: false, error: `「${title}」の種別を選んでください。` };

    // 空欄は「見積なし」。0 や空文字もここに落ちる。
    const rawHours = r.estimated_hours;
    let hours: number | null = null;
    if (rawHours !== null && rawHours !== undefined && rawHours !== "") {
      const n = Number(rawHours);
      if (!Number.isFinite(n) || n <= 0)
        return { ok: false, error: `「${title}」の見積は0より大きい数で入力してください。` };
      if (n > TEMPLATE_HOURS_MAX)
        return {
          ok: false,
          error: `「${title}」の見積は${TEMPLATE_HOURS_MAX}時間以内で入力してください。`,
        };
      if (Math.round(n / TEMPLATE_HOURS_STEP) * TEMPLATE_HOURS_STEP !== n)
        return {
          ok: false,
          error: `「${title}」の見積は${TEMPLATE_HOURS_STEP}時間刻みで入力してください。`,
        };
      hours = n;
    }

    items.push({ title, task_type: r.task_type, estimated_hours: hours });
  }

  return { ok: true, value: { name, priority: body.priority, items } };
}

/**
 * Create the parent and its children. The parent title is supplied by whoever
 * generates — "新機能の実装" as a literal task name helps nobody; "ログイン機能
 * の実装" does. Children keep the template's own titles, since the parent above
 * them already carries the context.
 *
 * Everything starts as todo with no assignee or due date: those are decisions
 * for the person planning the work, not for the template. 見積だけは例外で、
 * 雛形に入っていればそれを初期値として入れる（入っていなければ従来どおり空）。
 * 親タスクの見積は空のまま — 子の合計を勝手に入れない。
 */
export async function generateFromTemplate(
  template: TaskTemplate,
  parentTitle: string,
): Promise<{ parent: Task; children: Task[] }> {
  const title = parentTitle.trim() || template.name;
  const parent = await createTask({
    title,
    status: "todo",
    priority: template.priority,
  });
  try {
    const children = await createTasks(
      template.items.map((item) => ({
        title: item.title,
        status: "todo" as const,
        priority: template.priority,
        taskType: item.taskType,
        estimatedHours: item.estimatedHours,
        parentId: parent.id,
      })),
    );
    return { parent, children };
  } catch (e) {
    // A parent with no children is worse than nothing: it counts as a leaf and
    // would quietly join the progress denominator. Undo it.
    await supabase.from("tasks").delete().eq("id", parent.id);
    throw e;
  }
}
