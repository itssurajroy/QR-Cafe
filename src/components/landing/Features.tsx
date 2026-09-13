// Copyright (c) 2026 QRslice. All rights reserved.
const CARDS = [
  {
    title: "QR Ordering",
    icon: "📱",
    description: "Guests scan, browse, and order from their phone. No app download needed.",
  },
  {
    title: "Digital Menu",
    icon: "📋",
    description: "Beautiful menus with photos, prices, and dietary tags. Update instantly.",
  },
  {
    title: "Kitchen Display",
    icon: "🍳",
    description: "Orders appear in real time with table numbers, items, and status tracking.",
  },
  {
    title: "Table Management",
    icon: "🪑",
    description: "See which tables are active, waiting, or available at a glance.",
  },
  {
    title: "Menu Management",
    icon: "✏️",
    description: "Add items, set availability, organise categories. Changes go live instantly.",
  },
  {
    title: "Inventory",
    icon: "📦",
    description: "Auto-deduct ingredients. Low-stock alerts. Recipe-based stock control.",
  },
  {
    title: "Billing",
    icon: "🧾",
    description: "GST invoicing, split bills, discounts, and Bluetooth KOT printing.",
  },
  {
    title: "Analytics",
    icon: "📊",
    description: "Revenue, popular items, peak hours, and order trends in one dashboard.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5738F5] mb-3">Platform</p>
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            Everything your café needs.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="flex flex-col rounded-[20px] border border-[#E7E4F0] bg-white p-6 shadow-[0_8px_30px_rgba(23,20,43,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(23,20,43,0.08)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EEEAFE] text-2xl mb-5">
                {card.icon}
              </div>
              <h3 className="text-base font-bold text-[#17142B] mb-2">
                {card.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#6F7185]">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

