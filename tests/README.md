# Tests

TEST-EVIDENCE-PLAYBOOK の Phase 2〜3 を回すためのテスト資産。

## 実行

```bash
npm run test            # 単体テスト (Vitest)
npm run coverage        # 単体 + カバレッジ (evidence/unit/coverage/)
npm run test:e2e:public # E2E うち認証不要ぶん (AuthGate・ログイン画面) ※誰でも実行可
npm run test:e2e        # E2E 全部（要ログイン。下記の env が必要）
```

### 認証つき E2E（各画面の描画・console・スクショ）

ログインは env 経由（コードにパスワードを書かない）。テスト用アカウントで:

```bash
# 例: 本番を対象に、テスト用アカウントでログインして各画面を検証
TEST_EMAIL=you@example.com TEST_PASSWORD=... npm run test:e2e
# 対象を変える場合（プレビュー/ローカル）
E2E_BASE_URL=https://<preview>.vercel.app TEST_EMAIL=... TEST_PASSWORD=... npm run test:e2e
```

- `setup` プロジェクトが1回ログインしセッションを `tests/.auth/state.json` に保存 → `authed` が再利用。
- `screens.spec.ts` は **非破壊**（各画面を開いて描画・console error 0 を確認し `evidence/<screen>/screenshots/after.png` と `console.json` を保存するのみ）。CRUD/送信などの破壊的操作は含めない（＝別途 opt-in で追加する）。

## 生成される evidence（`.gitignore` 済み・再生成可能）

```
evidence/unit/coverage/     … 単体カバレッジ (json-summary / html)
evidence/<screen>/screenshots/after.png, console.json  … E2E の画面証跡
evidence/e2e/report/        … Playwright HTML レポート
```

## カバレッジ（PLAYBOOK §2.2）の考え方

単体は **純ロジックに限定**（`summary` / `tasks`(純関数) / `officeWorld`(`blocked`/`seatForUser`/`viewTransform`/`srand`＋`SEATS`不変条件)）。
canvas 描画とDBアクセス関数は**低カバレッジで正常**＝それらは E2E の担当（率のための空テストは足さない）。

## PLAYBOOK §8 スタック対応表（このプロジェクトの値）

| 項目 | 値 |
|---|---|
| 単体テスト実行 | `npm run test`（Vitest, node 環境, `@/`は tsconfig paths ネイティブ解決） |
| 差分カバレッジ | `npm run coverage`（@vitest/coverage-v8, json-summary） |
| 静的解析・型 | `npm run lint`（ESLint）/ `npx tsc --noEmit` / `npm run build`（Next型チェック込み） |
| UI 実測 | `npm run test:e2e`（Playwright/Chromium ヘッドレス, 起動→操作→スクショ→console） |
| E2E／受け入れ | `tests/e2e/screens.spec.ts`（画面別）/ `public.spec.ts`（AuthGate） |
| 永続層の実体確認(P4) | 未整備（要追加: service_role で email_send_log / tasks を直接照会） |
| セキュリティ | 未整備（要追加: 依存監査 `npm audit` ＋ 認可/サニタイズの E2E） |

## 未整備（要追加）
- 破壊的フロー（/tasks CRUD・/tasks/mail 実送信）の E2E（テスト用データ/宛先を分離してから）。
- P4 永続層の直接確認。canvas 内操作（席移動・タスク台クリック）は DOM が無く判定が浅いため、HUD/パネルの DOM で担保 + スクショ目視。
