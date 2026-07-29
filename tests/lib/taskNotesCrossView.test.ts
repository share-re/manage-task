import { describe, it, expect, vi } from "vitest";

// taskNotes.ts は ./supabase を読み込む。環境変数が無いと import 時に落ちるため
// スタブする（純関数だけを検証する）。
vi.mock("../../src/lib/supabase", () => ({ supabase: {} }));

import {
  daysSince,
  groupNotesByFeature,
  matchesOwner,
  noteAge,
  noteSummary,
  summarizeNoteBody,
  NOTE_STALE_DAYS,
  OWNER_NONE,
  type CrossViewNote,
} from "../../src/lib/taskNotes";

function row(over: Partial<CrossViewNote> = {}): CrossViewNote {
  return {
    note: {
      id: "n1",
      task_id: "t1",
      body: "保存後に一覧が更新されない",
      author: null,
      author_id: "u1",
      resolved: false,
      resolved_at: null,
      resolved_by: null,
      migrated_from_comment_id: null,
      created_at: "2026-07-20T00:00:00.000Z",
    },
    taskId: "t1",
    taskTitle: "送信履歴の記録",
    featureId: "f1",
    featureTitle: "メール配信",
    assigneeId: "u2",
    assigneeLabel: "柴田",
    authorLabel: "畠山",
    days: 1,
    ...over,
  };
}

describe("daysSince（放置日数）", () => {
  const now = new Date("2026-07-29T09:00:00+09:00");

  it("同じ日なら0日", () => {
    expect(daysSince("2026-07-29T01:00:00+09:00", now)).toBe(0);
  });

  // 時刻ではなく暦日で数える: 2時間差でも「昨日」なら1日として見せる。
  it("前日の夜と当日の朝は1日差になる", () => {
    expect(daysSince("2026-07-28T23:00:00+09:00", now)).toBe(1);
  });

  it("9日前は9日", () => {
    expect(daysSince("2026-07-20T15:00:00+09:00", now)).toBe(9);
  });

  it("未来日付は0に丸める（負にしない）", () => {
    expect(daysSince("2026-08-05T00:00:00+09:00", now)).toBe(0);
  });

  it("壊れた日付は0", () => {
    expect(daysSince("", now)).toBe(0);
    expect(daysSince("not-a-date", now)).toBe(0);
  });
});

describe("noteAge（色分けの区分）", () => {
  it("7日以上は stale", () => {
    expect(noteAge(7)).toBe("stale");
    expect(noteAge(30)).toBe("stale");
  });
  it("3〜6日は warn", () => {
    expect(noteAge(3)).toBe("warn");
    expect(noteAge(6)).toBe("warn");
  });
  it("2日以下は fresh", () => {
    expect(noteAge(0)).toBe("fresh");
    expect(noteAge(2)).toBe("fresh");
  });
});

describe("matchesOwner（担当者の絞り込み）", () => {
  it("null はすべて通す", () => {
    expect(matchesOwner("u1", null)).toBe(true);
    expect(matchesOwner(null, null)).toBe(true);
  });
  it("IDを指定するとその人だけ", () => {
    expect(matchesOwner("u1", "u1")).toBe(true);
    expect(matchesOwner("u2", "u1")).toBe(false);
    expect(matchesOwner(null, "u1")).toBe(false);
  });
  it("__none__ は担当者未設定だけ", () => {
    expect(matchesOwner(null, OWNER_NONE)).toBe(true);
    expect(matchesOwner("u1", OWNER_NONE)).toBe(false);
  });
});

