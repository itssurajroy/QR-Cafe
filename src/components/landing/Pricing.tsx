import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    price: "₹0",
    cta: "Get Started",
    href: "/onboarding",
    popular: false,
    features: [
      "QR Digital Menu",
      "Live Order Viewing",
      "Table & Section Management",
      "Basic Dashboard",
      "Sound Alerts",
      "Community Support",
    ],
  },
  {
    name: "Starter",
    price: "₹499",
    cta: "Start Free Trial",
    href: "/onboarding",
    popular: false,
    features: [
      "Everything in Free",
      "Session & Multi-batch Orders",
      "Customer Tracking & Invoice",
      "KOT & Bill Printing (BT)",
      "WhatsApp Notifications",
      "Email Support",
    ],
  },
  {
    name: "Growth",
    price: "₹799",
    cta: "Start Free Trial",
    href: "/onboarding",
    popular: true,
    features: [
      "Everything in Starter",
      "Kitchen Display (KDS)",
      "Gravy & Recipe Batch Mgmt",
      "Ingredient-wise Control",
      "Stock Control & Reports",
      "Advanced Analytics",
    ],
  },
  {
    name: "Pro",
    price: "₹1099",
    cta: "Start Free Trial",
    href: "/onboarding",
    popular: false,
    features: [
      "Everything in Growth",
      "AI Menu Optimization",
      "AI Purchase & Restocking",
      "Multi-outlet Dashboard",
      "Central Menu Sync",
      "API & Webhooks",
      "Audit Logs & Tax Presets",
      "99.9% SLA",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) =>
            tier.popular ? (
              <div
                key={tier.name}
                className="relative rounded-2xl bg-indigo-600 p-6 text-white"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600">
                  Most Popular
                </span>
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-4">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm font-normal">/mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-200">
                      <span className="mt-0.5 text-white">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="mt-8 block w-full rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                >
                  {tier.cta}
                </Link>
              </div>
            ) : (
              <div
                key={tier.name}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {tier.name}
                </h3>
                <p className="mt-4">
                  <span className="text-3xl font-bold text-slate-900">
                    {tier.price}
                  </span>
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-0.5 text-indigo-600">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {tier.name === "Free" ? (
                  <Link
                    href={tier.href}
                    className="mt-8 block w-full rounded-lg bg-slate-100 px-4 py-2 text-center text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <Link
                    href={tier.href}
                    className="mt-8 block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
