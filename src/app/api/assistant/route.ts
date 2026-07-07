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
  let body: { message?: unknown; history?: unknown; userName?: unknown };
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
      model: "gemini-2.5-flash",
      config: { systemInstruction },
      history,
    });

    // 今回の発言を送って、返答をもらう。
    const response = await chat.sendMessage({ message });
    return Response.json({ reply: response.text ?? "" });
  } catch (err) {
    // Gemini側のエラー（レート上限・鍵ミス等）はサーバログに出し、利用者には短く返す。
    console.error("Gemini API error:", err);
    return Response.json(
      { error: "AIの応答に失敗しました。少し待って、もう一度お試しください。" },
      { status: 502 },
    );
  }
}
