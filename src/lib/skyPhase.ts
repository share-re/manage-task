"use client";

import { useEffect, useState } from "react";

// 時間帯。SkyHero（進捗カード）と ForestBackground（背景）で共通に使う。
export type SkyPhase = "dawn" | "day" | "dusk" | "night";

export function phaseFromHour(h: number): SkyPhase {
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 19) return "dusk";
  return "night";
}

const PHASES: SkyPhase[] = ["dawn", "day", "dusk", "night"];

/**
 * 見た目の確認用。URL に `?sky=night` を付けると、その時間帯で固定して表示する。
 * 例: /tasks?sky=dusk ／ /assistant?sky=dawn
 * 知らない値（?sky=abc）や指定なしのときは null を返し、本当の時刻に従う。
 */
function phaseFromUrl(): SkyPhase | null {
  const v = new URLSearchParams(window.location.search).get("sky");
  return PHASES.includes(v as SkyPhase) ? (v as SkyPhase) : null;
}

/**
 * 現在の時間帯を返す。1分ごとに見直すので、夕方や夜になれば自動で切り替わる。
 *
 * サーバー側の描画（SSR）では時刻が使えないため、まず "day" を返しておき、
 * ブラウザ側で本当の時間帯に切り替える（表示のズレ＝hydration mismatch を避ける）。
 */
export function useSkyPhase(): SkyPhase {
  const [phase, setPhase] = useState<SkyPhase>("day");
  useEffect(() => {
    const apply = () =>
      setPhase(phaseFromUrl() ?? phaseFromHour(new Date().getHours()));
    apply();
    // URL で時間帯を固定しているときは、時刻の見直し（1分ごと）は不要。
    if (phaseFromUrl()) return;
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);
  return phase;
}
