"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { isAdmin } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";
import PasskeyRegisterButton from "@/components/PasskeyRegisterButton";
import UchidaIcon from "@/components/UchidaIcon";
import {
  listTasks,
  taskProgress,
  updateTaskStatus,
  type Task,
} from "@/lib/tasks";
import TaskPanel from "@/app/forest/TaskPanel";
import { getSpecies } from "@/app/forest/plants";
import { isWithinRetention } from "@/app/forest/album";
import { fetchWeather, type Weather } from "@/app/forest/weather";
import World from "./World";
import RoomChatPanel, { type RoomMsg } from "./RoomChatPanel";
import {
  STATUS_EMOJI,
  STATUS_LABEL,
  STATUS_ORDER,
  buildOfficePlants,
  type PresenceStatus,
} from "./officeWorld";
import type { RealtimeChannel } from "@supabase/supabase-js";

// 内田さん auto-joins the room chat when a message hits one of these words (with a
// cooldown), or is explicitly summoned with @AI / @内田.
const AI_KEYWORDS = ["辛い", "しんどい", "疲れた", "無理", "詰まった", "助けて"];
const AI_MENTION = /@ai|@内田/i;
const AI_COOLDOWN_MS = 3 * 60 * 1000;
const CHAT_MAX = 50;

// Remember the last status per device so it survives a reload (not synced across
// devices; it just restores the previous choice, presence itself is live).
const STATUS_KEY = "office-status";
function loadStatus(): PresenceStatus {
  if (typeof window === "undefined") return "working";
  const s = window.localStorage.getItem(STATUS_KEY);
  return s === "working" || s === "busy" || s === "away" || s === "break" ? s : "working";
}

