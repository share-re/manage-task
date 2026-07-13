"use client";

import { useEffect, useState } from "react";

// How many trees make a "full forest" in the hero.
const TOTAL_TREES = 6;

type SkyPhase = "dawn" | "day" | "dusk" | "night";

function phaseFromHour(h: number): SkyPhase {
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 17) return "day";
  if (h >= 17 && h < 19) return "dusk";
  return "night";
}

// Soft, muted palette per time of day (kept restrained on purpose).
const SKY: Record<
  SkyPhase,
  { from: string; to: string; orb: string; text: string; treeEmpty: string }
> = {
  dawn: {
    from: "#FBE3C6",
    to: "#E6F0FB",
    orb: "#F7C57C",
    text: "#6b4f2a",
    treeEmpty: "#CBD8B4",
  },
  day: {
    from: "#CDE4FA",
    to: "#EAF3FB",
    orb: "#FBD96B",
    text: "#173404",
    treeEmpty: "#C9D6B0",
  },
  dusk: {
    from: "#F3CDA9",
    to: "#D6C4E4",
    orb: "#F09E57",
    text: "#5a3a4a",
    treeEmpty: "#B9C4A0",
  },
  night: {
    from: "#33436F",
    to: "#51618C",
    orb: "#E9EDF7",
    text: "#e7edff",
    treeEmpty: "rgba(255,255,255,0.45)",
  },
};

export default function SkyHero({
  done,
  total,
  percent,
  label,
}: {
  done: number;
  total: number;
  percent: number;
  label: string;
}) {
  // Start on "day" for a stable SSR render, then switch to the real time of
  // day on the client (avoids a hydration mismatch).
  const [phase, setPhase] = useState<SkyPhase>("day");
  useEffect(() => {
    const apply = () => setPhase(phaseFromHour(new Date().getHours()));
    apply();
    const id = setInterval(apply, 60_000);
    return () => clearInterval(id);
  }, []);

  const sky = SKY[phase];
  const remaining = Math.max(0, TOTAL_TREES - done);

  return (
    <div
      className="relative mb-8 h-40 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5"
      style={{
        background: `linear-gradient(180deg, ${sky.from}, ${sky.to})`,
        transition: "background 1.5s ease",
      }}
    >
      <style>{`
        @keyframes skyDrift { from { transform: translateX(-60px); } to { transform: translateX(560px); } }
        @keyframes skyBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }
        @keyframes skyFlutter {
          0% { left: -24px; transform: translateY(0); }
          25% { transform: translateY(-10px); }
          50% { transform: translateY(4px); }
          75% { transform: translateY(-7px); }
          100% { left: 105%; transform: translateY(0); }
        }
      `}</style>

      {/* sun / moon */}
      <div
        className="absolute"
        style={{
          top: 18,
          right: 34,
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: sky.orb,
          animation: "skyBob 5s ease-in-out infinite",
        }}
      />

      {/* two slow clouds */}
      <div
        className="absolute"
        style={{
          top: 22,
          height: 14,
          width: 42,
          borderRadius: 20,
          background: "rgba(255,255,255,0.8)",
          animation: "skyDrift 40s linear infinite",
        }}
      />
      <div
        className="absolute"
        style={{
          top: 52,
          height: 12,
          width: 34,
          borderRadius: 20,
          background: "rgba(255,255,255,0.7)",
          animation: "skyDrift 58s linear infinite",
          animationDelay: "-12s",
        }}
      />

      {/* a single butterfly, daytime only, unobtrusive */}
      {phase === "day" && (
        <div
          className="absolute text-base"
          style={{
            top: 44,
            color: "#7C4DBD",
            animation: "skyFlutter 22s linear infinite",
          }}
          aria-hidden="true"
        >
          <i className="ti ti-butterfly" />
        </div>
      )}

      {/* progress copy + bar + trees, anchored to the bottom */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
        <div
          className="mb-1 flex items-baseline justify-between"
          style={{ color: sky.text }}
        >
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs">
            今日は {done} 件完了！ あと {remaining} 本で満開
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.6)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${percent}%`,
              background: "#639922",
              transition: "width 0.6s ease",
            }}
          />
        </div>
        <p
          className="mt-1 text-[11px] font-medium"
          style={{ color: sky.text }}
        >
          完了 {done} / 実作業 {total} 件（{percent}%）
        </p>
        <div className="mt-1.5 flex gap-1">
          {Array.from({ length: TOTAL_TREES }).map((_, i) => {
            // Fill from the RIGHT: the rightmost `done` trees turn green.
            const filled = i >= TOTAL_TREES - done;
            return (
              <i
                key={i}
                className="ti ti-tree text-base"
                style={{ color: filled ? "#3B6D11" : sky.treeEmpty }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      {/* grass strip along the very bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-2.5"
        style={{
          background:
            "repeating-linear-gradient(90deg,#9CC65A 0 7px,#8FBF3F 7px 14px)",
        }}
      />

      <span className="sr-only">
        {label}：{done} / {total} 完了（{percent}%）
      </span>
    </div>
  );
}
