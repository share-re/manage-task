import { supabase } from "./supabase";

// 簡易マスタ（app_settings）… 第15章。今回は人日換算係数のみ。
// 人日換算係数＝1人日あたりの時間（既定8h）。指標B（1人日あたり完了数）の分母に使う。

export const DEFAULT_PERSON_DAY_HOURS = 8;
const PERSON_DAY_HOURS_KEY = "person_day_hours";

function toPositiveNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Read the person-day conversion factor (hours per person-day). Falls back to
 * the default (8) on any error or missing/invalid row, so the dashboard never
 * breaks on a fresh DB.
 */
export async function getPersonDayHours(): Promise<number> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", PERSON_DAY_HOURS_KEY)
    .maybeSingle();
  if (error) {
    console.error("人日換算係数の取得に失敗:", error);
    return DEFAULT_PERSON_DAY_HOURS;
  }
  return toPositiveNumber(data?.value) ?? DEFAULT_PERSON_DAY_HOURS;
}

/** Update the person-day conversion factor (must be > 0). */
export async function setPersonDayHours(hours: number): Promise<void> {
  if (!(Number.isFinite(hours) && hours > 0)) {
    throw new Error("人日換算係数は0より大きい数値で入力してください。");
  }
  const { error } = await supabase.from("app_settings").upsert({
    key: PERSON_DAY_HOURS_KEY,
    value: hours,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
