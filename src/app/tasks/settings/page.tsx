"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  DEFAULT_PERSON_DAY_HOURS,
  getPersonDayHours,
  setPersonDayHours,
} from "@/lib/settings";
import ForestBackground from "@/components/ForestBackground";

/**
 * 簡易マスタ (/tasks/settings): 今回は人日換算係数（時間/人日）のみ（第15章）。
 * ここを変えると、ダッシュボードの指標B（1人日あたり完了数）の分母が変わる。
 */
export default function SettingsPage() {
  const [hours, setHours] = useState<string>(String(DEFAULT_PERSON_DAY_HOURS));
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    getPersonDayHours()
      .then((h) => setHours(String(h)))
      .catch((err) => {
        console.error(err);
        setError("設定の読み込みに失敗しました。");
      })
      .finally(() => setLoaded(true));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setMessage(undefined);
    const h = Number(hours);
    if (!Number.isFinite(h) || h <= 0) {
      setError("人日換算係数は0より大きい数値で入力してください。");
      return;
    }
    setSaving(true);
    try {
      await setPersonDayHours(h);
      setMessage("保存しました。");
    } catch (err) {
      console.error(err);
      setError("保存に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200";

  return (
    <div className="relative flex-1">
      <ForestBackground />
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">マスタ設定</h1>
          <Link
            href="/tasks/dashboard"
            className="text-sm hover:underline"
            style={{ color: "#3B6D11" }}
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mb-3 text-sm text-[#3B6D11]">{message}</p>}

        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-black/5"
        >
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">
              人日換算係数（時間 / 人日）
            </span>
            <input
              type="number"
              min={0}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={!loaded}
              className={`${inputClass} sm:max-w-[160px]`}
            />
            <span className="text-xs text-zinc-400">
              1人日を何時間とみなすか（既定 {DEFAULT_PERSON_DAY_HOURS}h）。指標B「1人日あたり完了数」の分母に使います。
            </span>
          </label>

          <button
            type="submit"
            disabled={saving || !loaded}
            className="mt-4 self-start rounded-lg bg-[#3B6D11] px-5 py-2 text-sm font-medium text-white hover:bg-[#2f5a0e] disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存する"}
          </button>
        </form>
      </main>
    </div>
  );
}
