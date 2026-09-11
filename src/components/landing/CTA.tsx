import Link from "next/link";

export function CTA() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-28">
      {/* Background Mesh Glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 via-violet-200/40 to-amber-200/30 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-black text-slate-900 sm:text-5xl tracking-tight leading-tight">
          Ready to run a tighter café?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
          Join independent cafés using QR Café to cut order errors and speed
          up service.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/onboarding"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 text-base font-black text-white shadow-xl shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <span>Start your 14-day free trial</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <a
            href="mailto:support@qrcafe.app"
            className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            Questions? Talk to us
          </a>
        </div>
      </div>
    </section>
  );
}
