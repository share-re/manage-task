# 次イテレーション 要件定義（共通機能 / office / forest 担当）

> 作成日: 2026-07-09 ／ 対象担当: 共通機能（`/home`）・`/office`・`/forest`
> 方針: **基盤の地固め＋機能追加**の2本立て。**低コストのissueから順に対応**する。

## 1. 目的・背景

各機能の「体験」はすでにかなり作り込まれている一方で、
- チームで安全に運用するための**基盤（DBスキーマのコード化・定期実行・環境変数）が未整備**
- 機能ごとに**未完のラストワンマイル**や**役割の重複**（特に office と forest）が残る

そこで本イテレーションでは「基盤を地固めしつつ、担当領域（共通 / office / forest）の体験を仕上げる」。

## 2. スコープ（担当領域と重なるもののみ）

対象は以下の8件（GitHub Issue #16〜#23）。スマホ化・通知・AI内田さん強化・タスク機能拡張は
**他担当 or 今回対象外**。

## 3. 優先順位（低コスト順・依存関係考慮）

| 順 | Issue | 内容 | コスト | 依存 |
|---|---|---|---|---|
| 1 | [#18](https://github.com/share-re/manage-task/issues/18) | 環境変数を `.env.local.example` に揃える | 小 | なし |
| 2 | [#20](https://github.com/share-re/manage-task/issues/20) | office アバターに在席ステータス | 小 | なし（Presence拡張） |
| 3 | [#21](https://github.com/share-re/manage-task/issues/21) | 表示名を office から変更 | 小 | なし |
| 4 | [#17](https://github.com/share-re/manage-task/issues/17) | 定期メールの cron 配線 | 中 | メール/タスク担当と要調整 |
| 5 | [#19](https://github.com/share-re/manage-task/issues/19) | トップ `/` を廃止し `/office` に一本化 | 小〜中 | #21 の続きに積む |
| 6 | [#22](https://github.com/share-re/manage-task/issues/22) | office オンライン参加者の簡易チャット | 中 | なし（Realtime broadcast） |
| 7 | [#16](https://github.com/share-re/manage-task/issues/16) | DBスキーマの migration 整備 | 中〜大 | ⑧の前提 |
| 8 | [#23](https://github.com/share-re/manage-task/issues/23) | /forest を「季節のアルバム」に刷新 | 中〜大 | **#16 に依存**（`garden_album` を#16で用意） |

- **⑤#20・⑥#21** は office の「プロフィール小窓」（名前＋シャツ色＋ステータス）としてまとめて実装すると効率的。
- **⑦#16 → ⑧#23** は順序固定。#23 の永続化テーブル `garden_album` を #16 の migration に含める。
- **④#17** はメール本文・タスクデータが別担当領域と重なるため、cron 配線範囲を事前すり合わせ。

## 4. 主要な決定事項

### 基盤
- **DBスキーマ**: `tasks` / `task_comments` / `email_settings` / `email_send_log`（＋新規 `garden_album`）を
  `supabase/migrations/` にコード化。RLS・Realtime設定も含める。
- **定期メール**: Vercel Cron 等から `POST /api/send-summary`（`{scheduled:true}`, `CRON_SECRET`付き）を定期実行。
  古い重複実装 `supabase/functions/send-summary/` は一本化 or 削除（削除は事前確認）。
- **環境変数**: `GEMINI_API_KEY`・`APP_URL` を含む全変数を例ファイルに用途コメント付きで記載。

### #19 トップ `/` の扱い
- **案A：`/` を廃止し `/office` に一本化**（案B＝マイページ化＝担当ダッシュボード＋ユーザー設定、は比較の上で不採用）。
- `/` → `/office` リダイレクト（ページ削除はしない）。**ログアウト・パスキー登録を office のプロフィール枠へ移設**
  （現状 `/` にしか無く、廃止すると失われるため必須）。アプリ内の「← トップ」リンクは全て `/office` へ。office の 🏠 は撤去。
- 自分の担当タスクのダッシュボードは今回スコープ外（将来 office パネルとして別 issue）。

### ④ /forest「季節のアルバム」（目玉）
- **コンセプト**: タスク完了＝その季節の植物が office に生える → 保持期間経過で消え、forest の「アルバム」へ移動。
  forest では月ごとに、アーカイブ＋図鑑を兼ねた「アルバム」として蓄積。
- **office 側**: 植物は名前のみの軽い背景に。増えすぎを防ぐ。
- **差別化**: office＝働く"今"の空間 ／ forest＝実績を振り返る"アルバム"（wiki はここに集約）。
- **決定パラメータ**:
  - アルバムのページ粒度 = **月ごと**
  - office 保持期間 = **既定4か月**（設定可変）
    - 根拠: SE案件の平均工期は国内外統計で約3〜6か月（海外平均 約4.5か月）。月次アルバムに揃え4か月を採用。
  - データ = **永続化**（`garden_album` テーブル追加）
  - 植物は**木だけでなく植物全般**を対象（季節×決定的マッピング。乱数は使わない）。
- **スコープ**: 今回はパイプライン＋月次アルバムUI＋永続化＋季節マッピング初期セット（計20種程度）。
  種カタログ拡充・個人別Myアルバム・レア演出は後追い。

## 5. 対象外（他担当 or 今回見送り）

- スマホアプリ化（不要と決定）
- 期限リマインド通知（タスク/メール担当）
- AI内田さんのタスク連携・会話保存（assistant担当）
- コメントのメンション通知（tasks/comments担当）

## 6. 補足

- 各Issueの本文（テンプレート形式）は `docs/issues/01〜08-*.md` に保存。
- Issue登録先: https://github.com/share-re/manage-task/issues （#16〜#23）
