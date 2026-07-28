import { describe, it, expect } from "vitest";
import {
  resolveSummaryRecipients,
  type MailRecipientRow,
} from "../../src/lib/mailRecipients";

const FALLBACK = { to: ["legacy@example.com"], bcc: [] };

function row(over: Partial<MailRecipientRow>): MailRecipientRow {
  return {
    id: "r",
    user_id: null,
    email: null,
    label: null,
    send_as: "bcc",
    enabled: true,
    ...over,
  };
}

describe("resolveSummaryRecipients", () => {
  it("メンバーのアドレスは profiles から引く", () => {
    const rows = [row({ id: "1", user_id: "u1", send_as: "to" })];
    const emails = new Map([["u1", "member@example.com"]]);
    expect(resolveSummaryRecipients(rows, emails, FALLBACK)).toEqual({
      to: ["member@example.com"],
      bcc: [],
    });
  });

  it("外部アドレスはそのまま使う", () => {
    const rows = [row({ id: "1", email: "ml@example.com" })];
    expect(resolveSummaryRecipients(rows, new Map(), FALLBACK)).toEqual({
      to: [],
      bcc: ["ml@example.com"],
    });
  });

  it("無効な行は送信対象から外れる", () => {
    const rows = [
      row({ id: "1", email: "on@example.com" }),
      row({ id: "2", email: "off@example.com", enabled: false }),
    ];
    expect(resolveSummaryRecipients(rows, new Map(), FALLBACK).bcc).toEqual([
      "on@example.com",
    ]);
  });

  // Mailing the same person twice is the visible symptom of a duplicate row.
  it("大文字小文字が違うだけの重複は1件にまとめる", () => {
    const rows = [
      row({ id: "1", email: "Dup@Example.com", send_as: "to" }),
      row({ id: "2", email: "dup@example.com" }),
    ];
    const r = resolveSummaryRecipients(rows, new Map(), FALLBACK);
    expect(r.to).toEqual(["Dup@Example.com"]);
    expect(r.bcc).toEqual([]);
  });

  // An empty address would make the mail server reject the whole batch, taking
  // everyone else's copy down with it.
  it("アドレスが無いメンバーは黙って飛ばす", () => {
    const rows = [
      row({ id: "1", user_id: "u1" }),
      row({ id: "2", email: "ok@example.com" }),
    ];
    const emails = new Map<string, string | null>([["u1", null]]);
    expect(resolveSummaryRecipients(rows, emails, FALLBACK).bcc).toEqual([
      "ok@example.com",
    ]);
  });

  it("マスタが空なら従来の設定にフォールバックする", () => {
    expect(resolveSummaryRecipients([], new Map(), FALLBACK)).toEqual(FALLBACK);
  });

  it("全員が無効なときもフォールバックする", () => {
    const rows = [row({ id: "1", email: "off@example.com", enabled: false })];
    expect(resolveSummaryRecipients(rows, new Map(), FALLBACK)).toEqual(
      FALLBACK,
    );
  });
});
