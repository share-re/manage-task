"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  drawWorld,
  moveActor,
  treeAt,
  POIS,
  type Actor,
  type Facing,
  type WorldState,
} from "./officeWorld";
import type { Weather } from "@/app/forest/weather";

type Props = {
  progress: number; // 0..1 target greenery from real completed tasks
  playerName: string;
  userId: string;
  playerColor: string;
  weather: Weather;
  onPickPlant?: (species: string | null, x: number, y: number) => void;
};

// What each client shares about itself over Realtime Presence.
type PresenceMeta = {
  x: number;
  z: number;
  face: Facing;
  moving: boolean;
  name: string;
  shirt: string;
  hair: string;
};

type Remote = Actor & { tx: number; tz: number }; // tx/tz = interpolation target

const HAIR = "#4a3628";
const AI: Actor = {
  x: 11.2, z: 4.3, name: "AI内田さん", shirt: "#f0f1ec", hair: "#8d939c",
  face: "down", ph: 5, ai: true, glasses: true,
};

// Ambient NPC bots. Client-side only (no Realtime cost); shown only when few
// real teammates are online, and labelled "(NPC)" so they aren't mistaken for
// real people.
const BOTS: Actor[] = [
  { x: 5, z: 8, name: "さとう(NPC)", shirt: "#e2678b", hair: "#6b4a3a", face: "down", ph: 1, tx: 5, tz: 8, wait: 1 },
  { x: 17, z: 5.5, name: "たなか(NPC)", shirt: "#e0a13e", hair: "#2e2620", face: "down", ph: 2, tx: 17, tz: 5.5, wait: 2.5 },
  { x: 20, z: 12, name: "すずき(NPC)", shirt: "#5b8dd6", hair: "#54423b", face: "down", ph: 3, tx: 20, tz: 12, wait: 0.5 },
];

