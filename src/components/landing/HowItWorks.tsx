import React from "react";
import { ClipboardList, QrCode, Rocket } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: ClipboardList,
    title: "Set up your menu",
    description:
      "Add dishes with photos, prices, veg/non-veg marks, and descriptions. Organize by category. Takes about 15 minutes.",
    color: "bg-amber-50 border-amber-200/60",
    accentColor: "text-amber-700",
    iconBg: "bg-amber-100",
    numberColor: "text-amber-300",
  },
  {
    number: "02",
    icon: QrCode,
    title: "Print table QR codes",
    description:
      "Generate and print unique QR codes for each table. Stick them on standees, table tents, or placemats.",
    color: "bg-violet-50 border-violet-200/60",
    accentColor: "text-violet-700",
    iconBg: "bg-violet-100",
    numberColor: "text-violet-300",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go live.",
    description:
      "Guests scan and order. Kitchen gets live tickets. You watch orders, revenue, and analytics flow in real-time.",
    color: "bg-emerald-50 border-emerald-200/60",
    accentColor: "text-emerald-700",
    iconBg: "bg-emerald-100",
    numberColor: "text-emerald-300",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white relative overflow-hidden border-y border-slate-100">
      {/* Background ambient gradient accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-50/60 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-50 border border-violet-200/80 rounded-full mb-4 shadow-sm">
            <Rocket className="w-4 h-4 text-[#5738F5]" />
            <span className="text-xs font-bold text-[#5738F5] uppercase tracking-wider">
              30-Minute Launch
            </span>
          </div>
          <h2 className="text-3xl sm:text-[2.75rem] font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-4">
            Live in <span className="text-[#5738F5]">three steps</span>. Not three months.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
            No expensive hardware to buy, no proprietary terminals, no technician visits needed.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative p-8 rounded-3xl bg-[#FAF9F6] border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-slate-200/60 hover:bg-white hover:border-[#5738F5]/30 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                {/* Large step number watermark */}
                <div className="absolute top-4 right-6 text-6xl font-black text-slate-200 font-[family-name:var(--font-plus-jakarta)] select-none pointer-events-none">
                  {step.number}
                </div>

                <div>
                  <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center mb-6 relative z-10 border border-black/[0.04]`}>
                    <Icon className={`w-7 h-7 ${step.accentColor}`} />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 font-[family-name:var(--font-plus-jakarta)] relative z-10">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed relative z-10">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
