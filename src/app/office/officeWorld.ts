// Metaverse office renderer. The visual design (warm forest × wood, immersive
// "walk up to a station" panels, 内田さん corner, light rays) follows the
// Claude Design mock; it reuses the /forest plant species, rare plants and
// weather. page/World.tsx drive it through a WorldState ref so the React tree
// never re-runs the animation loop.

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
};

// Immersive stations: walk into the radius and the matching panel opens.
export type StationId = "task" | "uchida";
export const STATIONS: {
  id: StationId;
  x: number;
  z: number;
  r: number;
  badge: string;
  color: string;
  ph: number;
}[] = [
  { id: "task", x: 3.2, z: 6.75, r: 1.65, badge: "📋 タスクを開く", color: "#e8a23a", ph: 0 },
  { id: "uchida", x: 11.1, z: 11.05, r: 1.75, badge: "💬 内田さんと話す", color: "#2f9e77", ph: 1.6 },
];

export type WorldState = {
  actors: Actor[];
  dispP: number;
  targetP: number;
  weather: Weather;
  hour: number; // local time of day (0..24) for the window sun/sky
};

// Where a teammate stands when they arrive: a seat in one of the zones
// (workspace desks, meeting table, lounge sofa, café counter) instead of
// everyone stacking on one spawn spot. Each seat carries its zone so a future
// presence status (作業中 / 休憩中 / 離席) can pick an anchor by zone — e.g.
// 作業中 → a ワークスペース desk, 休憩中 → ラウンジ / カフェ.
export type Seat = { x: number; z: number; face: Facing; zone: string };
// Seats sit on OPEN floor just in front of each zone's furniture (not on top of
// it), so the avatar reads as "at their spot" yet can always walk away — every
// seat below is verified free with 3–4 escape directions against blocked().
export const SEATS: Seat[] = [
  // ワークスペース — standing at the desks, facing the screens.
  { x: 14.0, z: 5.35, face: "up", zone: "ワークスペース" },
  { x: 17.0, z: 5.35, face: "up", zone: "ワークスペース" },
  { x: 20.0, z: 5.35, face: "up", zone: "ワークスペース" },
  { x: 14.0, z: 8.05, face: "up", zone: "ワークスペース" },
  { x: 17.0, z: 8.05, face: "up", zone: "ワークスペース" },
  { x: 20.0, z: 8.05, face: "up", zone: "ワークスペース" },
  // ミーティング — along the table, facing it.
  { x: 4.8, z: 5.45, face: "up", zone: "ミーティング" },
  { x: 5.8, z: 5.45, face: "up", zone: "ミーティング" },
  { x: 6.6, z: 5.45, face: "up", zone: "ミーティング" },
  // ラウンジ — around the sofa.
  { x: 3.3, z: 10.5, face: "down", zone: "ラウンジ" },
  { x: 4.6, z: 10.5, face: "down", zone: "ラウンジ" },
  { x: 5.7, z: 10.6, face: "down", zone: "ラウンジ" },
  { x: 2.1, z: 11.8, face: "right", zone: "ラウンジ" },
  { x: 6.5, z: 11.8, face: "left", zone: "ラウンジ" },
  // カフェ — at the counter.
  { x: 20.4, z: 14.0, face: "up", zone: "カフェ" },
  { x: 21.6, z: 14.0, face: "up", zone: "カフェ" },
];

// A stable seat per user (same hashing family as the shirt color) so everyone
// keeps a consistent "home seat". With more users than seats, some may share
// one — acceptable for a small team.
export function seatForUser(id: string): Seat {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return SEATS[h % SEATS.length];
}

type Furn = { type: string; x: number; y: number; w: number; h: number; zk?: number };

