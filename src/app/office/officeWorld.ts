// Metaverse office renderer, ported/adapted from the training mock.
// Framework-agnostic: page/World.tsx drive it through a WorldState ref so the
// React tree never re-runs the animation loop. Progress (completed tasks) grows
// the office into a forest, reusing the same plant species, rare plants and
// weather as the /forest view.

import {
  COMMON_SPECIES,
  RARE_SPECIES_LIST,
  getSpecies,
} from "@/app/forest/plants";
import type { Weather } from "@/app/forest/weather";

export const T = 52;
export const COLS = 24;
export const ROWS = 16;
export const MAPW = COLS * T;
export const MAPH = ROWS * T;

export type Facing = "up" | "down" | "left" | "right";

export type Actor = {
  x: number;
  z: number;
  name: string;
  shirt: string;
  hair: string;
  face: Facing;
  ph: number;
  moving?: boolean;
  self?: boolean;
  ai?: boolean;
  glasses?: boolean;
  tx?: number;
  tz?: number;
  wait?: number;
  stuck?: number;
};

export type WorldState = {
  actors: Actor[];
  dispP: number; // smoothed progress 0..1, drives tree growth
  targetP: number;
  weather: Weather;
};

type Furn = { type: string; x: number; y: number; w: number; h: number };

export const FURN: Furn[] = [
  { type: "table", x: 3, y: 3, w: 4, h: 2 },
  { type: "chair", x: 2.0, y: 3.2, w: 0.8, h: 0.8 },
  { type: "chair", x: 2.0, y: 4.2, w: 0.8, h: 0.8 },
  { type: "chair", x: 7.2, y: 3.2, w: 0.8, h: 0.8 },
  { type: "chair", x: 7.2, y: 4.2, w: 0.8, h: 0.8 },
  { type: "desk", x: 13, y: 3, w: 2, h: 1 },
  { type: "desk", x: 16, y: 3, w: 2, h: 1 },
  { type: "desk", x: 19, y: 3, w: 2, h: 1 },
  { type: "chair", x: 13.6, y: 4.1, w: 0.8, h: 0.7 },
  { type: "chair", x: 16.6, y: 4.1, w: 0.8, h: 0.7 },
  { type: "chair", x: 19.6, y: 4.1, w: 0.8, h: 0.7 },
  { type: "desk", x: 13, y: 6.5, w: 2, h: 1 },
  { type: "desk", x: 16, y: 6.5, w: 2, h: 1 },
  { type: "desk", x: 19, y: 6.5, w: 2, h: 1 },
  { type: "sofa", x: 2.8, y: 11.3, w: 3, h: 1.1 },
  { type: "lowtable", x: 3.6, y: 13.1, w: 1.5, h: 0.8 },
  { type: "counter", x: 19.6, y: 12.6, w: 3.2, h: 1.1 },
  { type: "shelf", x: 8.5, y: 1.45, w: 2.4, h: 0.85 },
  { type: "plant", x: 1.4, y: 1.8, w: 0.7, h: 0.7 },
  { type: "plant", x: 21.9, y: 1.8, w: 0.7, h: 0.7 },
  { type: "plant", x: 1.4, y: 13.9, w: 0.7, h: 0.7 },
];

const RUGS = [
  { x: 2, y: 2, w: 7, h: 5, c: "#8fbfae" },
  { x: 2.3, y: 10.6, w: 5, h: 3.8, c: "#d3968e" },
];

const ZONES = [
  { t: "ミーティング", x: 5.5, y: 6.55 },
  { t: "ワークスペース", x: 17, y: 8.8 },
  { t: "ラウンジ", x: 4.8, y: 10.35 },
  { t: "カフェ", x: 21.2, y: 12.3 },
];

export const POIS = [
  { x: 5, y: 7.6 }, { x: 10.5, y: 5.3 }, { x: 14, y: 5.5 }, { x: 17, y: 5.5 },
  { x: 20, y: 5.5 }, { x: 4.8, y: 9.9 }, { x: 20.5, y: 11.9 }, { x: 10, y: 9 },
  { x: 8.5, y: 12.5 }, { x: 15, y: 10.5 }, { x: 12, y: 12.5 },
];

