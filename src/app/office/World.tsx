"use client";

import { useEffect, useRef } from "react";
import {
  drawWorld,
  moveActor,
  POIS,
  type Actor,
  type WorldState,
} from "./officeWorld";

type Props = {
  progress: number; // 0..1 target greenery from real completed tasks
  playerName: string;
};

// Placeholder wandering colleagues until realtime multiplayer (Stage 2) replaces
// them with real teammates.
function makeBots(): Actor[] {
  return [
    { x: 5, z: 8, name: "さとう", shirt: "#e2678b", hair: "#6b4a3a", face: "down", ph: 1, tx: 5, tz: 8, wait: 1 },
    { x: 17, z: 5.5, name: "たなか", shirt: "#e0a13e", hair: "#2e2620", face: "down", ph: 2, tx: 17, tz: 5.5, wait: 2.5 },
    { x: 20, z: 12, name: "すずき", shirt: "#5b8dd6", hair: "#54423b", face: "down", ph: 3, tx: 20, tz: 12, wait: 0.5 },
  ];
}

export default function World({ progress, playerName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});

  const stateRef = useRef<WorldState>({
    dispP: 0,
    targetP: 0,
    actors: [
      { x: 11, z: 10, name: playerName, shirt: "#2f9e77", hair: "#4a3628", face: "down", ph: 0, self: true },
      { x: 11.2, z: 4.3, name: "AI内田さん", shirt: "#f0f1ec", hair: "#8d939c", face: "down", ph: 5, ai: true, glasses: true },
      ...makeBots(),
    ],
  });

  // Keep the latest real progress / name available to the loop without restart.
  useEffect(() => {
    stateRef.current.targetP = progress;
  }, [progress]);
  useEffect(() => {
    const me = stateRef.current.actors.find((a) => a.self);
    if (me) me.name = playerName;
  }, [playerName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
    const onUp = (e: KeyboardEvent) => {
      const k = keyMap[e.code];
      if (k) keys.current[k] = false;
    };
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

    function pickTarget(b: Actor) {
      const p = POIS[Math.floor(Math.random() * POIS.length)];
      b.tx = p.x + (Math.random() - 0.5);
      b.tz = p.y + (Math.random() - 0.5);
    }

    function update(dt: number) {
      const s = stateRef.current;
      const SPD = 3.4;
      let dx = (keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0);
      let dz = (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0);
      if (dx && dz) { dx *= 0.707; dz *= 0.707; }
      const me = s.actors.find((a) => a.self);
      if (me) {
        me.moving = !!(dx || dz);
        if (me.moving) {
          moveActor(me, dx * SPD * dt, dz * SPD * dt);
          me.face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "right" : "left") : dz > 0 ? "down" : "up";
        }
      }
      // Bots wander between points of interest.
      for (const b of s.actors) {
        if (b.self || b.ai) continue;
        if ((b.wait ?? 0) > 0) { b.wait = (b.wait ?? 0) - dt; b.moving = false; continue; }
        const bx = (b.tx ?? b.x) - b.x, bz = (b.tz ?? b.z) - b.z;
        const d = Math.hypot(bx, bz);
        if (d < 0.25) { b.wait = 1.5 + Math.random() * 4; pickTarget(b); continue; }
        const oxb = b.x, ozb = b.z;
        moveActor(b, (bx / d) * 2.1 * dt, (bz / d) * 2.1 * dt);
        b.moving = true;
        b.face = Math.abs(bx) > Math.abs(bz) ? (bx > 0 ? "right" : "left") : bz > 0 ? "down" : "up";
        if (Math.hypot(b.x - oxb, b.z - ozb) < 0.5 * dt) b.stuck = (b.stuck ?? 0) + dt;
        else b.stuck = 0;
        if ((b.stuck ?? 0) > 1.2) { b.stuck = 0; b.wait = 0.5; pickTarget(b); }
      }
      // Smoothly grow the forest toward the real progress.
      s.dispP += (s.targetP - s.dispP) * Math.min(1, dt * 2);
    }

    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = canvas!.clientWidth, h = canvas!.clientHeight;
      if (w > 0 && h > 0) {
        update(dt);
        drawWorld(ctx!, w, h, stateRef.current, now / 1000);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  // On-screen D-pad for touch devices.
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
