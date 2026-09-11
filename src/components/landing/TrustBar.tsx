const POINTS = [
  "500+ dishes pre-loaded",
  "Real-time kitchen",
  "Works on any phone",
];

export function TrustBar() {
  return (
    <section className="border-y border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-slate-500">
          Trusted by independent cafés and restaurants across India
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {POINTS.map((point) => (
            <span
              key={point}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
            >
              <span className="font-black text-emerald-600">✓</span>
              {point}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
