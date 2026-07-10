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
  const abortRef = useRef<AbortController | null>(null); // 生成中のリクエストを止める用

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
        (copiedIdx === i ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-600")
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

    // 生成中のリクエストを止められるようにする（停止ボタン用）。
    const controller = new AbortController();
    abortRef.current = controller;

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
        signal: controller.signal,
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
      // 停止ボタンで中断された場合は、正常な停止として扱う（エラーにしない）。
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
        }
      } catch (err) {
        if (!controller.signal.aborted) throw err; // 本物のエラーは外の catch へ
      }
      streamDone = true; // ここまで受信した分を typer が出し切って終わる
      await typer;

      // 停止で中断したときは「応答なし」を出さない。
      if (!started && !controller.signal.aborted) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: "（応答がありませんでした）" },
        ]);
      }
    } catch {
      // 停止ボタンによる中断はエラー扱いしない（受信済みの分はそのまま残す）。
      if (!controller.signal.aborted) {
        setError("通信に失敗しました。ネットワークを確認してください。");
        revert();
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // 生成を途中で止める（停止ボタン）。受信済みの文章はそのまま残す。
  function stop() {
    abortRef.current?.abort();
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
      className="relative min-h-screen text-zinc-900"
      style={{ colorScheme: "light" }}
    >
      {/* 植林（/forest）トーンの背景。装飾なので操作対象から外す（aria-hidden / pointer-events-none）。 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* アニメーション定義：雲の漂い・木の揺れ・鳥の飛行/上下/羽ばたき・蝶のひらひら/羽ばたき。
            端末が「動きを減らす」設定なら .anim のアニメを止める（体調・酔い対策）。 */}
        <style>{`
          @keyframes floatCloud { 0%,100% { transform: translateX(0); } 50% { transform: translateX(24px); } }
          @keyframes sway { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
          @keyframes flyAcross { 0% { transform: translate(-10vw,0); } 100% { transform: translate(110vw,0); } }
          @keyframes flyAcross2 { 0% { transform: translate(110vw,0) scaleX(-1); } 100% { transform: translate(-10vw,0) scaleX(-1); } }
          @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
          @keyframes flap { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(.4); } }
          @keyframes flutter { 0% { transform: translate(0,0) rotate(0deg); } 25% { transform: translate(30px,-24px) rotate(8deg); } 50% { transform: translate(64px,6px) rotate(-6deg); } 75% { transform: translate(30px,26px) rotate(6deg); } 100% { transform: translate(0,0) rotate(0deg); } }
          @keyframes flutter2 { 0% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(-40px,20px) rotate(-8deg); } 66% { transform: translate(-70px,-18px) rotate(8deg); } 100% { transform: translate(0,0) rotate(0deg); } }
          @keyframes wingL { 0%,100% { transform: rotateY(0deg); } 50% { transform: rotateY(70deg); } }
          @keyframes wingR { 0%,100% { transform: rotateY(0deg); } 50% { transform: rotateY(-70deg); } }
          @media (prefers-reduced-motion: reduce) { .anim { animation: none !important; } }
        `}</style>

        {/* 空のグラデーション（上=空色 → 下=緑） */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-green-200" />

        {/* 太陽（右上でぼんやり光る） */}
        <div
          className="absolute h-24 w-24 rounded-full"
          style={{
            top: "6%",
            right: "6%",
            background:
              "radial-gradient(circle at 40% 40%, #fef9c3, #fde047 70%, #facc15)",
            boxShadow: "0 0 60px 20px rgba(250, 204, 21, 0.35)",
          }}
        />

        {/* 雲（ゆっくり左右に漂う） */}
        {[
          { top: "9%", left: "9%", w: 112, h: 36, dur: 13, delay: 0 },
          { top: "17%", left: "26%", w: 80, h: 28, dur: 17, delay: 2 },
          { top: "7%", left: "44%", w: 96, h: 30, dur: 15, delay: 1 },
          { top: "13%", left: "72%", w: 88, h: 30, dur: 19, delay: 3 },
        ].map((c, i) => (
          <div
            key={i}
            className="anim absolute rounded-full bg-white/85 blur-[1px]"
            style={{
              top: c.top,
              left: c.left,
              width: c.w,
              height: c.h,
              animation: `floatCloud ${c.dur}s ease-in-out infinite ${c.delay}s`,
            }}
          />
        ))}

        {/* 鳥（画面を横切る。上下に揺れつつ羽ばたく。rtl=trueは右→左） */}
        {[
          { top: 120, size: 34, color: "#3f3f46", dur: 26, delay: 0, bob: 3, flap: 0.5, rtl: false },
          { top: 180, size: 26, color: "#52525b", dur: 34, delay: 4, bob: 3.6, flap: 0.6, rtl: false },
          { top: 220, size: 22, color: "#71717a", dur: 40, delay: 8, bob: 4, flap: 0.55, rtl: true },
        ].map((b, i) => (
          <div
            key={i}
            className="anim absolute"
            style={{
              top: b.top,
              left: b.rtl ? undefined : 0,
              right: b.rtl ? 0 : undefined,
              animation: `${b.rtl ? "flyAcross2" : "flyAcross"} ${b.dur}s linear infinite ${b.delay}s`,
            }}
          >
            <div className="anim" style={{ animation: `bob ${b.bob}s ease-in-out infinite` }}>
              <svg
                viewBox="0 0 40 20"
                width={b.size}
                height={b.size / 2}
                style={{ color: b.color }}
              >
                <path
                  d="M2 12 Q10 2 20 12 Q30 2 38 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  className="anim"
                  style={{ transformOrigin: "center", animation: `flap ${b.flap}s ease-in-out infinite` }}
                />
              </svg>
            </div>
          </div>
        ))}

        {/* 奥の丘（薄い緑・高め）：奥行きを出しつつ、空の余白を減らす */}
        <div
          className="absolute inset-x-0 bottom-0 h-[34vh] bg-gradient-to-b from-green-200 to-green-300"
          style={{ borderRadius: "50% 50% 0 0 / 90px 90px 0 0" }}
        />
        {/* 手前の丘（濃い緑・全幅） */}
        <div
          className="absolute inset-x-0 bottom-0 h-[26vh] bg-gradient-to-b from-green-300 to-green-400"
          style={{ borderRadius: "50% 50% 0 0 / 56px 56px 0 0" }}
        />

        {/* 草の質感（最下部の細い縦じま） */}
        <div
          className="absolute inset-x-0 bottom-0 h-12"
          style={{
            background:
              "repeating-linear-gradient(90deg, transparent 0 14px, rgba(21,128,61,0.35) 14px 16px)",
          }}
        />

        {/* 茂み（丘の裾を埋める小さな緑のかたまり） */}
        {[
          { left: "3%", w: 72, h: 38 },
          { left: "12%", w: 54, h: 30 },
          { left: "21%", w: 84, h: 42 },
          { left: "31%", w: 58, h: 32 },
          { left: "64%", w: 64, h: 34 },
          { left: "72%", w: 90, h: 44 },
          { left: "81%", w: 56, h: 30 },
          { left: "89%", w: 76, h: 40 },
          { left: "96%", w: 60, h: 32 },
        ].map((b, i) => (
          <div
            key={`bush-${i}`}
            className="absolute rounded-[50%] bg-green-500/90"
            style={{ bottom: "20vh", left: b.left, width: b.w, height: b.h }}
          />
        ))}

        {/* 木（大きめ＆多め。左右の空きをしっかり埋める。葉がゆっくり揺れる） */}
        {[
          { bottom: "22vh", left: "1%", leaf: 92, trunk: 42 },
          { bottom: "18vh", left: "8%", leaf: 66, trunk: 30 },
          { bottom: "24vh", left: "15%", leaf: 118, trunk: 50 },
          { bottom: "17vh", left: "23%", leaf: 58, trunk: 26 },
          { bottom: "24vh", left: "74%", leaf: 112, trunk: 48 },
          { bottom: "18vh", left: "83%", leaf: 70, trunk: 32 },
          { bottom: "22vh", left: "90%", leaf: 96, trunk: 42 },
          { bottom: "17vh", left: "96%", leaf: 56, trunk: 24 },
        ].map((t, i) => (
          <div
            key={`tree-${i}`}
            className="absolute flex flex-col items-center"
            style={{ bottom: t.bottom, left: t.left }}
          >
            <div
              className="anim rounded-full bg-green-600"
              style={{
                width: t.leaf,
                height: t.leaf,
                transformOrigin: "bottom center",
                animation: `sway ${4 + (i % 4)}s ease-in-out infinite`,
              }}
            />
            <div
              className="-mt-1 rounded-sm bg-amber-800"
              style={{ width: Math.max(8, Math.round(t.leaf / 8)), height: t.trunk }}
            />
          </div>
        ))}

        {/* 蝶（丘のあたりをひらひら。左右の羽が羽ばたく） */}
        {[
          { bottom: 160, left: "18%", right: undefined, dur: 9, delay: 0, w: 12, h: 16, wing: 0.35, from: "#fb923c", to: "#f97316", flut: "flutter" },
          { bottom: 200, left: undefined, right: "26%", dur: 11, delay: 0, w: 11, h: 15, wing: 0.4, from: "#a3e635", to: "#65a30d", flut: "flutter2" },
          { bottom: 130, left: "52%", right: undefined, dur: 13, delay: 2, w: 10, h: 13, wing: 0.3, from: "#fcd34d", to: "#f59e0b", flut: "flutter" },
        ].map((bf, i) => (
          <div
            key={i}
            className="anim absolute"
            style={{
              bottom: bf.bottom,
              left: bf.left,
              right: bf.right,
              animation: `${bf.flut} ${bf.dur}s ease-in-out infinite ${bf.delay}s`,
            }}
          >
            <div className="flex" style={{ perspective: 120 }}>
              <div
                className="anim"
                style={{
                  width: bf.w,
                  height: bf.h,
                  borderRadius: "60% 20% 60% 20%",
                  background: `linear-gradient(135deg, ${bf.from}, ${bf.to})`,
                  transformOrigin: "right center",
                  animation: `wingL ${bf.wing}s ease-in-out infinite`,
                }}
              />
              <div
                className="anim"
                style={{
                  width: bf.w,
                  height: bf.h,
                  borderRadius: "20% 60% 20% 60%",
                  background: `linear-gradient(225deg, ${bf.from}, ${bf.to})`,
                  transformOrigin: "left center",
                  animation: `wingR ${bf.wing}s ease-in-out infinite`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <main className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-2xl flex-col px-4 py-6">
      {/* ヘッダー（白い半透明カード） */}
      <header className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
        <div className="flex items-center gap-3">
          {/* 芽のアバター */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg">
            🌱
          </div>
          <div>
            <h1 className="text-lg font-bold text-emerald-800">AI内田さん</h1>
            <p className="text-xs text-emerald-700/70">
              内田さんをモデルにしたAIです（本人ではありません）
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="whitespace-nowrap rounded-lg bg-white/70 px-3 py-1 text-sm text-emerald-700 ring-1 ring-emerald-600/20 transition hover:bg-white"
        >
          ← トップ
        </Link>
      </header>

      {/* 会話エリア（ここだけスクロール） */}
      <div
        ref={listRef}
        onScroll={onListScroll}
        className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl bg-white/70 p-4 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.28)] ring-1 ring-black/5 backdrop-blur"
      >
        {messages.length === 0 && (
          <p className="m-auto text-sm text-emerald-800/60">
            気軽に相談してみましょう。「今どんな感じ？」から話しかけてくれてもOKです。
          </p>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex flex-col items-end">
              <span className="max-w-[80%] whitespace-pre-wrap rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-sm">
                {m.text}
              </span>
              {copyButton(m.text, i)}
            </div>
          ) : (
            <div key={i} className="flex flex-col items-start">
              {/* Markdownを描画（生HTMLは描画しないので安全）。要素ごとの見た目はTailwindで指定。 */}
              <div className="max-w-[80%] rounded-2xl bg-white/90 px-4 py-2 text-sm text-zinc-900 shadow-sm ring-1 ring-black/5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-emerald-700 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
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
            <span className="rounded-2xl bg-white/90 px-4 py-2 text-sm text-zinc-400 shadow-sm ring-1 ring-black/5">
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
          className="max-h-32 flex-1 resize-none rounded-lg border border-emerald-600/20 bg-white/80 px-3 py-2 text-zinc-900 shadow-sm outline-none backdrop-blur focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-zinc-100/80"
        />
        {loading ? (
          <button
            type="button"
            onClick={stop}
            aria-label="生成を停止"
            className="flex items-center gap-1 rounded-lg bg-zinc-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-zinc-700"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            停止
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          >
            送信
          </button>
        )}
      </form>
      </main>
    </div>
  );
}
