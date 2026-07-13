"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  drawWorld,
  moveActor,
  seatForUser,
  seatForStatus,
  officePlantAt,
  viewTransform,
  STATIONS,
  T,
  type Actor,
  type Facing,
  type OfficePlant,
  type PresenceStatus,
  type StationId,
  type WorldState,
} from "./officeWorld";
import type { Weather } from "@/app/forest/weather";

type Props = {
  progress: number; // 0..1 target greenery from real completed tasks
  playerName: string;
  userId: string;
  playerColor: string;
  status: PresenceStatus;
  weather: Weather;
  // One seasonal plant per recently-completed task (#23). The COUNT equals the
  // number of completed tasks in the retention window (computed by the page).
  plants: OfficePlant[];
  onPickPlant?: (species: string | null, x: number, y: number) => void;
  // Fired when the player walks into / out of a station's radius, so the page
  // can auto-open (or close) the matching panel — the "近づくと開く" HUD.
  onStationChange?: (id: StationId, near: boolean) => void;
  // Fired when a station (task board / 内田さん) is clicked, so the page can open
  // the matching panel without having to walk over to it.
  onStationClick?: (id: StationId) => void;
  // Fired on double-clicking a station, e.g. to navigate to its full page.
  onStationDblClick?: (id: StationId) => void;
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
  status: PresenceStatus;
};

type Remote = Actor & { tx: number; tz: number }; // tx/tz = interpolation target

const HAIR = "#4a3628";
const AI: Actor = {
  x: 11.1, z: 9.0, name: "AI内田さん", shirt: "#f0f1ec", hair: "#8d939c",
  face: "down", ph: 5, ai: true, glasses: true,
};

