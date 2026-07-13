// Data access for the seasonal album (issue #23). The album is the persistent
// archive of completed tasks as plants, grouped by the month they were
// completed. It reads from the `garden_album` table (created directly on
// Supabase; see docs/design/forest-album.sql) and never writes to `tasks`, so
// it stays within the forest feature's own data boundary.

import { supabase } from "@/lib/supabase";
import type { Task } from "@/lib/tasks";
import {
  hashId,
  seasonOf,
  speciesFor,
  RETENTION_MONTHS,
  SEASONS,
  type Plant,
  type Season,
} from "./plants";

export type AlbumEntry = {
  id: string;
  taskId: string | null;
  species: string;
  season: Season;
  completedAt: string; // timestamptz ISO
  movedAt: string | null;
  createdBy: string | null;
};

// Columns fetched from garden_album. Listed explicitly (not "*") so the client
// type and the query can never silently diverge.
const ALBUM_COLUMNS =
  "id, task_id, species, season, completed_at, moved_at, created_by";

function isSeason(v: unknown): v is Season {
  return typeof v === "string" && (SEASONS as string[]).includes(v);
}

// Normalize an untyped DB row into an AlbumEntry. season falls back to a value
// derived from completed_at when the stored one is missing/unexpected.
function normalizeEntry(row: Record<string, unknown>): AlbumEntry {
  const completedAt =
    typeof row.completed_at === "string" ? row.completed_at : "";
  return {
    id: String(row.id),
    taskId: typeof row.task_id === "string" ? row.task_id : null,
    species: typeof row.species === "string" ? row.species : "someiyoshino",
    season: isSeason(row.season) ? row.season : seasonOf(completedAt),
    completedAt,
    movedAt: typeof row.moved_at === "string" ? row.moved_at : null,
    createdBy: typeof row.created_by === "string" ? row.created_by : null,
  };
}

/** Fetch all album entries, oldest completion first. */
export async function listAlbumEntries(): Promise<AlbumEntry[]> {
  const { data, error } = await supabase
    .from("garden_album")
    .select(ALBUM_COLUMNS)
    .order("completed_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(normalizeEntry);
}

// "YYYY-MM" bucket key for a completion timestamp (local month).
export function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type AlbumMonth = {
  ym: string; // "YYYY-MM"
  label: string; // "2026年7月"
  season: Season;
  entries: AlbumEntry[];
};

// Group entries into month pages, newest month first. Each month's season is
// derived from its own completions (all entries in a month share a season).
export function groupByMonth(entries: AlbumEntry[]): AlbumMonth[] {
  const buckets = new Map<string, AlbumEntry[]>();
  for (const e of entries) {
    if (!e.completedAt) continue;
    const ym = monthKey(e.completedAt);
    const list = buckets.get(ym) ?? [];
    list.push(e);
    buckets.set(ym, list);
  }
  return [...buckets.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1)) // newest month first
    .map(([ym, list]) => {
      const [y, m] = ym.split("-");
      return {
        ym,
        label: `${y}年${Number(m)}月`,
        season: seasonOf(list[0].completedAt),
        entries: list,
      };
    });
}

// Turn album entries into drawable plants. Position and scale come from a
// deterministic hash of the source id, so a month page always lays out the
// same way. Reuses the existing Plant shape (layoutPlants/plantAt/draw).
export function entriesToPlants(entries: AlbumEntry[]): Plant[] {
  return entries.map((e, i) => {
    const seed = e.taskId ?? e.id;
    return {
      id: i + 1,
      kind: "normal",
      species: e.species,
      x: 0.06 + hashId(seed + ":x") * 0.88,
      y: 0.5 + hashId(seed + ":y") * 0.42,
    };
  });
}

// ISO cutoff before which a completed plant has left the office garden (moved
// to the album). Office shows completions on/after this instant.
export function retentionCutoffISO(now: Date = new Date()): string {
  const d = new Date(now);
  d.setMonth(d.getMonth() - RETENTION_MONTHS);
  return d.toISOString();
}

// Whether a completion is still inside the office retention window.
export function isWithinRetention(
  completedAt: string,
  now: Date = new Date(),
): boolean {
  return completedAt >= retentionCutoffISO(now);
}

// Ensure a garden_album row exists for every completed task. Idempotent: upsert
// on task_id (unique) with ignoreDuplicates, so re-running never creates
// duplicates. Bootstrap/transitional: it lets the album populate from existing
// completions until the office-side pipeline (issue #23, design 4.5) writes
// rows at completion time. Writes ONLY to garden_album — never to tasks.
export async function backfillAlbumFromTasks(tasks: Task[]): Promise<number> {
  const done = tasks.filter(
    (t): t is Task & { completed_at: string } =>
      t.status === "done" && !!t.completed_at,
  );
  if (done.length === 0) return 0;
  const rows = done.map((t) => {
    const season = seasonOf(t.completed_at);
    return {
      task_id: t.id,
      species: speciesFor(season, t.id),
      season,
      completed_at: t.completed_at,
      created_by: t.created_by,
    };
  });
  const { error } = await supabase
    .from("garden_album")
    .upsert(rows, { onConflict: "task_id", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}

// Record the office->forest move: stamp moved_at on entries whose office
// retention has expired (completed before the cutoff) and that aren't stamped
// yet (design 4.5). Display keys off completed_at, so this can run lazily.
// Writes only to garden_album. Returns how many rows were stamped.
export async function stampExpiredAsMoved(now: Date = new Date()): Promise<number> {
  const { data, error } = await supabase
    .from("garden_album")
    .update({ moved_at: now.toISOString() })
    .lt("completed_at", retentionCutoffISO(now))
    .is("moved_at", null)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}
