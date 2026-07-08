"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  drawWorld,
  moveActor,
  type Actor,
  type Facing,
  type WorldState,
} from "./officeWorld";

type Props = {
  progress: number; // 0..1 target greenery from real completed tasks
  playerName: string;
  userId: string;
  playerColor: string;
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

export default function World({ progress, playerName, userId, playerColor }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const selfRef = useRef<Actor>({
    x: 11, z: 10, name: playerName, shirt: playerColor, hair: HAIR, face: "down", ph: 0, self: true,
  });
  const remotesRef = useRef<Map<string, Remote>>(new Map());
  const worldRef = useRef({ dispP: 0, targetP: 0 });

  useEffect(() => { worldRef.current.targetP = progress; }, [progress]);
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
        // Broadcast our position a few times a second.
        sinceTrack += dt;
        if (sinceTrack > 0.12) {
          sinceTrack = 0;
          channel.track({
            x: me.x, z: me.z, face: me.face, moving: me.moving,
            name: me.name, shirt: me.shirt, hair: me.hair,
          } satisfies PresenceMeta);
        }
        // Grow the office into a forest toward the real progress.
        worldRef.current.dispP += (worldRef.current.targetP - worldRef.current.dispP) * Math.min(1, dt * 2);

        const state: WorldState = {
          dispP: worldRef.current.dispP,
          targetP: worldRef.current.targetP,
          actors: [me, AI, ...remotesRef.current.values()],
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
      <canvas ref={canvasRef} className="h-full w-full touch-none" />
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
