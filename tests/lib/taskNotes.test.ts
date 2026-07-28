import { describe, it, expect } from "vitest";
import {
  openNoteCountByTask,
  noteAuthorLabel,
  validateNoteBody,
  NOTE_MAX_LENGTH,
  type TaskNote,
} from "../../src/lib/taskNotes";

// Build a note with sensible defaults; override only what a test cares about.
function mk(p: Partial<TaskNote> & { id: string; task_id: string }): TaskNote {
  return {
    body: "メモ",
    author: null,
    author_id: null,
    resolved: false,
    resolved_at: null,
    resolved_by: null,
    migrated_from_comment_id: null,
    created_at: "",
    ...p,
  };
}

describe("openNoteCountByTask（未対応メモ件数・「！」判定の元）", () => {
  it("タスクごとに未対応だけ数える", () => {
    const m = openNoteCountByTask([
      mk({ id: "1", task_id: "A" }),
      mk({ id: "2", task_id: "A" }),
      mk({ id: "3", task_id: "A", resolved: true }), // 対応済み→数えない
      mk({ id: "4", task_id: "B" }),
    ]);
    expect(m.get("A")).toBe(2);
    expect(m.get("B")).toBe(1);
  });

  it("全部対応済みのタスクは Map に載らない（＝「！」が消える）", () => {
    const m = openNoteCountByTask([
      mk({ id: "1", task_id: "A", resolved: true }),
      mk({ id: "2", task_id: "A", resolved: true }),
    ]);
    expect(m.has("A")).toBe(false);
    expect(m.get("A") ?? 0).toBe(0);
  });

  it("メモ0件なら空", () => {
    expect(openNoteCountByTask([]).size).toBe(0);
  });
});

describe("noteAuthorLabel（投稿者の表示名）", () => {
  const labelById = new Map([["u1", "畠山彩華"]]);

  it("author_id からメンバー名を引く", () => {
    expect(noteAuthorLabel({ author_id: "u1", author: null }, labelById)).toBe(
      "畠山彩華",
    );
  });

  it("author_id が無ければ旧 author（表示名）にフォールバック", () => {
    expect(
      noteAuthorLabel({ author_id: null, author: "山田太郎" }, labelById),
    ).toBe("山田太郎");
  });

  it("author_id を引けなくても author が残っていればそれを使う（移行分）", () => {
    expect(
      noteAuthorLabel({ author_id: "unknown", author: "山田太郎" }, labelById),
    ).toBe("山田太郎");
  });

  it("どちらも無ければ「不明」", () => {
    expect(noteAuthorLabel({ author_id: null, author: null }, labelById)).toBe(
      "不明",
    );
  });
});

describe("validateNoteBody（本文の検証）", () => {
  it("空・空白のみは拒否", () => {
    expect(validateNoteBody("")).not.toBeNull();
    expect(validateNoteBody("   ")).not.toBeNull();
    expect(validateNoteBody("\n\t ")).not.toBeNull();
  });

  it("通常の本文はOK", () => {
    expect(validateNoteBody("APIの仕様が未確定")).toBeNull();
  });

  it("目安100字を超えてもOK（ハード制限ではない）", () => {
    expect(validateNoteBody("あ".repeat(150))).toBeNull();
  });

  it("上限ちょうど（500字）はOK、1字超は拒否", () => {
    expect(validateNoteBody("あ".repeat(NOTE_MAX_LENGTH))).toBeNull();
    expect(validateNoteBody("あ".repeat(NOTE_MAX_LENGTH + 1))).not.toBeNull();
  });

  it("前後の空白は長さに数えない（trim後で判定）", () => {
    expect(validateNoteBody(`  ${"あ".repeat(NOTE_MAX_LENGTH)}  `)).toBeNull();
  });
});
