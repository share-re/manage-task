"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Garden from "./Garden";
import Celebration from "./Celebration";

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

  useEffect(() => {
    let active = true;

    // Read completion straight from the shared "tasks" table so the forest
    // grows with the 進捗管理 feature. Once feature/tasks lands on main we can
    // switch to its taskProgress() helper.
    async function load() {
      const { data, error } = await supabase.from("tasks").select("status");
      if (!active) return;
      if (error) {
        setNote("進捗データを読み込めませんでした（tasks テーブル未作成の可能性）。");
        setDone(0);
        setTotal(0);
        setLoading(false);
        return;
      }
      const rows = data ?? [];
      const nextDone = rows.filter((r) => r.status === "done").length;

      // Celebrate when we cross a new multiple of 10 (but not on first load).
      const prev = prevDoneRef.current;
      if (
        prev !== null &&
        nextDone > prev &&
        Math.floor(nextDone / 10) > Math.floor(prev / 10)
      ) {
        setCelebrate(Math.floor(nextDone / 10) * 10);
      }
      prevDoneRef.current = nextDone;

      setTotal(rows.length);
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

  const growth = growthFromDone(done);
  const growthPercent = Math.round(growth * 100);

  return (
    <main className="relative min-h-[100svh] flex-1 overflow-hidden bg-sky-100">
      <Garden done={done} growth={growth} hour={hour} />

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
              {stageLabel(done)}
            </span>
            <span className="whitespace-nowrap text-sm text-zinc-500">
              🌳 {done} 本
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
