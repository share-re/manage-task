"use client";

import { useEffect, useRef, useState } from "react";

// 内田さん is a stationary NPC in the office; talking to them happens here.
//
// Replies are rule-based for now so this works self-contained. To use the real
// AI, merge the assistant feature (PR #6, Gemini) and set GEMINI_API_KEY, then
// point `reply()` at POST /api/assistant instead of the local rules below.

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

function reply(q: string, n: number): string {
  const hit = RULES.find(([re]) => re.test(q));
  return hit ? hit[1] : DEFAULTS[n % DEFAULTS.length];
}

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "ai", text: "こんにちは！AIメンターの内田です。研修で詰まったら何でも聞いてね💡" },
  ]);
  const [input, setInput] = useState("");
  const countRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [msgs]);

  function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { from: "me", text: q }]);
    const ans = reply(q, countRef.current++);
    window.setTimeout(() => setMsgs((m) => [...m, { from: "ai", text: ans }]), 500);
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
            {m.text}
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
        <button type="submit" className="rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">送信</button>
      </form>
      <p className="mt-2 text-[11px] text-zinc-400">
        ※現在はルールベース応答。実AI（Gemini/PR #6）に差し替え予定。
      </p>
    </div>
  );
}
