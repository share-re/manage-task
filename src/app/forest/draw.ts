import type { Plant } from "./plants";
import { srand } from "./plants";

// A normal tree, drawn procedurally. t is elapsed seconds (for the sway).
function drawTree(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  scale: number,
  t: number,
  seed: number,
) {
  const sway = Math.sin(t * 1.2 + seed * 3) * 2 * scale;
  ctx.fillStyle = "rgba(40,60,30,0.18)";
  ctx.beginPath();
  ctx.ellipse(px, py + 3, 22 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a5236";
  ctx.fillRect(px - 4 * scale, py - 30 * scale, 8 * scale, 32 * scale);
  const greens = ["#3e7d46", "#4f9455", "#67ab68"];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = greens[i];
    ctx.beginPath();
    ctx.arc(px + sway * (i + 1) * 0.3, py - (34 + i * 14) * scale, (24 - i * 5) * scale, 0, Math.PI * 2);
    ctx.arc(px - 13 * scale + sway * 0.2, py - (30 + i * 11) * scale, (16 - i * 4) * scale, 0, Math.PI * 2);
    ctx.arc(px + 13 * scale + sway * 0.4, py - (30 + i * 11) * scale, (16 - i * 4) * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A rare plant. Swap the canopy fill to a sprite (drawImage) later if desired.
function drawRare(
  ctx: CanvasRenderingContext2D,
  p: Plant,
  px: number,
  py: number,
  scale: number,
  t: number,
) {
  const sway = Math.sin(t * 1.4 + px) * 2 * scale;
  ctx.fillStyle = "rgba(40,60,30,0.20)";
  ctx.beginPath();
  ctx.ellipse(px, py + 3, 24 * scale, 8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a5b3a";
  ctx.fillRect(px - 4.5 * scale, py - 32 * scale, 9 * scale, 34 * scale);

  const canopy = (color: string) => {
    ctx.fillStyle = color;
    for (const [ox, oy, r] of [
      [0, -40, 20],
      [-16, -32, 15],
      [16, -32, 15],
      [0, -26, 15],
    ] as const) {
      ctx.beginPath();
      ctx.arc(px + ox * scale + sway, py + oy * scale, r * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  switch (p.species) {
    case "sakura":
      canopy("#f4b8d0");
      break;
    case "golden":
      canopy("#e8c24a");
      break;
    case "blue_rose":
      canopy("#7fa8e8");
      break;
    default:
      canopy("#c48fd8");
  }

  // Sparkle marks the rare plant.
  const tw = 0.5 + 0.5 * Math.sin(t * 4 + px);
  ctx.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`;
  for (const [ox, oy] of [
    [-14, -46],
    [16, -38],
    [4, -54],
  ] as const) {
    const sx = px + ox * scale;
    const sy = py + oy * scale;
    const r = (2 + tw * 1.5) * scale;
    ctx.beginPath();
    ctx.moveTo(sx, sy - r);
    ctx.lineTo(sx + r * 0.35, sy - r * 0.35);
    ctx.lineTo(sx + r, sy);
    ctx.lineTo(sx + r * 0.35, sy + r * 0.35);
    ctx.lineTo(sx, sy + r);
    ctx.lineTo(sx - r * 0.35, sy + r * 0.35);
    ctx.lineTo(sx - r, sy);
    ctx.lineTo(sx - r * 0.35, sy - r * 0.35);
    ctx.closePath();
    ctx.fill();
  }
}

// Draw one frame of the whole forest view.
export function drawGarden(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  plants: Plant[],
  progress: number,
  t: number,
) {
  // Sky-to-ground gradient. It gets greener as progress rises.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#d6ecf7");
  sky.addColorStop(0.55, "#e6f3e2");
  sky.addColorStop(1, "#cfe9c4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const groundY = h * 0.5;
  ctx.fillStyle = "#bfe0a8";
  ctx.fillRect(0, groundY, w, h - groundY);

  // Grass tufts (more as progress rises).
  const tufts = Math.floor(progress * 80);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < tufts; i++) {
    const gx = (0.04 + srand(i + 10) * 0.92) * w;
    const gy = groundY + srand(i + 60) * (h - groundY) * 0.9 + 6;
    ctx.strokeStyle = `rgba(70,140,60,${0.4 + srand(i) * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx - 3, gy - 7);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy - 9);
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + 3, gy - 7);
    ctx.stroke();
  }

  // Flowers (from 40% progress).
  const flowers = Math.max(0, Math.floor((progress - 0.4) * 50));
  for (let i = 0; i < flowers; i++) {
    const fx = (0.05 + srand(i + 200) * 0.9) * w;
    const fy = groundY + srand(i + 300) * (h - groundY) * 0.85 + 8;
    const fc = ["#e88fb0", "#f0d060", "#9fb8e8", "#f0a060"][i % 4];
    for (let pIdx = 0; pIdx < 5; pIdx++) {
      const ang = (pIdx * Math.PI * 2) / 5 + srand(i) * 2;
      ctx.fillStyle = fc;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(ang) * 3.2, fy + Math.sin(ang) * 3.2, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#fff3c0";
    ctx.beginPath();
    ctx.arc(fx, fy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Plants, back-to-front by y.
  const scaleBase = Math.min(1.4, Math.max(0.8, h / 320));
  const sorted = [...plants].sort((a, b) => a.y - b.y);
  for (const p of sorted) {
    const px = p.x * w;
    const py = groundY + p.y * (h - groundY) * 0.9;
    const s = scaleBase * (0.85 + srand(p.id) * 0.3);
    if (p.kind === "rare") drawRare(ctx, p, px, py, s, t);
    else drawTree(ctx, px, py, s, t, p.id);
  }

  // Butterflies (one per 25% progress).
  const nBf = Math.floor(progress * 4 + 0.001);
  const homes = [
    [0.25, 0.35],
    [0.7, 0.5],
    [0.5, 0.25],
    [0.85, 0.4],
  ] as const;
  for (let i = 0; i < nBf; i++) {
    const [hx, hz] = homes[i % homes.length];
    const bx = (hx + Math.sin(t * 0.5 + i * 2.1) * 0.06) * w;
    const by = (hz + Math.sin(t * 0.8 + i * 1.3) * 0.05) * h + Math.sin(t * 3 + i) * 6;
    const flap = Math.abs(Math.sin(t * 14 + i));
    const bc = ["#f0c454", "#e88fb0", "#9fb8e8", "#f0f0f0"][i % 4];
    ctx.fillStyle = bc;
    ctx.beginPath();
    ctx.ellipse(bx - 4 * flap - 1, by, 5 * flap + 1.5, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(bx + 4 * flap + 1, by, 5 * flap + 1.5, 4, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4a3b2f";
    ctx.fillRect(bx - 1, by - 4, 2, 8);
  }
}
