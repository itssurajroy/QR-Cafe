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
      <div className="relative rounded-[2.5rem] bg-[#17142B] p-2 shadow-[0_20px_60px_rgba(23,20,43,0.15)]">
        <div className="overflow-hidden rounded-[2rem] bg-white">
          {/* Notch */}
          <div className="flex justify-center bg-white pt-2">
            <div className="h-5 w-24 rounded-full bg-[#17142B]" />
          </div>

          {/* Screen content */}
          <div className="h-80 overflow-hidden bg-white p-4">
            {step === "scan" && (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="mb-4 h-32 w-32 rounded-[20px] border-2 border-dashed border-[#E7E4F0] bg-[#EEEAFE] flex items-center justify-center">
                  <svg className="h-12 w-12 text-[#5738F5]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  </svg>
                </div>
                <p className="text-center text-sm font-medium text-[#6F7185]">
                  Point camera at QR code
                </p>
              </div>
            )}

            {step === "menu" && (
              <div className="h-full overflow-hidden">
                <div className="mb-3 text-center font-bold text-[#17142B]">
                  Chai &amp; Snacks
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Masala Chai", price: "₹40", veg: true },
                    { name: "Paneer Sandwich", price: "₹120", veg: true },
                    { name: "Samosa", price: "₹30", veg: true },
                    { name: "Cold Coffee", price: "₹80", veg: true },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-[10px] bg-white border border-[#E7E4F0] p-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-sm border-2 ${item.veg ? "border-green-500" : "border-red-500"}`} />
                        <span className="text-sm font-medium text-[#17142B]">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[#17142B]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === "order" && (
              <div className="h-full overflow-hidden">
                <div className="mb-3 text-center font-bold text-[#17142B]">Your Order</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-[10px] bg-[#EEEAFE] p-3">
                    <span className="text-sm text-[#17142B]">Masala Chai × 2</span>
                    <span className="text-sm font-bold text-[#17142B]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>₹80</span>
                  </div>
                  <div className="flex items-center justify-between rounded-[10px] bg-[#EEEAFE] p-3">
                    <span className="text-sm text-[#17142B]">Samosa × 1</span>
                    <span className="text-sm font-bold text-[#17142B]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>₹30</span>
                  </div>
                </div>
                <div className="mt-4 rounded-[12px] bg-[#5738F5] p-3.5 text-center text-sm font-semibold text-white">
                  Place Order — ₹110
                </div>
              </div>
            )}

            {step === "kitchen" && (
              <div className="h-full overflow-hidden">
                <div className="mb-3 text-center font-bold text-[#17142B]">Kitchen Display</div>
                <div className="rounded-[12px] border border-[#E7E4F0] bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-[#17142B]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>TABLE 03</span>
                    <span className="rounded-[999px] bg-[#EEEAFE] px-2.5 py-0.5 text-xs font-bold text-[#5738F5]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>NEW</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm text-[#6F7185]">Masala Chai × 2</p>
                    <p className="text-sm text-[#6F7185]">Samosa × 1</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" className="flex-1 rounded-[10px] bg-[#5738F5] px-3 py-2 text-xs font-semibold text-white">
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center bg-white pb-2">
            <div className="h-1 w-16 rounded-full bg-[#E7E4F0]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DemoPitch() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="demo" className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5738F5] mb-3">
            Guest Experience
          </p>
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            Your menu. On their phone.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6F7185] sm:text-lg">
            Scan. Browse. Order. That&apos;s it. No app download, no waiting for a waiter.
          </p>
        </div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Steps */}
          <div className="space-y-3">
            {STEPS.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`flex w-full items-start gap-4 rounded-[16px] p-4 text-left transition-all duration-200 ${
                  activeStep === index
                    ? "bg-[#EEEAFE] border border-[#5738F5]/20"
                    : "hover:bg-[#EEEAFE]/50 border border-transparent"
                }`}
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-bold ${
                    activeStep === index
                      ? "bg-[#5738F5] text-white"
                      : "bg-[#E7E4F0] text-[#6F7185]"
                  }`}
                >
                  {step.number}
                </div>
                <div>
                  <h3 className="font-bold text-[#17142B]">{step.title}</h3>
                  <p className="mt-1 text-sm text-[#6F7185]">{step.description}</p>
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
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#5738F5] px-6 py-3.5 text-base font-semibold text-white shadow-[0_8px_30px_rgba(87,56,245,0.25)] transition-all duration-150 hover:bg-[#4328D9] active:scale-[0.98]"
          >
            Start free
            <span>→</span>
          </a>
          <p className="mt-3 text-sm text-[#6F7185]">
            Live in 30 minutes &middot; No credit card needed
          </p>
        </div>
      </div>
    </section>
  );
}