export function srand(i: number): number {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// Fixed tree slots; each is assigned a real species (every 5th is rare), reusing
// the /forest species lists so the office grows into the same kind of forest.
export type OfficeTree = {
  x: number;
  y: number;
  s: number; // progress threshold at which it appears
  species: string;
  kind: "normal" | "rare";
};
const RAW_TREES = [
  { x: 1.9, y: 9.6, s: 0.1 }, { x: 22.1, y: 5.8, s: 0.1 }, { x: 11, y: 14.2, s: 0.2 },
  { x: 2.0, y: 7.0, s: 0.3 }, { x: 22.0, y: 10.6, s: 0.3 }, { x: 15, y: 13.9, s: 0.4 },
  { x: 9.6, y: 11.0, s: 0.5 }, { x: 6.9, y: 9.8, s: 0.5 }, { x: 18, y: 9.8, s: 0.6 },
  { x: 12.4, y: 2.7, s: 0.7 }, { x: 2.3, y: 2.9, s: 0.7 }, { x: 16.6, y: 2.7, s: 0.8 },
  { x: 21.4, y: 2.9, s: 0.9 }, { x: 5.6, y: 14.2, s: 0.9 }, { x: 13.4, y: 9.2, s: 1 },
];
export const OFFICE_TREES: OfficeTree[] = RAW_TREES.map((tr, i) => {
  const isRare = i % 5 === 4;
  const list = isRare ? RARE_SPECIES_LIST : COMMON_SPECIES;
  const sp = list[Math.floor(srand(i * 7.3) * list.length)];
  return { ...tr, species: sp.key, kind: isRare ? "rare" : "normal" };
});

function treeGrow(tr: OfficeTree, dispP: number): number {
  return Math.max(0, Math.min(1, (dispP - tr.s + 0.15) / 0.15));
}

const SKIN = "#ffd9b3";
const R = 0.32;

export function blocked(x: number, z: number): boolean {
  if (x < 1.4 || x > COLS - 1.4 || z < 2.0 || z > ROWS - 1.5) return true;
  for (const f of FURN) {
    if (x > f.x - R && x < f.x + f.w + R && z > f.y - R * 0.7 && z < f.y + f.h + R * 0.7)
      return true;
  }
  return false;
}

export function moveActor(a: Actor, dx: number, dz: number) {
  if (dx && !blocked(a.x + dx, a.z)) a.x += dx;
  if (dz && !blocked(a.x, a.z + dz)) a.z += dz;
}

// Camera offset (top-left of the viewport in world pixels), following the player.
export function cameraOffset(player: Actor | undefined, W: number, H: number) {
  let ox = (player ? player.x * T : MAPW / 2) - W / 2;
  let oy = (player ? player.z * T : MAPH / 2) - H / 2;
  ox = MAPW <= W ? -(W - MAPW) / 2 : Math.max(0, Math.min(MAPW - W, ox));
  oy = MAPH <= H ? -(H - MAPH) / 2 : Math.max(0, Math.min(MAPH - H, oy));
  return { ox, oy };
}

// Which grown tree's canopy is under the screen point, if any (for tooltips).
export function treeAt(
  sx: number, sy: number, W: number, H: number, player: Actor | undefined, dispP: number,
): OfficeTree | null {
  const { ox, oy } = cameraOffset(player, W, H);
  const wx = sx + ox, wy = sy + oy;
  let hit: OfficeTree | null = null;
  let best = 1e9;
  for (const tr of OFFICE_TREES) {
    if (treeGrow(tr, dispP) <= 0.05) continue;
    const cx = tr.x * T;
    const cy = tr.y * T - 34;
    const d = Math.hypot(wx - cx, wy - cy);
    if (d < 34 && d < best) { best = d; hit = tr; }
  }
  return hit;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawFurn(ctx: CanvasRenderingContext2D, f: Furn) {
  const x = f.x * T, y = f.y * T, w = f.w * T, h = f.h * T;
  switch (f.type) {
    case "table":
      ctx.fillStyle = "rgba(0,0,0,0.15)"; rr(ctx, x + 3, y + 6, w, h, 12); ctx.fill();
      ctx.fillStyle = "#8d5f3e"; rr(ctx, x, y, w, h, 12); ctx.fill();
      ctx.fillStyle = "#a9754e"; rr(ctx, x + 5, y + 4, w - 10, h - 14, 9); ctx.fill();
      ctx.fillStyle = "#f3ede2"; rr(ctx, x + w * 0.3, y + h * 0.3, 26, 18, 2); ctx.fill();
      break;
    case "desk":
      ctx.fillStyle = "rgba(0,0,0,0.13)"; rr(ctx, x + 2, y + 5, w, h, 8); ctx.fill();
      ctx.fillStyle = "#b98a5e"; rr(ctx, x, y, w, h, 8); ctx.fill();
      ctx.fillStyle = "#cfa176"; rr(ctx, x + 3, y + 3, w - 6, h - 12, 6); ctx.fill();
      ctx.fillStyle = "#3d4451"; rr(ctx, x + w * 0.32, y + 8, 30, 20, 3); ctx.fill();
      ctx.fillStyle = "#8fc6e8"; rr(ctx, x + w * 0.32 + 3, y + 11, 24, 12, 2); ctx.fill();
      break;
    case "chair":
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath(); ctx.ellipse(x + w / 2 + 1, y + h / 2 + 4, w * 0.5, h * 0.35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#7a5c48"; rr(ctx, x, y, w, h, 10); ctx.fill();
      ctx.fillStyle = "#94735c"; rr(ctx, x + 4, y + 4, w - 8, h - 8, 7); ctx.fill();
      break;
    case "sofa":
      ctx.fillStyle = "rgba(0,0,0,0.15)"; rr(ctx, x + 3, y + 6, w, h, 14); ctx.fill();
      ctx.fillStyle = "#b4574a"; rr(ctx, x, y - 12, w, h + 12, 12); ctx.fill();
      ctx.fillStyle = "#cd6b5b"; rr(ctx, x + 5, y + 6, w - 10, h - 10, 9); ctx.fill();
      break;
    case "lowtable":
      ctx.fillStyle = "rgba(0,0,0,0.12)"; rr(ctx, x + 2, y + 4, w, h, 10); ctx.fill();
      ctx.fillStyle = "#9c6f4c"; rr(ctx, x, y, w, h, 10); ctx.fill();
      ctx.fillStyle = "#b58560"; rr(ctx, x + 4, y + 3, w - 8, h - 9, 7); ctx.fill();
      break;
    case "counter":
      ctx.fillStyle = "rgba(0,0,0,0.15)"; rr(ctx, x + 3, y + 6, w, h, 10); ctx.fill();
      ctx.fillStyle = "#6e4f3a"; rr(ctx, x, y, w, h, 10); ctx.fill();
      ctx.fillStyle = "#876148"; rr(ctx, x + 4, y + 3, w - 8, h - 12, 7); ctx.fill();
      break;
    case "shelf":
      ctx.fillStyle = "rgba(0,0,0,0.13)"; rr(ctx, x + 2, y + 4, w, h, 4); ctx.fill();
      ctx.fillStyle = "#7a5a42"; rr(ctx, x, y, w, h, 4); ctx.fill();
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = ["#c25b5b", "#5b8dc2", "#68a868", "#d8a24a", "#8a6bb8", "#c2765b", "#5bb0a8"][i];
        ctx.fillRect(x + 8 + (i * (w - 16)) / 7, y + 6, (w - 16) / 7 - 3, h - 12);
      }
      break;
    case "plant": {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.fillStyle = "#b06a4c";
      ctx.beginPath();
      ctx.moveTo(cx - 11, cy); ctx.lineTo(cx + 11, cy);
      ctx.lineTo(cx + 8, cy + 16); ctx.lineTo(cx - 8, cy + 16);
      ctx.closePath(); ctx.fill();
      for (const [ox, oy, r2] of [[-8, -12, 9], [8, -12, 9], [0, -20, 10], [0, -8, 9]]) {
        ctx.fillStyle = ["#5d9e5d", "#6fae6f", "#4f8f4f"][Math.abs(ox + oy) % 3];
        ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r2, 0, 7); ctx.fill();
      }
      break;
    }
  }
}

// Shift a hex color toward white by f (0..1), for lighter canopy layers.
function lighten(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * f);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function drawTree(ctx: CanvasRenderingContext2D, tr: OfficeTree, t: number, dispP: number) {
  const grow = treeGrow(tr, dispP);
  if (grow <= 0.01) return;
  const px = tr.x * T, py = tr.y * T;
  const s = grow * (0.85 + srand(tr.x * 7 + tr.y) * 0.3);
  const sway = Math.sin(t * 1.2 + tr.x * 3) * 2 * s;
  const base = getSpecies(tr.species).color;

  // Rare species get a soft golden aura so they stand out.
  if (tr.kind === "rare") {
    ctx.fillStyle = `rgba(240,200,90,${0.12 * grow})`;
    ctx.beginPath(); ctx.arc(px, py - 40 * s, 34 * s, 0, 7); ctx.fill();
  }
  ctx.fillStyle = "rgba(40,60,30,0.20)";
  ctx.beginPath(); ctx.ellipse(px, py + 3, 24 * s, 8 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#7a5236";
  rr(ctx, px - 5 * s, py - 34 * s, 10 * s, 36 * s, 4 * s); ctx.fill();
  const layers = [base, lighten(base, 0.12), lighten(base, 0.24)];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = layers[i];
    ctx.beginPath();
    ctx.arc(px + sway * (i + 1) * 0.3, py - (38 + i * 16) * s, (26 - i * 5) * s, 0, 7);
    ctx.arc(px - 14 * s + sway * 0.2, py - (32 + i * 12) * s, (18 - i * 4) * s, 0, 7);
    ctx.arc(px + 14 * s + sway * 0.4, py - (32 + i * 12) * s, (18 - i * 4) * s, 0, 7);
    ctx.fill();
  }
}

function drawChar(ctx: CanvasRenderingContext2D, a: Actor, t: number) {
  const px = a.x * T, py = a.z * T;
  const bob = a.moving ? Math.sin(t * 11 + a.ph) * 1.8 : Math.sin(t * 2 + a.ph) * 0.7;
  const step = a.moving ? Math.sin(t * 11 + a.ph) * 3.5 : 0;

  if (a.self) {
    ctx.strokeStyle = "rgba(47,158,119,0.65)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(px, py + 3, 17, 8, 0, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = "rgba(60,30,10,0.25)";
  ctx.beginPath(); ctx.ellipse(px, py + 3, 13, 5.5, 0, 0, 7); ctx.fill();

  ctx.fillStyle = a.ai ? "#5a6270" : "#4e5568";
  rr(ctx, px - 8, py - 12 + Math.max(0, step), 6.5, 12 - Math.max(0, step), 3); ctx.fill();
  rr(ctx, px + 1.5, py - 12 + Math.max(0, -step), 6.5, 12 - Math.max(0, -step), 3); ctx.fill();

  ctx.fillStyle = a.shirt;
  rr(ctx, px - 11, py - 30 + bob, 22, 21, 9); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  rr(ctx, px - 11, py - 30 + bob, 22, 8, 9); ctx.fill();
  if (a.ai) {
    ctx.fillStyle = "#2f9e77";
    ctx.beginPath();
    ctx.moveTo(px - 2.5, py - 29 + bob); ctx.lineTo(px + 2.5, py - 29 + bob);
    ctx.lineTo(px + 1.5, py - 18 + bob); ctx.lineTo(px, py - 15 + bob); ctx.lineTo(px - 1.5, py - 18 + bob);
    ctx.closePath(); ctx.fill();
  }

  const hy = py - 38 + bob;
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.arc(px, hy, 12.5, 0, 7); ctx.fill();
  ctx.fillStyle = a.hair;
  if (a.face === "up") {
    ctx.beginPath(); ctx.arc(px, hy - 0.5, 12.5, 0, 7); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(px, hy - 1.5, 12.5, Math.PI, Math.PI * 2); ctx.fill();
    rr(ctx, px - 12.5, hy - 3.5, 25, 5, 2); ctx.fill();
  }
  if (a.face !== "up") {
    const off = a.face === "left" ? -4 : a.face === "right" ? 4 : 0;
    if (a.glasses) {
      ctx.strokeStyle = "#3a4048"; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(px - 4.5 + off, hy + 2.5, 4.4, 0, 7);
      ctx.moveTo(px + 8.9 + off, hy + 2.5);
      ctx.arc(px + 4.5 + off, hy + 2.5, 4.4, 0, 7);
      ctx.stroke();
    }
    ctx.fillStyle = "#3a2f28";
    ctx.beginPath();
    ctx.arc(px - 4.5 + off, hy + 2.5, 1.8, 0, 7);
    ctx.arc(px + 4.5 + off, hy + 2.5, 1.8, 0, 7);
    ctx.fill();
  }

  ctx.font = "600 11px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = a.ai ? "🤖 " + a.name : a.name;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = a.ai ? "rgba(20,80,60,0.65)" : "rgba(50,30,15,0.55)";
  rr(ctx, px - tw / 2 - 6, py + 9, tw + 12, 16, 8); ctx.fill();
  ctx.fillStyle = a.self ? "#a8f0d8" : "#fdf6ea";
  ctx.fillText(label, px, py + 17.5);
}

// Weather-driven light over the whole scene ("日差し"): warm for clear skies,
// a cool grey veil for cloud/rain/snow. Reuses the /forest Weather condition.
function drawWeatherLight(ctx: CanvasRenderingContext2D, weather: Weather) {
  if (weather === "clear") {
    const g = ctx.createLinearGradient(0, 0, MAPW, MAPH);
    g.addColorStop(0, "rgba(255,238,180,0.16)");
    g.addColorStop(1, "rgba(255,236,180,0.04)");
    ctx.fillStyle = g;
  } else {
    const veil = weather === "rain" ? 0.26 : weather === "snow" ? 0.14 : 0.16;
    ctx.fillStyle = `rgba(120,128,140,${veil})`;
  }
  ctx.fillRect(0, 0, MAPW, MAPH);
}

export function drawWorld(
  ctx: CanvasRenderingContext2D, W: number, H: number, state: WorldState, t: number,
) {
  const player = state.actors.find((a) => a.self) ?? state.actors[0];
  ctx.fillStyle = "#2b2430";
  ctx.fillRect(0, 0, W, H);

  const { ox, oy } = cameraOffset(player, W, H);
  ctx.save();
  ctx.translate(-ox, -oy);

  // Floor
  ctx.fillStyle = "#e3b884";
  ctx.fillRect(0, 0, MAPW, MAPH);
  ctx.strokeStyle = "rgba(140,90,45,0.18)";
  ctx.lineWidth = 1;
  for (let r = 0; r < ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(MAPW, r * T); ctx.stroke();
    if (r % 2 === 0) {
      ctx.fillStyle = "rgba(255,235,200,0.10)";
      ctx.fillRect(0, r * T, MAPW, T);
      ctx.fillStyle = "#e3b884";
    }
  }

  if (state.dispP > 0.02) {
    for (let i = 0; i < 6; i++) {
      const gx = (2 + srand(i * 3 + 1) * 20) * T, gy = (3 + srand(i * 3 + 2) * 11) * T;
      const rad = (2.2 + srand(i * 3) * 2.5) * T;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
      g.addColorStop(0, `rgba(110,170,90,${state.dispP * 0.3})`);
      g.addColorStop(1, "rgba(110,170,90,0)");
      ctx.fillStyle = g;
      ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
    }
  }

  for (const g of RUGS) {
    ctx.fillStyle = g.c;
    rr(ctx, g.x * T, g.y * T, g.w * T, g.h * T, 18); ctx.fill();
  }

  ctx.font = "700 13px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const z of ZONES) {
    ctx.fillStyle = "rgba(90,55,25,0.40)";
    ctx.fillText(z.t, z.x * T, z.y * T);
  }

  ctx.fillStyle = "#5f4c3f";
  ctx.fillRect(0, 0, MAPW, T * 1.4);
  ctx.fillRect(0, MAPH - T, MAPW, T);
  ctx.fillRect(0, 0, T, MAPH);
  ctx.fillRect(MAPW - T, 0, T, MAPH);
  ctx.fillStyle = "#7b6353";
  ctx.fillRect(T * 0.15, T * 0.12, MAPW - T * 0.3, T * 1.1);
  const moss = Math.max(0, state.dispP - 0.3) * 0.45;
  if (moss > 0.01) {
    ctx.fillStyle = `rgba(70,130,60,${moss})`;
    ctx.fillRect(0, 0, MAPW, T * 1.4);
    ctx.fillRect(0, MAPH - T, MAPW, T);
    ctx.fillRect(0, 0, T, MAPH);
    ctx.fillRect(MAPW - T, 0, T, MAPH);
  }

  const items = [
    ...FURN.map((f) => ({ key: (f.y + f.h) * T, draw: () => drawFurn(ctx, f) })),
    ...OFFICE_TREES.map((tr) => ({ key: tr.y * T + 4, draw: () => drawTree(ctx, tr, t, state.dispP) })),
    ...state.actors.map((a) => ({ key: a.z * T + 6, draw: () => drawChar(ctx, a, t) })),
  ].sort((a, b) => a.key - b.key);
  for (const it of items) it.draw();

  if (state.dispP > 0.02) {
    ctx.fillStyle = `rgba(90,160,90,${state.dispP * 0.07})`;
    ctx.fillRect(0, 0, MAPW, MAPH);
  }
  drawWeatherLight(ctx, state.weather);
  ctx.restore();
}
