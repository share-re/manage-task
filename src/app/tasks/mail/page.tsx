"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  getEmailSettings,
  saveEmailSettings,
  WEEKDAY_LABELS,
  type MailFrequency,
} from "@/lib/emailSettings";
import { listSendLog, type SendLog } from "@/lib/sendLog";

export default function MailSettingsPage() {
  const { session } = useAuth();

  const [settingsId, setSettingsId] = useState<string>();
  const [toRecipients, setToRecipients] = useState("");
  const [bccRecipients, setBccRecipients] = useState("");
  const [frequency, setFrequency] = useState<MailFrequency>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Monday
  const [sendTime, setSendTime] = useState("09:00");
  const [enabled, setEnabled] = useState(true);

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  // Test send: always to the logged-in user's own address.
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string>();
  const [testError, setTestError] = useState<string>();

  // Send now: send the summary to the saved recipients immediately.
  const [sendingNow, setSendingNow] = useState(false);
  const [nowMessage, setNowMessage] = useState<string>();
  const [nowError, setNowError] = useState<string>();

  // Send history.
  const [logs, setLogs] = useState<SendLog[]>([]);

  async function onTestSend() {
    const target = session?.user.email;
    const token = session?.access_token;
    setTestMessage(undefined);
    setTestError(undefined);
    if (!target || !token) {
      setTestError(
        "ログイン状態を確認できませんでした。ページを再読み込みしてからお試しください。",
      );
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/send-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testRecipient: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました。");
      setTestMessage(`テスト送信しました：${(data.sentTo ?? []).join(", ")}`);
    } catch (err) {
      console.error(err);
      setTestError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setTesting(false);
    }
  }

  async function onSendNow() {
    setNowMessage(undefined);
    setNowError(undefined);
    const token = session?.access_token;
    if (!token) {
      setNowError(
        "ログイン状態を確認できませんでした。ページを再読み込みしてからお試しください。",
      );
      return;
    }
    if (
      !window.confirm(
        "保存済みの送信先へ、進捗サマリを今すぐ送信します。よろしいですか？",
      )
    )
      return;
    setSendingNow(true);
    try {
      const res = await fetch("/api/send-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // No testRecipient / no scheduled -> send to the saved recipients now.
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "送信に失敗しました。");
      setNowMessage(`送信しました：${(data.sentTo ?? []).join(", ")}`);
    } catch (err) {
      console.error(err);
      setNowError(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setSendingNow(false);
    }
  }

  useEffect(() => {
    getEmailSettings()
      .then((s) => {
        if (!s) return;
        setSettingsId(s.id);
        // Prefer the new To/Bcc fields; fall back to the legacy single field.
        if (s.to_recipients || s.bcc_recipients) {
          setToRecipients(s.to_recipients ?? "");
          setBccRecipients(s.bcc_recipients ?? "");
        } else if (s.recipients) {
          setBccRecipients(s.recipients);
        }
        setFrequency(s.frequency);
        setDayOfWeek(s.day_of_week ?? 1);
        setSendTime(s.send_time.slice(0, 5)); // "HH:MM:SS" -> "HH:MM"
        setEnabled(s.enabled);
      })
      .catch((err) => {
        console.error(err);
        setError("設定の読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));

    // Load recent send history (optional; missing table shouldn't break the page).
    listSendLog(10)
      .then(setLogs)
      .catch((err) => console.error("送信履歴の読み込みに失敗:", err));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const saved = await saveEmailSettings(
        {
          toRecipients: toRecipients.trim(),
          bccRecipients: bccRecipients.trim(),
          frequency,
          dayOfWeek: frequency === "weekly" ? dayOfWeek : null,
          sendTime,
          enabled,
        },
        settingsId,
      );
      setSettingsId(saved.id); // keep id so the next save updates the same row
      setMessage("設定を保存しました。");
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1" style={{ background: "#EAF3FB" }}>
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Sky hero header (森テーマ：流れる雲・揺れる太陽・蝶) */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
        style={{ background: "linear-gradient(180deg, #CDE4FA, #EAF3FB)" }}
      >
        <style>{`
          @keyframes mailDrift { from { transform: translateX(-50px); } to { transform: translateX(560px); } }
          @keyframes mailBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
          @keyframes mailFly {
            0% { left: -18px; transform: translateY(0); }
            25% { transform: translateY(-9px); }
            50% { transform: translateY(4px); }
            75% { transform: translateY(-6px); }
            100% { left: 104%; transform: translateY(0); }
          }
        `}</style>
        <div
          className="absolute"
          style={{ top: 16, right: 30, width: 24, height: 24, borderRadius: "50%", background: "#FBD96B", animation: "mailBob 5s ease-in-out infinite" }}
        />
        <div
          className="absolute"
          style={{ top: 18, height: 12, width: 40, borderRadius: 20, background: "rgba(255,255,255,0.85)", animation: "mailDrift 34s linear infinite" }}
        />
        <div
          className="absolute"
          style={{ top: 46, height: 10, width: 30, borderRadius: 20, background: "rgba(255,255,255,0.7)", animation: "mailDrift 48s linear infinite", animationDelay: "-12s" }}
        />
        <div
          className="absolute text-sm"
          style={{ top: 40, color: "#7C4DBD", animation: "mailFly 18s linear infinite" }}
          aria-hidden="true"
        >
          <i className="ti ti-butterfly" />
        </div>

        <div className="relative px-5 pb-7 pt-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "#173404" }}>
              メール共有の設定
            </h1>
            <Link
              href="/tasks"
              className="text-sm hover:underline"
              style={{ color: "#3B6D11" }}
            >
              ← 進捗管理に戻る
            </Link>
          </div>
          <p className="mt-1 text-sm" style={{ color: "#2f5a2a" }}>
            進捗サマリを定期的にメール送信するための設定です。送信先・頻度・時刻にしたがって、
            「自動送信を有効にする」がオンの間、自動で送られます。
          </p>
          <button
            type="button"
            onClick={onTestSend}
            disabled={testing || !session?.user.email}
            title="自分のメールアドレス宛てに1通送って確認します"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#C0DD97] bg-white px-3 py-1.5 text-sm font-medium text-[#3B6D11] transition hover:bg-[#EAF3DE] disabled:opacity-50"
          >
            {testing ? "送信中…" : "テスト送信"}
          </button>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 h-2.5"
          style={{ background: "repeating-linear-gradient(90deg,#9CC65A 0 7px,#8FBF3F 7px 14px)" }}
        />
      </div>

      {testError && <p className="mb-2 text-sm text-red-600">{testError}</p>}
      {testMessage && <p className="mb-2 text-sm text-green-700">{testMessage}</p>}

      {!loaded ? (
        <p className="text-sm text-zinc-400">読み込み中…</p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5"
        >
          {/* Enabled toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#3B6D11]"
              />
              <span className="text-sm font-medium text-zinc-700">
                自動送信を有効にする
              </span>
            </label>
            {!enabled && (
              <p className="mt-1 text-sm text-amber-600">
                ⚠ 現在、自動送信は停止中です（設定は保存できます）。
              </p>
            )}
          </div>

          {/* Recipients: To / Bcc */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              To（宛先・複数はカンマ区切り）
            </span>
            <input
              type="text"
              value={toRecipients}
              onChange={(e) => setToRecipients(e.target.value)}
              placeholder="例：leader@example.com"
              className="rounded-lg border border-[#DCE9F5] px-3 py-2 text-zinc-900 outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#EAF3DE]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              Bcc（他の宛先に見せない・複数はカンマ区切り）
            </span>
            <input
              type="text"
              value={bccRecipients}
              onChange={(e) => setBccRecipients(e.target.value)}
              placeholder="例：member1@example.com, member2@example.com"
              className="rounded-lg border border-[#DCE9F5] px-3 py-2 text-zinc-900 outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#EAF3DE]"
            />
            <span className="text-xs text-zinc-400">
              To を空にして Bcc だけにすると、受信者同士にアドレスが見えません。
            </span>
          </label>

          {/* Frequency */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">頻度</span>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as MailFrequency)}
              className="rounded-lg border border-[#DCE9F5] px-3 py-2 text-zinc-900 outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#EAF3DE]"
            >
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
            </select>
          </label>

          {/* Day of week (weekly only) */}
          {frequency === "weekly" && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">曜日</span>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="rounded-lg border border-[#DCE9F5] px-3 py-2 text-zinc-900 outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#EAF3DE]"
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={i} value={i}>
                    {label}曜日
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Send time */}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">送信時刻</span>
            <input
              type="time"
              value={sendTime}
              onChange={(e) => setSendTime(e.target.value)}
              className="w-40 rounded-lg border border-[#DCE9F5] px-3 py-2 text-zinc-900 outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#EAF3DE]"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-lg bg-[#3B6D11] px-5 py-2 font-medium text-white transition hover:bg-[#2f5a0e] disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存する"}
          </button>
        </form>
      )}


      {/* Send now: send to the saved recipients immediately (no schedule wait). */}
      {loaded && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-[#173404]">今すぐ送信</h2>
          <p className="mt-1 text-sm text-zinc-500">
            スケジュールを待たず、<strong>保存済みの送信先</strong>
            へ進捗サマリを今すぐ送ります。宛先を変えた場合は先に「保存する」を押してください。
          </p>
          <button
            type="button"
            onClick={onSendNow}
            disabled={sendingNow}
            className="mt-3 rounded-lg bg-[#3B6D11] px-5 py-2 font-medium text-white transition hover:bg-[#2f5a0e] disabled:opacity-50"
          >
            {sendingNow ? "送信中…" : "今すぐ送信"}
          </button>
          {nowError && <p className="mt-2 text-sm text-red-600">{nowError}</p>}
          {nowMessage && (
            <p className="mt-2 text-sm text-green-700">{nowMessage}</p>
          )}
        </div>
      )}

      {/* Send history */}
      {loaded && (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-md ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-[#173404]">送信履歴</h2>
          {logs.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-400">
              まだ送信履歴はありません。
            </p>
          ) : (
            <ul className="mt-3 flex flex-col divide-y divide-zinc-100">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start justify-between gap-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="text-zinc-800">
                      {new Date(log.sent_at).toLocaleString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {log.recipients || "（宛先不明）"}
                    </p>
                    {log.status === "failed" && log.error && (
                      <p className="truncate text-xs text-red-600">
                        {log.error}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === "sent"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {log.status === "sent" ? "送信成功" : "失敗"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      </main>
    </div>
  );
}
