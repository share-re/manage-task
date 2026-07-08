"use client";

import { useEffect, useRef, useState } from "react";

// 内田さん is a stationary NPC in the office; talking to them happens here.
//
// Replies come from the real assistant at POST /api/assistant (Gemini, PR #6) —
// a streaming text/plain response. If that route is absent (PR #6 not merged) or
// errors (e.g. GEMINI_API_KEY unset), we fall back to the rule-based replies so
// the office always works. Once PR #6 lands on main and the key is set, real AI
// turns on automatically with no further change here.

type Msg = { from: "me" | "ai"; text: string };

const RULES: [RegExp, string][] = [
  [/エラー|error|例外/i, "まずエラーメッセージの最後の1行までよく読もう。「どのファイルの何行目か」が必ず出ているよ。そこを見てから、メッセージをそのまま検索するのが近道。"],
  [/supabase|同期|リアルタイム|realtime/i, "Realtime同期は「①自分の座標を送る → ②他人の座標を受け取って描く」の2段階に分けて考えよう。まず①だけ作って、console.logで届いてるか確認！"],
  [/表示|映らない|動かない|白い|真っ暗/i, "F12でConsoleを開いてみて。赤いエラーは出てない？出ていたらその1行目を教えて。何も無ければ描画が呼ばれてるかlogを仕込もう。"],
  [/デプロイ|vercel|公開/i, "VercelはGitHubにpushするだけで自動デプロイされるよ。環境変数の設定を忘れずにね。"],
  [/進捗|終わらない|間に合わ|不安/i, "焦らなくて大丈夫。今日のゴールを1つに絞ろう。15分考えて解けなければ、すぐ私に聞いてOK。それが一番速いよ☕"],
  [/タスク|task/i, "タスクはこのオフィスの「📋 タスク」から完了にできるよ。完了が増えるほどオフィスが森に育つ🌳"],
];
const DEFAULTS = [
  "いい質問だね。まず「期待する動き」と「実際の動き」を1行ずつ書き出してみよう。差分が原因のヒントだよ。",
  "処理を小さく分けて、どこまで動いているかconsole.logで確認してみよう。半分ずつ絞ると速いよ。",
  "一度深呼吸☕ 問題を声に出して説明してみて。案外そこで自分で気づけるものだよ。",
];

function ruleReply(q: string, n: number): string {
  const hit = RULES.find(([re]) => re.test(q));
  return hit ? hit[1] : DEFAULTS[n % DEFAULTS.length];
}

export default function ChatPanel({
  userName,
  onClose,
}: {
  userName: string;
  onClose: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "こんにちは！AIメンターの内田です。研修で詰まったら何でも聞いてね💡" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const countRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);

    // History for the API starts at the first user turn (Gemini rejects a
    // history that begins with a model turn, e.g. our greeting).
    const firstMe = msgs.findIndex((m) => m.from === "me");
    const history =
      firstMe === -1
        ? []
        : msgs.slice(firstMe).map((m) => ({
            role: m.from === "me" ? "user" : "model",
            text: m.text,
          }));

    setMsgs((m) => [...m, { from: "me", text: q }]);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, history, userName }),
      });
      const ct = res.headers.get("Content-Type") ?? "";
      if (!res.ok || !res.body || !ct.startsWith("text/plain")) {
        throw new Error("assistant unavailable");
      }
      // Stream the reply into a growing "ai" message.
      setMsgs((m) => [...m, { from: "ai", text: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { from: "ai", text: acc };
          return copy;
        });
      }
      if (!acc.trim()) {
        setMsgs((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { from: "ai", text: ruleReply(q, countRef.current++) };
          return copy;
        });
      }
    } catch {
      // Fall back to a rule-based reply so the office is never dead.
      const ans = ruleReply(q, countRef.current++);
      setMsgs((m) => [...m, { from: "ai", text: ans }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-auto flex max-h-[70vh] w-80 flex-col rounded-2xl bg-white/90 p-4 shadow-md ring-1 ring-black/5 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-emerald-800">🤖 AI内田さんに相談</h2>
        <button onClick={onClose} aria-label="閉じる" className="rounded px-2 py-0.5 text-zinc-500 hover:bg-zinc-100">×</button>
      </div>
      <div ref={logRef} className="mb-2 flex max-h-[46vh] flex-col gap-2 overflow-y-auto">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.from === "ai"
                ? "self-start rounded-xl bg-emerald-50 px-3 py-2 text-sm text-zinc-800 ring-1 ring-emerald-100"
                : "self-end rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-800"
            }
          >
            {m.text || "…"}
          </div>
        ))}
      </div>
      <form onSubmit={send} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="困ったことを聞いてみよう…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "…" : "送信"}
        </button>
      </form>
    </div>
  );
}
