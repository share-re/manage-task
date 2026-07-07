// Plant data for the forest view. Each plant is a real species so its details
// can be looked up (see wiki.ts). Kept framework-agnostic.

export type PlantKind = "normal" | "rare";

export type Plant = {
  id: number;
  kind: PlantKind;
  species: string; // Species.key
  x: number; // relative position 0..1
  y: number; // relative position 0..1
};

export type Species = {
  key: string;
  ja: string; // display name
  wiki: string; // Japanese Wikipedia article title
  color: string; // canopy base color
};

// Seeded pseudo-random: same input always yields the same value, so plant
// positions and species stay stable as the garden grows.
export function srand(i: number): number {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// Common trees, assigned to normal plants.
export const COMMON_SPECIES: Species[] = [
  { key: "someiyoshino", ja: "ソメイヨシノ", wiki: "ソメイヨシノ", color: "#f4b8d0" },
  { key: "keyaki", ja: "ケヤキ", wiki: "ケヤキ", color: "#5fa25a" },
  { key: "ginkgo", ja: "イチョウ", wiki: "イチョウ", color: "#e6c34a" },
  { key: "kusunoki", ja: "クスノキ", wiki: "クスノキ", color: "#4f9455" },
  { key: "irohamomiji", ja: "イロハモミジ", wiki: "イロハモミジ", color: "#d8663f" },
  { key: "konara", ja: "コナラ", wiki: "コナラ", color: "#6fa24a" },
  { key: "shirakaba", ja: "シラカンバ", wiki: "シラカンバ", color: "#7cb87c" },
  { key: "kinmokusei", ja: "キンモクセイ", wiki: "キンモクセイ", color: "#e8a23a" },
  { key: "sugi", ja: "スギ", wiki: "スギ", color: "#3e7d46" },
  { key: "hinoki", ja: "ヒノキ", wiki: "ヒノキ", color: "#4a8a5a" },
  { key: "tsubaki", ja: "ツバキ", wiki: "ツバキ", color: "#c0433f" },
  { key: "akamatsu", ja: "アカマツ", wiki: "アカマツ", color: "#5a8f52" },
];

// Rare / notable species, assigned to every RARE_EVERY-th plant.
export const RARE_SPECIES_LIST: Species[] = [
  { key: "baobab", ja: "バオバブ", wiki: "バオバブ", color: "#c9a86a" },
  { key: "jacaranda", ja: "ジャカランダ", wiki: "ジャカランダ", color: "#8f7fd8" },
  { key: "sequoia", ja: "セコイア", wiki: "セコイア", color: "#6a7f4a" },
  { key: "yakusugi", ja: "屋久杉", wiki: "屋久杉", color: "#3a6d46" },
];

const BY_KEY = new Map(
  [...COMMON_SPECIES, ...RARE_SPECIES_LIST].map((s) => [s.key, s]),
);

export function getSpecies(key: string): Species {
  return BY_KEY.get(key) ?? COMMON_SPECIES[0];
}

// A rare plant appears every this many completed tasks.
export const RARE_EVERY = 10;

// Cap on how many plants are actually drawn, to keep the frame cheap no matter
// how large the completed count grows. The forest looks full well before this.
export const MAX_PLANTS = 160;

// Build the plant list from the number of completed tasks.
// - normal: one common tree per completed task
// - rare: every RARE_EVERY-th plant is a notable species
// Positions/species come from a seeded RNG, so existing plants never change.
// Drawing is capped at MAX_PLANTS; the count/stage still track the real total.
export function buildGarden(doneCount: number): Plant[] {
  const plants: Plant[] = [];
  const n = Math.min(doneCount, MAX_PLANTS);
  for (let i = 1; i <= n; i++) {
    const isRare = i % RARE_EVERY === 0;
    const list = isRare ? RARE_SPECIES_LIST : COMMON_SPECIES;
    const sp = list[Math.floor(srand(i * 7.3) * list.length)];
    plants.push({
      id: i,
      kind: isRare ? "rare" : "normal",
      species: sp.key,
      x: 0.06 + srand(i * 3.13) * 0.88,
      y: 0.5 + srand(i * 1.77) * 0.42,
    });
  }
  return plants;
}

// Screen placement of a plant, shared by the renderer and hover hit-testing.
export type PlantLayout = { plant: Plant; px: number; py: number; s: number };

export function layoutPlants(
  plants: Plant[],
  w: number,
  h: number,
): PlantLayout[] {
  const groundY = h * 0.5;
  const bandH = h - groundY;
  const scaleBase = Math.min(1.4, Math.max(0.8, h / 320));
  return plants.map((p) => {
    // depth: 0 = far (small, near the horizon) .. 1 = near (large, at the front)
    const depth = (p.y - 0.5) / 0.42;
    return {
      plant: p,
      px: p.x * w,
      py: groundY + (0.06 + depth * 0.9) * bandH,
      s: scaleBase * (0.5 + depth * 0.7) * (0.9 + srand(p.id * 1.9) * 0.2),
    };
  });
}

// The plant whose canopy/trunk is under (cx, cy), preferring the frontmost
// (largest py). Returns null when nothing is hit.
export function plantAt(
  layouts: PlantLayout[],
  cx: number,
  cy: number,
): PlantLayout | null {
  let hit: PlantLayout | null = null;
  for (const l of layouts) {
    const withinX = Math.abs(cx - l.px) < 26 * l.s;
    const withinY = cy > l.py - 58 * l.s && cy < l.py + 6 * l.s;
    if (withinX && withinY && (!hit || l.py > hit.py)) hit = l;
  }
  return hit;
}
