import { describe, it, expect } from "vitest";

import * as templates from "../../src/app/api/admin/templates/route";
import * as priorities from "../../src/app/api/admin/priorities/route";
import * as statuses from "../../src/app/api/admin/statuses/route";
import * as taskTypes from "../../src/app/api/admin/task-types/route";
import * as mailRecipients from "../../src/app/api/admin/mail-recipients/route";
import * as users from "../../src/app/api/admin/users/route";
import * as invite from "../../src/app/api/admin/invite/route";

/**
 * 管理APIの権限ガード（P3 悪意ある操作者 / ISO25010 セキュリティ）。
 *
 * PLAYBOOK §2.2：「コードを読んで直した」は合格にしない。実際に不正な呼び出しを
 * 流して、拒否されることを実証する。
 *
 * requireAdmin() はトークンが無い時点で 401 を返し、そこまでは DB にも
 * サービスロールキーにも触らない。だからサーバも Supabase も無しで走る。
 *
 * ⚠ ここで確かめているのは「認証されていない呼び出しが通らないこと」まで。
 *    「一般ユーザーのトークンで 403」は本物のトークンが要るため未実施
 *    （テスト設計 F107-13 / F108-11 として要追加のまま）。
 */

type Handler = (req: Request) => Promise<Response>;

const ROUTES: { name: string; handler: Handler }[] = [
  { name: "POST   /api/admin/templates", handler: templates.POST },
  { name: "PATCH  /api/admin/templates", handler: templates.PATCH },
  { name: "DELETE /api/admin/templates", handler: templates.DELETE },
  { name: "PATCH  /api/admin/priorities", handler: priorities.PATCH },
  { name: "PATCH  /api/admin/statuses", handler: statuses.PATCH },
  { name: "PATCH  /api/admin/task-types", handler: taskTypes.PATCH },
  { name: "GET    /api/admin/mail-recipients", handler: mailRecipients.GET },
  { name: "POST   /api/admin/mail-recipients", handler: mailRecipients.POST },
  { name: "PATCH  /api/admin/mail-recipients", handler: mailRecipients.PATCH },
  { name: "DELETE /api/admin/mail-recipients", handler: mailRecipients.DELETE },
  { name: "GET    /api/admin/users", handler: users.GET },
  { name: "PATCH  /api/admin/users", handler: users.PATCH },
  { name: "DELETE /api/admin/users", handler: users.DELETE },
  { name: "POST   /api/admin/invite", handler: invite.POST },
];

function request(headers: Record<string, string> = {}, body: unknown = {}) {
  return new Request("http://localhost/api/admin/x", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("管理APIは認証なしの呼び出しを拒否する", () => {
  for (const { name, handler } of ROUTES) {
    it(`${name} … Authorization なしで 401`, async () => {
      const res = await handler(request());
      expect(res.status).toBe(401);
      const json = await res.json();
      // 中身を漏らさず、理由だけ返す。
      expect(json.error).toBe("未ログインです。");
      expect(json).not.toHaveProperty("users");
      expect(json).not.toHaveProperty("recipients");
    });
  }
});

describe("Bearer 形式でないヘッダも拒否する", () => {
  const BAD = [
    { label: "Basic 認証", header: "Basic YWRtaW46YWRtaW4=" },
    { label: "スキームなしの生トークン", header: "eyJhbGciOiJIUzI1NiJ9.x.y" },
    { label: "Bearer だけで中身が空", header: "Bearer " },
    { label: "小文字の bearer", header: "bearer abc" },
    { label: "空文字", header: "" },
  ];

  for (const { label, header } of BAD) {
    it(`${label} … 401`, async () => {
      // 代表として1本。全ルートが同じ requireAdmin を通る。
      const res = await templates.POST(request({ Authorization: header }));
      expect(res.status).toBe(401);
    });
  }
});

describe("検証の順序（認証が先、入力チェックは後）", () => {
  it("壊れた本文でも、未認証なら 400 ではなく 401 を返す", async () => {
    // 逆順だと、未認証の相手に「その入力は不正」と教えてしまう＝内部仕様が漏れる。
    const res = await templates.POST(
      new Request("http://localhost/api/admin/templates", {
        method: "POST",
        body: "{ this is not json",
      }),
    );
    expect(res.status).toBe(401);
  });
});