export const FURN: Furn[] = [
  { type: "table", x: 3, y: 3, w: 4, h: 2 },
  { type: "chair", x: 2.0, y: 3.2, w: 0.8, h: 0.8 }, { type: "chair", x: 2.0, y: 4.2, w: 0.8, h: 0.8 },
  { type: "chair", x: 7.2, y: 3.2, w: 0.8, h: 0.8 }, { type: "chair", x: 7.2, y: 4.2, w: 0.8, h: 0.8 },
  { type: "chair", x: 3.7, y: 2.15, w: 0.8, h: 0.8 }, { type: "chair", x: 5.5, y: 2.15, w: 0.8, h: 0.8 },
  { type: "desk", x: 13, y: 3, w: 2, h: 1 }, { type: "desk", x: 16, y: 3, w: 2, h: 1 }, { type: "desk", x: 19, y: 3, w: 2, h: 1 },
  { type: "chair", x: 13.6, y: 4.1, w: 0.8, h: 0.7 }, { type: "chair", x: 16.6, y: 4.1, w: 0.8, h: 0.7 }, { type: "chair", x: 19.6, y: 4.1, w: 0.8, h: 0.7 },
  { type: "desk", x: 13, y: 6.5, w: 2, h: 1 }, { type: "desk", x: 16, y: 6.5, w: 2, h: 1 }, { type: "desk", x: 19, y: 6.5, w: 2, h: 1 },
  { type: "sofa", x: 2.8, y: 11.3, w: 3, h: 1.1 },
  { type: "lowtable", x: 3.6, y: 13.1, w: 1.5, h: 0.8 },
  { type: "counter", x: 19.6, y: 12.6, w: 3.2, h: 1.1 },
  { type: "shelf", x: 8.5, y: 1.45, w: 2.4, h: 0.85 },
  // 内田さん corner
  { type: "udesk", x: 10.0, y: 9.4, w: 2.2, h: 1.0 },
  { type: "nameplate", x: 12.55, y: 10.1, w: 0.3, h: 0.3, zk: 40 },
  { type: "lamp", x: 9.35, y: 9.3, w: 0.4, h: 0.4, zk: 8 },
  { type: "taskboard", x: 2.3, y: 5.8, w: 1.9, h: 0.5, zk: 82 },
  { type: "plant", x: 1.4, y: 1.8, w: 0.7, h: 0.7 }, { type: "plant", x: 21.9, y: 1.8, w: 0.7, h: 0.7 },
  { type: "plant", x: 1.4, y: 13.9, w: 0.7, h: 0.7 }, { type: "plant", x: 11.6, y: 1.8, w: 0.7, h: 0.7 },
  { type: "plant", x: 22.0, y: 8.8, w: 0.7, h: 0.7 }, { type: "plant", x: 12.7, y: 11.0, w: 0.7, h: 0.7 },
];

const RUGS = [
  { x: 2, y: 2, w: 7, h: 5, c: "#8fbfae" },
  { x: 2.3, y: 10.6, w: 5, h: 3.8, c: "#d3968e" },
  { x: 9.0, y: 8.7, w: 4.2, h: 3.5, c: "#e6c396" },
];

const ZONES = [
  { t: "ミーティング", x: 5.5, y: 6.55 },
  { t: "ワークスペース", x: 17, y: 8.8 },
  { t: "ラウンジ", x: 4.8, y: 10.35 },
  { t: "カフェ", x: 21.2, y: 12.3 },
];

const BFLY_HOMES = [[6, 9.5], [16, 11], [11.5, 6], [20, 8.5]];

export function srand(i: number): number {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// Fixed tree slots; each is a real species (every 5th rare), reusing /forest.
export type OfficeTree = { x: number; y: number; s: number; species: string; kind: "normal" | "rare" };
const RAW_TREES = [
  { x: 1.9, y: 9.6, s: 0.1 }, { x: 22.1, y: 5.8, s: 0.1 }, { x: 11, y: 14.2, s: 0.2 },
  { x: 2.0, y: 7.0, s: 0.3 }, { x: 22.0, y: 10.6, s: 0.3 }, { x: 15, y: 13.9, s: 0.4 },
  { x: 6.9, y: 9.8, s: 0.5 }, { x: 18, y: 9.8, s: 0.6 }, { x: 6.6, y: 12.6, s: 0.6 },
  { x: 12.4, y: 2.7, s: 0.7 }, { x: 2.3, y: 2.9, s: 0.7 }, { x: 16.6, y: 2.7, s: 0.8 },
  { x: 21.4, y: 2.9, s: 0.9 }, { x: 5.6, y: 14.2, s: 0.9 }, { x: 14.4, y: 8.2, s: 1 },
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
    if (f.type === "nameplate" || f.type === "lamp") continue;
    if (x > f.x - R && x < f.x + f.w + R && z > f.y - R * 0.7 && z < f.y + f.h + R * 0.7) return true;
  }
  return false;
}
export function moveActor(a: Actor, dx: number, dz: number) {
  if (dx && !blocked(a.x + dx, a.z)) a.x += dx;
  if (dz && !blocked(a.x, a.z + dz)) a.z += dz;
}

