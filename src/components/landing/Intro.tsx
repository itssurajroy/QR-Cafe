import React from "react";
import { Zap } from "lucide-react";

export function Intro() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 border border-amber-200/80 rounded-full mb-6 shadow-sm">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              The Hospitality OS
            </span>
          </div>

          <h2 className="text-3xl sm:text-[2.75rem] lg:text-5xl font-black leading-[1.15] tracking-tight text-slate-900 font-[family-name:var(--font-plus-jakarta)] mb-6">
            One platform that connects your{" "}
            <span className="text-[#5738F5]">tables</span>,{" "}
            <span className="text-amber-600">kitchen</span>, and{" "}
            <span className="text-emerald-600">business</span>.
          </h2>

          <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            QRslice replaces paper chits, shouting waiters, and lost tickets with a calm, seamless digital spine
            for your entire restaurant. From scan to serve to settlement — everything flows in real-time.
          </p>
        </div>

        {/* Stats Row - Solid crisp white cards with refined accents */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-16 max-w-5xl mx-auto">
          {[
            { value: "30 min", label: "Average setup time", badge: "Fast Launch", border: "border-violet-200 hover:border-violet-400", badgeColor: "bg-violet-50 text-[#5738F5]" },
            { value: "0", label: "Apps for guests to install", badge: "Zero Friction", border: "border-amber-200 hover:border-amber-400", badgeColor: "bg-amber-50 text-amber-800" },
            { value: "₹999", label: "Flat per outlet / month", badge: "Zero Commission", border: "border-emerald-200 hover:border-emerald-400", badgeColor: "bg-emerald-50 text-emerald-800" },
            { value: "99.9%", label: "Uptime & offline sync", badge: "Always On", border: "border-sky-200 hover:border-sky-400", badgeColor: "bg-sky-50 text-sky-800" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl bg-[#FAF9F6] border ${stat.border} hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-200 text-center relative flex flex-col justify-between`}
            >
              <div className="mb-3">
                <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${stat.badgeColor}`}>
                  {stat.badge}
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-[family-name:var(--font-plus-jakarta)] tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