export default function World({ progress, playerName, userId, playerColor, status, weather, plants, onPickPlant, onStationChange, onStationClick, onStationDblClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const moveTargetRef = useRef<{ x: number; z: number } | null>(null); // click-to-move goal
  // Arrive at a seat in one of the zones (see SEATS), not one shared spawn spot.
  const seat = seatForUser(userId);
  const selfRef = useRef<Actor>({
    x: seat.x, z: seat.z, name: playerName, shirt: playerColor, hair: HAIR, face: seat.face, ph: 0, self: true, status,
  });
  const remotesRef = useRef<Map<string, Remote>>(new Map());
  const worldRef = useRef({ dispP: 0, targetP: 0 });
  const weatherRef = useRef<Weather>(weather);
  const plantsRef = useRef<OfficePlant[]>(plants);
  const nearRef = useRef<Record<StationId, boolean>>({ task: false, uchida: false });
  const onStationRef = useRef(onStationChange);
  const metaDirtyRef = useRef(false); // set when self meta (status / name) changes → re-track now

  useEffect(() => { worldRef.current.targetP = progress; }, [progress]);
  useEffect(() => { weatherRef.current = weather; }, [weather]);
  useEffect(() => { plantsRef.current = plants; }, [plants]);
  useEffect(() => { onStationRef.current = onStationChange; });
  useEffect(() => { selfRef.current.name = playerName; selfRef.current.shirt = playerColor; metaDirtyRef.current = true; }, [playerName, playerColor]);
  useEffect(() => { selfRef.current.status = status; metaDirtyRef.current = true; }, [status]);

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
        // Park each teammate at a seat in the zone their status implies, rather
        // than their raw broadcast position, so the room clusters by activity.
        const stat = m.status ?? "working";
        const spot = seatForStatus(key, stat);
        const cur = remotesRef.current.get(key);
        if (!cur) {
          remotesRef.current.set(key, {
            x: spot.x, z: spot.z, tx: spot.x, tz: spot.z, name: m.name, shirt: m.shirt,
            hair: m.hair, face: spot.face, moving: false, status: stat, ph: (key.charCodeAt(0) % 7) + 1,
          });
        } else {
          cur.tx = spot.x; cur.tz = spot.z; cur.status = stat;
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
          name: me.name, shirt: me.shirt, hair: me.hair, status: me.status ?? "working",
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
        // Move local player: keyboard/D-pad (WASD) or a click-to-move target.
        const SPD = 3.4;
        const me = selfRef.current;
        let dx = (keys.current.d ? 1 : 0) - (keys.current.a ? 1 : 0);
        let dz = (keys.current.s ? 1 : 0) - (keys.current.w ? 1 : 0);
        if (dx || dz) {
          moveTargetRef.current = null; // any key press cancels click-to-move
          if (dx && dz) { dx *= 0.707; dz *= 0.707; }
        } else if (moveTargetRef.current) {
          const tx = moveTargetRef.current.x - me.x, tz = moveTargetRef.current.z - me.z;
          const dist = Math.hypot(tx, tz);
          if (dist < 0.12) moveTargetRef.current = null; // arrived
          else { dx = tx / dist; dz = tz / dist; }
        }
        me.moving = !!(dx || dz);
        if (me.moving) {
          const px = me.x, pz = me.z;
          moveActor(me, dx * SPD * dt, dz * SPD * dt);
          me.face = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? "right" : "left") : dz > 0 ? "down" : "up";
          // Blocked by furniture on the way to a click target → stop trying.
          if (moveTargetRef.current && Math.hypot(me.x - px, me.z - pz) < 0.0005) moveTargetRef.current = null;
        }
        // "近づくと開く": open/close a panel as the player enters/leaves a station.
        for (const s of STATIONS) {
          const inside = Math.hypot(me.x - s.x, me.z - s.z) < s.r;
          if (inside !== nearRef.current[s.id]) {
            nearRef.current[s.id] = inside;
            onStationRef.current?.(s.id, inside);
          }
        }
        // Interpolate remote players toward their status seat; when their status
        // changes zones they visibly "walk" over to the new spot.
        for (const r of remotesRef.current.values()) {
          const rdx = r.tx - r.x, rdz = r.tz - r.z;
          r.moving = Math.hypot(rdx, rdz) > 0.06;
          if (r.moving) r.face = Math.abs(rdx) > Math.abs(rdz) ? (rdx > 0 ? "right" : "left") : rdz > 0 ? "down" : "up";
          const k = Math.min(1, dt * 10);
          r.x += rdx * k;
          r.z += rdz * k;
        }
        // Low-frequency presence to stay well under Realtime limits (Free allows
        // ~20 presence msgs/sec): update when the player settles (stops moving)
        // and on a slow heartbeat, not every frame. Remote avatars interpolate
        // to the new spot, so it still reads as walking there.
        sinceTrack += dt;
        const justStopped = wasMoving && !me.moving;
        wasMoving = me.moving;
        if (justStopped || sinceTrack > 4 || metaDirtyRef.current) {
          sinceTrack = 0;
          metaDirtyRef.current = false;
          channel.track({
            x: me.x, z: me.z, face: me.face, moving: false,
            name: me.name, shirt: me.shirt, hair: me.hair, status: me.status ?? "working",
          } satisfies PresenceMeta);
        }

        // Grow the office into a forest toward the real progress.
        worldRef.current.dispP += (worldRef.current.targetP - worldRef.current.dispP) * Math.min(1, dt * 2);

        const clock = new Date();
        const state: WorldState = {
          dispP: worldRef.current.dispP,
          targetP: worldRef.current.targetP,
          weather: weatherRef.current,
          hour: clock.getHours() + clock.getMinutes() / 60,
          actors: [me, AI, ...remotesRef.current.values()],
          plants: plantsRef.current,
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
          const tr = officePlantAt(
            e.clientX - rect.left, e.clientY - rect.top,
            canvas.clientWidth, canvas.clientHeight,
            selfRef.current, plantsRef.current,
          );
          e.currentTarget.style.cursor = tr ? "pointer" : "default";
          onPickPlant(tr ? tr.species : null, e.clientX, e.clientY);
        }}
        onPointerLeave={() => onPickPlant?.(null, 0, 0)}
        onClick={(e) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const { scale, ox, oy } = viewTransform(selfRef.current, canvas.clientWidth, canvas.clientHeight);
          const wx = (e.clientX - rect.left) / scale + ox;
          const wy = (e.clientY - rect.top) / scale + oy;
          // A station click opens its panel (priority over walking). Generous
          // radius so the board / 内田さん sprite (offset from the floor marker)
          // still registers; stations are far apart.
          if (onStationClick) {
            for (const s of STATIONS) {
              if (Math.hypot(wx - s.x * T, wy - s.z * T) < (s.r + 0.9) * T) { onStationClick(s.id); return; }
            }
          }
          // Otherwise walk toward the clicked spot (parallel to WASD).
          moveTargetRef.current = { x: wx / T, z: wy / T };
        }}
        onDoubleClick={(e) => {
          if (!onStationDblClick) return;
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();
          const { scale, ox, oy } = viewTransform(selfRef.current, canvas.clientWidth, canvas.clientHeight);
          const wx = (e.clientX - rect.left) / scale + ox;
          const wy = (e.clientY - rect.top) / scale + oy;
          for (const s of STATIONS) {
            if (Math.hypot(wx - s.x * T, wy - s.z * T) < (s.r + 0.9) * T) { onStationDblClick(s.id); return; }
          }
        }}
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
