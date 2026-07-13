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
  form?: "tree" | "flower"; // rough shape for seasonal rendering (default: tree)
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

// Flowering / seasonal species not already covered by COMMON_SPECIES. These
// broaden the seasonal album beyond trees (see SEASON_SPECIES below).
export const SEASONAL_EXTRA_SPECIES: Species[] = [
  // spring
  { key: "tulip", ja: "チューリップ", wiki: "チューリップ", color: "#e8607a", form: "flower" },
  { key: "nanohana", ja: "ナノハナ", wiki: "アブラナ", color: "#f2d024", form: "flower" },
  { key: "shibazakura", ja: "シバザクラ", wiki: "シバザクラ", color: "#e58fb0", form: "flower" },
  { key: "mokuren", ja: "モクレン", wiki: "モクレン", color: "#e6dcef", form: "flower" },
  // summer
  { key: "himawari", ja: "ヒマワリ", wiki: "ヒマワリ", color: "#f4b21a", form: "flower" },
  { key: "asagao", ja: "アサガオ", wiki: "アサガオ", color: "#6f7fd6", form: "flower" },
  { key: "ajisai", ja: "アジサイ", wiki: "アジサイ", color: "#7f9bd8", form: "flower" },
  { key: "hasu", ja: "ハス", wiki: "ハス", color: "#f0a6c0", form: "flower" },
  // autumn
  { key: "cosmos", ja: "コスモス", wiki: "コスモス", color: "#e987b0", form: "flower" },
  { key: "higanbana", ja: "ヒガンバナ", wiki: "ヒガンバナ", color: "#d33b2f", form: "flower" },
  // winter
  { key: "suisen", ja: "スイセン", wiki: "スイセン", color: "#f3e79a", form: "flower" },
  { key: "sazanka", ja: "サザンカ", wiki: "サザンカ", color: "#e2637f", form: "flower" },
  { key: "fukujuso", ja: "フクジュソウ", wiki: "フクジュソウ", color: "#f2c21a", form: "flower" },
  { key: "nanten", ja: "ナンテン", wiki: "ナンテン", color: "#cc3b34", form: "flower" },
];

const BY_KEY = new Map(
  [...COMMON_SPECIES, ...RARE_SPECIES_LIST, ...SEASONAL_EXTRA_SPECIES].map(
    (s) => [s.key, s],
  ),
);

export function getSpecies(key: string): Species {
  return BY_KEY.get(key) ?? COMMON_SPECIES[0];
}

// ---------------------------------------------------------------------------
// Seasonal album mapping (issue #23). Everything below is deterministic: the
// same completion date + task id always yields the same season and species, so
// the album is reproducible and never depends on a random number generator.
// ---------------------------------------------------------------------------

export type Season = "spring" | "summer" | "autumn" | "winter";

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export const SEASON_JA: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};

// Month (1..12) → season, kept as an explicit table so the boundaries live in
// one place and can be adjusted without touching seasonOf's logic.
const SEASON_BY_MONTH: Record<number, Season> = {
  3: "spring", 4: "spring", 5: "spring",
  6: "summer", 7: "summer", 8: "summer",
  9: "autumn", 10: "autumn", 11: "autumn",
  12: "winter", 1: "winter", 2: "winter",
};

// Season a task's completion falls in. Uses the local month of completed_at.
export function seasonOf(completedAt: string | Date): Season {
  const d = completedAt instanceof Date ? completedAt : new Date(completedAt);
  return SEASON_BY_MONTH[d.getMonth() + 1] ?? "winter";
}

// Species catalog per season (initial set: 5 per season, 20 total). Reuses
// existing tree species where they fit and adds seasonal flowers for variety.
export const SEASON_SPECIES: Record<Season, Species[]> = {
  spring: ["someiyoshino", "tulip", "nanohana", "shibazakura", "mokuren"].map(getSpecies),
  summer: ["himawari", "asagao", "ajisai", "hasu", "kusunoki"].map(getSpecies),
  autumn: ["irohamomiji", "ginkgo", "cosmos", "kinmokusei", "higanbana"].map(getSpecies),
  winter: ["tsubaki", "suisen", "sazanka", "fukujuso", "nanten"].map(getSpecies),
};

// String → stable [0,1) seed via FNV-1a. A task id is a uuid string, so we hash
// it deterministically instead of using srand's numeric index. No randomness.
export function hashId(s: string): number {
  let h = 2166136261; // FNV offset basis (32-bit)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619); // FNV prime
  }
  return (h >>> 0) / 4294967296; // normalize to 0..1
}

// The species key a completed task grows into: determined by its season and id.
// Same (season, taskId) always maps to the same species (mirrors srand's idea:
// seed → [0,1) → array index), with the seed source swapped to the task id.
export function speciesFor(season: Season, taskId: string): string {
  const list = SEASON_SPECIES[season];
  const idx = Math.floor(hashId(taskId) * list.length) % list.length;
  return list[idx].key;
}

// How long a completed plant stays in the office garden before it moves to the
// forest album. Default 4 months (SE projects average ~3-6 months); adjustable.
export const RETENTION_MONTHS = 4;

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

// Memoized on (plants, w, h): the render loop and hover hit-testing both call
// this every frame / pointer move with the same inputs, so returning the cached
// layout avoids re-mapping and re-sorting the plant list ~60x/second. Results
// are sorted back-to-front (by py) so the renderer can draw them directly.
let layoutCache: {
  plants: Plant[];
  w: number;
  h: number;
  out: PlantLayout[];
} | null = null;

export function layoutPlants(
  plants: Plant[],
  w: number,
  h: number,
): PlantLayout[] {
  if (
    layoutCache &&
    layoutCache.plants === plants &&
    layoutCache.w === w &&
    layoutCache.h === h
  ) {
    return layoutCache.out;
  }
  const groundY = h * 0.5;
  const bandH = h - groundY;
  const scaleBase = Math.min(1.4, Math.max(0.8, h / 320));
  const out = plants
    .map((p) => {
      // depth: 0 = far (small, near the horizon) .. 1 = near (large, at the front)
      const depth = (p.y - 0.5) / 0.42;
      return {
        plant: p,
        px: p.x * w,
        py: groundY + (0.06 + depth * 0.9) * bandH,
        s: scaleBase * (0.5 + depth * 0.7) * (0.9 + srand(p.id * 1.9) * 0.2),
      };
    })
    .sort((a, b) => a.py - b.py);
  layoutCache = { plants, w, h, out };
  return out;
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
