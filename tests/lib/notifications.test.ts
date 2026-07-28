import { describe, it, expect, vi } from "vitest";

// notifications.ts は ./supabase を読み込む。環境変数が無いと import 時に落ちるため
// スタブする（純関数だけを検証する）。
vi.mock("../../src/lib/supabase", () => ({ supabase: {} }));

import {
  normalizeNotification,
  notificationText,
  relativeTime,
  unreadCount,
  type AppNotification,
} from "../../src/lib/notifications";

function make(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    type: "concern_note",
    task_id: "t1",
    note_id: "m1",
    read: false,
    created_at: "2026-07-28T00:00:00.000Z",
    actorName: "柴田",
    taskTitle: "QA表作成",
    ...over,
  };
}

describe("normalizeNotification", () => {
  const base = {
    id: "n1",
    type: "concern_note",
    task_id: "t1",
    note_id: "m1",
    read: false,
    created_at: "2026-07-28T00:00:00.000Z",
  };

  it("埋め込みが単体オブジェクトのとき名前を取り出す", () => {
    const n = normalizeNotification({
      ...base,
      actor: { name: "柴田", email: "shibata@example.com" },
      task: { title: "QA表作成" },
    });
    expect(n.actorName).toBe("柴田");
    expect(n.taskTitle).toBe("QA表作成");
  });

  it("埋め込みが配列で返っても取り出せる", () => {
    const n = normalizeNotification({
      ...base,
      actor: [{ name: "佐藤", email: "sato@example.com" }],
      task: [{ title: "API設計" }],
    });
    expect(n.actorName).toBe("佐藤");
    expect(n.taskTitle).toBe("API設計");
  });

  it("表示名が未設定ならメールで代替する", () => {
    const n = normalizeNotification({
      ...base,
      actor: { name: null, email: "sato@example.com" },
    });
    expect(n.actorName).toBe("sato@example.com");
  });

  it("表示名もメールも空文字なら null", () => {
    const n = normalizeNotification({
      ...base,
      actor: { name: "   ", email: "" },
    });
    expect(n.actorName).toBeNull();
  });

  it("埋め込み自体が無ければ null（退会・削除済み）", () => {
    const n = normalizeNotification({ ...base, actor: null, task: null });
    expect(n.actorName).toBeNull();
    expect(n.taskTitle).toBeNull();
  });

  it("欠損・型違いの値でも既定値に落として壊れない", () => {
    const n = normalizeNotification({ id: 123 });
    expect(n.id).toBe("123");
    expect(n.type).toBe("");
    expect(n.task_id).toBeNull();
    expect(n.note_id).toBeNull();
    expect(n.read).toBe(false);
    expect(n.created_at).toBe("");
  });

  it("read は true のときだけ true", () => {
    expect(normalizeNotification({ ...base, read: true }).read).toBe(true);
    expect(normalizeNotification({ ...base, read: "true" }).read).toBe(false);
  });
});

describe("unreadCount", () => {
  it("未読だけを数える", () => {
    expect(
      unreadCount([make(), make({ id: "n2", read: true }), make({ id: "n3" })]),
    ).toBe(2);
  });

  it("空配列は0", () => {
    expect(unreadCount([])).toBe(0);
  });
});

describe("notificationText", () => {
  it("懸念メモの通知文を作る", () => {
    expect(notificationText(make())).toBe(
      "柴田さんが「QA表作成」に懸念メモを追加しました",
    );
  });

  it("投稿者名が取れないときは「誰か」で埋める", () => {
    expect(notificationText(make({ actorName: null }))).toBe(
      "誰かさんが「QA表作成」に懸念メモを追加しました",
    );
  });

  it("タスク名が取れないときは「タスク」で埋める", () => {
    expect(notificationText(make({ taskTitle: null }))).toBe(
      "柴田さんが「タスク」に懸念メモを追加しました",
    );
  });

  it("未知の種別でも文言が欠けない", () => {
    expect(notificationText(make({ type: "unknown" }))).toBe(
      "柴田さんから通知があります",
    );
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-07-28T12:00:00.000Z");

  it("1分未満は「たった今」", () => {
    expect(relativeTime("2026-07-28T11:59:30.000Z", now)).toBe("たった今");
  });

  it("分・時間・日で丸める", () => {
    expect(relativeTime("2026-07-28T11:30:00.000Z", now)).toBe("30分前");
    expect(relativeTime("2026-07-28T09:00:00.000Z", now)).toBe("3時間前");
    expect(relativeTime("2026-07-26T12:00:00.000Z", now)).toBe("2日前");
  });

  it("1週間以上前は日付表記", () => {
    expect(relativeTime("2026-07-01T12:00:00.000Z", now)).toBe("7/1");
  });

  it("不正な日時は空文字", () => {
    expect(relativeTime("not-a-date", now)).toBe("");
  });
});
