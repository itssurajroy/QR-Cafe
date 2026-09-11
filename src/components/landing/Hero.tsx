import Link from "next/link";

const PILLS = [
  "Instant QR Menu",
  "Multi-station KDS",
  "Stock & Recipes",
  "Bluetooth KOT",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-50 pt-12 pb-14 sm:pt-16 sm:pb-20">
      {/* Light ambient mesh background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-amber-200/20 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        {/* Eyebrow */}
        <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-700">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
          Next-Gen QR Ordering &amp; Kitchen OS
        </p>

        {/* Headline */}
        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
          Run your café from one system.
          <br />
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-600 bg-clip-text text-transparent">
            QR ordering. Live kitchen. Real stock.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-xl">
          Customers scan, order, and pay from the table.
          Kitchen gets tickets instantly. You control menu, stock, and
          billing — all in one place.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Start 14-day free trial</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="#demo"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            Watch live demo
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-4 text-xs font-medium text-slate-500">
          No credit card required · Live in 30 minutes · Cancel anytime
        </p>

        {/* Micro feature pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