// Scale the fixed map to always COVER the viewport (no dark margins on any
// window size); the camera then follows the player within it.
export function viewTransform(player: Actor | undefined, W: number, H: number) {
  const scale = Math.max(W / MAPW, H / MAPH);
  const vw = W / scale, vh = H / scale;
  let ox = (player ? player.x * T : MAPW / 2) - vw / 2;
  let oy = (player ? player.z * T : MAPH / 2) - vh / 2;
  ox = Math.max(0, Math.min(MAPW - vw, ox));
  oy = Math.max(0, Math.min(MAPH - vh, oy));
  return { scale, ox, oy };
}
export function treeAt(sx: number, sy: number, W: number, H: number, player: Actor | undefined, dispP: number): OfficeTree | null {
  const { scale, ox, oy } = viewTransform(player, W, H);
  const wx = sx / scale + ox, wy = sy / scale + oy;
  let hit: OfficeTree | null = null, best = 1e9;
  for (const tr of OFFICE_TREES) {
    if (treeGrow(tr, dispP) <= 0.05) continue;
    const d = Math.hypot(wx - tr.x * T, wy - (tr.y * T - 34));
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
      ctx.fillStyle = "#e5dccb"; rr(ctx, x + w * 0.55, y + h * 0.42, 24, 16, 2); ctx.fill();
      break;
    case "desk":
      ctx.fillStyle = "rgba(0,0,0,0.13)"; rr(ctx, x + 2, y + 5, w, h, 8); ctx.fill();
      ctx.fillStyle = "#b98a5e"; rr(ctx, x, y, w, h, 8); ctx.fill();
      ctx.fillStyle = "#cfa176"; rr(ctx, x + 3, y + 3, w - 6, h - 12, 6); ctx.fill();
      ctx.fillStyle = "#3d4451"; rr(ctx, x + w * 0.32, y + 8, 30, 20, 3); ctx.fill();
      ctx.fillStyle = "#8fc6e8"; rr(ctx, x + w * 0.32 + 3, y + 11, 24, 12, 2); ctx.fill();
      ctx.fillStyle = "#d95f5f"; ctx.beginPath(); ctx.arc(x + w * 0.78, y + 18, 6, 0, 7); ctx.fill();
      break;
    case "chair":
      ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.beginPath(); ctx.ellipse(x + w / 2 + 1, y + h / 2 + 4, w * 0.5, h * 0.35, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#7a5c48"; rr(ctx, x, y, w, h, 10); ctx.fill();
      ctx.fillStyle = "#94735c"; rr(ctx, x + 4, y + 4, w - 8, h - 8, 7); ctx.fill();
      break;
    case "sofa":
      ctx.fillStyle = "rgba(0,0,0,0.15)"; rr(ctx, x + 3, y + 6, w, h, 14); ctx.fill();
      ctx.fillStyle = "#b4574a"; rr(ctx, x, y - 12, w, h + 12, 12); ctx.fill();
      ctx.fillStyle = "#cd6b5b"; rr(ctx, x + 5, y + 6, w - 10, h - 10, 9); ctx.fill();
      ctx.fillStyle = "#e8b64c"; rr(ctx, x + 8, y - 4, 22, 18, 6); ctx.fill();
      ctx.fillStyle = "#7fa8c9"; rr(ctx, x + w - 32, y - 4, 22, 18, 6); ctx.fill();
      break;
    case "lowtable":
      ctx.fillStyle = "rgba(0,0,0,0.12)"; rr(ctx, x + 2, y + 4, w, h, 10); ctx.fill();
      ctx.fillStyle = "#9c6f4c"; rr(ctx, x, y, w, h, 10); ctx.fill();
      ctx.fillStyle = "#b58560"; rr(ctx, x + 4, y + 3, w - 8, h - 9, 7); ctx.fill();
      ctx.fillStyle = "#6fae6f"; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, 6, 0, 7); ctx.fill();
      break;
    case "counter":
      ctx.fillStyle = "rgba(0,0,0,0.15)"; rr(ctx, x + 3, y + 6, w, h, 10); ctx.fill();
      ctx.fillStyle = "#6e4f3a"; rr(ctx, x, y, w, h, 10); ctx.fill();
      ctx.fillStyle = "#876148"; rr(ctx, x + 4, y + 3, w - 8, h - 12, 7); ctx.fill();
      ctx.fillStyle = "#33393f"; rr(ctx, x + 12, y - 14, 26, 30, 4); ctx.fill();
      ctx.fillStyle = "#c2483b"; rr(ctx, x + 16, y - 10, 18, 6, 2); ctx.fill();
      for (let i = 0; i < 3; i++) { ctx.fillStyle = ["#e8d9c0", "#c9dbe8", "#e8c9c9"][i]; ctx.beginPath(); ctx.arc(x + 60 + i * 18, y + 12, 5.5, 0, 7); ctx.fill(); }
      break;
    case "shelf":
      ctx.fillStyle = "rgba(0,0,0,0.13)"; rr(ctx, x + 2, y + 4, w, h, 4); ctx.fill();
      ctx.fillStyle = "#7a5a42"; rr(ctx, x, y, w, h, 4); ctx.fill();
      for (let i = 0; i < 7; i++) { ctx.fillStyle = ["#c25b5b", "#5b8dc2", "#68a868", "#d8a24a", "#8a6bb8", "#c2765b", "#5bb0a8"][i]; ctx.fillRect(x + 8 + (i * (w - 16)) / 7, y + 6, (w - 16) / 7 - 3, h - 12); }
      break;
    case "udesk":
      ctx.fillStyle = "rgba(0,0,0,0.14)"; rr(ctx, x + 3, y + 6, w, h, 11); ctx.fill();
      ctx.fillStyle = "#8d5f3e"; rr(ctx, x, y, w, h, 11); ctx.fill();
      ctx.fillStyle = "#a9754e"; rr(ctx, x + 4, y + 3, w - 8, h - 13, 8); ctx.fill();
      ctx.fillStyle = "#3d4451"; rr(ctx, x + w * 0.5 - 17, y + 8, 34, 21, 3); ctx.fill();
      ctx.fillStyle = "#8fc6e8"; rr(ctx, x + w * 0.5 - 14, y + 11, 28, 14, 2); ctx.fill();
      ctx.fillStyle = "#2f9e77"; ctx.font = "11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("AI", x + w * 0.5, y + 18);
      ctx.fillStyle = "#c98a5a"; ctx.beginPath(); ctx.arc(x + w - 22, y + 20, 6, 0, 7); ctx.fill();
      break;
    case "lamp": {
      const cx = x + w / 2, cy = y + h;
      ctx.strokeStyle = "#7a5236"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 34); ctx.stroke();
      ctx.fillStyle = "#f4e0b0"; ctx.beginPath(); ctx.moveTo(cx - 13, cy - 34); ctx.lineTo(cx + 13, cy - 34); ctx.lineTo(cx + 8, cy - 52); ctx.lineTo(cx - 8, cy - 52); ctx.closePath(); ctx.fill();
      const g = ctx.createRadialGradient(cx, cy - 36, 0, cx, cy - 36, 46);
      g.addColorStop(0, "rgba(255,224,150,0.45)"); g.addColorStop(1, "rgba(255,224,150,0)");
      ctx.fillStyle = g; ctx.fillRect(cx - 46, cy - 82, 92, 92);
      break;
    }
    case "nameplate": {
      const cx = x + w / 2, cy = y;
      ctx.strokeStyle = "#7a5236"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 7, cy + 8); ctx.lineTo(cx - 7, cy + 20); ctx.moveTo(cx + 7, cy + 8); ctx.lineTo(cx + 7, cy + 20); ctx.stroke();
      ctx.fillStyle = "#8d5f3e"; rr(ctx, cx - 35, cy - 15, 70, 22, 6); ctx.fill();
      ctx.fillStyle = "#f6ecdb"; rr(ctx, cx - 31, cy - 12, 62, 16, 4); ctx.fill();
      ctx.fillStyle = "#2f7d5c"; ctx.font = "700 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("AI内田さん", cx, cy - 3.5);
      break;
    }
    case "taskboard": {
      const bw = w, H2 = 64;
      ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.beginPath(); ctx.ellipse(x + w / 2, y + H2 + 10, w * 0.5, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "#7a5236"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x + 10, y + H2); ctx.lineTo(x + 2, y + H2 + 20); ctx.moveTo(x + bw - 10, y + H2); ctx.lineTo(x + bw + 2, y + H2 + 20); ctx.stroke();
      ctx.fillStyle = "#8a7263"; rr(ctx, x - 4, y - 4, bw + 8, H2 + 8, 6); ctx.fill();
      ctx.fillStyle = "#fdfbf5"; rr(ctx, x, y, bw, H2, 4); ctx.fill();
      ctx.fillStyle = "#2f9e77"; rr(ctx, x, y, bw, 15, 4); ctx.fill(); ctx.fillRect(x, y + 8, bw, 7);
      ctx.fillStyle = "#fff"; ctx.font = "700 9px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("📋 タスク", x + bw / 2, y + 7.5);
      const cols = ["#f2c14e", "#f0a5a5", "#a5d6a7"];
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 3; c2++) { ctx.fillStyle = cols[c2]; rr(ctx, x + 6 + (c2 * (bw - 12)) / 3, y + 20 + r2 * 14, (bw - 12) / 3 - 4, 10, 2); ctx.fill(); }
      break;
    }
    case "plant": {
      const cx = x + w / 2, cy = y + h / 2;
      ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.beginPath(); ctx.ellipse(cx + 1, cy + h * 0.45, w * 0.5, h * 0.2, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#b06a4c";
      ctx.beginPath(); ctx.moveTo(cx - 11, cy); ctx.lineTo(cx + 11, cy); ctx.lineTo(cx + 8, cy + 16); ctx.lineTo(cx - 8, cy + 16); ctx.closePath(); ctx.fill();
      for (const [ox2, oy2, r2] of [[-8, -12, 9], [8, -12, 9], [0, -20, 10], [0, -8, 9], [-4, -16, 8], [5, -17, 8]]) {
        ctx.fillStyle = ["#5d9e5d", "#6fae6f", "#4f8f4f"][Math.abs(ox2 + oy2) % 3];
        ctx.beginPath(); ctx.arc(cx + ox2, cy + oy2, r2, 0, 7); ctx.fill();
      }
      break;
    }
  }
}

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
  if (tr.kind === "rare") { ctx.fillStyle = `rgba(240,200,90,${0.12 * grow})`; ctx.beginPath(); ctx.arc(px, py - 40 * s, 34 * s, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgba(40,60,30,0.20)"; ctx.beginPath(); ctx.ellipse(px, py + 3, 24 * s, 8 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#7a5236"; rr(ctx, px - 5 * s, py - 34 * s, 10 * s, 36 * s, 4 * s); ctx.fill();
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

  if (a.ai) {
    const g = ctx.createRadialGradient(px, py - 16, 0, px, py - 16, 62);
    g.addColorStop(0, "rgba(255,226,150,0.34)");
    g.addColorStop(0.6, "rgba(120,200,150,0.14)");
    g.addColorStop(1, "rgba(255,226,150,0)");
    ctx.fillStyle = g; ctx.fillRect(px - 62, py - 78, 124, 124);
  }
  if (a.self) { ctx.strokeStyle = "rgba(47,158,119,0.65)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(px, py + 3, 17, 8, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = "rgba(60,30,10,0.25)"; ctx.beginPath(); ctx.ellipse(px, py + 3, 13, 5.5, 0, 0, 7); ctx.fill();

  ctx.fillStyle = a.ai ? "#5a6270" : "#4e5568";
  rr(ctx, px - 8, py - 12 + Math.max(0, step), 6.5, 12 - Math.max(0, step), 3); ctx.fill();
  rr(ctx, px + 1.5, py - 12 + Math.max(0, -step), 6.5, 12 - Math.max(0, -step), 3); ctx.fill();

  ctx.fillStyle = a.shirt; rr(ctx, px - 11, py - 30 + bob, 22, 21, 9); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)"; rr(ctx, px - 11, py - 30 + bob, 22, 8, 9); ctx.fill();
  if (a.ai) {
    ctx.fillStyle = "#2f9e77"; ctx.beginPath();
    ctx.moveTo(px - 2.5, py - 29 + bob); ctx.lineTo(px + 2.5, py - 29 + bob);
    ctx.lineTo(px + 1.5, py - 18 + bob); ctx.lineTo(px, py - 15 + bob); ctx.lineTo(px - 1.5, py - 18 + bob);
    ctx.closePath(); ctx.fill();
  }

  const hy = py - 38 + bob;
  ctx.fillStyle = SKIN; ctx.beginPath(); ctx.arc(px, hy, 12.5, 0, 7); ctx.fill();
  ctx.fillStyle = a.hair;
  if (a.face === "up") { ctx.beginPath(); ctx.arc(px, hy - 0.5, 12.5, 0, 7); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(px, hy - 1.5, 12.5, Math.PI, Math.PI * 2); ctx.fill(); rr(ctx, px - 12.5, hy - 3.5, 25, 5, 2); ctx.fill(); }
  if (a.face !== "up") {
    const off = a.face === "left" ? -4 : a.face === "right" ? 4 : 0;
    if (a.glasses) {
      ctx.strokeStyle = "#3a4048"; ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.arc(px - 4.5 + off, hy + 2.5, 4.4, 0, 7);
      ctx.moveTo(px + 8.9 + off, hy + 2.5); ctx.arc(px + 4.5 + off, hy + 2.5, 4.4, 0, 7);
      ctx.moveTo(px - 0.5 + off, hy + 2.5); ctx.lineTo(px + 0.5 + off, hy + 2.5); ctx.stroke();
    }
    ctx.fillStyle = "#3a2f28"; ctx.beginPath(); ctx.arc(px - 4.5 + off, hy + 2.5, 1.8, 0, 7); ctx.arc(px + 4.5 + off, hy + 2.5, 1.8, 0, 7); ctx.fill();
    ctx.fillStyle = "rgba(240,130,110,0.35)"; ctx.beginPath(); ctx.arc(px - 7.5 + off, hy + 6, 2.6, 0, 7); ctx.arc(px + 7.5 + off, hy + 6, 2.6, 0, 7); ctx.fill();
  }
  ctx.font = "600 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = a.ai ? "🤖 " + a.name : a.name;
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = a.ai ? "rgba(20,80,60,0.72)" : "rgba(50,30,15,0.55)";
  rr(ctx, px - tw / 2 - 6, py + 9, tw + 12, 16, 8); ctx.fill();
  ctx.fillStyle = a.self ? "#a8f0d8" : "#fdf6ea";
  ctx.fillText(label, px, py + 17.5);
}

function drawStation(ctx: CanvasRenderingContext2D, s: (typeof STATIONS)[number], near: boolean, t: number) {
  const px = s.x * T, py = s.z * T;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + s.ph);
  const rad = s.r * 0.72 * T;
  const rgb = s.color === "#2f9e77" ? "47,158,119" : "232,162,58";
  const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
  g.addColorStop(0, `rgba(${rgb},${0.06 + pulse * 0.12})`);
  g.addColorStop(0.65, `rgba(${rgb},${0.1 + pulse * 0.13})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, rad, rad * 0.5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},${0.35 + pulse * 0.35})`; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(px, py, rad * (0.62 + pulse * 0.12), rad * 0.5 * (0.62 + pulse * 0.12), 0, 0, 7); ctx.stroke();
}
function drawStationBadge(ctx: CanvasRenderingContext2D, s: (typeof STATIONS)[number], near: boolean, t: number) {
  const px = s.x * T;
  const py = s.z * T - s.r * 0.62 * T - 24 + Math.sin(t * 2.4 + s.ph) * 3;
  ctx.save(); ctx.translate(px, py); ctx.scale(near ? 1.1 : 1, near ? 1.1 : 1);
  ctx.font = "700 11px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const label = near ? "✨ " + s.badge : s.badge;
  const tw = ctx.measureText(label).width, bw = tw + 20, bh = 21;
  ctx.shadowColor = "rgba(40,20,0,0.28)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = near ? s.color : "#fffdf8"; rr(ctx, -bw / 2, -bh / 2, bw, bh, 11); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath(); ctx.moveTo(-5, bh / 2 - 1); ctx.lineTo(5, bh / 2 - 1); ctx.lineTo(0, bh / 2 + 6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = near ? "rgba(255,255,255,0.5)" : s.color; ctx.lineWidth = 1.5; rr(ctx, -bw / 2, -bh / 2, bw, bh, 11); ctx.stroke();
  ctx.fillStyle = near ? "#fff" : s.color; ctx.fillText(label, 0, 0.5);
  ctx.restore();
}

function drawWeatherLight(ctx: CanvasRenderingContext2D, weather: Weather) {
  if (weather === "clear") {
    const g = ctx.createLinearGradient(0, 0, MAPW, MAPH);
    g.addColorStop(0, "rgba(255,238,180,0.16)"); g.addColorStop(1, "rgba(255,236,180,0.04)");
    ctx.fillStyle = g;
  } else {
    const veil = weather === "rain" ? 0.26 : weather === "snow" ? 0.14 : 0.16;
    ctx.fillStyle = `rgba(120,128,140,${veil})`;
  }
  ctx.fillRect(0, 0, MAPW, MAPH);
}

// The view out of a window: sky tinted by the real weather + time of day, with
// the sun/moon tracking the clock, weather particles, and a distant forest that
// grows with progress.
function drawWindowSky(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, hh: number, weather: Weather, hour: number, dispP: number) {
  ctx.save();
  rr(ctx, x, y, w, hh, 4); ctx.clip();
  const night = hour < 5 ? 1 : hour < 7 ? (7 - hour) / 2 : hour > 20 ? 1 : hour > 18 ? (hour - 18) / 2 : 0;
  const day: Record<Weather, [number[], number[]]> = {
    clear: [[120, 200, 235], [192, 226, 236]],
    clouds: [[150, 165, 180], [198, 208, 214]],
    rain: [[92, 102, 116], [132, 142, 152]],
    snow: [[198, 208, 218], [226, 232, 238]],
  };
  const [top, bot] = day[weather];
  const nt = [22, 28, 52], nb = [40, 50, 74];
  const mix = (a: number[], b: number[], f: number) =>
    `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
  const g = ctx.createLinearGradient(0, y, 0, y + hh);
  g.addColorStop(0, mix(top, nt, night)); g.addColorStop(1, mix(bot, nb, night));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, hh);
  // Sun (day) / moon (night) tracking the hour left→right.
  const f = Math.max(0, Math.min(1, (hour - 6) / 12));
  const cx = x + f * w, cy = y + hh * 0.28 + (1 - Math.sin(f * Math.PI)) * hh * 0.44;
  if (weather !== "rain") {
    ctx.fillStyle = night > 0.5 ? "rgba(240,240,220,0.95)" : "rgba(255,226,120,0.98)";
    ctx.beginPath(); ctx.arc(cx, cy, night > 0.5 ? 5.5 : 7, 0, 7); ctx.fill();
  }
  if (dispP > 0.3) {
    ctx.fillStyle = `rgba(70,140,80,${Math.min(0.9, dispP)})`;
    ctx.beginPath();
    ctx.arc(x + w * 0.2, y + hh * 0.9, 12 * dispP + 4, 0, 7);
    ctx.arc(x + w * 0.5, y + hh * 0.96, 15 * dispP + 4, 0, 7);
    ctx.arc(x + w * 0.8, y + hh * 0.9, 11 * dispP + 4, 0, 7);
    ctx.fill();
  }
  if (weather === "clouds" || weather === "rain") {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    for (let i = 0; i < 3; i++) { const ccx = x + w * (0.22 + i * 0.3); ctx.beginPath(); ctx.arc(ccx, y + hh * 0.32, 8, 0, 7); ctx.arc(ccx + 9, y + hh * 0.34, 6, 0, 7); ctx.fill(); }
  }
  if (weather === "rain") {
    ctx.strokeStyle = "rgba(210,225,255,0.55)"; ctx.lineWidth = 1;
    for (let i = 0; i < 14; i++) { const rx = x + ((i * 37) % w), ry = y + ((i * 23) % hh); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 8); ctx.stroke(); }
  }
  if (weather === "snow") {
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(x + ((i * 41) % w), y + ((i * 29) % hh), 1.7, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}

export function drawWorld(ctx: CanvasRenderingContext2D, W: number, H: number, state: WorldState, t: number) {
  const player = state.actors.find((a) => a.self) ?? state.actors[0];
  const dispP = state.dispP;
  ctx.fillStyle = "#241d28"; ctx.fillRect(0, 0, W, H);
  const { scale, ox, oy } = viewTransform(player, W, H);
  ctx.save(); ctx.scale(scale, scale); ctx.translate(-ox, -oy);

  // Floor with subtle plank lines
  ctx.fillStyle = "#e3b884"; ctx.fillRect(0, 0, MAPW, MAPH);
  ctx.strokeStyle = "rgba(140,90,45,0.18)"; ctx.lineWidth = 1;
  for (let r = 0; r < ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * T); ctx.lineTo(MAPW, r * T); ctx.stroke();
    for (let c = (r % 2) * 1.5; c < COLS; c += 3) { ctx.beginPath(); ctx.moveTo(c * T, r * T); ctx.lineTo(c * T, (r + 1) * T); ctx.stroke(); }
    if (r % 2 === 0) { ctx.fillStyle = "rgba(255,235,200,0.10)"; ctx.fillRect(0, r * T, MAPW, T); ctx.fillStyle = "#e3b884"; }
  }
  // Greenery patches
  if (dispP > 0.02) for (let i = 0; i < 6; i++) {
    const gx = (2 + srand(i * 3 + 1) * 20) * T, gy = (3 + srand(i * 3 + 2) * 11) * T, rad = (2.2 + srand(i * 3) * 2.5) * T;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rad);
    g.addColorStop(0, `rgba(110,170,90,${dispP * 0.3})`); g.addColorStop(1, "rgba(110,170,90,0)");
    ctx.fillStyle = g; ctx.fillRect(gx - rad, gy - rad, rad * 2, rad * 2);
  }
  // Rugs
  for (const g of RUGS) {
    ctx.fillStyle = g.c; rr(ctx, g.x * T, g.y * T, g.w * T, g.h * T, 18); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.42)"; ctx.lineWidth = 2; rr(ctx, g.x * T + 7, g.y * T + 7, g.w * T - 14, g.h * T - 14, 13); ctx.stroke();
  }
  // Grass tufts + flowers
  const tufts = Math.floor(dispP * 46); ctx.lineWidth = 1.6;
  for (let i = 0; i < tufts; i++) {
    const gx = (1.7 + srand(i + 10) * 20.6) * T, gy = (2.3 + srand(i + 60) * 12.2) * T;
    ctx.strokeStyle = `rgba(70,140,60,${0.4 + srand(i) * 0.3})`;
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 7); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy - 9); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 7); ctx.stroke();
  }
  const flowers = Math.max(0, Math.floor((dispP - 0.4) * 30));
  for (let i = 0; i < flowers; i++) {
    const fx = (1.8 + srand(i + 200) * 20.4) * T, fy = (2.4 + srand(i + 300) * 12) * T, fc = ["#e88fb0", "#f0d060", "#9fb8e8", "#f0a060"][i % 4];
    for (let p = 0; p < 5; p++) { const ang = (p * Math.PI * 2) / 5 + srand(i) * 2; ctx.fillStyle = fc; ctx.beginPath(); ctx.arc(fx + Math.cos(ang) * 3.2, fy + Math.sin(ang) * 3.2, 2.4, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#fff3c0"; ctx.beginPath(); ctx.arc(fx, fy, 2, 0, 7); ctx.fill();
  }
  // Station floor glow
  for (const s of STATIONS) drawStation(ctx, s, Math.hypot(player.x - s.x, player.z - s.z) < s.r, t);
  // Zone labels
  ctx.font = "700 13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const z of ZONES) { ctx.fillStyle = "rgba(90,55,25,0.40)"; ctx.fillText(z.t, z.x * T, z.y * T); }
  // Walls + moss
  ctx.fillStyle = "#5f4c3f";
  ctx.fillRect(0, 0, MAPW, T * 1.4); ctx.fillRect(0, MAPH - T, MAPW, T); ctx.fillRect(0, 0, T, MAPH); ctx.fillRect(MAPW - T, 0, T, MAPH);
  ctx.fillStyle = "#7b6353"; ctx.fillRect(T * 0.15, T * 0.12, MAPW - T * 0.3, T * 1.1);
  const moss = Math.max(0, dispP - 0.3) * 0.45;
  if (moss > 0.01) { ctx.fillStyle = `rgba(70,130,60,${moss})`; ctx.fillRect(0, 0, MAPW, T * 1.4); ctx.fillRect(0, MAPH - T, MAPW, T); ctx.fillRect(0, 0, T, MAPH); ctx.fillRect(MAPW - T, 0, T, MAPH); }
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(0, T * 1.4 - 4, MAPW, 4);
  // Vines from 50%
  const vine = Math.max(0, (dispP - 0.5) * 2);
  if (vine > 0.01) for (let i = 0; i < 9; i++) {
    const vx = (2 + i * 2.4 + srand(i + 40) * 0.8) * T, len = (3 + srand(i + 44) * 5) * vine;
    ctx.fillStyle = `rgba(80,145,70,${0.5 + srand(i) * 0.3})`;
    for (let j = 0; j < len; j++) { ctx.beginPath(); ctx.arc(vx + Math.sin(j * 1.3 + i) * 4, T * 1.35 + j * 9, 4.5 - j * 0.25, 0, 7); ctx.fill(); }
  }
  // Windows — the real outside view (weather + sun), so you can check it from
  // inside. A few along the top wall so one is usually in view.
  for (const wx of [6.0, 12.6, 15.6]) {
    const x = wx * T, y = T * 0.28, w = 2.2 * T, hh = T * 0.78;
    ctx.fillStyle = "#4a3a2f"; rr(ctx, x - 4, y - 4, w + 8, hh + 8, 6); ctx.fill();
    drawWindowSky(ctx, x, y, w, hh, state.weather, state.hour, dispP);
    ctx.strokeStyle = "#4a3a2f"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + hh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + hh / 2); ctx.lineTo(x + w, y + hh / 2); ctx.stroke();
  }
  // Whiteboard
  { const x = 3 * T, y = T * 0.25, w = 3.4 * T, hh = T * 0.85;
    ctx.fillStyle = "#8a7263"; rr(ctx, x - 5, y - 5, w + 10, hh + 10, 6); ctx.fill();
    ctx.fillStyle = "#fdfbf5"; rr(ctx, x, y, w, hh, 4); ctx.fill();
    ctx.font = "700 13px sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = "#c0392b"; ctx.fillText("研修キックオフ🔥", x + 10, y + 8);
    ctx.strokeStyle = "#3a6ea5"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 10, y + 30); ctx.lineTo(x + w * 0.55, y + 30); ctx.moveTo(x + 10, y + 38); ctx.lineTo(x + w * 0.42, y + 38); ctx.stroke();
  }
  // Depth-sorted furniture + trees + characters
  const items = [
    ...FURN.map((f) => ({ key: f.zk != null ? f.y * T + f.zk : (f.y + f.h) * T, draw: () => drawFurn(ctx, f) })),
    ...OFFICE_TREES.map((tr) => ({ key: tr.y * T + 4, draw: () => drawTree(ctx, tr, t, dispP) })),
    ...state.actors.map((a) => ({ key: a.z * T + 6, draw: () => drawChar(ctx, a, t) })),
  ].sort((a, b) => a.key - b.key);
  for (const it of items) it.draw();
  // Station badges above
  for (const s of STATIONS) drawStationBadge(ctx, s, Math.hypot(player.x - s.x, player.z - s.z) < s.r, t);
  // Butterflies from 25%
  const nBf = Math.floor(dispP * 4 + 0.001);
  for (let i = 0; i < nBf; i++) {
    const [hx, hz] = BFLY_HOMES[i % BFLY_HOMES.length];
    const bx = (hx + Math.sin(t * 0.5 + i * 2.1) * 3.2) * T, by = (hz + Math.sin(t * 0.8 + i * 1.3) * 2.2) * T - 40 + Math.sin(t * 3 + i) * 8;
    const flap = Math.abs(Math.sin(t * 14 + i)), bc = ["#f0c454", "#e88fb0", "#9fb8e8", "#f0f0f0"][i % 4];
    ctx.fillStyle = bc; ctx.beginPath();
    ctx.ellipse(bx - 4 * flap - 1, by, 5 * flap + 1.5, 4, -0.4, 0, 7); ctx.ellipse(bx + 4 * flap + 1, by, 5 * flap + 1.5, 4, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#4a3b2f"; rr(ctx, bx - 1, by - 4, 2, 8, 1); ctx.fill();
  }
  // Light rays (木漏れ日)
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    const bx = (3 + i * 5.5) * T + Math.sin(t * 0.2 + i) * 10, al = 0.05 + 0.02 * Math.sin(t * 0.5 + i * 1.3);
    const grd = ctx.createLinearGradient(bx, T * 1.4, bx + 150, MAPH);
    grd.addColorStop(0, `rgba(255,244,200,${al})`); grd.addColorStop(1, "rgba(255,244,200,0)");
    ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(bx, T * 1.4); ctx.lineTo(bx + 70, T * 1.4); ctx.lineTo(bx + 260, MAPH); ctx.lineTo(bx + 150, MAPH); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (dispP > 0.02) { ctx.fillStyle = `rgba(90,160,90,${dispP * 0.07})`; ctx.fillRect(0, 0, MAPW, MAPH); }
  drawWeatherLight(ctx, state.weather);
  ctx.restore();
  // Vignette (screen space)
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(40,20,5,0.32)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
