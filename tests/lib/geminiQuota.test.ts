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

  it("429 ではないエラーは null を返す", () => {
    expect(parseQuotaError(new Error("fetch failed"))).toBeNull();
    expect(parseQuotaError(new Error('{"error":{"code":500}}'))).toBeNull();
    expect(parseQuotaError(undefined)).toBeNull();
  });
});
