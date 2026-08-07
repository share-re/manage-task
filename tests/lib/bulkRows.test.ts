import { describe, it, expect, vi } from "vitest";

vi.mock("../../src/lib/supabase", () => ({ supabase: {} }));

import { parseBulkRows, resolveBulkRange } from "../../src/lib/tasks";

describe("parseBulkRows（まとめて登録の行解析）", () => {
  it("行頭の空白で子タスクになる", () => {
    const rows = parseBulkRows("ログイン機能\n  画面の設計\n  APIの実装");
    expect(rows.map((r) => [r.title, r.isChild])).toEqual([
      ["ログイン機能", false],
      ["画面の設計", true],
      ["APIの実装", true],
    ]);
  });

  it("タブと全角スペースも子タスク扱い", () => {
    const rows = parseBulkRows("親\n\t子1\n　子2");
    expect(rows.map((r) => r.isChild)).toEqual([false, true, true]);
  });

  it("空行は無視する", () => {
    const rows = parseBulkRows("親A\n\n  子\n   \n親B");
    expect(rows.map((r) => r.title)).toEqual(["親A", "子", "親B"]);
  });

  // 先頭がいきなりインデントされていても親として扱う（親がまだ無いため）。
  // 登録処理側の groups.length > 0 判定と挙動を揃えている。
  it("先頭がインデントされていても親になる", () => {
    const rows = parseBulkRows("  いきなり子\n  次");
    expect(rows.map((r) => r.isChild)).toEqual([false, true]);
  });

  it("キーは親ごとに振り直される", () => {
    const rows = parseBulkRows("親A\n  子1\n  子2\n親B\n  子1");
    expect(rows.map((r) => r.key)).toEqual(["0", "0-1", "0-2", "1", "1-1"]);
  });

  // キーが安定していないと、画面で設定した期間が保存時に別の行に付いてしまう。
  it("後ろの行を足しても既存行のキーは変わらない", () => {
    const before = parseBulkRows("親A\n  子1");
    const after = parseBulkRows("親A\n  子1\n  子2\n親B");
    expect(after.slice(0, 2).map((r) => r.key)).toEqual(
      before.map((r) => r.key),
    );
  });

  it("空文字なら空配列", () => {
    expect(parseBulkRows("")).toEqual([]);
    expect(parseBulkRows("\n\n  \n")).toEqual([]);
  });

  it("前後の空白は落とす", () => {
    expect(parseBulkRows("  子だけど先頭  ")[0].title).toBe("子だけど先頭");
  });
});

describe("resolveBulkRange（行ごとの期間の決定）", () => {
  const shared = { start: "2026-08-01", due: "2026-08-31" };

  it("個別設定が無ければ共通を使う", () => {
    expect(resolveBulkRange(undefined, shared)).toEqual(shared);
  });

  it("個別設定があればそちらを使う", () => {
    expect(
      resolveBulkRange({ start: "2026-08-05", due: "2026-08-10" }, shared),
    ).toEqual({ start: "2026-08-05", due: "2026-08-10" });
  });

  // 片方だけ入れた状態を弾かず、空いている方は共通で埋める。
  it("開始だけ設定したら終了は共通で埋める", () => {
    expect(resolveBulkRange({ start: "2026-08-05", due: "" }, shared)).toEqual({
      start: "2026-08-05",
      due: "2026-08-31",
    });
  });

  it("終了だけ設定したら開始は共通で埋める", () => {
    expect(resolveBulkRange({ start: "", due: "2026-08-10" }, shared)).toEqual({
      start: "2026-08-01",
      due: "2026-08-10",
    });
  });

  it("共通が空なら空のまま（期間なしで登録できる）", () => {
    expect(resolveBulkRange(undefined, { start: "", due: "" })).toEqual({
      start: "",
      due: "",
    });
  });
});