// Whether the top-left control card is expanded. Collapsed shows just a
// hamburger so the world is easier to see. Persisted per device like the status
// (default expanded on first visit).
const PANEL_KEY = "office-panel-open";
function loadPanelOpen(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PANEL_KEY) !== "0";
}

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
  const { session, profileName, refreshProfileName } = useAuth();
  const userId = session?.user.id ?? "guest";
  // Display name: profiles.name is the source of truth; fall back to
  // user_metadata.name / email while it loads (NFR5).
  const playerName =
    profileName?.trim() ||
    (session?.user.user_metadata?.name as string | undefined)?.trim() ||
    session?.user.email?.split("@")[0] ||
    "あなた";
  const playerColor = colorFromId(userId);

  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(false);
  const [confirmNav, setConfirmNav] = useState(false); // 進捗管理へ遷移する確認
  const [note, setNote] = useState<string>();
  const loadedRef = useRef(false);

  // Office room chat (ephemeral, Realtime broadcast). Everyone in the office
  // shares one channel; history is kept only in memory (last CHAT_MAX).
  const [showRoomChat, setShowRoomChat] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<RoomMsg[]>([]);
  const chatChannelRef = useRef<RealtimeChannel | null>(null);
  const lastAiTsRef = useRef(0); // last 内田さん reply time, for the auto-join cooldown

  // Presence status shown on the avatar (and used to park teammates by zone).
  const [status, setStatus] = useState<PresenceStatus>(loadStatus);
  useEffect(() => {
    try { window.localStorage.setItem(STATUS_KEY, status); } catch {}
  }, [status]);

  // Collapsible top-left control card (persisted).
  const [panelOpen, setPanelOpen] = useState(loadPanelOpen);
  useEffect(() => {
    try { window.localStorage.setItem(PANEL_KEY, panelOpen ? "1" : "0"); } catch {}
  }, [panelOpen]);

  // Editing the display name (user_metadata.name) from the office profile card.
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string>();
  const [savingName, setSavingName] = useState(false);

  // Real weather (reused from /forest); "?weather=clear|clouds|rain|snow" forces one.
  const [weather, setWeather] = useState<Weather>("clear");
  const [demoWeather] = useState<Weather | null>(() => {
    if (typeof window === "undefined") return null;
    const wq = new URLSearchParams(window.location.search).get("weather");
    return wq === "clear" || wq === "clouds" || wq === "rain" || wq === "snow" ? wq : null;
  });

  // Name-only label on hovering an office plant. The wiki/図鑑 lives in /forest
  // (the album), so the office stays a light "working now" backdrop (#23).
  const [picked, setPicked] = useState<{ name: string; x: number; y: number } | null>(null);
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
      // Drop the web-search sources blob the assistant appends after the SOURCES
      // separator (\x1e); only the human-readable text belongs in the room chat.
      const reply = acc.split("")[0].trim();
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
  const toggleTasks = () => { setShowRoomChat(false); setShowTasks((v) => !v); };
  const toggleRoomChat = () => { setShowTasks(false); setShowRoomChat((v) => !v); };
  // Clicking a station: the task board opens inline; 内田さん opens the full
  // assistant page in a new tab so this tab keeps its office presence alive.
  const openStation = (id: "task" | "uchida") => {
    if (id === "uchida") { window.open("/assistant", "_blank", "noopener,noreferrer"); return; }
    setShowRoomChat(false);
    setShowTasks(true);
  };

  function startEditName() {
    setNameDraft(playerName);
    setNameError(undefined);
    setEditingName(true);
  }
  // Save the display name. profiles.name is the source of truth (used by the
  // assignee name everywhere); user_metadata is also updated for compatibility.
  // refreshProfileName() then flows the new name to all screens via AuthProvider.
  async function saveName() {
    const next = nameDraft.trim();
    if (!next) { setNameError("名前を入力してください。"); return; }
    if (next.length > 20) { setNameError("20文字以内で入力してください。"); return; }
    if (next === playerName) { setEditingName(false); return; }
    setSavingName(true);
    setNameError(undefined);
    const uid = session?.user.id;
    const { error: e1 } = await supabase.auth.updateUser({ data: { name: next } });
    const { error: e2 } = uid
      ? await supabase.from("profiles").upsert({ id: uid, name: next })
      : { error: null };
    setSavingName(false);
    if (e1 || e2) { setNameError("変更に失敗しました。時間をおいて再度お試しください。"); return; }
    refreshProfileName();
    setEditingName(false);
  }

  function handlePick(species: string | null, x: number, y: number) {
    if (species) {
      cancelClose();
      setPicked({ name: getSpecies(species).ja, x, y });
    } else {
      scheduleClose();
    }
  }

  const { done, total } = taskProgress(tasks);
  const progress = growthFromDone(done);

  // One plant per completed task within the office retention window (#23). The
  // COUNT is exactly the number of such tasks: creating a task (todo) adds none,
  // 0 completed → 0 plants, and un-completing a task (done→todo) drops its plant.
  // Positions/species are deterministic per task id, so plants don't reshuffle.
  const officePlants = useMemo(
    () =>
      buildOfficePlants(
        tasks
          .filter(
            (t) =>
              t.status === "done" &&
              t.completed_at &&
              isWithinRetention(t.completed_at),
          )
          .map((t) => ({ id: t.id, completedAt: t.completed_at as string })),
      ),
    [tasks],
  );
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
        status={status}
        weather={effectiveWeather}
        plants={officePlants}
        onPickPlant={handlePick}
        onStationClick={openStation}
        onStationDblClick={(id) => { if (id === "task") setConfirmNav(true); }}
      />

      {/* Top-left: compact title + station toggles (collapsible to a hamburger) */}
      <div className="pointer-events-none absolute left-3 top-3 max-w-[min(92vw,290px)]">
        {!panelOpen ? (
          <button
            onClick={() => setPanelOpen(true)}
            aria-label="メニューを開く"
            title="メニューを開く"
            className="pointer-events-auto rounded-xl bg-[rgba(255,253,248,0.92)] px-2.5 py-2 text-base leading-none text-[#4a3b2f] shadow-lg ring-1 ring-[rgba(120,90,60,0.15)] backdrop-blur hover:bg-[rgba(47,158,119,0.12)]"
          >
            ☰
          </button>
        ) : (
        <div className="pointer-events-auto rounded-2xl bg-[rgba(255,253,248,0.92)] p-3 shadow-lg ring-1 ring-[rgba(120,90,60,0.15)] backdrop-blur">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-sm font-bold text-[#4a3b2f]">
              <span className="mr-1 text-[#2f9e77]">◆</span>バーチャルオフィス
            </h1>
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="メニューを閉じる"
              title="折りたたむ"
              className="-mr-1 -mt-0.5 rounded-lg px-1.5 py-1 text-sm leading-none text-[#a08a76] hover:bg-black/5"
            >
              ☰
            </button>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-[#a08a76]">
            <kbd className="rounded bg-black/5 px-1">WASD</kbd>/矢印で移動。
            下の<b className="text-[#4a3b2f]">ボタン</b>、または世界の<b className="text-[#4a3b2f]">タスク台・内田さん</b>をクリックで開けます（内田さんは別タブ・完了 {done}/{total}）
          </p>
          <div className="mt-2 flex gap-1.5">
            <button
              onClick={toggleTasks}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${showTasks ? "bg-[#2f9e77] text-white" : "bg-[rgba(47,158,119,0.1)] text-[#2f9e77] hover:bg-[rgba(47,158,119,0.22)]"}`}
            >
              📋 進捗
            </button>
            <button
              onClick={toggleRoomChat}
              className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${showRoomChat ? "bg-[#2f9e77] text-white" : "bg-[rgba(47,158,119,0.1)] text-[#2f9e77] hover:bg-[rgba(47,158,119,0.22)]"}`}
            >
              💬 チャット
            </button>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-[#a08a76]">あなた</p>
            {editingName ? (
              <div className="mt-1 flex items-center gap-1">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  maxLength={20}
                  className="min-w-0 flex-1 rounded-lg border border-[rgba(120,90,60,0.25)] bg-white px-2 py-1 text-xs text-[#4a3b2f] outline-none focus:border-[#2f9e77]"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="rounded-lg bg-[#2f9e77] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[#268768] disabled:opacity-50"
                >
                  {savingName ? "…" : "保存"}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="rounded-lg px-1.5 py-1 text-[11px] text-[#a08a76] hover:bg-black/5"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-1">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#4a3b2f]">{playerName}</span>
                <button
                  onClick={startEditName}
                  title="表示名を変更"
                  className="rounded-lg px-1.5 py-1 text-[11px] text-[#2f9e77] hover:bg-[rgba(47,158,119,0.15)]"
                >
                  ✏️ 変更
                </button>
              </div>
            )}
            {nameError && <p className="mt-1 text-[10px] text-amber-600">{nameError}</p>}
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-[#a08a76]">ステータス</p>
            <div className="mt-1 flex gap-1">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  title={STATUS_LABEL[s]}
                  className={`flex flex-1 items-center justify-center gap-0.5 rounded-lg px-1 py-1 text-[11px] font-semibold ${status === s ? "bg-[#2f9e77] text-white" : "bg-[rgba(47,158,119,0.1)] text-[#4a3b2f] hover:bg-[rgba(47,158,119,0.22)]"}`}
                >
                  <span>{STATUS_EMOJI[s]}</span>
                  <span>{STATUS_LABEL[s]}</span>
                </button>
              ))}
            </div>
          </div>
          {isAdmin(session) && (
            <div className="mt-2 flex flex-col items-stretch gap-1.5 border-t border-[rgba(120,90,60,0.15)] pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#3B6D11]">
                  管理者メニュー
                </span>
                <span className="rounded bg-[#EAF3DE] px-1.5 py-0.5 text-[10px] font-semibold text-[#173404]">
                  adminのみ
                </span>
              </div>
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-1.5 rounded-lg border-2 border-[#2f9e77] bg-[#EAF3DE] px-3 py-2 text-sm font-semibold text-[#173404] transition hover:bg-[#dcefce]"
              >
                ⚙ 管理
              </Link>
            </div>
          )}
          <div className="mt-2 flex flex-col items-stretch gap-1.5 border-t border-[rgba(120,90,60,0.15)] pt-2">
            <PasskeyRegisterButton />
            <LogoutButton className="self-start rounded-lg px-2 py-1 text-[11px] font-semibold text-[#a08a76] hover:bg-black/5" />
          </div>
          {note && <p className="mt-2 text-[11px] text-amber-600">{note}</p>}
        </div>
        )}
      </div>

      {/* Top-right: weather + compact page nav (icons) */}
      <div className="pointer-events-none absolute right-3 top-3">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full bg-[rgba(255,253,248,0.92)] px-2 py-1 text-[#4a3b2f] shadow-lg ring-1 ring-[rgba(120,90,60,0.15)] backdrop-blur">
          <span title={`天気: ${effectiveWeather}`} className="px-1 text-sm">{weatherIcon}</span>
          <span className="mx-0.5 h-4 w-px bg-black/10" />
          <Link href="/tasks" title="進捗管理" className={navLink}>✅</Link>
          <Link href="/tasks/mail" title="メール" className={navLink}>✉️</Link>
          <Link href="/forest" title="植林" className={navLink}>🌱</Link>
          <a href="/assistant" target="_blank" rel="noopener noreferrer" title="AI内田さん" className={`${navLink} inline-flex items-center`}>
            <UchidaIcon size={18} label="AI内田さん" />
          </a>
        </div>
      </div>

      {showTasks && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <TaskPanel tasks={tasks} onToggle={handleToggle} onClose={() => setShowTasks(false)} />
        </div>
      )}

      {showRoomChat && (
        <div className="pointer-events-none absolute right-4 top-28 z-10">
          <RoomChatPanel messages={chatMsgs} selfName={playerName} onSend={sendChat} onClose={() => setShowRoomChat(false)} />
        </div>
      )}

      {picked && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[rgba(255,253,248,0.96)] px-2.5 py-1 text-xs font-semibold text-[#4a3b2f] shadow-lg ring-1 ring-[rgba(120,90,60,0.18)]"
          style={{ left: picked.x, top: picked.y - 10 }}
        >
          🌿 {picked.name}
        </div>
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
