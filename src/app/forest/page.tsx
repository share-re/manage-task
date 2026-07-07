"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { listTasks, taskProgress } from "@/lib/tasks";
import Garden from "./Garden";
import Celebration from "./Celebration";
import PlantTooltip from "./PlantTooltip";
import { fetchWeather, type Weather } from "./weather";
import type { Plant } from "./plants";

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
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string>();
  const [hour, setHour] = useState(currentHour);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const prevDoneRef = useRef<number | null>(null);
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
      let progress: { done: number; total: number };
      try {
        progress = taskProgress(await listTasks());
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

  const effectiveDone = demoDone ?? done;
  const effectiveWeather = demoWeather ?? weather;
  const growth = growthFromDone(effectiveDone);
  const growthPercent = Math.round(growth * 100);

  return (
    <main className="relative min-h-[100svh] flex-1 overflow-hidden bg-sky-100">
      <Garden
        done={effectiveDone}
        growth={growth}
        hour={hour}
        weather={effectiveWeather}
        onPickPlant={handlePick}
      />

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

      {/* Overlay: title, growth, and navigation. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl bg-white/85 p-4 shadow-md ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-emerald-800">🌱 植林</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/tasks"
                className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                進捗管理を開く →
              </Link>
              <Link
                href="/"
                className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                ← トップ
              </Link>
            </div>
          </div>

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

          {loading && <p className="text-xs text-zinc-400">読み込み中…</p>}
          {note && <p className="text-xs text-amber-600">{note}</p>}
          <p className="text-xs text-zinc-500">
            完了したタスクの数だけ緑が増えます（全 {total} 件）。10
            件ごとにレアな植物が芽生え、お祝いが表示されます。
          </p>
        </div>
      </div>
    </main>
  );
}
