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

    // Draw one frame at time t.
    function render(t: number) {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      if (w === 0 || h === 0) return;
      const plants = buildGarden(stateRef.current.done);
      drawGarden(ctx!, w, h, plants, stateRef.current.progress, t);
    }

    // Size the drawing buffer to the canvas's CSS box (driven by h-full/w-full).
    // A ResizeObserver re-runs this once layout settles, avoiding a 0-size canvas
    // when the effect runs before the flex layout has dimensions. We draw a frame
    // right after sizing so the garden is visible even while rAF is paused
    // (e.g. a hidden/background tab), where only the animation would stall.
    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      render(0);
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const start = performance.now();
    function frame(now: number) {
      render((now - start) / 1000);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
