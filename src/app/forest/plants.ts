// Plant data for the forest view. Kept framework-agnostic so the canvas
// drawing code can stay pure.

export type PlantKind = "normal" | "rare";

export type Plant = {
  id: number;
  kind: PlantKind;
  species?: string; // rare species id, e.g. "sakura"
  x: number; // relative position 0..1
  y: number; // relative position 0..1
};

// Seeded pseudo-random: same input always yields the same value, so plant
// positions stay stable as the garden grows.
export function srand(i: number): number {
  const s = Math.sin(i * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

// Rare species. Add new ones here (and a look in draw.ts) to grow the variety.
export const RARE_SPECIES = ["sakura", "golden", "blue_rose"] as const;
export type RareSpecies = (typeof RARE_SPECIES)[number];

// A rare plant appears every this many completed tasks.
export const RARE_EVERY = 10;

// Build the plant list from the number of completed tasks.
// - normal: one tree per completed task
// - rare: when the count hits a multiple of RARE_EVERY, that one is rare
// Positions come from a seeded RNG, so existing plants never move.
export function buildGarden(doneCount: number): Plant[] {
  const plants: Plant[] = [];
  for (let i = 1; i <= doneCount; i++) {
    const isRare = i % RARE_EVERY === 0;
    const species = isRare
      ? RARE_SPECIES[Math.floor(srand(i * 7.3) * RARE_SPECIES.length)]
      : undefined;
    plants.push({
      id: i,
      kind: isRare ? "rare" : "normal",
      species,
      x: 0.06 + srand(i * 3.13) * 0.88,
      y: 0.5 + srand(i * 1.77) * 0.42,
    });
  }
  return plants;
}
