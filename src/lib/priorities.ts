import { supabase } from "./supabase";
import {
  isTaskPriority,
  PRIORITY_META,
  PRIORITY_ORDER,
  type TaskPriority,
} from "./tasks";

/**
 * Priority presentation, read from the task_priorities master table.
 *
 * The priority codes themselves (high / mid / low) stay compiled in — they are
 * what tasks.priority stores. Only the label and the color are data, so the
 * master screen can rename or recolor a level without a migration.
 */

// Tailwind only emits CSS for classes it can find in the source, so a class
// stored solely as a DB string would render with no styling at all. The DB
// therefore holds a color KEY and this table turns it into real classes.
export const PRIORITY_COLORS = {
  red: {
    label: "レッド",
    badgeClass: "bg-red-100 text-red-700",
    swatch: "#fecaca",
  },
  amber: {
    label: "アンバー",
    badgeClass: "bg-amber-100 text-amber-700",
    swatch: "#fde68a",
  },
  green: {
    label: "グリーン",
    badgeClass: "bg-emerald-100 text-emerald-700",
    swatch: "#a7f3d0",
  },
  blue: {
    label: "ブルー",
    badgeClass: "bg-blue-100 text-blue-700",
    swatch: "#bfdbfe",
  },
  purple: {
    label: "パープル",
    badgeClass: "bg-violet-100 text-violet-700",
    swatch: "#ddd6fe",
  },
  gray: {
    label: "グレー",
    badgeClass: "bg-zinc-100 text-zinc-600",
    swatch: "#e5e7eb",
  },
} as const;

export type PriorityColor = keyof typeof PRIORITY_COLORS;

export const PRIORITY_COLOR_ORDER: PriorityColor[] = [
  "red",
  "amber",
  "green",
  "blue",
  "purple",
  "gray",
];

export function isPriorityColor(value: unknown): value is PriorityColor {
  return typeof value === "string" && value in PRIORITY_COLORS;
}

export type PriorityMeta = {
  label: string;
  color: PriorityColor;
  badgeClass: string;
  // Sort position. Derived from PRIORITY_ORDER rather than stored: with the
  // three levels fixed there is nothing to reorder. It becomes a column only
  // if priorities ever become addable.
  order: number;
};

export type PriorityMetaMap = Record<TaskPriority, PriorityMeta>;

// The color each level ships with. Chosen to reproduce the classes that were
// hard-coded in PRIORITY_META, so seeding the table changes nothing on screen.
const DEFAULT_COLOR: Record<TaskPriority, PriorityColor> = {
  high: "red",
  mid: "amber",
  low: "gray",
};

/**
 * What the app looked like before the master table existed. Rendered until the
 * DB answers, and kept as the fallback when it cannot be reached — a master
 * table that fails to load should not blank out the task list.
 */
export const DEFAULT_PRIORITY_META: PriorityMetaMap = Object.fromEntries(
  PRIORITY_ORDER.map((code, i) => [
    code,
    {
      label: PRIORITY_META[code].label,
      color: DEFAULT_COLOR[code],
      badgeClass: PRIORITY_COLORS[DEFAULT_COLOR[code]].badgeClass,
      order: i,
    },
  ]),
) as PriorityMetaMap;

/** Priority labels and colors from the master table, defaults on any failure. */
export async function loadPriorityMeta(): Promise<PriorityMetaMap> {
  const { data, error } = await supabase
    .from("task_priorities")
    .select("code, label, color");
  if (error || !data?.length) return DEFAULT_PRIORITY_META;

  const meta: PriorityMetaMap = { ...DEFAULT_PRIORITY_META };
  for (const row of data) {
    const code = row.code;
    // An unknown code means the table drifted ahead of the app (a level was
    // added). Ignore it here rather than crash; the app still knows three.
    if (!isTaskPriority(code)) continue;
    const color = isPriorityColor(row.color) ? row.color : meta[code].color;
    const label =
      typeof row.label === "string" && row.label.trim()
        ? row.label.trim()
        : meta[code].label;
    meta[code] = {
      label,
      color,
      badgeClass: PRIORITY_COLORS[color].badgeClass,
      order: meta[code].order,
    };
  }
  return meta;
}
