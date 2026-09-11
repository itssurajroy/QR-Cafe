const CARDS = [
  {
    title: "QR Table Ordering",
    tag: "Guest Ordering",
    description:
      "Customers scan, browse, and order from their phone. No app download. Live order status. Instant kitchen ticket.",
  },
  {
    title: "Multi-station KDS",
    tag: "Kitchen",
    description:
      "Tickets appear in real time. Prep batch summary. Voice alerts. Clear stages: New → Cooking → Ready.",
  },
  {
    title: "Stock, Recipes & POS",
    tag: "Operations",
    description:
      "Auto-deduct ingredients. Low-stock alerts. Full billing, discounts, split bills, and Bluetooth KOT printing.",
  },
  {
    title: "One Dashboard",
    tag: "Control",
    description:
      "Menu, tables, QR stands, analytics, and multi-outlet view — all in one place.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Everything your café needs. Nothing you don’t.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                {card.tag}
              </span>
              <h3 className="mt-3 text-lg font-bold text-slate-900">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
