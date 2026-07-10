"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import RoomChatPanel, { type RoomMsg } from "./RoomChatPanel";
import type { RealtimeChannel } from "@supabase/supabase-js";

// 内田さん auto-joins the room chat when a message hits one of these words (with a
// cooldown), or is explicitly summoned with @AI / @内田.
const AI_KEYWORDS = ["辛い", "しんどい", "疲れた", "無理", "詰まった", "助けて"];
const AI_MENTION = /@ai|@内田/i;
const AI_COOLDOWN_MS = 3 * 60 * 1000;
const CHAT_MAX = 50;

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

  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [confirmNav, setConfirmNav] = useState(false); // 進捗管理へ遷移する確認
  const [note, setNote] = useState<string>();
  const loadedRef = useRef(false);

  // Office room chat (ephemeral, Realtime broadcast). Everyone in the office
  // shares one channel; history is kept only in memory (last CHAT_MAX).
  const [showRoomChat, setShowRoomChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<RoomMsg[]>([]);
  const chatChannelRef = useRef<RealtimeChannel | null>(null);
  const lastAiTsRef = useRef(0); // last 内田さん reply time, for the auto-join cooldown

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

  // Subscribe to the office room-chat broadcast channel while in the office, so
  // messages are received even when the panel is closed (kept to CHAT_MAX).
  useEffect(() => {
    const channel = supabase.channel("office-chat", { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "msg" }, ({ payload }) => {
      const m = payload as RoomMsg;
      if (!m?.id) return;
      if (m.ai) lastAiTsRef.current = m.ts;
      setChatMsgs((cur) => [...cur, m].slice(-CHAT_MAX));
    });
    channel.subscribe();
    chatChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      chatChannelRef.current = null;
    };
  }, []);

  function pushChat(m: RoomMsg) {
    if (m.ai) lastAiTsRef.current = m.ts;
    setChatMsgs((cur) => [...cur, m].slice(-CHAT_MAX));
  }
  // 内田さん posts into the room chat (broadcast to others + local echo).
  function postAi(text: string) {
    const m: RoomMsg = { id: crypto.randomUUID(), name: "内田さん", text, ts: Date.now(), ai: true };
    chatChannelRef.current?.send({ type: "broadcast", event: "msg", payload: m });
    pushChat(m);
  }
  // Ask the assistant for a reply and post it. Only the sender's client runs this,
  // so there is exactly one 内田さん reply per triggering message.
  async function triggerAi(userText: string, mention: boolean) {
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, history: [], userName: playerName }),
      });
      const ct = res.headers.get("Content-Type") ?? "";
      if (!res.ok || !res.body || !ct.startsWith("text/plain")) throw new Error("unavailable");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      const reply = acc.trim();
      if (reply) postAi(reply);
      else if (mention) postAi("今ちょっと応答できないみたい💦");
    } catch {
      // Explicit @mention always gets a reply; keyword auto-join stays silent.
      if (mention) postAi("今ちょっと応答できないみたい💦");
    }
  }
  function sendChat(text: string) {
    const t = text.trim();
    if (!t) return;
    const m: RoomMsg = { id: crypto.randomUUID(), name: playerName, text: t, ts: Date.now() };
    chatChannelRef.current?.send({ type: "broadcast", event: "msg", payload: m });
    pushChat(m);
    const mention = AI_MENTION.test(t);
    const keyword = AI_KEYWORDS.some((k) => t.includes(k));
    const cooldownOk = Date.now() - lastAiTsRef.current > AI_COOLDOWN_MS;
    if (mention || (keyword && cooldownOk)) triggerAi(t, mention);
  }

  const cancelClose = () => {
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setPicked(null), 160);
  };
  // Panels open/close by clicking the toggles — no need to walk over. Tasks and
  // the 内田さん chat are mutually exclusive so they never overlap on the right.
  const toggleTasks = () => { setShowChat(false); setShowRoomChat(false); setShowTasks((v) => !v); };
  const toggleChat = () => { setShowTasks(false); setShowRoomChat(false); setShowChat((v) => !v); };
  const toggleRoomChat = () => { setShowTasks(false); setShowChat(false); setShowRoomChat((v) => !v); };
  // Clicking a station in the world (task board / 内田さん) opens its panel.
  const openStation = (id: "task" | "uchida") => {
    setShowRoomChat(false);
    if (id === "task") { setShowChat(false); setShowTasks(true); }
    else { setShowTasks(false); setShowChat(true); }
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
  const weatherIcon =
    effectiveWeather === "rain" ? "🌧️" : effectiveWeather === "snow" ? "❄️" : effectiveWeather === "clouds" ? "☁️" : "☀️";
  const navLink = "rounded-full px-2 py-1 text-sm leading-none hover:bg-[rgba(47,158,119,0.12)]";

  return (
    <main className="relative min-h-[100svh] flex-1 overflow-hidden bg-[#2b2430]">
      <World
        progress={progress}
        playerName={playerName}
        userId={userId}
        playerColor={playerColor}
        weather={effectiveWeather}
        onPickPlant={handlePick}
        onStationClick={openStation}
        onStationDblClick={(id) => { if (id === "task") setConfirmNav(true); }}
      />

      {/* Top-left: compact title + station toggles */}
      <div className="pointer-events-none absolute left-3 top-3 max-w-[min(92vw,290px)]">
        <div className="pointer-events-auto rounded-2xl bg-[rgba(255,253,248,0.92)] p-3 shadow-lg ring-1 ring-[rgba(120,90,60,0.15)] backdrop-blur">
          <h1 className="text-sm font-bold text-[#4a3b2f]">
            <span className="mr-1 text-[#2f9e77]">◆</span>バーチャルオフィス
          </h1>
          <p className="mt-1 text-[11px] leading-relaxed text-[#a08a76]">
            <kbd className="rounded bg-black/5 px-1">WASD</kbd>/矢印で移動。
            下の<b className="text-[#4a3b2f]">ボタン</b>、または世界の<b className="text-[#4a3b2f]">タスク台・内田さん</b>をクリックで開けます（完了 {done}/{total}）
          </p>
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={toggleTasks}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${showTasks ? "bg-[#2f9e77] text-white" : "bg-[rgba(47,158,119,0.1)] text-[#2f9e77] hover:bg-[rgba(47,158,119,0.22)]"}`}
            >
              📋 進捗
            </button>
            <button
              onClick={toggleChat}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${showChat ? "bg-[#2f9e77] text-white" : "bg-[rgba(47,158,119,0.1)] text-[#2f9e77] hover:bg-[rgba(47,158,119,0.22)]"}`}
            >
              🤖 内田さん
            </button>
            <button
              onClick={toggleRoomChat}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${showRoomChat ? "bg-[#2f9e77] text-white" : "bg-[rgba(47,158,119,0.1)] text-[#2f9e77] hover:bg-[rgba(47,158,119,0.22)]"}`}
            >
              💬 チャット
            </button>
          </div>
          {note && <p className="mt-2 text-[11px] text-amber-600">{note}</p>}
        </div>
      </div>

      {/* Top-right: weather + compact page nav (icons) */}
      <div className="pointer-events-none absolute right-3 top-3">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-[rgba(255,253,248,0.92)] px-2 py-1 text-[#4a3b2f] shadow-lg ring-1 ring-[rgba(120,90,60,0.15)] backdrop-blur">
          <span title={`天気: ${effectiveWeather}`} className="px-1 text-sm">{weatherIcon}</span>
          <span className="mx-0.5 h-4 w-px bg-black/10" />
          <Link href="/tasks" title="進捗管理" className={navLink}>✅</Link>
          <Link href="/tasks/mail" title="メール" className={navLink}>✉️</Link>
          <Link href="/forest" title="植林" className={navLink}>🌱</Link>
          <Link href="/" title="トップ" className={navLink}>🏠</Link>
        </div>
      </div>

      {showTasks && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <TaskPanel tasks={tasks} onToggle={handleToggle} onClose={() => setShowTasks(false)} />
        </div>
      )}

      {showChat && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <ChatPanel userName={playerName} onClose={() => setShowChat(false)} />
        </div>
      )}

      {showRoomChat && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <RoomChatPanel messages={chatMsgs} selfName={playerName} onSend={sendChat} onClose={() => setShowRoomChat(false)} />
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

      {confirmNav && (
        <div
          className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmNav(false)}
        >
          <div
            className="mx-4 max-w-xs rounded-2xl bg-[rgba(255,253,248,0.98)] p-5 shadow-xl ring-1 ring-[rgba(120,90,60,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-bold text-[#4a3b2f]">進捗管理画面に移動してもよろしいですか？</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#a08a76]">
              バーチャルオフィスを離れて進捗管理（/tasks）を開きます。
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmNav(false)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#a08a76] hover:bg-black/5"
              >
                いいえ
              </button>
              <button
                onClick={() => router.push("/tasks")}
                className="rounded-lg bg-[#2f9e77] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#268768]"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
