import Link from "next/link";
import { getContent } from "@/lib/content";

const DEFAULTS = {
  eyebrow: "QR Ordering & Kitchen OS",
  headlineA: "Your table is now your",
  headlineB: "ordering counter.",
  sub: "Guests scan, browse, order and pay from their phone. Your kitchen gets the order instantly.",
  primaryCta: "Start free",
  secondaryCta: "See how it works",
  trustLine: "No credit card required · Live in 30 minutes · Cancel anytime",
  pills: [
    "QR Ordering",
    "Kitchen Display",
    "Digital Menu",
    "Inventory & POS",
  ],
};

export async function Hero() {
  const c = await getContent("cms.hero", DEFAULTS);
  const pills = c.pills?.length ? c.pills : DEFAULTS.pills;

  return (
    <section className="relative overflow-hidden bg-white pt-16 pb-20 sm:pt-24 sm:pb-28">
      {/* Subtle lavender ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#EEEAFE] opacity-50 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="inline-flex items-center gap-2 rounded-[999px] border border-[#E7E4F0] bg-[#EEEAFE] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#5738F5]">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#5738F5]" />
            {c.eyebrow}
          </p>

          {/* Headline — 64px desktop, 40px mobile */}
          <h1 className="mt-6 text-[40px] font-extrabold tracking-tight text-[#17142B] sm:text-[56px] lg:text-[64px] leading-[1.05]">
            {c.headlineA}{" "}
            <span className="text-[#5738F5]">
              {c.headlineB}
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#6F7185] sm:text-xl">
            {c.sub}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#5738F5] px-8 py-4 text-base font-semibold text-white shadow-[0_8px_30px_rgba(87,56,245,0.25)] transition-all duration-150 hover:bg-[#4328D9] hover:shadow-[0_12px_40px_rgba(87,56,245,0.3)] active:scale-[0.98]"
            >
              {c.primaryCta}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-1 rounded-[12px] border border-[#E7E4F0] bg-white px-8 py-4 text-base font-semibold text-[#17142B] transition-all duration-150 hover:border-[#5738F5] hover:text-[#5738F5]"
            >
              {c.secondaryCta}
              <span className="text-[#5738F5]">→</span>
            </a>
          </div>

          {/* Trust line */}
          <p className="mt-5 text-sm font-medium text-[#6F7185]">
            {c.trustLine}
          </p>
        </div>

        {/* Product visual — right side on desktop */}
        <div className="mt-16 lg:absolute lg:right-8 lg:top-1/2 lg:-translate-y-1/2 lg:mt-0 lg:w-[420px]">
          <div className="rounded-[24px] border border-[#E7E4F0] bg-white p-1 shadow-[0_20px_60px_rgba(23,20,43,0.08)]">
            {/* Mini product mockup: table → phone → kitchen */}
            <div className="rounded-[20px] bg-[#EEEAFE] p-6 space-y-4">
              {/* Table QR */}
              <div className="flex items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_4px_16px_rgba(23,20,43,0.04)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEEAFE]">
                  <svg className="h-5 w-5 text-[#5738F5]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v4.5m3.375-6.75v6.75m3.375-4.5v4.5" /></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6F7185]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>SCAN</p>
                  <p className="text-sm font-semibold text-[#17142B]">Guest scans table QR</p>
                </div>
              </div>

              {/* Phone order */}
              <div className="flex items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_4px_16px_rgba(23,20,43,0.04)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEEAFE]">
                  <svg className="h-5 w-5 text-[#5738F5]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6F7185]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>ORDER</p>
                  <p className="text-sm font-semibold text-[#17142B]">Browse menu &amp; place order</p>
                </div>
              </div>

              {/* Kitchen ticket */}
              <div className="flex items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_4px_16px_rgba(23,20,43,0.04)] border-l-4 border-[#5738F5]">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EEEAFE]">
                  <svg className="h-5 w-5 text-[#5738F5]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></svg>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#6F7185]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>KITCHEN</p>
                  <p className="text-sm font-semibold text-[#17142B]">Ticket reaches kitchen instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
          {pills.map((pill) => (
            <span
              key={pill}
              className="rounded-[999px] border border-[#E7E4F0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#17142B]"
            >
              {pill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
