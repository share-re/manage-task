"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/components/AuthProvider";
import ForestBackground from "@/components/ForestBackground";
import UchidaIcon from "@/components/UchidaIcon";
import {
  createConversation,
  addMessage,
  touchConversation,
  listConversations,
  getMessages,
  deleteConversation,
  type Conversation,
} from "@/lib/conversations";

// 検索の裏取りに使った参照元（出典）1件分。
type Source = { title: string; uri: string };

// 会話1件分。role は "user"（自分）か "model"（AI内田さん）。
// AIの返答が検索を使ったときは、出典(sources)と検索候補(suggestions=GoogleのHTML)が付く。
type Msg = {
  role: "user" | "model";
  text: string;
  sources?: Source[];
  suggestions?: string;
};

// 本文と出典(JSON)を1本のストリームで送るときの区切り記号（サーバ側と一致させる）。
const SOURCES_SEP = "\x1e";

// 受信した塊を「本文」と「出典JSONの生文字列」に切り分ける。
function splitAcc(acc: string): { textPart: string; metaRaw: string } {
  const i = acc.indexOf(SOURCES_SEP);
  if (i === -1) return { textPart: acc, metaRaw: "" };
  return { textPart: acc.slice(0, i), metaRaw: acc.slice(i + SOURCES_SEP.length) };
}

// 入力欄の最大高さ(px)。約5行分。これを超えたら伸ばさず、入力欄の中でスクロールさせる。
const MAX_INPUT_HEIGHT = 128;

// 隠し要素: 辛いもの好きという人格設定（docs/persona-ai-curiosity.md）に合わせ、
// 直近の返答が辛いもの寄りの話題ならアバターのバッジを🌶に差し替える。単純な語句判定でよい。
const SPICY_WORDS = /辛い|激辛|唐辛子|カレー|スパイス|麻婆|キムチ|ハバネロ/;

