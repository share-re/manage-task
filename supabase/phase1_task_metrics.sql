-- フェーズ1：タスクに「種別・見積工数・実績時間」を追加する
-- 要件：AI活用効果測定_進捗管理_要件ドラフト.md（Q-03 / Q-04・決定1/決定2）
-- Supabase の SQL Editor に貼り付けて実行する。
--
-- 方針：
--   - 既存の tasks 行を壊さないよう、すべて「空でもOK（NULL 可）」で追加する。
--   - 難易度（小/中/大）は列に持たない。見積工数から自動で決める（アプリ側で導出）。
--   - 種別は status/priority と同じく英語コードで保存し、日本語ラベルは画面側で付ける。
--   - RLS は変更不要（列を足すだけで、どの行を見られるかのルールは変わらない）。

-- 1) 種別（どんな作業か）。設計/実装/テスト/調査/レビュー/資料作成の6区分。
--    NULL（未設定）も許可する（既存行や未入力のため）。
alter table public.tasks
  add column if not exists task_type text;

alter table public.tasks
  drop constraint if exists tasks_task_type_check;
alter table public.tasks
  add constraint tasks_task_type_check
  check (
    task_type is null
    or task_type in (
      'design',          -- 設計
      'implementation',  -- 実装
      'test',            -- テスト
      'research',        -- 調査
      'review',          -- レビュー
      'documentation'    -- 資料作成
    )
  );

-- 2) 見積工数（着手前の中立な予想・時間）。任意入力。0 以上のみ。
--    この数字から難易度（小<4h / 中4〜8h / 大8〜16h / 特大>=16h）をアプリ側で自動判定する。
alter table public.tasks
  add column if not exists estimated_hours numeric(6, 2);

alter table public.tasks
  drop constraint if exists tasks_estimated_hours_check;
alter table public.tasks
  add constraint tasks_estimated_hours_check
  check (estimated_hours is null or estimated_hours >= 0);

-- 3) 実績時間（実際にかかった時間）。完了時に入力（アプリ側で必須化）。0 以上のみ。
alter table public.tasks
  add column if not exists actual_hours numeric(6, 2);

alter table public.tasks
  drop constraint if exists tasks_actual_hours_check;
alter table public.tasks
  add constraint tasks_actual_hours_check
  check (actual_hours is null or actual_hours >= 0);
