"use client";

import { useEffect, useMemo } from "react";
import { srand } from "./plants";

const COLORS = ["#f0c454", "#e88fb0", "#7cc47f", "#7fa8e8", "#f0a060", "#c48fd8"];

// A short confetti + banner burst shown when the forest reaches a milestone
// (every 10th completed task). Calls onDone after the animation finishes.
export default function Celebration({
  milestone,
  onDone,
}: {
  milestone: number;
  onDone: () => void;
}) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: srand(i * 1.7 + milestone) * 100,
        color: COLORS[i % COLORS.length],
        delay: srand(i * 2.3) * 0.6,
        duration: 2.4 + srand(i * 3.1) * 1.6,
        size: 6 + srand(i * 4.7) * 8,
        rot: srand(i * 5.9) * 360,
      })),
    [milestone],
  );

  useEffect(() => {
    const id = setTimeout(onDone, 4000);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      <style>{`
        @keyframes forest-confetti-fall {
          0% { transform: translateY(-12vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(112vh) rotate(720deg); opacity: 0.9; }
        }
        @keyframes forest-banner-pop {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          15% { transform: translate(-50%, 0) scale(1.08); opacity: 1; }
          30%, 80% { transform: translate(-50%, 0) scale(1); opacity: 1; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 0; }
        }
      `}</style>

      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `forest-confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}

      <div
        className="absolute left-1/2 top-1/3 rounded-2xl bg-white/90 px-6 py-4 text-center shadow-lg ring-1 ring-black/5"
        style={{ animation: "forest-banner-pop 4s ease-out forwards" }}
      >
        <div className="text-2xl font-bold text-emerald-700">
          🎉 {milestone} 本 達成！
        </div>
        <div className="mt-1 text-sm text-zinc-500">森がまた一歩育ちました</div>
      </div>
    </div>
  );
}
