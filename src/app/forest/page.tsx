"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { listTasks, taskProgress, updateTaskStatus, type Task } from "@/lib/tasks";
import Garden from "./Garden";
import Celebration from "./Celebration";
import PlantTooltip from "./PlantTooltip";
import TaskPanel from "./TaskPanel";
import { fetchWeather, type Weather } from "./weather";
import type { Plant, Season } from "./plants";
import { SEASON_JA } from "./plants";
import {
  backfillAlbumFromTasks,
  entriesToPlants,
  groupByMonth,
  listAlbumEntries,
  stampExpiredAsMoved,
  type AlbumMonth,
} from "./album";

// Seasonal mood wash laid over the canvas for an album month page. Kept as a
// CSS overlay so the canvas renderer (draw.ts) stays unchanged.
const SEASON_OVERLAY: Record<Season, string> = {
  spring: "linear-gradient(180deg, rgba(244,184,208,0.30), rgba(255,255,255,0) 46%)",
  summer: "linear-gradient(180deg, rgba(120,200,140,0.26), rgba(255,255,255,0) 46%)",
  autumn: "linear-gradient(180deg, rgba(216,140,80,0.32), rgba(255,255,255,0) 48%)",
  winter: "linear-gradient(180deg, rgba(180,205,230,0.34), rgba(255,255,255,0) 52%)",
};
const SEASON_EMOJI: Record<Season, string> = {
  spring: "🌸",
  summer: "🌻",
  autumn: "🍁",
  winter: "❄️",
};

// Stage label based on the NUMBER of completed tasks (not a ratio), so the
// forest never regresses when new tasks are added.
function stageLabel(done: number): string {
  if (done === 0) return "🪴 さら地";
  if (done < 5) return "🌱 芽生え";
  if (done < 10) return "🌿 若葉";
  if (done < 20) return "🌳 育ちざかり";
  if (done < 40) return "🌲 もうすぐ森";
  return "🏕 フォレスト";
}

// Greenery level derived from the completed count. Monotonically increasing and
// saturating toward 1, so completing tasks always adds green and adding new
// (incomplete) tasks never removes any.
function growthFromDone(done: number): number {
  return 1 - Math.pow(0.85, done);
}

function currentHour(): number {
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60;
}

