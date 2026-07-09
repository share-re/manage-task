import { describe, it, expect } from "vitest";
import {
  blocked, moveActor, seatForUser, viewTransform, srand, SEATS, MAPW, MAPH, type Actor,
} from "@/app/office/officeWorld";

const actor = (x: number, z: number): Actor => ({ x, z, name: "", shirt: "", hair: "", face: "up", ph: 0 });

describe("seatForUser", () => {
  it("is deterministic and returns a defined SEAT", () => {
    expect(seatForUser("user-abc")).toEqual(seatForUser("user-abc"));
    expect(SEATS).toContainEqual(seatForUser("user-abc"));
  });
  it("maps arbitrary users to valid seats", () => {
    for (const u of ["u1", "u2", "u3", "u4", "u5"]) expect(SEATS).toContainEqual(seatForUser(u));
  });
});

// Regression for the "spawn stuck on furniture" bug: every seat must sit on free
// floor and have escape routes so the player can always walk away.
describe("SEATS invariant", () => {
  it("every seat is free with >=3 escape directions", () => {
    for (const s of SEATS) {
      expect(blocked(s.x, s.z), `${s.zone} (${s.x},${s.z}) must be free`).toBe(false);
      const d = 0.35;
      const exits = [[d, 0], [-d, 0], [0, d], [0, -d]].filter(([dx, dz]) => !blocked(s.x + dx, s.z + dz)).length;
      expect(exits, `${s.zone} (${s.x},${s.z}) escape routes`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("blocked", () => {
  it("blocks out-of-bounds / walls", () => {
    expect(blocked(0, 8)).toBe(true);
    expect(blocked(12, 0.5)).toBe(true);
    expect(blocked(12, 30)).toBe(true);
  });
  it("blocks furniture but frees open floor", () => {
    expect(blocked(5, 4)).toBe(true);   // meeting table
    expect(blocked(12, 8)).toBe(false); // open floor
  });
});

describe("moveActor", () => {
  it("moves into free space", () => {
    const a = actor(12, 8);
    moveActor(a, 0.1, 0);
    expect(a.x).toBeCloseTo(12.1);
  });
  it("is blocked by walls (position unchanged on the blocked axis)", () => {
    const a = actor(1.6, 8);
    moveActor(a, -0.5, 0); // target x=1.1 < 1.4 -> blocked
    expect(a.x).toBe(1.6);
  });
});

describe("viewTransform", () => {
  it("scales to cover the viewport and clamps offsets inside the map", () => {
    const W = 800, H = 600;
    const vt = viewTransform(actor(12, 8), W, H);
    expect(vt.scale).toBeCloseTo(Math.max(W / MAPW, H / MAPH));
    const vw = W / vt.scale, vh = H / vt.scale;
    expect(vt.ox).toBeGreaterThanOrEqual(0);
    expect(vt.ox).toBeLessThanOrEqual(MAPW - vw + 1e-6);
    expect(vt.oy).toBeGreaterThanOrEqual(0);
    expect(vt.oy).toBeLessThanOrEqual(MAPH - vh + 1e-6);
  });
});

describe("srand", () => {
  it("is deterministic and within [0,1)", () => {
    for (let i = 0; i < 20; i++) {
      const v = srand(i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(srand(7)).toBe(srand(7));
  });
});
