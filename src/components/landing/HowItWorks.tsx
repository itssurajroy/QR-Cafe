const STEPS = [
  {
    number: "01",
    title: "Create your café",
    description: "Add menu, tables, and generate QR stands.",
  },
  {
    number: "02",
    title: "Place the QRs",
    description: "Customers scan and order from their seats.",
  },
  {
    number: "03",
    title: "Run the floor",
    description:
      "Kitchen sees tickets instantly. You track everything from the dashboard.",
  },
];

function MenuVisual() {
  const items = [
    { name: "Masala Chai", price: "\u20B940", veg: true },
    { name: "Sandwich", price: "\u20B9120", veg: true },
    { name: "Cold Coffee", price: "\u20B980", veg: true },
  ];

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-green-400" />
        <span className="text-xs font-medium text-slate-500">Menu Preview</span>
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Today&apos;s Menu
          </span>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
            3 items
          </span>
        </div>
        <div className="space-y-0">
          {items.map((item, i) => (
            <div
              key={item.name}
              className={`flex items-center justify-between py-3 ${
                i < items.length - 1 ? "border-b border-slate-50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-3.5 w-3.5 rounded-sm border-2 ${
                    item.veg
                      ? "border-green-500 bg-green-50"
                      : "border-red-500 bg-red-50"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-800">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  {item.price}
                </span>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"
                  aria-label={`Add ${item.name}`}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold text-slate-900">{"\u20B9"}240</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QRVisual() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-indigo-400" />
        <span className="text-xs font-medium text-slate-500">Scan to Order</span>
      </div>
      <div className="flex flex-col items-center p-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 blur-xl" />
          <div className="relative rounded-2xl bg-white p-4 ring-1 ring-slate-100">
            <svg className="h-32 w-32 text-slate-800" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <rect x="5" y="5" width="25" height="25" rx="3" stroke="currentColor" strokeWidth="3" />
              <rect x="10" y="10" width="15" height="15" rx="2" fill="currentColor" />
              <rect x="70" y="5" width="25" height="25" rx="3" stroke="currentColor" strokeWidth="3" />
              <rect x="75" y="10" width="15" height="15" rx="2" fill="currentColor" />
              <rect x="5" y="70" width="25" height="25" rx="3" stroke="currentColor" strokeWidth="3" />
              <rect x="10" y="75" width="15" height="15" rx="2" fill="currentColor" />
              <rect x="35" y="5" width="5" height="5" fill="currentColor" />
              <rect x="45" y="5" width="5" height="5" fill="currentColor" />
              <rect x="55" y="5" width="5" height="5" fill="currentColor" />
              <rect x="35" y="15" width="5" height="5" fill="currentColor" />
              <rect x="50" y="15" width="5" height="5" fill="currentColor" />
              <rect x="35" y="25" width="5" height="5" fill="currentColor" />
              <rect x="45" y="25" width="5" height="5" fill="currentColor" />
              <rect x="5" y="35" width="5" height="5" fill="currentColor" />
              <rect x="15" y="35" width="5" height="5" fill="currentColor" />
              <rect x="25" y="35" width="5" height="5" fill="currentColor" />
              <rect x="35" y="35" width="5" height="5" fill="currentColor" />
              <rect x="45" y="35" width="5" height="5" fill="currentColor" />
              <rect x="55" y="35" width="5" height="5" fill="currentColor" />
              <rect x="65" y="35" width="5" height="5" fill="currentColor" />
              <rect x="75" y="35" width="5" height="5" fill="currentColor" />
              <rect x="85" y="35" width="5" height="5" fill="currentColor" />
              <rect x="5" y="45" width="5" height="5" fill="currentColor" />
              <rect x="25" y="45" width="5" height="5" fill="currentColor" />
              <rect x="45" y="45" width="5" height="5" fill="currentColor" />
              <rect x="65" y="45" width="5" height="5" fill="currentColor" />
              <rect x="85" y="45" width="5" height="5" fill="currentColor" />
              <rect x="5" y="55" width="5" height="5" fill="currentColor" />
              <rect x="15" y="55" width="5" height="5" fill="currentColor" />
              <rect x="35" y="55" width="5" height="5" fill="currentColor" />
              <rect x="55" y="55" width="5" height="5" fill="currentColor" />
              <rect x="75" y="55" width="5" height="5" fill="currentColor" />
              <rect x="35" y="65" width="5" height="5" fill="currentColor" />
              <rect x="55" y="65" width="5" height="5" fill="currentColor" />
              <rect x="70" y="65" width="5" height="5" fill="currentColor" />
              <rect x="85" y="65" width="5" height="5" fill="currentColor" />
              <rect x="35" y="75" width="5" height="5" fill="currentColor" />
              <rect x="45" y="75" width="5" height="5" fill="currentColor" />
              <rect x="65" y="75" width="5" height="5" fill="currentColor" />
              <rect x="85" y="75" width="5" height="5" fill="currentColor" />
              <rect x="35" y="85" width="5" height="5" fill="currentColor" />
              <rect x="55" y="85" width="5" height="5" fill="currentColor" />
              <rect x="70" y="85" width="5" height="5" fill="currentColor" />
              <rect x="85" y="85" width="5" height="5" fill="currentColor" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm font-semibold text-slate-700">Table T1</p>
          <p className="mt-1 text-xs text-slate-400">Point camera at QR code</p>
        </div>
      </div>
    </div>
  );
}

function OrderVisual() {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="text-xs font-medium text-slate-500">Order Status</span>
      </div>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Order #A-1234</p>
            <p className="text-xs text-slate-400">Table T1 &middot; 2 min ago</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200/50">
            Preparing
          </span>
        </div>
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400">
            <span>Placed</span>
            <span>Preparing</span>
            <span>Ready</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600" />
          </div>
        </div>
        <div className="space-y-2.5">
          {[
            { name: "Masala Chai", qty: 1 },
            { name: "Sandwich", qty: 1 },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-600">
                  {item.qty}
                </span>
                <span className="text-sm text-slate-700">{item.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-sm font-bold text-slate-900">
              {"\u20B9"}200
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Live in under 30 minutes
          </h2>
        </div>

        <div className="relative mt-16">
          {/* Connector line */}
          <div
            className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                <div className="text-center md:text-left">
                  {/* Step number */}
                  <div className="mb-5 inline-flex md:ml-0">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-md" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-indigo-500/25">
                        {step.number}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {step.description}
                  </p>

                  {i === 0 && <MenuVisual />}
                  {i === 1 && <QRVisual />}
                  {i === 2 && <OrderVisual />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
