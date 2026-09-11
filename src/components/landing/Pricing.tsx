import Link from "next/link";

const INCLUDED = [
  "QR ordering + live guest tracking",
  "Multi-station Kitchen Display",
  "Stock control & recipe auto-deduction",
  "Full POS + Bluetooth KOT printing",
  "Analytics, API & Webhooks",
  "Priority support",
];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            One plan. Complete system.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            No feature gates. No hidden tiers. Everything included.
          </p>
        </div>

        {/* Single plan card */}
        <div className="mx-auto mt-12 max-w-2xl">
          <div className="relative rounded-3xl bg-slate-900 p-8 text-white shadow-2xl shadow-slate-900/20 sm:p-10">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-slate-950 ring-4 ring-white">
              Every feature included
            </span>

            <h3 className="text-xl font-bold">QR Café</h3>
            <p className="mt-1 text-sm text-slate-400">
              Full QR ordering, multi-station KDS, stock control, recipes,
              POS, and analytics for independent cafés and restaurants.
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="text-5xl font-black tracking-tight">
                {"\u20B9"}999
              </span>
              <span className="pb-1.5 text-sm text-slate-400">
                / month per outlet
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-amber-300">
              Or {"\u20B9"}9,999 / year <span className="text-slate-400">(save {"\u20B9"}1,989)</span>
            </p>

            <Link
              href="/onboarding"
              className="mt-8 block w-full rounded-xl bg-amber-400 px-4 py-3.5 text-center text-base font-bold text-slate-950 transition-all duration-200 hover:bg-amber-300 hover:shadow-lg active:scale-[0.98]"
            >
              Start 14-day free trial
            </Link>
            <p className="mt-3 text-center text-xs text-slate-400">
              No credit card required · Cancel anytime · GST extra
            </p>
          </div>
        </div>

        {/* What's included */}
        <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {INCLUDED.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
              {feature}
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
          All prices per outlet · GST extra · Cancel anytime · No credit card
          for trial
        </p>
      </div>
    </section>
  );
}
