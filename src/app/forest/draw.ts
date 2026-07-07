import type { Plant } from "./plants";
import { srand } from "./plants";

// Linearly blend two RGB colors (f: 0 = a, 1 = b) into a css color string.
function mix(a: number[], b: number[], f: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);
  return `rgb(${r},${g},${bl})`;
}

// 0 = full day, 1 = full night, with smooth dawn (5-7h) and dusk (17-19h).
function nightFactor(hour: number): number {
  if (hour >= 7 && hour < 17) return 0;
  if (hour >= 17 && hour < 19) return (hour - 17) / 2;
  if (hour >= 5 && hour < 7) return 1 - (hour - 5) / 2;
  return 1;
}

// Sky, celestial body (sun/moon), and stars for the given hour.
function drawSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  hour: number,
  night: number,
  t: number,
) {
  const dayTop = [214, 236, 247],
    dayMid = [230, 243, 226],
    dayBot = [207, 233, 196];
  const nightTop = [18, 24, 50],
    nightMid = [28, 36, 66],
    nightBot = [36, 48, 72];
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, mix(dayTop, nightTop, night));
  sky.addColorStop(0.6, mix(dayMid, nightMid, night));
  sky.addColorStop(1, mix(dayBot, nightBot, night));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, groundY);

  // Warm glow at dawn/dusk (peaks mid-transition).
  const dusk = 1 - Math.abs(night - 0.5) * 2;
  if (dusk > 0.05) {
    ctx.fillStyle = `rgba(240,150,90,${dusk * 0.22})`;
    ctx.fillRect(0, 0, w, groundY);
  }

  // Stars fade in at night.
  if (night > 0.25) {
    const n = Math.floor(night * 90);
    for (let i = 0; i < n; i++) {
      const sx = srand(i * 2.1) * w;
      const sy = srand(i * 3.7) * groundY * 0.9;
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
      ctx.fillStyle = `rgba(255,255,255,${night * (0.3 + tw * 0.5)})`;
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
  }

  // Sun during the day, moon at night, tracking the hour across the sky.
  if (night < 0.5) {
    const fx = Math.max(0, Math.min(1, (hour - 6) / 12));
    const cx = fx * w;
    const cy = groundY * 0.15 + (1 - Math.sin(fx * Math.PI)) * groundY * 0.25;
    ctx.fillStyle = "rgba(255,235,150,0.25)";
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,225,120,0.95)";
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const nf = hour >= 18 ? (hour - 18) / 12 : (hour + 6) / 12;
    const cx = nf * w;
    const cy = groundY * 0.18 + (1 - Math.sin(nf * Math.PI)) * groundY * 0.22;
    ctx.fillStyle = "rgba(240,240,220,0.95)";
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    // Carve a crescent using the sky color behind it.
    ctx.fillStyle = mix(nightTop, nightMid, 0.5);
    ctx.beginPath();
    ctx.arc(cx + 7, cy - 3, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

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

// Draw one frame of the whole forest view. hour is the local time of day
// (0-24, fractional) driving the day/night sky.
export function drawGarden(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  plants: Plant[],
  growth: number,
  hour: number,
  t: number,
) {
  const groundY = h * 0.5;
  const night = nightFactor(hour);

  // Sky, sun/moon and stars for the current time of day.
  drawSky(ctx, w, groundY, hour, night, t);

  // Ground blends slightly darker at night.
  ctx.fillStyle = mix([191, 224, 168], [58, 84, 72], night);
  ctx.fillRect(0, groundY, w, h - groundY);

  // Grass tufts (more as growth rises).
  const tufts = Math.floor(growth * 80);
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

  // Flowers (from 40% growth).
  const flowers = Math.max(0, Math.floor((growth - 0.4) * 50));
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

  // Butterflies: one per 5 completed tasks (count-based), capped at 4.
  // They rest at night, so none are drawn once it is dark.
  const nBf = night > 0.5 ? 0 : Math.min(4, Math.floor(plants.length / 5));
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
