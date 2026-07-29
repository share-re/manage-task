"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { MailRecipientRow, SendAs } from "@/lib/mailRecipients";
import {
  getEmailSettings,
  saveEmailSettings,
  WEEKDAY_LABELS,
  type MailFrequency,
} from "@/lib/emailSettings";
import { listSendLog, type SendLog } from "@/lib/sendLog";
import { C, CARD_STYLE, Pill } from "./theme";

type Member = { id: string; name: string | null; email: string | null };

/**
 * 共有先 — everything about the progress summary mail: who receives it, when
 * it goes out, sending it by hand, and what has been sent.
 *
 * This absorbed the former /tasks/mail screen. The To / Bcc text boxes it had
 * are gone: each recipient row now carries its own To/Bcc, so the boxes were a
 * second, conflicting answer to the same question.
 *
 * Members are picked from the list rather than typed: their address already
 * exists in profiles, and a typed one would be a second copy that can go
 * stale. Outside addresses (a mailing list, someone without an account) are
 * typed, because nothing else in the app knows them.
 */
export default function MailPanel() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [rows, setRows] = useState<MailRecipientRow[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [memberPick, setMemberPick] = useState("");
  const [extEmail, setExtEmail] = useState("");
  const [extLabel, setExtLabel] = useState("");

  // --- schedule (from the former /tasks/mail screen) ---
  const [settingsId, setSettingsId] = useState<string>();
  const [frequency, setFrequency] = useState<MailFrequency>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [sendTime, setSendTime] = useState("09:00");
  const [enabled, setEnabled] = useState(true);
  // The hand-typed addresses are no longer editable, but they are still what
  // the send route falls back to while the recipient list is empty. Carry them
  // through every save untouched rather than blanking them.
  const [legacyTo, setLegacyTo] = useState("");
  const [legacyBcc, setLegacyBcc] = useState("");
  const [saving, setSaving] = useState(false);

  const [sending, setSending] = useState<"test" | "now" | null>(null);
  const [logs, setLogs] = useState<SendLog[]>([]);

  // 取得だけを行う（state は触らない）。state 更新と分けておくと、effect からは
  // 「呼ぶ → .then で setState」の形にでき、effect 内の同期 setState を避けられる。
  const fetchRecipients = useCallback(async () => {
    if (!token) return null;
    const res = await fetch("/api/admin/mail-recipients", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "取得に失敗しました。");
    return {
      rows: json.recipients as MailRecipientRow[],
      members: json.members as Member[],
    };
  }, [token]);

  // Note: no setLoading(true) here. It starts true, and a reload after an edit
  // should not flash the table away — the buttons are already disabled by busy.
  const load = useCallback(async () => {
    try {
      const data = await fetchRecipients();
      if (data) {
        setRows(data.rows);
        setMembers(data.members);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [fetchRecipients]);

  // 初回読み込み。setState はすべて then/catch/finally の中で行う。
  useEffect(() => {
    let alive = true;
    fetchRecipients()
      .then((data) => {
        if (!alive || !data) return;
        setRows(data.rows);
        setMembers(data.members);
        setError(null);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [fetchRecipients]);

  const loadLogs = useCallback(() => {
    listSendLog()
      .then(setLogs)
      .catch((err) => console.error("送信履歴の読み込みに失敗:", err));
  }, []);

  useEffect(() => {
    getEmailSettings()
      .then((s) => {
        if (!s) return;
        setSettingsId(s.id);
        setFrequency(s.frequency);
        setDayOfWeek(s.day_of_week ?? 1);
        setSendTime((s.send_time ?? "09:00").slice(0, 5));
        setEnabled(s.enabled);
        setLegacyTo(s.to_recipients ?? "");
        setLegacyBcc(s.bcc_recipients ?? s.recipients ?? "");
      })
      .catch((err) => console.error("メール設定の読み込みに失敗:", err));
    loadLogs();
  }, [loadLogs]);

  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const saved = await saveEmailSettings(
        {
          toRecipients: legacyTo,
          bccRecipients: legacyBcc,
          frequency,
          dayOfWeek: frequency === "weekly" ? dayOfWeek : null,
          sendTime,
          enabled,
        },
        settingsId,
      );
      setSettingsId(saved.id); // keep the id so the next save updates this row
      setNotice("送信スケジュールを保存しました。");
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  /** Test goes to your own address only; "now" goes to the real list. */
  async function send(kind: "test" | "now") {
    if (!token) return;
    if (
      kind === "now" &&
      !window.confirm("登録されている共有先へ、進捗サマリを今すぐ送信します。よろしいですか？")
    )
      return;
    setSending(kind);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/send-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          kind === "test" ? { testRecipient: session?.user.email } : {},
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました。");
      setNotice(
        `${kind === "test" ? "テスト送信" : "送信"}しました：${(data.sentTo ?? []).join(", ")}`,
      );
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setSending(null);
    }
  }

  const memberById = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members],
  );
  // Members already on the list must not be offered again — the unique index
  // would reject the insert anyway.
  const addable = useMemo(
    () =>
      members.filter((m) => !rows.some((r) => r.user_id === m.id)),
    [members, rows],
  );

  const enabledCount = rows.filter((r) => r.enabled).length;

  async function call(
    method: "POST" | "PATCH" | "DELETE",
    body: Record<string, unknown>,
    okMessage?: string,
  ) {
    if (!token) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/mail-recipients", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "更新に失敗しました。");
      await load();
      if (okMessage) setNotice(okMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function displayOf(r: MailRecipientRow): { name: string; sub: string } {
    if (r.user_id) {
      const m = memberById.get(r.user_id);
      return {
        name: m?.name?.trim() || m?.email || "（不明なメンバー）",
        sub: m?.email ?? "アドレス未設定",
      };
    }
    return { name: r.label?.trim() || r.email || "", sub: r.email ?? "" };
  }

  const inputStyle = {
    border: `1px solid ${C.line}`,
    background: C.card,
  } as const;

  return (
    <section className="px-5 py-4" style={CARD_STYLE}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-[1.05rem] font-extrabold">✉️ 共有先マスタ</h2>
        <span className="text-[0.82rem]" style={{ color: C.muted }}>
          {loading ? "読み込み中…" : `${rows.length}件中 ${enabledCount}件が受信`}
        </span>
      </div>
      <p className="mb-3.5 mt-1.5 text-[0.86rem]" style={{ color: C.muted }}>
        進捗サマリメールの<b style={{ color: C.ink }}>届け先・送信スケジュール・送信履歴</b>
        をまとめて扱います。以前の「メール共有の設定」画面はこの中に統合しました。
      </p>

      {notice && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: C.accentSoft, color: C.accentInk }}
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: C.dangerBg, color: C.danger }}
        >
          {error}
        </p>
      )}

      {!loading && rows.length === 0 && !error && (
        <p
          className="mb-3 rounded-lg px-3 py-2 text-[0.84rem]"
          style={{ background: C.warnBg, color: C.ink }}
        >
          <b style={{ color: C.warn }}>まだ1件も登録がありません。</b>
          この状態のあいだは、以前の画面で保存済みのアドレスへ送られます（設定が消えないよう残してあります）。
          <b style={{ color: C.ink }}>1件でも登録すると、こちらの一覧が宛先になります。</b>
        </p>
      )}

      {rows.length > 0 && (
        <div
          className="overflow-x-auto rounded-xl"
          style={{ border: `1px solid ${C.line}` }}
        >
          <table className="w-full min-w-[640px] border-collapse text-[0.85rem]">
            <thead>
              <tr>
                {["宛先", "種別", "送信区分", "定期サマリ", "操作"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-3 py-2.5 text-left text-[0.72rem] font-extrabold uppercase tracking-[0.06em]"
                    style={{
                      background: C.card2,
                      color: C.muted,
                      borderBottom: `1px solid ${C.line}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const d = displayOf(r);
                return (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td className="px-3 py-2.5">
                      <div className="font-bold">{d.name}</div>
                      <div className="font-mono text-[0.75rem]" style={{ color: C.muted }}>
                        {d.sub}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {r.user_id ? (
                        <Pill bg={C.infoBg} color={C.info}>
                          メンバー
                        </Pill>
                      ) : (
                        <Pill bg={C.card2} color={C.muted} outlined>
                          外部
                        </Pill>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        value={r.send_as}
                        disabled={busy}
                        onChange={(e) =>
                          call("PATCH", {
                            id: r.id,
                            sendAs: e.target.value as SendAs,
                          })
                        }
                        className="rounded-lg px-2 py-1 text-sm"
                        style={inputStyle}
                      >
                        <option value="bcc">Bcc（他に見せない）</option>
                        <option value="to">To（宛先）</option>
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        disabled={busy}
                        onClick={() =>
                          call("PATCH", { id: r.id, enabled: !r.enabled })
                        }
                        className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                        style={
                          r.enabled
                            ? {
                                border: `1px solid ${C.accent}`,
                                background: C.accentSoft,
                                color: C.accentInk,
                              }
                            : { border: `1px solid ${C.line}`, color: C.muted }
                        }
                      >
                        {r.enabled ? "受け取る" : "受け取らない"}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        disabled={busy}
                        onClick={() =>
                          call("DELETE", { id: r.id }, "共有先から外しました。")
                        }
                        className="rounded-lg px-2.5 py-1 text-xs font-bold disabled:opacity-50"
                        style={{ border: `1px solid ${C.danger}`, color: C.danger }}
                      >
                        外す
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* --- add a member --- */}
      <div
        className="mt-3 flex flex-wrap items-end gap-2 rounded-xl p-3"
        style={{ background: C.card2, border: `1px solid ${C.line}` }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[0.72rem] font-bold" style={{ color: C.muted }}>
            メンバーを追加
          </span>
          <select
            value={memberPick}
            onChange={(e) => setMemberPick(e.target.value)}
            disabled={busy || addable.length === 0}
            className="min-w-[220px] rounded-lg px-2 py-1.5 text-sm"
            style={inputStyle}
          >
            <option value="">
              {addable.length ? "選択してください" : "全員が登録済みです"}
            </option>
            {addable.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name?.trim() || m.email || "名前未設定"}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={busy || !memberPick}
          onClick={() =>
            call("POST", { userId: memberPick }, "共有先に追加しました。").then(
              () => setMemberPick(""),
            )
          }
          className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: C.accent }}
        >
          ＋ 追加
        </button>
        <p className="w-full text-[0.72rem]" style={{ color: C.muted }}>
          メンバーのアドレスは入力しません。メンバーマスタの登録内容がそのまま使われるので、
          <b style={{ color: C.ink }}>アドレスが変わっても直す必要がありません</b>。
        </p>
      </div>

      {/* --- add an outside address --- */}
      <div
        className="mt-2 flex flex-wrap items-end gap-2 rounded-xl p-3"
        style={{ background: C.card2, border: `1px solid ${C.line}` }}
      >
        <label className="flex flex-col gap-1">
          <span className="text-[0.72rem] font-bold" style={{ color: C.muted }}>
            外部のメールアドレス
          </span>
          <input
            type="email"
            value={extEmail}
            onChange={(e) => setExtEmail(e.target.value)}
            placeholder="例：team-ml@example.com"
            className="min-w-[240px] rounded-lg px-2 py-1.5 text-sm"
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[0.72rem] font-bold" style={{ color: C.muted }}>
            表示名（任意）
          </span>
          <input
            value={extLabel}
            onChange={(e) => setExtLabel(e.target.value)}
            placeholder="例：チーム全体ML"
            className="min-w-[160px] rounded-lg px-2 py-1.5 text-sm"
            style={inputStyle}
          />
        </label>
        <button
          disabled={busy || !extEmail.trim()}
          onClick={() =>
            call(
              "POST",
              { email: extEmail, label: extLabel },
              "共有先に追加しました。",
            ).then(() => {
              setExtEmail("");
              setExtLabel("");
            })
          }
          className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: C.accent }}
        >
          ＋ 追加
        </button>
        <p className="w-full text-[0.72rem]" style={{ color: C.muted }}>
          メーリングリストや、アプリを使っていない人の宛先はこちらに登録します。
        </p>
      </div>

      <p
        className="mt-3.5 rounded-xl px-3 py-2.5 text-[0.82rem]"
        style={{
          background: C.card2,
          border: `1px dashed ${C.line}`,
          color: C.muted,
        }}
      >
        <b style={{ color: C.ink }}>To と Bcc の違い：</b>
        <b style={{ color: C.ink }}>To</b> は宛先が受信者全員に見えます。
        <b style={{ color: C.ink }}>Bcc</b> は見えません。
        社外の宛先が混ざるときは、アドレスを互いに知らせないために Bcc が無難です（既定は Bcc）。
      </p>

      {/* ---------- schedule ---------- */}
      <h3 className="mb-2 mt-6 text-[0.95rem] font-extrabold">🗓 送信スケジュール</h3>
      <form
        onSubmit={saveSchedule}
        className="rounded-xl p-3"
        style={{ background: C.card2, border: `1px solid ${C.line}` }}
      >
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          自動送信を有効にする
        </label>
        {!enabled && (
          <p className="mt-1 text-[0.78rem]" style={{ color: C.warn }}>
            ⚠ いまは自動送信が止まっています（設定の保存と「今すぐ送信」はできます）。
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[0.72rem] font-bold" style={{ color: C.muted }}>
              頻度
            </span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as MailFrequency)}
              className="rounded-lg px-2 py-1.5 text-sm"
              style={inputStyle}
            >
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
            </select>
          </label>

          {frequency === "weekly" && (
            <label className="flex flex-col gap-1">
              <span className="text-[0.72rem] font-bold" style={{ color: C.muted }}>
                曜日
              </span>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="rounded-lg px-2 py-1.5 text-sm"
                style={inputStyle}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {label}曜日
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="text-[0.72rem] font-bold" style={{ color: C.muted }}>
              送信時刻
            </span>
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-sm"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: C.accent }}
          >
            {saving ? "保存中…" : "保存する"}
          </button>
        </div>
      </form>

      {/* ---------- send by hand ---------- */}
      <h3 className="mb-2 mt-6 text-[0.95rem] font-extrabold">📤 送信</h3>
      <div
        className="flex flex-wrap items-center gap-2 rounded-xl p-3"
        style={{ background: C.card2, border: `1px solid ${C.line}` }}
      >
        <button
          type="button"
          disabled={sending !== null}
          onClick={() => send("test")}
          className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50"
          style={{ border: `1px solid ${C.accent}`, color: C.accentInk }}
        >
          {sending === "test" ? "送信中…" : "テスト送信（自分だけに届く）"}
        </button>
        <button
          type="button"
          disabled={sending !== null}
          onClick={() => send("now")}
          className="rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          style={{ background: C.accent }}
        >
          {sending === "now" ? "送信中…" : "今すぐ送信"}
        </button>
        <p className="w-full text-[0.72rem]" style={{ color: C.muted }}>
          テスト送信はログイン中のあなた宛にだけ届きます。
          <b style={{ color: C.ink }}>「今すぐ送信」は上の共有先全員に届きます</b>
          （実行前に確認が出ます）。
        </p>
      </div>

      {/* ---------- history ---------- */}
      <h3 className="mb-2 mt-6 text-[0.95rem] font-extrabold">🧾 送信履歴</h3>
      <div
        className="rounded-xl p-3"
        style={{ background: C.card2, border: `1px solid ${C.line}` }}
      >
        {logs.length === 0 ? (
          <p className="text-[0.82rem]" style={{ color: C.muted }}>
            まだ送信履歴はありません。
          </p>
        ) : (
          <ul className="flex max-h-72 flex-col overflow-y-auto">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-3 py-2 text-sm"
                style={{ borderBottom: `1px solid ${C.line}` }}
              >
                <div className="min-w-0">
                  <p>
                    {new Date(log.sent_at).toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="truncate text-xs" style={{ color: C.muted }}>
                    {log.recipients || "（宛先不明）"}
                  </p>
                  {log.status === "failed" && log.error && (
                    <p className="truncate text-xs" style={{ color: C.danger }}>
                      {log.error}
                    </p>
                  )}
                </div>
                {log.status === "sent" ? (
                  <Pill bg={C.accentSoft} color={C.accentInk}>
                    送信
                  </Pill>
                ) : (
                  <Pill bg={C.dangerBg} color={C.danger}>
                    失敗
                  </Pill>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
