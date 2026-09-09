"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 500, suffix: "+", label: "Cafés" },
  { value: 2, suffix: "M+", label: "Orders Processed" },
  { value: 10, prefix: "₹", suffix: "Cr+", label: "Revenue Tracked" },
  { value: 4.9, suffix: "★", label: "Merchant Rating", decimals: 1 },
];

function useAnimatedCounter(target: number, duration = 1500, decimals = 0) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Number((eased * target).toFixed(decimals)));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, decimals]);

  return { ref, count };
}

function Stat({
  value,
  prefix,
  suffix,
  label,
  decimals,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  decimals?: number;
}) {
  const { ref, count } = useAnimatedCounter(value, 1500, decimals);

  return (
    <div ref={ref} className="text-center">
      <p className="text-2xl font-bold text-white">
        {prefix}
        {count}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-slate-400">Trusted by 500+ cafés across India</p>

          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            QR ordering for restaurants
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            One QR code. Your customers scan, browse the menu, and order. No app
            downloads. No waiters needed.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/onboarding"
              className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Start Free Trial
            </Link>
            <Link
              href="/c/curry-leaf/t/T1"
              className="rounded-lg border border-slate-600 px-6 py-3 font-medium text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
            >
              See Live Demo
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {STATS.map((stat) => (
            <Stat key={stat.label} {...stat} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
          <span>GST Compliant</span>
          <span>Made in India</span>
          <span>UPI Payments</span>
          <span>24/7 Support</span>
        </div>
      </div>
    </section>
  );
}
