import { supabase } from "./supabase";
import {
  isTaskStatus,
  STATUS_META,
  STATUS_ORDER,
  type TaskStatus,
} from "./tasks";

/**
 * Status presentation, read from the task_statuses master table.
 *
 * Only the label and the color are data. The codes stay compiled in, and
 * "done" especially: progress, archiving, the forest, the parent/child sync
 * and the actual-hours rule all test for it directly, so which status counts
 * as finished is not something this master can change.
 */

// Tailwind only emits classes it can find in the source, so the DB holds a
// color KEY. A status needs two colors: the badge, and the bar down the left
// edge of the row — which is a hex because it is an inline style.
export const STATUS_COLORS = {
  gray: {
    label: "グレー",
    badgeClass: "bg-zinc-100 text-zinc-600",
    barColor: "#B4B2A9",
    swatch: "#e5e7eb",
  },
  blue: {
    label: "ブルー",
    badgeClass: "bg-blue-100 text-blue-700",
    barColor: "#378ADD",
    swatch: "#bfdbfe",
  },
  green: {
    label: "グリーン",
    badgeClass: "bg-green-200 text-green-800",
    barColor: "#3B6D11",
    swatch: "#bbf7d0",
  },
  amber: {
    label: "アンバー",
    badgeClass: "bg-amber-100 text-amber-700",
    barColor: "#D97706",
    swatch: "#fde68a",
  },
  red: {
    label: "レッド",
    badgeClass: "bg-red-100 text-red-700",
    barColor: "#B91C1C",
    swatch: "#fecaca",
  },
  purple: {
    label: "パープル",
    badgeClass: "bg-violet-100 text-violet-700",
    barColor: "#6D28D9",
    swatch: "#ddd6fe",
  },
} as const;

export type StatusColor = keyof typeof STATUS_COLORS;

export const STATUS_COLOR_ORDER: StatusColor[] = [
  "gray",
  "blue",
  "green",
  "amber",
  "red",
  "purple",
];

export function isStatusColor(value: unknown): value is StatusColor {
  return typeof value === "string" && value in STATUS_COLORS;
}

// Badges sit inline in a dense task list, so a long label would wrap the row.
export const STATUS_LABEL_MAX = 10;

export type StatusMeta = {
  label: string;
  color: StatusColor;
  badgeClass: string;
  barColor: string;
};

export type StatusMetaMap = Record<TaskStatus, StatusMeta>;

// The color each status ships with, chosen to reproduce the classes and bar
// colors that were hard-coded in STATUS_META.
const DEFAULT_COLOR: Record<TaskStatus, StatusColor> = {
  todo: "gray",
  in_progress: "blue",
  done: "green",
};

/**
 * What the app looked like before the master table existed. Rendered until the
 * DB answers, and kept as the fallback when it cannot be reached.
 */
export const DEFAULT_STATUS_META: StatusMetaMap = Object.fromEntries(
  STATUS_ORDER.map((code) => [
    code,
    {
      label: STATUS_META[code].label,
      color: DEFAULT_COLOR[code],
      badgeClass: STATUS_COLORS[DEFAULT_COLOR[code]].badgeClass,
      barColor: STATUS_COLORS[DEFAULT_COLOR[code]].barColor,
    },
  ]),
) as StatusMetaMap;

/** Status labels and colors from the master table, defaults on any failure. */
export async function loadStatusMeta(): Promise<StatusMetaMap> {
  const { data, error } = await supabase
    .from("task_statuses")
    .select("code, label, color");
  if (error || !data?.length) return DEFAULT_STATUS_META;

  const meta: StatusMetaMap = { ...DEFAULT_STATUS_META };
  for (const row of data) {
    const code = row.code;
    if (!isTaskStatus(code)) continue;
    const color = isStatusColor(row.color) ? row.color : meta[code].color;
    const label =
      typeof row.label === "string" && row.label.trim()
        ? row.label.trim()
        : meta[code].label;
    meta[code] = {
      label,
      color,
      badgeClass: STATUS_COLORS[color].badgeClass,
      barColor: STATUS_COLORS[color].barColor,
    };
  }
  return meta;
}
