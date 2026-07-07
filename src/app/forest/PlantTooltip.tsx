"use client";

import { useEffect, useState } from "react";
import { getSpecies, type Plant } from "./plants";
import { fetchWikiSummary, type WikiSummary } from "./wiki";

type Props = {
  plant: Plant;
  x: number;
  y: number;
  onKeepOpen: () => void;
  onRequestClose: () => void;
  onClose: () => void;
};

// A small panel with the plant's real name, photo and summary from Wikipedia.
export default function PlantTooltip({
  plant,
  x,
  y,
  onKeepOpen,
  onRequestClose,
  onClose,
}: Props) {
  const species = getSpecies(plant.species);
  const [summary, setSummary] = useState<WikiSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetchWikiSummary(species.wiki).then((s) => {
      if (active) setSummary(s);
    });
    return () => {
      active = false;
    };
  }, [species.wiki]);

  const vw = typeof window === "undefined" ? 1000 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const left = Math.max(8, Math.min(x + 14, vw - 268));
  const top = Math.max(8, Math.min(y + 14, vh - 210));

  return (
    <div
      className="fixed z-30 w-64 rounded-xl bg-white/95 p-3 shadow-xl ring-1 ring-black/10 backdrop-blur"
      style={{ left, top }}
      onPointerEnter={onKeepOpen}
      onPointerLeave={onRequestClose}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-emerald-800">
          {species.ja}
          {plant.kind === "rare" && (
            <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              レア
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="-mr-1 -mt-1 rounded px-1.5 text-lg leading-none text-zinc-400 hover:text-zinc-600"
        >
          ×
        </button>
      </div>

      {summary?.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={summary.thumbnail}
          alt={species.ja}
          className="mt-2 h-24 w-full rounded object-cover"
        />
      )}

      <p className="mt-2 text-xs leading-relaxed text-zinc-600">
        {summary
          ? summary.extract.slice(0, 140) +
            (summary.extract.length > 140 ? "…" : "")
          : "読み込み中…"}
      </p>

      {summary?.pageUrl && (
        <a
          href={summary.pageUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-medium text-emerald-600 hover:underline"
        >
          Wikipedia で見る →
        </a>
      )}
    </div>
  );
}
