"use client";

import { useEffect, useRef, useState } from "react";

// A message in the office room chat. `ai` marks 内田さん's auto/《@AI》 replies.
export type RoomMsg = { id: string; name: string; text: string; ts: number; ai?: boolean };

// Ephemeral group chat for everyone currently in the office. Messages arrive via
// Realtime broadcast (see page.tsx) — nothing is persisted. This component is the
// view only: the channel, history and AI triggering live in the page.
export default function RoomChatPanel({
  messages,
  selfName,
  onSend,
  onClose,
}: {
  messages: RoomMsg[];
  selfName: string;
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    onSend(t);
    setInput("");
  }

  return (
    <div className="pointer-events-auto flex max-h-[70vh] w-80 flex-col rounded-2xl bg-white/90 p-4 shadow-md ring-1 ring-black/5 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold text-emerald-800">💬 みんなのチャット</h2>
        <button onClick={onClose} aria-label="閉じる" className="rounded px-2 py-0.5 text-zinc-500 hover:bg-zinc-100">×</button>
      </div>
      <div ref={logRef} className="mb-2 flex max-h-[46vh] flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="px-1 py-2 text-xs text-zinc-400">
            まだ発言はありません。オフィスにいるみんなに話しかけてみよう。<br />
            <span className="text-emerald-700">@AI</span> で内田さんも呼べます。
          </p>
        )}
        {messages.map((m) => {
          const mine = !m.ai && m.name === selfName;
          return (
            <div key={m.id} className={mine ? "self-end" : "self-start"}>
              <span className={`mb-0.5 block text-[10px] ${m.ai ? "text-emerald-700" : "text-zinc-400"} ${mine ? "text-right" : ""}`}>
                {m.ai ? "🤖 内田さん" : m.name}
              </span>
              <div
                className={
                  m.ai
                    ? "rounded-xl bg-emerald-50 px-3 py-2 text-sm text-zinc-800 ring-1 ring-emerald-100"
                    : mine
                      ? "rounded-xl bg-zinc-100 px-3 py-2 text-sm text-zinc-800"
                      : "rounded-xl bg-white px-3 py-2 text-sm text-zinc-800 ring-1 ring-zinc-200"
                }
              >
                {m.text}
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージ…（@AI で内田さん）"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <button type="submit" className="rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600">
          送信
        </button>
      </form>
    </div>
  );
}
