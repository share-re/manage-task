import { describe, it, expect, vi } from "vitest";

// taskFindings.ts は ./supabase を読み込む。環境変数が無いと import 時に落ちるため
// スタブする（純関数だけを検証する）。
vi.mock("../../src/lib/supabase", () => ({ supabase: {} }));

import {
  countByPhase,
  findingAuthorLabel,
  findingCountByTask,
  openFindingCountByTask,
  qualityState,
  summarizeFindingBody,
  validateFindingBody,
  FINDING_MAX_LENGTH,
  type FindingPhase,
  type TaskFinding,
} from "../../src/lib/taskFindings";

function make(over: Partial<TaskFinding> = {}): TaskFinding {
  return {
    id: "f1",
    task_id: "t1",
    phase: "test" as FindingPhase,
    body: "保存後に一覧が更新されない",
    author: null,
    author_id: "u1",
    found_on: "2026-07-24",
    resolved: false,
    resolved_at: null,
    resolved_by: null,
    deleted_at: null,
    created_at: "2026-07-24T00:00:00.000Z",
    ...over,
  };
}

describe("openFindingCountByTask（未対応＝行のバッジ）", () => {
  it("未対応だけを数える", () => {
    const m = openFindingCountByTask([
      make({ id: "a" }),
      make({ id: "b", resolved: true }),
      make({ id: "c" }),
    ]);
    expect(m.get("t1")).toBe(2);
  });

  it("取り消し済みは数えない", () => {
    const m = openFindingCountByTask([
      make({ id: "a" }),
      make({ id: "b", deleted_at: "2026-07-25T00:00:00.000Z" }),
    ]);
    expect(m.get("t1")).toBe(1);
  });

  it("タスクごとに分かれる", () => {
    const m = openFindingCountByTask([
      make({ id: "a", task_id: "t1" }),
      make({ id: "b", task_id: "t2" }),
      make({ id: "c", task_id: "t2" }),
    ]);
    expect(m.get("t1")).toBe(1);
    expect(m.get("t2")).toBe(2);
    expect(m.get("t3")).toBeUndefined();
  });
});

describe("findingCountByTask（発見総数＝品質の物差し）", () => {
  it("対応済みでも減らない", () => {
    const m = findingCountByTask([
      make({ id: "a", resolved: true }),
      make({ id: "b", resolved: true }),
      make({ id: "c" }),
    ]);
    expect(m.get("t1")).toBe(3);
  });

  // レビュー指摘①：取り消しで総数が減ると「自分の記録を消して件数を下げる」ができてしまう。
  it("取り消し済みでも減らない", () => {
    const m = findingCountByTask([
      make({ id: "a", deleted_at: "2026-07-25T00:00:00.000Z" }),
      make({ id: "b" }),
    ]);
    expect(m.get("t1")).toBe(2);
  });

  it("未対応の数え方とは別物である", () => {
    const findings = [
      make({ id: "a", resolved: true }),
      make({ id: "b", deleted_at: "2026-07-25T00:00:00.000Z" }),
      make({ id: "c" }),
    ];
    expect(findingCountByTask(findings).get("t1")).toBe(3);
    expect(openFindingCountByTask(findings).get("t1")).toBe(1);
  });
});

describe("countByPhase", () => {
  it("工程ごとに数える", () => {
    const c = countByPhase([
      make({ id: "a", phase: "test" }),
      make({ id: "b", phase: "test" }),
      make({ id: "c", phase: "review" }),
      make({ id: "d", phase: "accept" }),
      make({ id: "e", phase: "post" }),
    ]);
    expect(c).toEqual({ test: 2, review: 1, accept: 1, post: 1 });
  });

  it("空なら全部0（キーは必ず4つ揃う）", () => {
    expect(countByPhase([])).toEqual({
      test: 0,
      review: 0,
      accept: 0,
      post: 0,
    });
  });
});

describe("qualityState（未確認 / 0件 / n件）", () => {
  it("未チェックかつ0件は「未確認」", () => {
    expect(qualityState(null, 0)).toBe("unchecked");
  });

  it("チェック済みで0件なら「0件で確定」", () => {
    expect(qualityState("2026-07-25T00:00:00.000Z", 0)).toBe("zero");
  });

  it("1件でもあれば「n件」", () => {
    expect(qualityState(null, 1)).toBe("has");
    expect(qualityState("2026-07-25T00:00:00.000Z", 3)).toBe("has");
  });

  // レビュー指摘②：第2引数に「未対応件数」を渡す事故を固定する。
  // 全部直したタスクは未対応0だが、発見総数を渡していれば zero にならない。
  it("対応済みだけのタスクは zero にならない（発見総数を渡していれば）", () => {
    const findings = [
      make({ id: "a", resolved: true }),
      make({ id: "b", resolved: true }),
    ];
    const totalFound = findingCountByTask(findings).get("t1") ?? 0;
    const openCount = openFindingCountByTask(findings).get("t1") ?? 0;

    expect(openCount).toBe(0); // 未対応は0（＝これを渡すと事故る）
    expect(qualityState("2026-07-25T00:00:00.000Z", totalFound)).toBe("has");
  });
});

describe("validateFindingBody", () => {
  it("空・空白のみは拒否", () => {
    expect(validateFindingBody("")).toBeTruthy();
    expect(validateFindingBody("   ")).toBeTruthy();
  });

  it("上限ちょうどは通る", () => {
    expect(validateFindingBody("あ".repeat(FINDING_MAX_LENGTH))).toBeNull();
  });

  it("上限超えは拒否", () => {
    expect(validateFindingBody("あ".repeat(FINDING_MAX_LENGTH + 1))).toBeTruthy();
  });
});

describe("summarizeFindingBody（一覧用の短縮）", () => {
  it("既定は40字（右側の列が見切れない長さ）", () => {
    const body = "あ".repeat(50);
    expect(summarizeFindingBody(body)).toBe(`${"あ".repeat(40)}…`);
  });

  it("短い本文はそのまま", () => {
    expect(summarizeFindingBody("保存できない")).toBe("保存できない");
  });

  it("改行や連続スペースは1つの空白に潰す", () => {
    expect(summarizeFindingBody("手順1\n手順2\n\n  手順3")).toBe(
      "手順1 手順2 手順3",
    );
  });

  it("上限を超えたら省略記号を付ける", () => {
    const body = "あ".repeat(80);
    const out = summarizeFindingBody(body, 60);
    expect(out).toBe(`${"あ".repeat(60)}…`);
    expect(out.length).toBe(61); // 60字＋省略記号
  });

  it("上限ちょうどなら省略しない", () => {
    const body = "あ".repeat(60);
    expect(summarizeFindingBody(body, 60)).toBe(body);
  });

  it("前後の空白は落とす", () => {
    expect(summarizeFindingBody("  余白あり  ")).toBe("余白あり");
  });
});

describe("findingAuthorLabel", () => {
  const labelById = new Map([["u1", "柴田"]]);

  it("author_id から名簿の名前を引く", () => {
    expect(findingAuthorLabel(make(), labelById)).toBe("柴田");
  });

  it("名簿に無ければ author 文字列にフォールバック", () => {
    expect(
      findingAuthorLabel({ author: "旧名", author_id: "u9" }, labelById),
    ).toBe("旧名");
  });

  it("どちらも無ければ「不明」", () => {
    expect(findingAuthorLabel({ author: null, author_id: null }, labelById)).toBe(
      "不明",
    );
  });
});
