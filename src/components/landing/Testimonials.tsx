"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    quote:
      "QR Café transformed our ordering. We reduced wait times by 40% and our staff can focus on food instead of taking orders.",
    name: "Priya Sharma",
    location: "Mumbai",
  },
  {
    quote:
      "The KDS is a game changer. Our kitchen has never been more organized. Orders flow in real-time and we never miss one.",
    name: "Rahul Verdel",
    location: "Delhi",
  },
  {
    quote:
      "Simple setup, beautiful menu, and our customers love it. We went from paper menus to digital in one afternoon.",
    name: "Anjali Mehta",
    location: "Bangalore",
  },
];

function ChevronLeft() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(next, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, next]);

  return (
    <section id="testimonials" className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Loved by café owners
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            See what our merchants have to say.
          </p>
        </div>

        <div
          className="relative mt-16"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Carousel */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${activeIndex * (100 / 3)}%)`,
              }}
            >
              {TESTIMONIALS.map((t, i) => (
                <div
                  key={i}
                  className="w-full shrink-0 px-3 sm:w-1/2 md:w-1/3"
                >
                  <div className="flex h-full flex-col bg-white p-6 rounded-2xl border border-slate-200">
                    <p className="flex-1 text-slate-600 leading-relaxed">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6">
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <p className="text-sm text-slate-500">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full bg-white p-2 shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors hidden sm:flex"
            aria-label="Previous testimonial"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full bg-white p-2 shadow-md border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors hidden sm:flex"
            aria-label="Next testimonial"
          >
            <ChevronRight />
          </button>

          {/* Dot indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  i === activeIndex ? "bg-indigo-600" : "bg-slate-300"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