export default function World({ progress, playerName, userId, playerColor, weather, onPickPlant }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const selfRef = useRef<Actor>({
    x: 11, z: 10, name: playerName, shirt: playerColor, hair: HAIR, face: "down", ph: 0, self: true,
  });
  const remotesRef = useRef<Map<string, Remote>>(new Map());
  const worldRef = useRef({ dispP: 0, targetP: 0 });
  const weatherRef = useRef<Weather>(weather);

  useEffect(() => { worldRef.current.targetP = progress; }, [progress]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { selfRef.current.name = playerName; selfRef.current.shirt = playerColor; }, [playerName, playerColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // --- Input ---
    const keyMap: Record<string, string> = {
      KeyW: "w", KeyS: "s", KeyA: "a", KeyD: "d",
      ArrowUp: "w", ArrowDown: "s", ArrowLeft: "a", ArrowRight: "d",
    };
    const onDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const k = keyMap[e.code];
      if (k) { keys.current[k] = true; e.preventDefault(); }
    };
    const onUp = (e: KeyboardEvent) => { const k = keyMap[e.code]; if (k) keys.current[k] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    function resize() {
      const w = canvas!.clientWidth, h = canvas!.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // --- Realtime multiplayer (Presence): join/leave + position sync ---
    const channel = supabase.channel("office-room", {
      config: { presence: { key: userId } },
    });
    function syncRemotes() {
      const st = channel.presenceState<PresenceMeta>();
      const seen = new Set<string>();
      for (const key of Object.keys(st)) {
        if (key === userId) continue;
        const m = st[key][0];
        if (!m) continue;
        seen.add(key);
        const cur = remotesRef.current.get(key);
        if (!cur) {
          remotesRef.current.set(key, {
            x: m.x, z: m.z, tx: m.x, tz: m.z, name: m.name, shirt: m.shirt,
            hair: m.hair, face: m.face, moving: m.moving, ph: (key.charCodeAt(0) % 7) + 1,
          });
        } else {
          cur.tx = m.x; cur.tz = m.z; cur.face = m.face; cur.moving = m.moving;
          cur.name = m.name; cur.shirt = m.shirt; cur.hair = m.hair;
        }
      }
      for (const key of [...remotesRef.current.keys()])
        if (!seen.has(key)) remotesRef.current.delete(key);
    }
    channel.on("presence", { event: "sync" }, syncRemotes);
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        const me = selfRef.current;
        channel.track({
          x: me.x, z: me.z, face: me.face, moving: false,
          name: me.name, shirt: me.shirt, hair: me.hair,
        } satisfies PresenceMeta);
      }
    });

    // --- Loop ---
    let raf = 0;
    let last = performance.now();
    let sinceTrack = 0;
    let wasMoving = false;
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas!.clientWidth, h = canvas!.clientHeight;
      if (w > 0 && h > 0) {
        // Move local player.
        const SPD = 3.4;
        let dx = (keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0);
        let dz = (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0);
        if (dx && dz) { dx *= 0.707; dz *= 0.707; }
        const me = selfRef.current;
        me.moving = !!(dx || dz);
        if (me.moving) {
          moveActor(me, dx * SPD * dt, dz * SPD * dt);
          me.face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "right" : "left") : dz > 0 ? "down" : "up";
        }
        // Interpolate remote players toward their latest known position.
        for (const r of remotesRef.current.values()) {
          const k = Math.min(1, dt * 10);
          r.x += (r.tx - r.x) * k;
          r.z += (r.tz - r.z) * k;
        }
        // Low-frequency presence to stay well under Realtime limits (Free allows
        // ~20 presence msgs/sec): update when the player settles (stops moving)
        // and on a slow heartbeat, not every frame. Remote avatars interpolate
        // to the new spot, so it still reads as walking there.
        sinceTrack += dt;
        const justStopped = wasMoving && !me.moving;
        wasMoving = me.moving;
        if (justStopped || sinceTrack > 4) {
          sinceTrack = 0;
          channel.track({
            x: me.x, z: me.z, face: me.face, moving: false,
            name: me.name, shirt: me.shirt, hair: me.hair,
          } satisfies PresenceMeta);
        }

        // Ambient NPC bots fill the office when few real teammates are online.
        const botCount = Math.max(0, 3 - remotesRef.current.size);
        for (let i = 0; i < BOTS.length; i++) {
          const b = BOTS[i];
          if (i >= botCount) { b.moving = false; continue; }
          if ((b.wait ?? 0) > 0) { b.wait = (b.wait ?? 0) - dt; b.moving = false; continue; }
          const bx = (b.tx ?? b.x) - b.x, bz = (b.tz ?? b.z) - b.z;
          const d = Math.hypot(bx, bz);
          if (d < 0.25) {
            b.wait = 1.5 + Math.random() * 4;
            const p = POIS[Math.floor(Math.random() * POIS.length)];
            b.tx = p.x + (Math.random() - 0.5);
            b.tz = p.y + (Math.random() - 0.5);
            continue;
          }
          moveActor(b, (bx / d) * 2.0 * dt, (bz / d) * 2.0 * dt);
          b.moving = true;
          b.face = Math.abs(bx) > Math.abs(bz) ? (bx > 0 ? "right" : "left") : bz > 0 ? "down" : "up";
        }

        // Grow the office into a forest toward the real progress.
        worldRef.current.dispP += (worldRef.current.targetP - worldRef.current.dispP) * Math.min(1, dt * 2);

        const state: WorldState = {
          dispP: worldRef.current.dispP,
          targetP: worldRef.current.targetP,
          weather: weatherRef.current,
          actors: [me, AI, ...BOTS.slice(0, botCount), ...remotesRef.current.values()],
        };
        drawWorld(ctx!, w, h, state, now / 1000);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const hold = (k: string, on: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    keys.current[k] = on;
  };
  const padBtn =
    "flex h-14 w-14 items-center justify-center rounded-xl bg-white/80 text-lg shadow ring-1 ring-black/10 active:bg-emerald-200 select-none";

  return (
    <div className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || !onPickPlant) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const tr = treeAt(
            e.clientX - rect.left, e.clientY - rect.top,
            canvas.clientWidth, canvas.clientHeight,
            selfRef.current, worldRef.current.dispP,
          );
          e.currentTarget.style.cursor = tr ? "pointer" : "default";
          onPickPlant(tr ? tr.species : null, e.clientX, e.clientY);
        }}
        onPointerLeave={() => onPickPlant?.(null, 0, 0)}
      />
      <div className="pointer-events-none absolute bottom-5 right-5 grid grid-cols-3 grid-rows-2 gap-2 md:hidden">
        <span />
        <button className={`pointer-events-auto ${padBtn}`} onPointerDown={hold("w", true)} onPointerUp={hold("w", false)} onPointerLeave={hold("w", false)}>▲</button>
        <span />
        <button className={`pointer-events-auto ${padBtn}`} onPointerDown={hold("a", true)} onPointerUp={hold("a", false)} onPointerLeave={hold("a", false)}>◀</button>
        <button className={`pointer-events-auto ${padBtn}`} onPointerDown={hold("s", true)} onPointerUp={hold("s", false)} onPointerLeave={hold("s", false)}>▼</button>
        <button className={`pointer-events-auto ${padBtn}`} onPointerDown={hold("d", true)} onPointerUp={hold("d", false)} onPointerLeave={hold("d", false)}>▶</button>
      </div>
    </div>
  );
}
