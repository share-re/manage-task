"use client";

import { useEffect, useRef } from "react";
import { buildGarden } from "./plants";
import { drawGarden } from "./draw";

type Props = {
  done: number; // number of completed tasks
  progress: number; // done / total, 0..1
};

// Hosts a <canvas> and runs the animation loop. React state is passed to the
// draw loop through a ref so we never restart the loop on every render.
export default function Garden({ done, progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ done, progress });

  // Keep the latest values available to the animation loop without restarting it.
  useEffect(() => {
    stateRef.current = { done, progress };
  }, [done, progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + "px";
      canvas!.style.height = h + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const start = performance.now();
    function frame(now: number) {
      const t = (now - start) / 1000;
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      const plants = buildGarden(stateRef.current.done);
      drawGarden(ctx!, w, h, plants, stateRef.current.progress, t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
}
