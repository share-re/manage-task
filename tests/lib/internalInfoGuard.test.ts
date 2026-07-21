import { describe, it, expect } from "vitest";
import {
  needsInternalInfoGuard,
  withInternalInfoGuard,
} from "../../src/lib/internalInfoGuard";

describe("needsInternalInfoGuard", () => {
  it("Issue #72 の再現例（納期・会議・担当者）を検知する", () => {
    expect(needsInternalInfoGuard("先週の案件Xの締め切り、何日だった？")).toBe(true);
    expect(needsInternalInfoGuard("来月の全社会議っていつだっけ？")).toBe(true);
    expect(needsInternalInfoGuard("この件の担当って誰？")).toBe(true);
    expect(needsInternalInfoGuard("納期いつまでだっけ")).toBe(true);
  });

  it("表記ゆれ（締切・〆切・打合わせ・ミーティング）も検知する", () => {
    expect(needsInternalInfoGuard("締切過ぎてない？")).toBe(true);
    expect(needsInternalInfoGuard("〆切はいつ？")).toBe(true);
    expect(needsInternalInfoGuard("次の打合わせの日程教えて")).toBe(true);
    expect(needsInternalInfoGuard("明日のミーティング何時から？")).toBe(true);
  });

  it("社内情報と無関係な雑談には反応しない", () => {
    expect(needsInternalInfoGuard("今どんな感じ？")).toBe(false);
    expect(needsInternalInfoGuard("おすすめの激辛カレー教えて")).toBe(false);
    expect(needsInternalInfoGuard("TypeScriptの型って何？")).toBe(false);
  });
});

describe("withInternalInfoGuard", () => {
  it("検知したときは、元の発言の後ろに注意書きを付ける", () => {
    const out = withInternalInfoGuard("案件Aの納期っていつ？");
    expect(out.startsWith("案件Aの納期っていつ？")).toBe(true);
    expect(out).toContain("システムからの注記");
    expect(out).toContain("分からない");
  });

  it("検知しないときは、元の発言をそのまま返す", () => {
    expect(withInternalInfoGuard("こんにちは！")).toBe("こんにちは！");
  });
});