export default function AssistantPage() {
  const { session, profileName } = useAuth();
  // ログイン中の名前。profiles.name を正とし、無ければ表示名→メールの@より前。
  const metaName = session?.user.user_metadata?.name as string | undefined;
  const email = session?.user.email;
  const userName =
    profileName?.trim() || metaName?.trim() || (email ? email.split("@")[0] : "");

  const [messages, setMessages] = useState<Msg[]>([]); // これまでの会話
  const [input, setInput] = useState(""); // 入力欄の文字
  const [loading, setLoading] = useState(false); // 返答待ちかどうか
  const [error, setError] = useState<string>(); // エラー文言
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null); // コピー済みの吹き出し
  // 賢さモード。ON のとき、次からの送信を上位モデル(Flash)で行う（チャット欄外のトグルで切替）。
  const [smartMode, setSmartMode] = useState(false);
  // 保存中の会話ID。最初の送信で会話を作り、以降はこの会話に発言を足していく。
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]); // 履歴一覧
  const [sidebarOpen, setSidebarOpen] = useState(false); // スマホ用サイドバー（履歴）の開閉
  const [saveEnabled, setSaveEnabled] = useState(true); // この会話を保存するか（プライバシー）
  const abortRef = useRef<AbortController | null>(null); // 生成中のリクエストを止める用
  const textareaRef = useRef<HTMLTextAreaElement>(null); // 入力欄。高さの自動調整に使う

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

  // 入力欄の高さを中身に合わせて自動調整（最大 MAX_INPUT_HEIGHT＝約5行まで）。
  // ①いったん auto に戻して本来の高さ(scrollHeight)を測り、②最大値で頭打ちしてセット。
  // 送信後に空へ戻したときも縮むよう、input の変化に反応させる。
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, MAX_INPUT_HEIGHT) + "px";
  }, [input]);

  // ログインできたら、保存済みの会話一覧を読み込む（履歴パネル用）。
  useEffect(() => {
    if (session) refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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

  // 送信本体（送信ボタン・Enterキー・「考え直して」から呼ぶ）。
  // retryText を渡すと「再送信」＝新しい吹き出しを足さず、直前のAI返答を捨てて同じ質問を送り直す。
  // useSmartModel=true のときだけ上位モデル(Flash)を使う（省略時は画面の賢さモードに従う）。
  async function send(opts?: { retryText?: string; useSmartModel?: boolean }) {
    const isRetry = opts?.retryText !== undefined;
    // opts で明示されなければ、いまの賢さモードに従う。
    const useSmartModel = opts?.useSmartModel ?? smartMode;
    const text = (opts?.retryText ?? input).trim();
    if (!text || loading) return; // 空・返答待ちのときは何もしない

    setError(undefined);

    // サーバに渡す履歴は「今回の発言を含まない、これまでのやりとり」。
    let history: Msg[];
    if (isRetry) {
      // 再送信：末尾のユーザー発言を探し、それより後（＝捨てるAI返答）を消す。
      const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
      history = messages.slice(0, lastUserIdx); // その質問より前
      setMessages(messages.slice(0, lastUserIdx + 1)); // 質問までを残しAI返答を削除
    } else {
      history = messages;
      setMessages((prev) => [...prev, { role: "user", text }]);
      setInput(""); // いったん空に（失敗したら下で戻す）
    }
    setLoading(true);

    // 生成中のリクエストを止められるようにする（停止ボタン用）。
    const controller = new AbortController();
    abortRef.current = controller;

    // 失敗時の後始末。通常送信は「吹き出しを消して入力欄に文を戻す」。
    // 再送信は質問をそのまま残す（消さない）。
    const revert = () => {
      if (isRetry) return;
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
        body: JSON.stringify({ message: text, history, userName, useSmartModel }),
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
          const glyphs = Array.from(splitAcc(acc).textPart); // 本文だけ（出典は除く）を1文字扱い
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

      // 本文の後ろに出典JSONが来ていれば、解析して最後のAI吹き出しに付ける。
      const { metaRaw } = splitAcc(acc);
      if (metaRaw && started) {
        try {
          const meta = JSON.parse(metaRaw) as {
            sources?: Source[];
            suggestions?: string;
          };
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === "model") {
              copy[copy.length - 1] = {
                ...last,
                sources: meta.sources ?? [],
                suggestions: meta.suggestions ?? "",
              };
            }
            return copy;
          });
        } catch {
          // 出典の解析に失敗しても、本文は表示済みなので無視する。
        }
      }

      // --- 会話をDBに保存する（通常送信のみ・ベストエフォート）---
      // 保存に失敗しても、チャット体験は止めない（黙って続行し、ログだけ残す）。
      if (saveEnabled && !isRetry && started && !controller.signal.aborted) {
        const replyText = splitAcc(acc).textPart;
        try {
          let cid = conversationId;
          const isNew = !cid;
          if (!cid) {
            // 最初の送信：会話を新規作成し、最初のユーザー発言をタイトルにする。
            const conv = await createConversation(text);
            cid = conv.id;
            setConversationId(cid);
          }
          await addMessage(cid, "user", text);
          await addMessage(cid, "model", replyText);
          await touchConversation(cid);
          if (isNew) await refreshConversations(); // 新しい会話を一覧にも反映
        } catch (e) {
          console.error("会話の保存に失敗:", e);
        }
      }

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

  // 保存済みの会話一覧を取り直す（最近使った順）。
  async function refreshConversations() {
    try {
      setConversations(await listConversations());
    } catch (e) {
      console.error("会話一覧の取得に失敗:", e);
    }
  }

  // 過去の会話を開いて、続きから表示する。
  async function openConversation(id: string) {
    try {
      const rows = await getMessages(id);
      setMessages(rows.map((r) => ({ role: r.role, text: r.text })));
      setConversationId(id);
      setSidebarOpen(false);
      setError(undefined);
    } catch (e) {
      console.error("会話の読み込みに失敗:", e);
      setError("会話の読み込みに失敗しました。");
    }
  }

  // 新しい会話を始める（今の表示をまっさらに。保存済みの会話は消えない）。
  function newConversation() {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setSidebarOpen(false);
    setError(undefined);
  }

  // 会話を削除する（確認あり）。開いている会話を消したら、表示もクリアする。
  async function removeConversation(id: string) {
    if (!window.confirm("この会話を削除しますか？（元に戻せません）")) return;
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        setMessages([]);
        setConversationId(null);
      }
    } catch (e) {
      console.error("会話の削除に失敗:", e);
      setError("会話の削除に失敗しました。");
    }
  }

  // 「考え直して」：直前の質問を、いまの賢さモードのまま送り直す。
  function retry() {
    if (loading) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    send({ retryText: lastUser.text }); // useSmartModel は省略＝現在のモードに従う
  }

  // textarea のキー操作：Shift+Enterで送信、Enterは改行（そのまま）。
  // 日本語変換中（isComposing）のEnterは確定用なので送信しない。
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  // ヘッダーのアバターに出すバッジ。直近の返答が辛い話題のときだけ🌶に変わる。
  const lastMsg = messages[messages.length - 1];
  const avatarBadge =
    !loading && lastMsg?.role === "model" && SPICY_WORDS.test(lastMsg.text) ? "chili" : "spark";

  return (
    // このページだけ常にライト表示に固定（OSがダークでも反転させない）。
    <div
      className="relative flex min-h-screen text-zinc-900"
      style={{ colorScheme: "light" }}
    >
      {/* 植林（/forest）トーンの背景。進捗管理（/tasks）と共通のコンポーネント。 */}
      <ForestBackground />

      {/* スマホでサイドバーを開いたときの背景（タップで閉じる） */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* 左サイドバー：新しい会話＋履歴一覧。PCは常時表示、スマホは☰で開閉する引き出し。 */}
      <aside
        className={
          "fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 transform flex-col bg-white/95 shadow-lg ring-1 ring-black/5 backdrop-blur transition-transform md:static md:z-10 md:translate-x-0 md:shadow-none md:ring-0 " +
          (sidebarOpen ? "translate-x-0" : "-translate-x-full")
        }
      >
        {/* ブランド */}
        <div className="flex items-center gap-2 px-3 pb-2 pt-4">
          <UchidaIcon size={32} badge="spark" className="shrink-0" />
          <span className="font-bold text-emerald-800">AI内田さん</span>
          {/* スマホ用の閉じるボタン */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="サイドバーを閉じる"
            className="ml-auto rounded p-1 text-zinc-400 transition hover:bg-zinc-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* 新しい会話 */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={newConversation}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700"
          >
            ＋ 新しい会話
          </button>
        </div>

        <div className="px-3 pb-1 text-xs text-zinc-400">履歴</div>

        {/* 会話一覧 */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {conversations.length === 0 ? (
            <p className="px-2 py-2 text-xs text-zinc-500">
              まだ保存された会話はありません。
            </p>
          ) : (
            conversations.map((c) => {
              const active = c.id === conversationId;
              return (
                <div
                  key={c.id}
                  className={
                    "flex items-center gap-1 rounded-md pr-1 " +
                    (active ? "bg-emerald-100" : "hover:bg-emerald-50")
                  }
                >
                  <button
                    type="button"
                    onClick={() => openConversation(c.id)}
                    className={
                      "flex min-w-0 flex-1 items-baseline justify-between gap-2 px-2 py-1.5 text-left text-sm " +
                      (active ? "text-emerald-800" : "text-zinc-700")
                    }
                  >
                    <span className="truncate">{c.title || "（無題）"}</span>
                    <span className="shrink-0 text-[10px] text-zinc-400">
                      {new Date(c.updated_at).toLocaleDateString("ja-JP")}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeConversation(c.id)}
                    aria-label="この会話を削除"
                    title="削除"
                    className="shrink-0 rounded p-1 text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* フッター：オフィスへ */}
        <div className="border-t border-black/5 px-3 py-3">
          <Link
            href="/office"
            className="inline-flex items-center gap-1 text-sm text-emerald-700 transition hover:text-emerald-900"
          >
            ← オフィスへ
          </Link>
        </div>
      </aside>

      <main className="relative z-10 flex h-[100dvh] min-w-0 flex-1 flex-col px-4 py-6">
        <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      {/* ヘッダー（白い半透明カード） */}
      <header className="mb-4 flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 shadow-sm ring-1 ring-black/5 backdrop-blur">
        {/* スマホ：サイドバー（履歴）を開く */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="履歴を開く"
          className="-ml-1 shrink-0 rounded-lg p-1 text-emerald-700 transition hover:bg-emerald-50 md:hidden"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {/* AI内田さんのアバター。返答生成中は「考え中」の顔＋バッジ点滅にする。 */}
        <UchidaIcon
          size={40}
          badge={avatarBadge}
          animateBadge={loading}
          expression={loading ? "think" : "normal"}
          className="shrink-0"
        />
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-emerald-800">AI内田さん</h1>
          <p className="truncate text-xs text-emerald-700/70">
            内田さんをモデルにしたAIです（本人ではありません）
          </p>
        </div>
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
            <div key={i} className="flex items-start gap-2">
              {/* 誰の発言か一目で分かるよう、AIの吹き出しの左に小さいアバターを置く（バッジなし） */}
              <UchidaIcon size={24} className="mt-1 shrink-0" />
              <div className="flex min-w-0 flex-col items-start">
                {/* Markdownを描画（生HTMLは描画しないので安全）。要素ごとの見た目はTailwindで指定。 */}
                <div className="max-w-[80%] rounded-2xl bg-white/90 px-4 py-2 text-sm text-zinc-900 shadow-sm ring-1 ring-black/5 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:text-emerald-700 [&_a]:underline [&_code]:rounded [&_code]:bg-zinc-200/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:mt-2 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-bold [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-zinc-100 [&_pre]:p-3 [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // 本文中のリンクは新しいタブで開く。
                      // クリックでこのページから離脱すると、保存していない会話が消えてしまうため。
                      a({ node, ...props }) {
                        return <a {...props} target="_blank" rel="noreferrer" />;
                      },
                    }}
                  >
                    {m.text}
                  </Markdown>
                </div>
                {/* 検索を使ったときの「参照元（出典）」。無いときは表示しない。 */}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-1 max-w-[80%] text-xs text-emerald-800/70">
                    <p className="font-medium">参照</p>
                    <ul className="list-disc pl-4">
                      {m.sources.map((s, k) => (
                        <li key={k}>
                          <a
                            href={s.uri}
                            target="_blank"
                            rel="noreferrer"
                            className="underline hover:text-emerald-700"
                          >
                            {s.title || s.uri}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {/* Googleの検索候補（Search Suggestions）。利用規約で表示が求められるHTMLをそのまま描画。 */}
                {m.suggestions && (
                  <div
                    className="mt-1 max-w-[80%]"
                    dangerouslySetInnerHTML={{ __html: m.suggestions }}
                  />
                )}
                {/* コピー ボタン（アイコン） */}
                {copyButton(m.text, i)}
                {/* 直前のAI返答にだけ「考え直して」を出す（生成中は隠す）。いまの賢さモードで送り直す。 */}
                {i === messages.length - 1 && !loading && (
                  <button
                    type="button"
                    onClick={retry}
                    title="同じ質問を、いまのモードで答え直します"
                    className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-600/40 transition hover:bg-emerald-200"
                  >
                    🔄 考え直して
                  </button>
                )}
              </div>
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

      {/* 賢さモードの切り替え（チャット欄の外）。ONにすると次からの送信を賢いモデル(Flash)で行う。
          先にONにしておけば、ふつうの返答を1回はさまずに、最初から賢く答えてもらえる。 */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {/* 保存のオン/オフ（プライバシー）。OFFにすると、この会話をサーバに保存しない。 */}
        <button
          type="button"
          role="switch"
          aria-checked={saveEnabled}
          onClick={() => setSaveEnabled((v) => !v)}
          title="OFFにすると、この会話をサーバに保存しません"
          className={
            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 transition " +
            (saveEnabled
              ? "bg-white/70 text-emerald-700 ring-emerald-600/30 hover:bg-white"
              : "bg-zinc-100 text-zinc-500 ring-zinc-300 hover:bg-zinc-200")
          }
        >
          {saveEnabled ? "💾 保存する" : "🔒 保存しない"}
        </button>

        {/* 賢さモードの切り替え。ONにすると次からの送信を賢いモデル(Flash)で行う。 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-800/70">
            {smartMode
              ? "賢くモード：しっかり考える（無料枠を多めに使います）"
              : "ふつうモード：軽快に答える"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={smartMode}
            onClick={() => setSmartMode((v) => !v)}
            title="ONにすると、次からの返答を上位モデル(Flash)で考えます（無料枠を多めに使います）"
            className={
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 transition " +
              (smartMode
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-white/70 text-emerald-700 ring-emerald-600/30 hover:bg-white")
            }
          >
            🧠 賢く {smartMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* 入力欄（Enterで送信 / Shift+Enterで改行） */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="mt-2 flex items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          rows={1}
          placeholder="メッセージを入力…（Shift+Enterで送信）"
          className="max-h-32 flex-1 resize-none overflow-y-auto rounded-lg border border-emerald-600/20 bg-white/80 px-3 py-2 text-zinc-900 shadow-sm outline-none backdrop-blur focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:bg-zinc-100/80"
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
        </div>
      </main>
    </div>
  );
}