export default function ForestPage() {
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string>();
  const [hour, setHour] = useState(currentHour);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const prevDoneRef = useRef<number | null>(null);
  // Seasonal album (issue #23): months of completed plants read from
  // garden_album. `view` toggles between the album and the classic live garden;
  // the album is the default when there is anything to show.
  const [months, setMonths] = useState<AlbumMonth[]>([]);
  const [monthIdx, setMonthIdx] = useState(0); // 0 = newest month
  const [view, setView] = useState<"album" | "live">("album");
  const [albumNote, setAlbumNote] = useState<string>();
  // Preview helper: "?demo=N" overrides the shown completed count without
  // touching the shared data, for checking how the garden looks at any size.
  const [demoDone] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const d = new URLSearchParams(window.location.search).get("demo");
    const n = d === null ? NaN : parseInt(d, 10);
    return Number.isNaN(n) ? null : Math.max(0, n);
  });
  const [weather, setWeather] = useState<Weather>("clear");
  // Preview helper: "?weather=clear|clouds|rain|snow" forces a condition.
  const [demoWeather] = useState<Weather | null>(() => {
    if (typeof window === "undefined") return null;
    const wq = new URLSearchParams(window.location.search).get("weather");
    return wq === "clear" || wq === "clouds" || wq === "rain" || wq === "snow"
      ? wq
      : null;
  });

  useEffect(() => {
    let active = true;

    // Read completion through the 進捗管理 feature's shared helper so the forest
    // stays in step with how that feature counts progress (single source of
    // truth for the tasks schema and the done/total tally).
    async function load() {
      let list: Task[];
      try {
        list = await listTasks();
      } catch (err) {
        if (!active) return;
        console.error(err);
        // The first load has nothing to show yet, so surface the problem. A
        // later (realtime-triggered) refresh that fails should keep the
        // last-known garden rather than collapse it to bare ground over a
        // transient blip. prevDoneRef is null only until the first success.
        if (prevDoneRef.current === null) {
          setNote("進捗データを読み込めませんでした。ログイン状態や接続を確認してください。");
          setDone(0);
          setTotal(0);
        }
        setLoading(false);
        return;
      }
      if (!active) return;
      const progress = taskProgress(list);
      const nextDone = progress.done;

      // Celebrate when we cross a new multiple of 10 (but not on first load).
      // Skipped in ?demo preview, where the garden shows demoDone, not the real
      // count, so a real-count milestone would fire over a mismatched forest.
      const prev = prevDoneRef.current;
      if (
        demoDone === null &&
        prev !== null &&
        nextDone > prev &&
        Math.floor(nextDone / 10) > Math.floor(prev / 10)
      ) {
        setCelebrate(Math.floor(nextDone / 10) * 10);
      }
      prevDoneRef.current = nextDone;

      setTasks(list);
      setTotal(progress.total);
      setDone(nextDone);
      setNote(undefined);
      setLoading(false);
    }

    load();

    // Reflect other members' task updates in real time.
    const channel = supabase
      .channel("forest-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        load,
      )
      .subscribe();

    // Keep the day/night sky in sync with the clock.
    const clock = setInterval(() => setHour(currentHour()), 60_000);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      clearInterval(clock);
    };
  }, []);

  // Load the seasonal album from garden_album. Best-effort backfill first so
  // already-completed tasks populate the album even before the office-side
  // pipeline writes rows; then read + group by month. Kept separate from the
  // live-garden load so a missing/empty garden_album never breaks the garden.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await listTasks();
        await backfillAlbumFromTasks(list).catch(() => {});
        await stampExpiredAsMoved().catch(() => {});
        const entries = await listAlbumEntries();
        if (!active) return;
        const grouped = groupByMonth(entries);
        setMonths(grouped);
        setMonthIdx(0);
        setAlbumNote(undefined);
      } catch (err) {
        if (!active) return;
        console.error(err);
        // garden_album may not exist yet (run docs/design/forest-album.sql).
        setAlbumNote(
          "アルバムを読み込めませんでした（garden_album 未作成の可能性）。庭表示に切り替えられます。",
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Sync the garden weather with the real weather (falls back to Tokyo when
  // geolocation is unavailable or denied). Skipped when "?weather=" forces one.
  useEffect(() => {
    if (demoWeather !== null) return;
    let active = true;
    let coords = { lat: 35.68, lon: 139.69 };
    const run = () =>
      fetchWeather(coords.lat, coords.lon)
        .then((w) => {
          if (active) setWeather(w);
        })
        .catch(() => {});
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          run();
        },
        () => run(),
        { timeout: 8000 },
      );
    } else {
      run();
    }
    const id = setInterval(run, 600_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [demoWeather]);

  // Plant detail tooltip (hover on desktop, tap on mobile). A short grace
  // period keeps it open while the pointer travels onto the panel.
  const [picked, setPicked] = useState<{ plant: Plant; x: number; y: number } | null>(
    null,
  );
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setPicked(null), 160);
  };
  const handlePick = (plant: Plant | null, x: number, y: number) => {
    if (plant) {
      cancelClose();
      setPicked({ plant, x, y });
    } else {
      scheduleClose();
    }
  };

  // Update completion in place: check a task off (or reopen it) from the forest
  // itself. The write reuses the 進捗管理 feature's updateTaskStatus(); the
  // realtime subscription echoes it back, and this optimistic update makes the
  // garden respond instantly. Rolls back on failure (e.g. not logged in / RLS).
  function applyTasks(list: Task[]) {
    setTasks(list);
    const p = taskProgress(list);
    setDone(p.done);
    setTotal(p.total);
  }
  async function handleToggle(id: string, checked: boolean) {
    const next: "done" | "todo" = checked ? "done" : "todo";
    const snapshot = tasks;
    applyTasks(tasks.map((t) => (t.id === id ? { ...t, status: next } : t)));
    try {
      await updateTaskStatus(id, next);
    } catch (err) {
      console.error(err);
      applyTasks(snapshot);
      setNote("状態の更新に失敗しました。ログイン状態を確認してください。");
    }
  }

  const effectiveDone = demoDone ?? done;
  const effectiveWeather = demoWeather ?? weather;
  const growth = growthFromDone(effectiveDone);
  const growthPercent = Math.round(growth * 100);

  // Album view state. currentMonth is null when the album is empty or the user
  // switched to the live garden; albumPlants is memoized on the chosen month so
  // the canvas layout cache stays warm across renders.
  const showAlbum = view === "album" && months.length > 0;
  const currentMonth = showAlbum
    ? months[Math.min(monthIdx, months.length - 1)]
    : null;
  const albumPlants = useMemo(
    () => (currentMonth ? entriesToPlants(currentMonth.entries) : undefined),
    [currentMonth],
  );
  const gardenWeather: Weather = currentMonth
    ? currentMonth.season === "winter"
      ? "snow"
      : "clear"
    : effectiveWeather;

  return (
    <main className="relative min-h-[100svh] flex-1 overflow-hidden bg-sky-100">
      <Garden
        done={effectiveDone}
        growth={showAlbum ? 1 : growth}
        hour={hour}
        weather={gardenWeather}
        plants={albumPlants}
        onPickPlant={handlePick}
      />

      {showAlbum && currentMonth && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: SEASON_OVERLAY[currentMonth.season] }}
        />
      )}

      {picked && (
        <PlantTooltip
          key={picked.plant.species}
          plant={picked.plant}
          x={picked.x}
          y={picked.y}
          onKeepOpen={cancelClose}
          onRequestClose={scheduleClose}
          onClose={() => setPicked(null)}
        />
      )}

      {celebrate !== null && (
        <Celebration milestone={celebrate} onDone={() => setCelebrate(null)} />
      )}

      {showTasks && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <TaskPanel
            tasks={tasks}
            onToggle={handleToggle}
            onClose={() => setShowTasks(false)}
          />
        </div>
      )}

      {/* Overlay: title, growth, and navigation. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl bg-white/85 p-4 shadow-md ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-emerald-800">🌱 植林</h1>
            <div className="flex items-center gap-2">
              {months.length > 0 && (
                <button
                  onClick={() => setView((v) => (v === "album" ? "live" : "album"))}
                  className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 hover:bg-amber-200"
                >
                  {view === "album" ? "🌳 庭を見る" : "📖 アルバム"}
                </button>
              )}
              <button
                onClick={() => setShowTasks((v) => !v)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                  showTasks
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                📋 タスク
              </button>
              <Link
                href="/tasks"
                className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                進捗管理を開く →
              </Link>
              <Link
                href="/office"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M4 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" />
                  <path d="M15 8h4a1 1 0 0 1 1 1v12" />
                  <path d="M3 21h18" />
                  <path d="M8 7h3M8 11h3M8 15h3" />
                </svg>
                オフィスへ
              </Link>
            </div>
          </div>

          {showAlbum && currentMonth ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setMonthIdx((i) => Math.min(months.length - 1, i + 1))}
                  disabled={monthIdx >= months.length - 1}
                  className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-40"
                >
                  ← 前の月
                </button>
                <div className="text-center">
                  <div className="text-base font-bold text-emerald-800">
                    {SEASON_EMOJI[currentMonth.season]} {currentMonth.label}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {SEASON_JA[currentMonth.season]}のアルバム ・ {currentMonth.entries.length} 本
                  </div>
                </div>
                <button
                  onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
                  disabled={monthIdx <= 0}
                  className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 hover:bg-emerald-200 disabled:opacity-40"
                >
                  次の月 →
                </button>
              </div>
              <p className="text-xs text-zinc-500">
                完了タスクが季節の植物として月ごとに残ります。植物をクリックすると図鑑（Wikipedia 要約）が開きます。
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-500"
                    style={{ width: `${growthPercent}%` }}
                  />
                </div>
                <span className="whitespace-nowrap text-sm font-medium text-emerald-700">
                  {stageLabel(effectiveDone)}
                </span>
                <span className="whitespace-nowrap text-sm text-zinc-500">
                  🌳 {effectiveDone} 本
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                完了したタスクの数だけ緑が増えます（全 {total} 件）。10
                件ごとにレアな植物が芽生え、お祝いが表示されます。
              </p>
            </>
          )}

          {loading && <p className="text-xs text-zinc-400">読み込み中…</p>}
          {note && <p className="text-xs text-amber-600">{note}</p>}
          {albumNote && <p className="text-xs text-amber-600">{albumNote}</p>}
        </div>
      </div>
    </main>
  );
}
