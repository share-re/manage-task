"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

// 会話1件分。role は "user"（自分）か "model"（AI内田さん）。
type Msg = { role: "user" | "model"; text: string };

export default function AssistantPage() {
  const { session } = useAuth();
  // ログイン中の名前。表示名が無ければメールの@より前を名前代わりに使う。
  const metaName = session?.user.user_metadata?.name as string | undefined;
  const email = session?.user.email;
  const userName = metaName ?? (email ? email.split("@")[0] : "");

  const [messages, setMessages] = useState<Msg[]>([]); // これまでの会話
  const [input, setInput] = useState(""); // 入力欄の文字
  const [loading, setLoading] = useState(false); // 返答待ちかどうか
  const [error, setError] = useState<string>(); // エラー文言

  // 送信（Enter か 送信ボタンで呼ばれる）
  async function send(e: React.FormEvent) {
    e.preventDefault(); // フォーム送信でページが再読み込みされるのを止める
    const text = input.trim();
    if (!text || loading) return; // 空・返答待ちのときは何もしない

    setError(undefined);
    // サーバに渡す履歴は「今回の発言を含まない、これまでのやりとり」。
    // （state更新は非同期なので、この時点の messages はまだ古い＝ちょうど良い）
    const history = messages;
    // 画面には自分の発言をすぐ出す
    const userMsg: Msg = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, userName }),
      });

      // エラー時はJSONで返ってくる。読んで表示して終わり。
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "エラーが発生しました。");
        return;
      }

      // 成功時は本文が「少しずつ届くストリーム」。届いた分をAIの吹き出しに足していく。
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = ""; // ここまでに届いた全文
      let started = false; // AIの吹き出しをもう足したか
      while (true) {
        const { done, value } = await reader.read();
        if (done) break; // これ以上届かない＝完了
        acc += decoder.decode(value, { stream: true });
        if (!started) {
          // 最初のかたまりが来たら、AIの吹き出しを新しく1つ足す
          started = true;
          setMessages((prev) => [...prev, { role: "model", text: acc }]);
        } else {
          // 2回目以降は、最後の吹き出しの中身を最新の全文に差し替える
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { role: "model", text: acc };
            return copy;
          });
        }
      }
      // 一文字も返らなかったとき
      if (!started) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "（応答がありませんでした）" },
        ]);
      }
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
      {/* ヘッダー */}
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">🤖 AI内田さん</h1>
          <p className="text-xs text-zinc-500">
            内田さんをモデルにしたAIです（本人ではありません）
          </p>
        </div>
        <Link href="/" className="text-sm text-zinc-600 underline">
          ← トップ
        </Link>
      </header>

      {/* 会話エリア */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl bg-zinc-50 p-4 ring-1 ring-black/5">
        {messages.length === 0 && (
          <p className="m-auto text-sm text-zinc-400">
            気軽に相談してみましょう。「今どんな感じ？」から話しかけてくれてもOKです。
          </p>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <span
              className={
                "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm " +
                (m.role === "user"
                  ? "bg-green-700 text-white"
                  : "bg-white text-zinc-900 ring-1 ring-black/5")
              }
            >
              {m.text}
            </span>
          </div>
        ))}

        {/* 返答待ちの表示（AIの吹き出しが出るまでの間だけ） */}
        {loading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <span className="rounded-2xl bg-white px-4 py-2 text-sm text-zinc-400 ring-1 ring-black/5">
              考え中…
            </span>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* 入力欄 */}
      <form onSubmit={send} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-green-700 px-5 py-2 font-medium text-white transition hover:bg-green-800 disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </main>
  );
}
