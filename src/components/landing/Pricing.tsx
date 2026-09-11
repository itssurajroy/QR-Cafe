import Link from "next/link";
import { getContent } from "@/lib/content";

const DEFAULTS = {
  name: "QrSlice",
  monthly: 999,
  yearly: 9999,
  bullets: [
    "QR ordering + live guest tracking",
    "Multi-station Kitchen Display",
    "Stock control & recipe auto-deduction",
    "Full POS + Bluetooth KOT printing",
    "Analytics, API & Webhooks",
    "Priority support",
  ],
  trialText: "Start free",
  fineprint: "All prices per outlet · GST extra · Cancel anytime · No credit card for trial",
};

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export async function Pricing() {
  const c = await getContent("cms.pricing", DEFAULTS);
  const bullets = c.bullets?.length ? c.bullets : DEFAULTS.bullets;

  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5738F5] mb-3">Pricing</p>
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            One plan. Complete system.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6F7185] sm:text-lg">
            No feature gates. No hidden tiers. Everything included.
          </p>
        </div>

        {/* Single plan card */}
        <div className="mx-auto max-w-lg">
          <div className="relative rounded-[24px] bg-[#17142B] p-8 text-white shadow-[0_20px_60px_rgba(23,20,43,0.2)] sm:p-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-[999px] bg-[#EEEAFE] px-4 py-1.5 text-xs font-bold text-[#5738F5] uppercase tracking-widest">
              Everything included
            </span>

            <h3 className="text-xl font-bold mt-2">{c.name}</h3>
            <p className="mt-2 text-sm text-white/50">
              Full QR ordering, kitchen display, stock control, POS, and analytics.
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="text-5xl font-extrabold tracking-tight" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>
                {"\u20B9"}{c.monthly.toLocaleString("en-IN")}
              </span>
              <span className="pb-1.5 text-sm text-white/50">
                / month per outlet
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-[#EEEAFE]">
              Or {"\u20B9"}{c.yearly.toLocaleString("en-IN")} / year{" "}
              <span className="text-white/40">
                (save {"\u20B9"}{(c.monthly * 12 - c.yearly).toLocaleString("en-IN")})
              </span>
            </p>

            <Link
              href="/onboarding"
              className="mt-8 block w-full rounded-[12px] bg-[#5738F5] px-4 py-4 text-center text-base font-semibold text-white transition-all duration-150 hover:bg-[#4328D9] active:scale-[0.98]"
            >
              {c.trialText}
            </Link>
            <p className="mt-3 text-center text-xs text-white/40">
              No credit card required · Cancel anytime
            </p>
          </div>
        </div>

        {/* What's included */}
        <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {bullets.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 rounded-[16px] border border-[#E7E4F0] bg-white px-4 py-3 text-sm font-medium text-[#17142B] shadow-[0_4px_16px_rgba(23,20,43,0.03)]"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5738F5]" />
              {feature}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[#6F7185]">
          {c.fineprint}
        </p>
      </div>
    </section>
  );
}
