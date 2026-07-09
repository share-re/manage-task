"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null); // コピー済みの吹き出し

  // 自動スクロール用。ユーザーが上に遡っているときは追従しない。
  const listRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  function onListScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }
  useEffect(() => {
    const el = listRef.current;
    if (el && nearBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  // 返答をクリップボードにコピー（HTTPS / localhost でのみ動く）。
  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(i);
      setTimeout(() => setCopiedIdx((c) => (c === i ? null : c)), 1500);
    } catch {
      setError("コピーできませんでした。");
    }
  }

  // コピー用の小さなアイコンボタン（自分の問い・AIの返答の両方で使う）。
  // コピー前は「重なった四角」、コピー後は「チェック」を緑で表示。
  const copyButton = (text: string, i: number) => (
    <button
      type="button"
      onClick={() => copy(text, i)}
      aria-label={copiedIdx === i ? "コピーしました" : "コピー"}
      title="コピー"
      className={
        "mt-1 rounded p-1 transition " +
        (copiedIdx === i ? "text-green-600" : "text-zinc-400 hover:text-zinc-600")
      }
    >
      {copiedIdx === i ? (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );

  // 送信本体（送信ボタン・Enterキーの両方から呼ぶ）。
  async function send() {
    const text = input.trim();
    if (!text || loading) return; // 空・返答待ちのときは何もしない

    setError(undefined);
    // サーバに渡す履歴は「今回の発言を含まない、これまでのやりとり」。
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput(""); // いったん空に（失敗したら下で戻す）
    setLoading(true);

    // 失敗時に「送った吹き出しを消して、入力欄に文を戻す」ための後始末。
    const revert = () => {
      setMessages((prev) =>
        prev[prev.length - 1]?.role === "user" && prev[prev.length - 1]?.text === text
          ? prev.slice(0, -1)
          : prev,
      );
      setInput(text);
    };

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, userName }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "エラーが発生しました。");
        revert();
        return;
      }

      // 成功時は本文が「少しずつ届くストリーム」。
      // 届いた文字は acc に貯め、画面へは "タイプライター" で少しずつ出す。
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = ""; // サーバから届いた全文
      let streamDone = false; // 受信が終わったか
      let shown = 0; // 画面に出し終えた文字数（コードポイント単位）
      let started = false; // AIの吹き出しをもう足したか

      // 表示を進める非同期ループ。残り文字が多いほど速く、少ないほど1文字ずつ。
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const typer = (async () => {
        const INTERVAL = 70; // 1コマの間隔(ms)。大きいほどゆっくり打つ
        while (true) {
          const glyphs = Array.from(acc); // 日本語や絵文字も1文字として扱う
          const total = glyphs.length;
          if (shown < total) {
            shown = Math.min(
              total,
              shown + Math.max(1, Math.ceil((total - shown) / 12)),
            );
            const out = glyphs.slice(0, shown).join("");
            if (!started) {
              started = true;
              setMessages((prev) => [...prev, { role: "model", text: out }]);
            } else {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "model", text: out };
                return copy;
              });
            }
          } else if (streamDone) {
            break;
          }
          await sleep(INTERVAL);
        }
      })();

      // 受信ループ：届いた分を acc に足すだけ（表示は typer が担当）。
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      streamDone = true;
      await typer;

      if (!started) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "（応答がありませんでした）" },
        ]);
      }
    } catch {
      setError("通信に失敗しました。ネットワークを確認してください。");
      revert();
    } finally {
      setLoading(false);
    }
  }

  // textarea のキー操作：Shift+Enterで送信、Enterは改行（そのまま）。
  // 日本語変換中（isComposing）のEnterは確定用なので送信しない。
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    // このページだけ常にライト表示に固定（OSがダークでも反転させない）。
    <div
      className="min-h-screen bg-white text-zinc-900"
      style={{ colorScheme: "light" }}
    >
      <main className="mx-auto flex h-screen w-full max-w-2xl flex-col px-4 py-6">
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

      {/* 会話エリア（ここだけスクロール） */}
      <div
        ref={listRef}
        onScroll={onListScroll}
        className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl bg-zinc-50 p-4 ring-1 ring-black/5"
      >
        {messages.length === 0 && (
          <p className="m-auto text-sm text-zinc-400">
            気軽に相談してみましょう。「今どんな感じ？」から話しかけてくれてもOKです。
          </p>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex flex-col items-end">
              <span className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-green-700 px-4 py-2 text-sm text-white">
                {m.text}
              </span>
              {copyButton(m.text, i)}
            </div>
          ) : (
            <div key={i} className="flex flex-col items-start">
              {/* Markdownを描画（生HTMLは描画しないので安全）。要素ごとの見た目はTailwindで指定。 */}
              <div className="max-w-[80%] rounded-2xl bg-white px-4 py-2 text-sm text-zinc-900 ring-1 ring-black/5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-green-700 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
                <Markdown remarkPlugins={[remarkGfm]}>{m.text}</Markdown>
              </div>
              {/* コピー ボタン（アイコン） */}
              {copyButton(m.text, i)}
            </div>
          ),
        )}

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

      {/* 入力欄（Enterで送信 / Shift+Enterで改行） */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-3 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          rows={1}
          placeholder="メッセージを入力…（Shift+Enterで送信）"
          className="max-h-32 flex-1 resize-none rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-zinc-100"
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
    </div>
  );
}
