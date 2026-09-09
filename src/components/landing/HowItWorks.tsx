const STEPS = [
  {
    number: "1",
    title: "Set up your menu",
    description:
      "Add your menu items, categories, and prices. Or import from a CSV in one click.",
    menuItems: [
      { name: "Masala Chai", price: "₹40" },
      { name: "Sandwich", price: "₹120" },
      { name: "Cold Coffee", price: "₹80" },
    ],
  },
  {
    number: "2",
    title: "Print QR codes",
    description:
      "Each table gets a unique QR code. Print them and place them on tables.",
    table: "Table T1",
  },
  {
    number: "3",
    title: "Start taking orders",
    description:
      "Customers scan, order, and pay. You see everything on your dashboard.",
    order: "Order #A-1234 — 2 items — ₹200",
  },
];

const QR_CELLS = [
  1, 0, 1, 0, 1,
  0, 1, 1, 1, 0,
  1, 1, 0, 1, 1,
  0, 1, 1, 0, 0,
  1, 0, 1, 0, 1,
];

function MenuVisual({ items }: { items: { name: string; price: string }[] }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              {item.name}
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {item.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QRVisual({ table }: { table: string }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="grid grid-cols-5 gap-0.5">
          {QR_CELLS.map((filled, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-sm ${
                filled ? "bg-slate-800" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500">{table}</p>
      </div>
    </div>
  );
}

function OrderVisual({ order }: { order: string }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">{order}</p>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            Up and running in 30 minutes. No technical setup required.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <div key={step.number} className="relative">
              {i > 0 && (
                <>
                  <div className="absolute left-5 top-0 h-full border-l border-slate-200 md:block" />
                  <div className="absolute top-5 h-px w-full border-t border-slate-200 md:hidden" />
                </>
              )}
              <div className="text-center md:text-left">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  {step.description}
                </p>
                {step.menuItems && <MenuVisual items={step.menuItems} />}
                {step.table && <QRVisual table={step.table} />}
                {step.order && <OrderVisual order={step.order} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
