const POINTS = [
  "Designed for 5–30 table independent outlets",
  "Light, fast interface for staff under pressure",
  "Real inventory and kitchen tools — not just a digital menu",
  "Works on any smartphone, tablet, or kitchen screen",
];

export function Differentiation() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Built for real café rush hours
        </h2>
        <ul className="mx-auto mt-8 max-w-2xl space-y-3 text-left">
          {POINTS.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm"
            >
              <span className="font-black text-emerald-600">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
