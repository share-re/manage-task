import { describe, it, expect } from "vitest";
import {
  DEFAULT_PERSON_DAY_HOURS,
  setPersonDayHours,
} from "../../src/lib/settings";

// F109。人日換算係数はダッシュボードの指標B（1人日あたり完了数）の分母。
// ここに 0 や負数が入ると、指標が Infinity や負の値になる。
// setPersonDayHours は DB に触る前に弾くので、接続なしで検証できる。

describe("DEFAULT_PERSON_DAY_HOURS", () => {
  it("既定は 8 時間／人日", () => {
    // app_settings が無い環境でもダッシュボードが動くための値。
    expect(DEFAULT_PERSON_DAY_HOURS).toBe(8);
  });

  it("0より大きい（分母として使えること）", () => {
    expect(DEFAULT_PERSON_DAY_HOURS).toBeGreaterThan(0);
  });
});

describe("setPersonDayHours", () => {
  it("0 と負数は保存前に弾く（ゼロ除算・負の指標を作らない）", async () => {
    await expect(setPersonDayHours(0)).rejects.toThrow();
    await expect(setPersonDayHours(-1)).rejects.toThrow();
  });

  it("数値でない値も弾く", async () => {
    await expect(setPersonDayHours(NaN)).rejects.toThrow();
    await expect(setPersonDayHours(Infinity)).rejects.toThrow();
  });

  it("弾いた理由が利用者に読める日本語で返る", async () => {
    await expect(setPersonDayHours(0)).rejects.toThrow(
      /0より大きい数値/,
    );
  });
});
