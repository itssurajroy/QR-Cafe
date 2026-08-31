"use client";

/**
 * useCounterAnimation — Animates a number from 0 to target when element enters viewport
 * Extracted from page.tsx (landing page animated counters)
 */

import { useState, useEffect, useRef } from "react";

export interface UseCounterAnimationReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  count: number;
  started: boolean;
}

export function useCounterAnimation(
  target: number,
  durationMs = 1200,
): UseCounterAnimationReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);

          const steps = 50;
          const stepValue = target / steps;
          const stepDuration = durationMs / steps;
          let current = 0;

          const iv = setInterval(() => {
            current += stepValue;
            if (current >= target) {
              setCount(target);
              clearInterval(iv);
            } else {
              setCount(Math.round(current));
            }
          }, stepDuration);
        }
      },
      { threshold: 0.3 },
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, durationMs, started]);

  return { ref, count, started };
}

/**
 * useMultipleCounters — Animate multiple counters together from a single container ref
 * Used by the landing page stats grid.
 */
export function useMultipleCounters(
  targets: number[],
  durationMs = 1200,
): { ref: React.RefObject<HTMLDivElement | null>; counts: number[] } {
  const ref = useRef<HTMLDivElement | null>(null);
  const [counts, setCounts] = useState<number[]>(targets.map(() => 0));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);

          const steps = 50;
          const stepDuration = durationMs / steps;
          let step = 0;

          const iv = setInterval(() => {
            step += 1;
            const progress = Math.min(step / steps, 1);
            setCounts(targets.map((t) => Math.round(t * progress)));
            if (step >= steps) clearInterval(iv);
          }, stepDuration);
        }
      },
      { threshold: 0.3 },
    );

    obs.observe(ref.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, durationMs]);

  return { ref, counts };
}
