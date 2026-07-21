import { describe, it, expect } from "vitest";
import { parseQuotaError } from "../../src/lib/geminiQuota";

// Gemini API が実際に返す 429 エラー本文（JSON）を模したサンプルを作るヘルパー。
// SDK はこの JSON を含む文字列を Error.message に入れて投げてくる。
function make429Message(quotaId: string, retryDelay?: string): string {
  const details: unknown[] = [
    {
      "@type": "type.googleapis.com/google.rpc.QuotaFailure",
      violations: [
        {
          quotaMetric:
            "generativelanguage.googleapis.com/generate_content_free_tier_requests",
          quotaId,
        },
      ],
    },
  ];
  if (retryDelay) {
    details.push({
      "@type": "type.googleapis.com/google.rpc.RetryInfo",
      retryDelay,
    });
  }
  return JSON.stringify({
    error: {
      code: 429,
      message: "You exceeded your current quota.",
      status: "RESOURCE_EXHAUSTED",
      details,
    },
  });
}

describe("parseQuotaError", () => {
  it("PerDay（1日の上限）は daily と判定する", () => {
    const err = new Error(
      make429Message("GenerateRequestsPerDayPerProjectPerModel-FreeTier"),
    );
    const info = parseQuotaError(err);
    expect(info?.kind).toBe("daily");
    expect(info?.quotaId).toContain("PerDay");
  });

  it("PerMinute（1分のリクエスト上限=RPM）は temporary と判定し retryDelay を読む", () => {
    const err = new Error(
      make429Message("GenerateRequestsPerMinutePerProjectPerModel-FreeTier", "37s"),
    );
    const info = parseQuotaError(err);
    expect(info?.kind).toBe("temporary");
    expect(info?.retryDelaySec).toBe(37);
  });

  it("トークンのPerMinute上限（TPM）も temporary と判定する", () => {
    const err = new Error(
      make429Message("GenerateContentInputTokensPerModelPerMinute-FreeTier", "12.5s"),
    );
    const info = parseQuotaError(err);
    expect(info?.kind).toBe("temporary");
    expect(info?.retryDelaySec).toBe(13); // 小数は切り上げ
  });

  it("details の無い判別不能な 429 は、安全側で temporary（retryDelay は null）", () => {
    const err = new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}');
    const info = parseQuotaError(err);
    expect(info?.kind).toBe("temporary");
    expect(info?.retryDelaySec).toBeNull();
  });

  it("err.status が 429 の場合（SDKの ApiError 形式）も 429 と認識する", () => {
    const err = Object.assign(new Error("Too Many Requests"), { status: 429 });
    expect(parseQuotaError(err)?.kind).toBe("temporary");
  });

  it("ストリーミング経由の二重に包まれたエラー（エスケープ形式）でも判定できる", () => {
    // sendMessageStream 経由では、APIのエラーJSONが「エスケープされた文字列」として
    // もう一段JSONに包まれて届く（実際に観測した形式の再現）。
    const innerJson = JSON.stringify(
      {
        error: {
          code: 429,
          message:
            "You exceeded your current quota. * Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-2.5-flash-lite\nPlease retry in 25.074552488s.",
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.QuotaFailure",
              violations: [
                {
                  quotaMetric:
                    "generativelanguage.googleapis.com/generate_content_free_tier_requests",
                  quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier",
                  quotaValue: "20",
                },
              ],
            },
            {
              "@type": "type.googleapis.com/google.rpc.RetryInfo",
              retryDelay: "25s",
            },
          ],
        },
      },
      null,
      2, // 実物と同じく整形あり（"code": 429 のようにコロンの後に空白が入る）
    );
    const err = new Error(
      JSON.stringify({
        error: { message: innerJson, code: 429, status: "Too Many Requests" },
      }),
    );
    const info = parseQuotaError(err);
    expect(info?.kind).toBe("daily");
    expect(info?.quotaId).toContain("PerDay");
    expect(info?.retryDelaySec).toBe(25);
  });

  it("分と日を同時に超過しているときは「日次」を優先する", () => {
    const err = new Error(
      JSON.stringify({
        error: {
          code: 429,
          status: "RESOURCE_EXHAUSTED",
          details: [
            {
              "@type": "type.googleapis.com/google.rpc.QuotaFailure",
              violations: [
                { quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" },
                { quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" },
              ],
            },
          ],
        },
      }),
    );
    expect(parseQuotaError(err)?.kind).toBe("daily");
  });

  it("retryDelay が無くても本文の「retry in ○s」から待ち時間を拾える", () => {
    const err = new Error(
      '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED","message":"Please retry in 14.2s."}}',
    );
    const info = parseQuotaError(err);
    expect(info?.kind).toBe("temporary");
    expect(info?.retryDelaySec).toBe(15); // 小数は切り上げ
  });

  it("429 ではないエラーは null を返す", () => {
    expect(parseQuotaError(new Error("fetch failed"))).toBeNull();
    expect(parseQuotaError(new Error('{"error":{"code":500}}'))).toBeNull();
    expect(parseQuotaError(undefined)).toBeNull();
  });
});
