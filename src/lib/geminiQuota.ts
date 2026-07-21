// Gemini API の 429（利用上限）エラーを読み解くためのヘルパー。
// API ルート（src/app/api/assistant/route.ts）から使う。
// ルートファイルの外に置いてあるのは、単体テスト（tests/lib）をしやすくするため。

// Geminiの429（利用上限）を読み解いた結果。
// kind: "daily"  = 1日のリクエスト数上限(RPD)。明日まで回復しない。
//       "temporary" = 1分あたりの上限(RPM/TPM)など。数十秒で自動回復する。
export type QuotaInfo = {
  kind: "daily" | "temporary";
  quotaId: string; // どの上限に当たったかを示すID（例: GenerateRequestsPerDay...）
  retryDelaySec: number | null; // Googleが提案する待ち時間（秒）。無ければ null
};

// Geminiの「利用上限」エラー（HTTP 429 / RESOURCE_EXHAUSTED）かどうかを見分け、
// エラー本文のJSONから quotaId / retryDelay を抜き出して原因を判別する。
// 429でなければ null を返す。
export function parseQuotaError(err: unknown): QuotaInfo | null {
  const status = (err as { status?: unknown })?.status;
  const raw = String(err instanceof Error ? err.message : err);
  // ストリーミング呼び出し(sendMessageStream)では、APIのエラーJSONが
  // 「エスケープされた文字列」(\" の形)としてもう一段JSONに包まれて届く。
  // そのままだと正規表現が当たらないので、先に \" → " に戻してから探す。
  const msg = raw.replace(/\\"/g, '"');
  const is429 =
    status === 429 || /"code"\s*:\s*429/.test(msg) || msg.includes("RESOURCE_EXHAUSTED");
  if (!is429) return null;

  // SDKのエラー文字列にはAPIが返した生のJSONが含まれるので、そこから抜き出す。
  // JSON全体のパースは形が安定しないため、必要な項目だけ正規表現で拾う。
  // 上限違反(violations)は複数並ぶことがある（例: 分と日を同時に超過）ので全部集める。
  const quotaIds = [...msg.matchAll(/"quota(?:Id|Metric)"\s*:\s*"([^"]+)"/g)].map(
    (m) => m[1],
  );
  const quotaId = quotaIds.join(", ");
  // 待ち時間は RetryInfo の retryDelay を第一候補に、無ければ
  // メッセージ本文の "Please retry in 25.07s" という文からも拾う（予備手段）。
  const delay =
    /"retryDelay"\s*:\s*"([\d.]+)s"/.exec(msg) ?? /retry in ([\d.]+)\s*s/i.exec(msg);
  const retryDelaySec = delay ? Math.ceil(Number(delay[1])) : null;

  // どれか1つでも "PerDay" を含めば「1日の上限」（分と日を同時に超えたら日次を優先）。
  // "PerMinute" 系や判別不能なものは、安全側に倒して「一時的」として扱う
  // （数十秒で直るものを「明日まで」と誤案内するほうが害が大きいため）。
  const kind = quotaIds.some((q) => /perday/i.test(q)) ? "daily" : "temporary";
  return { kind, quotaId, retryDelaySec };
}
