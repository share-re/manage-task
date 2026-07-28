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
  taskType: TaskType | null;
};

export type TaskTemplate = {
  code: string;
  name: string;
  priority: TaskPriority;
  items: TemplateItem[];
};

export const TEMPLATE_NAME_MAX = 30;

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
      { title: "設計", taskType: "design" },
      { title: "実装", taskType: "implementation" },
      { title: "単体テスト", taskType: "test" },
    ],
  },
  {
    code: "integration_test",
    name: "結合試験の実施",
    priority: "mid",
    items: [
      { title: "試験項目書の作成", taskType: "documentation" },
      { title: "試験の実施", taskType: "test" },
      { title: "エビデンスの整理", taskType: "documentation" },
      { title: "結果の報告", taskType: "documentation" },
    ],
  },
  {
    code: "monthly_report",
    name: "月次レポート",
    priority: "low",
    items: [
      { title: "実績の集計", taskType: "research" },
      { title: "レビュー", taskType: "review" },
    ],
  },
];

function normalizeItems(raw: unknown): TemplateItem[] {
  if (!Array.isArray(raw)) return [];
  const items: TemplateItem[] = [];
  for (const r of raw) {
    const title =
      r && typeof r === "object" && typeof (r as { title?: unknown }).title === "string"
        ? (r as { title: string }).title.trim()
        : "";
    if (!title) continue;
    const t = (r as { task_type?: unknown }).task_type;
    items.push({ title, taskType: isTaskType(t) ? t : null });
  }
  return items;
}

/** Templates from the master table, built-in defaults on any failure. */
export async function loadTaskTemplates(): Promise<TaskTemplate[]> {
  const { data, error } = await supabase
    .from("task_templates")
    .select("code, name, priority, items, sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data?.length) return DEFAULT_TEMPLATES;

  const templates: TaskTemplate[] = [];
  for (const row of data) {
    const items = normalizeItems(row.items);
    // A template with no children would create a lone parent, which is just a
    // task — not worth offering as a template.
    if (!items.length) continue;
    templates.push({
      code: String(row.code),
      name: typeof row.name === "string" ? row.name : String(row.code),
      priority: isTaskPriority(row.priority) ? row.priority : "mid",
      items,
    });
  }
  return templates.length ? templates : DEFAULT_TEMPLATES;
}

/**
 * Create the parent and its children. The parent title is supplied by whoever
 * generates — "新機能の実装" as a literal task name helps nobody; "ログイン機能
 * の実装" does. Children keep the template's own titles, since the parent above
 * them already carries the context.
 *
 * Everything starts as todo with no assignee or due date: those are decisions
 * for the person planning the work, not for the template.
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
