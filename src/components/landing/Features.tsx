import {
  QrCodeIcon,
  BellIcon,
  MessageCircleIcon,
  CreditCardIcon,
  PrinterIcon,
  SearchIcon,
} from "@/components/Icons";

const FEATURES = [
  {
    icon: QrCodeIcon,
    title: "QR Menu & Ordering",
    description:
      "Customers scan a QR code at their table, browse your menu, and place orders instantly. No app downloads required.",
  },
  {
    icon: BellIcon,
    title: "Live Kitchen Display",
    description:
      "Real-time kitchen board with status tracking. Orders flow from pending to ready with sound alerts.",
  },
  {
    icon: MessageCircleIcon,
    title: "WhatsApp Notifications",
    description:
      "Send order status updates and bill PDFs directly to customers on WhatsApp.",
  },
  {
    icon: CreditCardIcon,
    title: "POS Terminal",
    description:
      "Fast cash POS for walk-in customers. Bluetooth receipt printing, UPI QR payments.",
  },
  {
    icon: PrinterIcon,
    title: "GST Invoicing",
    description:
      "Auto-generated GST-compliant bills with HSN codes, tax breakdown, and thermal printer support.",
  },
  {
    icon: SearchIcon,
    title: "Analytics Dashboard",
    description:
      "Track revenue, bestsellers, peak hours, and customer ratings. Data-driven decisions for your café.",
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Everything your restaurant needs
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            From QR ordering to kitchen management — one platform that handles it
            all.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300"
              >
                <Icon className="mb-4 h-10 w-10 text-indigo-600" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