describe("groupNotesByFeature", () => {
  const notes = [
    row({ note: { ...row().note, id: "a" }, featureId: "f1", featureTitle: "メール配信", days: 12 }),
    row({ note: { ...row().note, id: "b" }, featureId: "f1", featureTitle: "メール配信", days: 2 }),
    row({ note: { ...row().note, id: "c" }, featureId: "f2", featureTitle: "マスタ管理", days: 4 }),
    row({ note: { ...row().note, id: "d" }, featureId: "f2", featureTitle: "マスタ管理", days: 3 }),
    row({ note: { ...row().note, id: "e" }, featureId: "f2", featureTitle: "マスタ管理", days: 1 }),
  ];

  it("機能ごとにまとめ、件数と最長放置を出す", () => {
    const g = groupNotesByFeature(notes);
    expect(g).toHaveLength(2);
    expect(g[0]).toMatchObject({ name: "メール配信", count: 2, maxDays: 12 });
    expect(g[1]).toMatchObject({ name: "マスタ管理", count: 3, maxDays: 4 });
  });

  // 既定を「放置が長い順」にしているのは、忘れられているものを上に出すため。
  it("既定は最長放置が長い順", () => {
    expect(groupNotesByFeature(notes).map((g) => g.name)).toEqual([
      "メール配信",
      "マスタ管理",
    ]);
  });

  it("count 指定なら件数の多い順", () => {
    expect(groupNotesByFeature(notes, "count").map((g) => g.name)).toEqual([
      "マスタ管理",
      "メール配信",
    ]);
  });

  it("name 指定なら機能名順", () => {
    expect(groupNotesByFeature(notes, "name").map((g) => g.name)).toEqual([
      "マスタ管理",
      "メール配信",
    ]);
  });

  it("グループ内の明細も放置が長い順に並ぶ", () => {
    const g = groupNotesByFeature(notes);
    expect(g[1].items.map((i) => i.days)).toEqual([4, 3, 1]);
  });

  it("親が無いものは1つのグループにまとまる", () => {
    const g = groupNotesByFeature([
      row({ featureId: null, featureTitle: "（親なし）", days: 5 }),
      row({ featureId: null, featureTitle: "（親なし）", days: 1 }),
    ]);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ key: "__standalone__", count: 2, maxDays: 5 });
  });

  it("空なら空配列", () => {
    expect(groupNotesByFeature([])).toEqual([]);
  });
});

describe("noteSummary（タイルの件数）", () => {
  const notes = [
    row({ assigneeId: "u1", days: 12 }),
    row({ assigneeId: "u1", days: 1 }),
    row({ assigneeId: "u2", days: 8 }),
    row({ assigneeId: null, days: 5 }),
    row({ assigneeId: null, days: 9 }),
  ];

  it("絞り込みなしなら全件", () => {
    expect(noteSummary(notes, null)).toEqual({
      open: 5,
      stale: 3,
      unassigned: 2,
    });
  });

  // 一覧とタイルの数字が食い違うと読み手が混乱するので、担当者の絞り込みに追従させる。
  it("担当者で絞ると未対応・放置がその人の件数になる", () => {
    expect(noteSummary(notes, "u1")).toMatchObject({ open: 2, stale: 1 });
  });

  // ここが要件の肝: 自分に絞った瞬間に0になると、誰も拾っていない懸念が視界から消える。
  it("「担当者なし」だけは絞り込んでも全体の件数のまま", () => {
    expect(noteSummary(notes, "u1").unassigned).toBe(2);
    expect(noteSummary(notes, "u2").unassigned).toBe(2);
  });

  it("担当者なしで絞ると未設定のものだけ数える", () => {
    expect(noteSummary(notes, OWNER_NONE)).toMatchObject({
      open: 2,
      stale: 1,
    });
  });

  it("しきい値ちょうどは放置に数える", () => {
    expect(
      noteSummary([row({ assigneeId: "u1", days: NOTE_STALE_DAYS })], "u1").stale,
    ).toBe(1);
    expect(
      noteSummary([row({ assigneeId: "u1", days: NOTE_STALE_DAYS - 1 })], "u1")
        .stale,
    ).toBe(0);
  });
});

describe("summarizeNoteBody（一覧用の短縮）", () => {
  it("既定は40字（右側の列が見切れない長さ）", () => {
    expect(summarizeNoteBody("あ".repeat(50))).toBe(`${"あ".repeat(40)}…`);
  });

  it("短い本文はそのまま", () => {
    expect(summarizeNoteBody("保存できない")).toBe("保存できない");
  });

  it("改行や連続スペースは1つの空白に潰す", () => {
    expect(summarizeNoteBody("手順1\n手順2\n\n  手順3")).toBe("手順1 手順2 手順3");
  });

  it("上限ちょうどなら省略しない", () => {
    const body = "あ".repeat(40);
    expect(summarizeNoteBody(body)).toBe(body);
  });
});
