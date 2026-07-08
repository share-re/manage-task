"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import {
  listTasks,
  taskProgress,
  updateTaskStatus,
  type Task,
} from "@/lib/tasks";
import TaskPanel from "@/app/forest/TaskPanel";
import PlantTooltip from "@/app/forest/PlantTooltip";
import { RARE_SPECIES_LIST, type Plant } from "@/app/forest/plants";
import { fetchWeather, type Weather } from "@/app/forest/weather";
import World from "./World";
import ChatPanel from "./ChatPanel";

// Same saturating curve as the /forest view: completing tasks always adds green
// and adding new (incomplete) tasks never removes any.
function growthFromDone(done: number): number {
  return 1 - Math.pow(0.85, done);
}

// Stable, distinct shirt color per user so teammates are told apart at a glance.
function colorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 60% 55%)`;
}

export default function OfficePage() {
  const { session } = useAuth();
  const userId = session?.user.id ?? "guest";
  const playerName =
    (session?.user.user_metadata?.name as string | undefined) ??
    session?.user.email?.split("@")[0] ??
    "あなた";
  const playerColor = colorFromId(userId);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [note, setNote] = useState<string>();
  const loadedRef = useRef(false);

  // Real weather (reused from /forest); "?weather=clear|clouds|rain|snow" forces one.
  const [weather, setWeather] = useState<Weather>("clear");
  const [demoWeather] = useState<Weather | null>(() => {
    if (typeof window === "undefined") return null;
    const wq = new URLSearchParams(window.location.search).get("weather");
    return wq === "clear" || wq === "clouds" || wq === "rain" || wq === "snow" ? wq : null;
  });

  // Plant detail tooltip on hovering a tree (reuses /forest PlantTooltip + wiki).
  const [picked, setPicked] = useState<{ plant: Plant; x: number; y: number } | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const list = await listTasks();
        if (!active) return;
        setTasks(list);
        loadedRef.current = true;
        setNote(undefined);
      } catch (err) {
        if (!active) return;
        console.error(err);
        if (!loadedRef.current)
          setNote("進捗データを読み込めませんでした。ログイン状態や接続を確認してください。");
      }
    }
    load();
    const channel = supabase
      .channel("office-tasks")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleToggle(id: string, checked: boolean) {
    const next: "done" | "todo" = checked ? "done" : "todo";
    const snapshot = tasks;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: next } : t)));
    try {
      await updateTaskStatus(id, next);
    } catch (err) {
      console.error(err);
      setTasks(snapshot);
      setNote("状態の更新に失敗しました。権限またはログイン状態を確認してください。");
    }
  }

  // Fetch real weather (falls back to Tokyo); skipped when "?weather=" forces one.
  useEffect(() => {
    if (demoWeather !== null) return;
    let active = true;
    let coords = { lat: 35.68, lon: 139.69 };
    const run = () =>
      fetchWeather(coords.lat, coords.lon)
        .then((w) => { if (active) setWeather(w); })
        .catch(() => {});
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { coords = { lat: pos.coords.latitude, lon: pos.coords.longitude }; run(); },
        () => run(),
        { timeout: 8000 },
      );
    } else run();
    const id = setInterval(run, 600_000);
    return () => { active = false; clearInterval(id); };
  }, [demoWeather]);

  const cancelClose = () => {
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setPicked(null), 160);
  };
  function handlePick(species: string | null, x: number, y: number) {
    if (species) {
      cancelClose();
      const isRare = RARE_SPECIES_LIST.some((s) => s.key === species);
      setPicked({ plant: { id: 0, kind: isRare ? "rare" : "normal", species, x: 0, y: 0 }, x, y });
    } else {
      scheduleClose();
    }
  }

  const { done, total } = taskProgress(tasks);
  const progress = growthFromDone(done);
  const effectiveWeather = demoWeather ?? weather;

  return (
    <main className="relative min-h-[100svh] flex-1 overflow-hidden bg-[#2b2430]">
      <World
        progress={progress}
        playerName={playerName}
        userId={userId}
        playerColor={playerColor}
        weather={effectiveWeather}
        onPickPlant={handlePick}
      />

      {/* Top overlay: title, progress, controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
        <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl bg-white/85 p-4 shadow-md ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-emerald-800">🏢 バーチャルオフィス</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTasks((v) => !v)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                  showTasks ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                📋 タスク
              </button>
              <button
                onClick={() => setShowChat((v) => !v)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                  showChat ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                🤖 内田さん
              </button>
              <Link href="/forest" className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100">
                🌱 植林
              </Link>
              <Link href="/" className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100">
                ← トップ
              </Link>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            <kbd className="rounded bg-black/5 px-1">W</kbd>{" "}
            <kbd className="rounded bg-black/5 px-1">A</kbd>{" "}
            <kbd className="rounded bg-black/5 px-1">S</kbd>{" "}
            <kbd className="rounded bg-black/5 px-1">D</kbd> か矢印キーで移動。完了タスクが増えるほどオフィスが森に育ちます（完了 {done} / 全 {total} 件）。
          </p>
          {note && <p className="text-xs text-amber-600">{note}</p>}
        </div>
      </div>

      {showTasks && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <TaskPanel tasks={tasks} onToggle={handleToggle} onClose={() => setShowTasks(false)} />
        </div>
      )}

      {showChat && (
        <div className="pointer-events-none absolute left-4 top-28 z-10">
          <ChatPanel userName={playerName} onClose={() => setShowChat(false)} />
        </div>
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
    </main>
  );
}
