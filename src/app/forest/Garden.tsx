"use client";

import { useEffect, useRef } from "react";
import { buildGarden, layoutPlants, plantAt, type Plant } from "./plants";
import { drawGarden } from "./draw";
import type { Weather } from "./weather";

type Props = {
  done: number; // number of completed tasks
  growth: number; // greenery level from the completed count, 0..1
  hour: number; // local time of day (0-24, fractional) for the day/night sky
  weather: Weather; // current weather condition
  onPickPlant?: (plant: Plant | null, clientX: number, clientY: number) => void;
};

// Hosts a <canvas> and runs the animation loop. React state is passed to the
// draw loop through a ref so we never restart the loop on every render.
export default function Garden({
  done,
  growth,
  hour,
  weather,
  onPickPlant,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ done, growth, hour, weather });

  // buildGarden is deterministic in `done`, so cache its result and rebuild
  // only when `done` changes instead of allocating the list every frame /
  // every pointer move.
  const plantsRef = useRef<{ done: number; plants: Plant[] }>({
    done: -1,
    plants: [],
  });
  function gardenFor(done: number): Plant[] {
    if (plantsRef.current.done !== done) {
      plantsRef.current = { done, plants: buildGarden(done) };
    }
    return plantsRef.current.plants;
  }

  // Which plant is under (clientX, clientY), if any.
  function plantFromEvent(clientX: number, clientY: number): Plant | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const layouts = layoutPlants(
      gardenFor(stateRef.current.done),
      canvas.clientWidth,
      canvas.clientHeight,
    );
    const hit = plantAt(layouts, clientX - rect.left, clientY - rect.top);
    return hit ? hit.plant : null;
  }

  // Keep the latest values available to the animation loop without restarting it.
  useEffect(() => {
    stateRef.current = { done, growth, hour, weather };
  }, [done, growth, hour, weather]);

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
      const s = stateRef.current;
      const plants = gardenFor(s.done);
      drawGarden(ctx!, w, h, plants, s.growth, s.hour, s.weather, t);
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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !onPickPlant) return;
        const plant = plantFromEvent(e.clientX, e.clientY);
        e.currentTarget.style.cursor = plant ? "pointer" : "default";
        onPickPlant(plant, e.clientX, e.clientY);
      }}
      onPointerLeave={() => onPickPlant?.(null, 0, 0)}
      onClick={(e) => {
        if (!onPickPlant) return;
        onPickPlant(plantFromEvent(e.clientX, e.clientY), e.clientX, e.clientY);
      }}
    />
  );
}
