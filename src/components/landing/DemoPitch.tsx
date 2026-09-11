"use client";

import { useState } from "react";

const STEPS = [
  {
    number: "1",
    title: "Customer scans QR",
    description: "Points phone at QR code on table. No app download needed.",
    visual: "scan",
  },
  {
    number: "2",
    title: "Menu appears",
    description: "Sees your menu with photos, prices, and veg/non-veg tags.",
    visual: "menu",
  },
  {
    number: "3",
    title: "Places order",
    description: "Adds items, selects quantity, and submits. Order goes to kitchen instantly.",
    visual: "order",
  },
  {
    number: "4",
    title: "Kitchen receives",
    description: "Order appears on kitchen display with table number and items.",
    visual: "kitchen",
  },
];

function PhoneMockup({ step }: { step: string }) {
  return (
    <div className="relative mx-auto w-64 sm:w-72">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] bg-slate-800 p-2 shadow-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-white">
          {/* Notch */}
          <div className="flex justify-center bg-white pt-2">
            <div className="h-5 w-24 rounded-full bg-slate-800" />
          </div>

          {/* Screen content */}
          <div className="h-80 overflow-hidden bg-slate-50 p-4">
            {step === "scan" && (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-4 h-32 w-32 rounded-2xl border-4 border-dashed border-indigo-300 bg-indigo-50" />
                <p className="text-center text-sm font-medium text-slate-600">
                  Point camera at QR code
                </p>
                <div className="mt-4 flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />
                  <div className="h-2 w-2 rounded-full bg-indigo-400" />
                </div>
              </div>
            )}

            {step === "menu" && (
              <div className="h-full overflow-hidden">
                <div className="mb-3 text-center font-bold text-slate-800">
                  Chai & Snacks
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Masala Chai", price: "₹40", veg: true },
                    { name: "Sandwich", price: "₹120", veg: true },
                    { name: "Samosa", price: "₹30", veg: true },
                    { name: "Cold Coffee", price: "₹80", veg: true },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg bg-white p-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-sm border ${
                            item.veg
                              ? "border-green-500"
                              : "border-red-500"
                          }`}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {item.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "order" && (
              <div className="h-full overflow-hidden">
                <div className="mb-3 text-center font-bold text-slate-800">
                  Your Order
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <span className="text-sm text-slate-700">Masala Chai × 2</span>
                    <span className="text-sm font-bold text-slate-900">₹80</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                    <span className="text-sm text-slate-700">Samosa × 1</span>
                    <span className="text-sm font-bold text-slate-900">₹30</span>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-indigo-600 p-3 text-center text-sm font-semibold text-white">
                  Place Order — ₹110
                </div>
              </div>
            )}

            {step === "kitchen" && (
              <div className="h-full overflow-hidden">
                <div className="mb-3 text-center font-bold text-slate-800">
                  Kitchen Display
                </div>
                <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">
                      Table 3
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      New
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-slate-600">Masala Chai × 2</p>
                    <p className="text-sm text-slate-600">Samosa × 1</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-green-500 px-3 py-1 text-xs font-medium text-white"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="rounded bg-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      5 min
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center bg-white pb-2">
            <div className="h-1 w-16 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      {/* QR code on table (only for scan step) */}
      {step === "scan" && (
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 rotate-12">
          <div className="rounded-lg bg-white p-2 shadow-lg">
            <div className="grid grid-cols-5 gap-0.5">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 ${
                    [0, 1, 2, 4, 5, 6, 10, 12, 14, 18, 20, 22, 23, 24].includes(i)
                      ? "bg-slate-800"
                      : "bg-white"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-center text-[10px] text-slate-400">
            Table 3
          </p>
        </div>
      )}
    </div>
  );
}

export function DemoPitch() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="demo" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
            See it in action
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            How your customers will order
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Scan. Browse. Order. That&apos;s it. No app download, no waiting
            for a waiter, no confusion.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Steps */}
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`flex w-full items-start gap-4 rounded-xl p-4 text-left transition-all ${
                  activeStep === index
                    ? "bg-indigo-50 ring-1 ring-indigo-200"
                    : "hover:bg-slate-50"
                }`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    activeStep === index
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {step.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center">
            <PhoneMockup step={STEPS[activeStep]!.visual} />
          </div>
        </div>

        {/* CTA below demo */}
        <div className="mt-16 text-center">
          <a
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/30 active:scale-[0.98]"
          >
            Set Up Your Menu — Free
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
          <p className="mt-3 text-sm text-slate-500">
            Live in 30 minutes &middot; No credit card needed
          </p>
        </div>
      </div>
    </section>
  );
}
