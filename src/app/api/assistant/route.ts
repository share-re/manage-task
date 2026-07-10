import { GoogleGenAI } from "@google/genai";
import { UCHIDA_SYSTEM_PROMPT } from "@/lib/uchidaPrompt";

// このAPIはサーバ側で動かす（鍵をブラウザに出さないため）。
// Edgeランタイムだと不具合が出やすいので Node を明示する。
export const runtime = "nodejs";

// クライアントから送られてくる会話履歴の1件分の形。
// role は "user"（利用者）か "model"（AI内田さん）のどちらか。
type ChatTurn = { role: "user" | "model"; text: string };

export async function POST(req: Request) {
  // 鍵が未設定なら、原因が分かるメッセージを返して終了する。
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY が設定されていません（.env.local を確認）。" },
      { status: 500 },
    );
  }

  // リクエストの中身（JSON）を取り出す。壊れていたら400で返す。
  let body: {
    message?: unknown;
    history?: unknown;
    userName?: unknown;
    useSmartModel?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "リクエストの形式が不正です。" }, { status: 400 });
  }

  // 今回の新しい発言。空なら弾く。
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "メッセージが空です。" }, { status: 400 });
  }

  // 相手の名前（ログイン中のユーザー名）。あれば人格に伝えて「〇〇さん」と呼ばせる。
  const userName = typeof body.userName === "string" ? body.userName.trim() : "";

  // 使うモデルを選ぶ。
  // ふだんは軽い Flash-Lite（1日に使える回数が多い＝429で止まりにくい）。
  // 画面の「賢く答え直して」ボタンが押されたときだけ、賢い Flash に一時的に切り替える。
  const useSmartModel = body.useSmartModel === true;
  const model = useSmartModel ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";

  // これまでの会話履歴を、Geminiが受け取れる形（role + parts）に整える。
  // 想定外のデータが混ざっても落ちないよう、型を確かめながら変換する。
  const rawHistory = Array.isArray(body.history) ? (body.history as ChatTurn[]) : [];
  const history = rawHistory
    .filter((t) => t && (t.role === "user" || t.role === "model") && typeof t.text === "string")
    .map((t) => ({ role: t.role, parts: [{ text: t.text }] }));

  try {
    // 鍵を渡してGeminiクライアントを用意する。
    const ai = new GoogleGenAI({ apiKey });

    // 名前が分かっていれば、人格プロンプトの末尾に「今の相手」を1行足す。
    const systemInstruction = userName
      ? `${UCHIDA_SYSTEM_PROMPT}\n\n# 今話している相手\n相手の表示名は「${userName}」です。この名前で呼びかけてください（呼び方ルールに従い、性別が不明なら「${userName}さん」）。`
      : UCHIDA_SYSTEM_PROMPT;

    // 人格プロンプトを systemInstruction（土台の指示）として渡し、履歴も渡す。
    const chat = ai.chats.create({
      model,
      // Google検索ツールを持たせる。使うかどうかは Gemini が自分で判断する（AI判断型）。
      // 事実確認や最新情報が要る質問のときだけ検索が走り、ふつうの雑談では走らない。
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
      history,
    });

    // 今回の発言を送り、返答を「少しずつ」受け取る（ストリーミング）。
    const result = await chat.sendMessageStream({ message });

    // 受け取った文字を、そのままクライアントへ少しずつ流すストリームを作る。
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text)); // 届いた分だけ流す
          }
        } catch (err) {
          // 途中でGemini側が落ちたら、印を1行入れて終わる。
          console.error("Gemini stream error:", err);
          controller.enqueue(
            encoder.encode("\n\n（応答が途中で止まりました。もう一度お試しください。）"),
          );
        } finally {
          controller.close();
        }
      },
    });

    // text/plain のストリームとして返す。
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    // ストリーム開始前のエラー（レート上限・鍵ミス等）はJSONで返す。
    console.error("Gemini API error:", err);
    return Response.json(
      { error: "AIの応答に失敗しました。少し待って、もう一度お試しください。" },
      { status: 502 },
    );
  }
}
