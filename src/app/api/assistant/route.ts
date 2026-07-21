import { GoogleGenAI, type GroundingMetadata } from "@google/genai";
import { UCHIDA_SYSTEM_PROMPT } from "@/lib/uchidaPrompt";
import { parseQuotaError } from "@/lib/geminiQuota";
import { withInternalInfoGuard } from "@/lib/internalInfoGuard";

// このAPIはサーバ側で動かす（鍵をブラウザに出さないため）。
// Edgeランタイムだと不具合が出やすいので Node を明示する。
export const runtime = "nodejs";

// クライアントから送られてくる会話履歴の1件分の形。
// role は "user"（利用者）か "model"（AI内田さん）のどちらか。
type ChatTurn = { role: "user" | "model"; text: string };

// 本文と「出典情報(JSON)」を1本のストリームで送るときの区切り記号。
// 制御文字(U+001E)なので、AIの文章とは絶対に衝突しない。
const SOURCES_SEP = "\x1e";

// grounding（検索の裏取り情報）から、画面に出す最小限の出典データだけを取り出す。
// 出典も Search Suggestions(HTML) も無ければ null を返す（何も付けない）。
function buildSourcesMeta(gm: GroundingMetadata | undefined) {
  if (!gm) return null;
  const sources = (gm.groundingChunks ?? [])
    .map((c) => ({ title: c.web?.title ?? "", uri: c.web?.uri ?? "" }))
    .filter((s) => s.uri); // URLがあるものだけ残す
  const suggestions = gm.searchEntryPoint?.renderedContent ?? "";
  if (sources.length === 0 && !suggestions) return null;
  return { sources, suggestions };
}

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
    // #72対策: 社内の固有情報（納期・会議・担当者など）を問う気配のある発言には、
    // 創作を防ぐ注意書きをサーバー側で機械的に添える（画面表示・保存には含まれない）。
    const result = await chat.sendMessageStream({
      message: withInternalInfoGuard(message),
    });

    // 受け取った文字を、そのままクライアントへ少しずつ流すストリームを作る。
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // 検索が走ったときの「出典情報」を、受信ループの中で拾っておく。
        let grounding: GroundingMetadata | undefined;
        try {
          for await (const chunk of result) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text)); // 届いた分だけ流す
            // チャンクに出典情報が付いていれば、最新のものを覚えておく。
            const gm = chunk.candidates?.[0]?.groundingMetadata;
            if (gm) grounding = gm;
          }
          // 本文を流し切ったあと、出典があれば「区切り記号＋JSON」を末尾に付ける。
          // 画面側はこの区切り記号で、本文と出典を切り分ける。
          const meta = buildSourcesMeta(grounding);
          if (meta) {
            controller.enqueue(encoder.encode(SOURCES_SEP + JSON.stringify(meta)));
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
    // 原因調査のため、加工前の生のエラーを必ずそのままログに残す。
    console.error("Gemini API error (raw):", err);
    const quota = parseQuotaError(err);
    if (quota) {
      // 429の判定に使った材料もログに残す（どの上限に当たったかを後から追えるように）。
      console.error("Gemini 429 detail:", {
        kind: quota.kind,
        quotaId: quota.quotaId || "(不明)",
        retryDelaySec: quota.retryDelaySec,
      });
      // 「1日の上限(PerDay)」と確認できたときだけ、日次の文言を返す。
      // 無料枠の上限はモデルごとに別カウントなので、もう一方のモードなら
      // まだ使える場合があることを、失敗したモデルに合わせて案内する。
      if (quota.kind === "daily") {
        const switchHint = useSmartModel
          ? "上限はモデルごとに別なので、「🧠 賢く」をOFFにすると、ふつうモードで続けられる場合があります。"
          : "上限はモデルごとに別なので、「🧠 賢く」をONにすると、別のモデルで続けられる場合があります。";
        return Response.json(
          {
            error:
              `今日は${useSmartModel ? "賢くモード" : "ふつうモード"}のAIが利用上限に達しました（無料枠の1日あたりの上限。明日リセットされます）。` +
              switchHint,
            quota: "daily",
          },
          { status: 429 },
        );
      }
      // 1分あたりの上限(RPM/TPM)や判別不能な429は「一時的」。
      // 自動再試行はせず、文言を返してユーザーの判断に任せる。
      // quota / retryAfterSec は機械可読な参考情報として添えておく（画面は文言のみ使用）。
      return Response.json(
        {
          error: "混雑しています。少し時間をおいてもう一度お試しください。",
          quota: "temporary",
          retryAfterSec: quota.retryDelaySec ?? 10,
        },
        { status: 429 },
      );
    }
    return Response.json(
      { error: "AIの応答に失敗しました。少し待って、もう一度お試しください。" },
      { status: 502 },
    );
  }
}
