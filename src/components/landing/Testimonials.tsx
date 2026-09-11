const TESTIMONIALS = [
  {
    quote:
      "We cut order wait times by 40% in the first week. Our staff finally has time to focus on food quality instead of taking orders.",
    name: "Priya Sharma",
    role: "Owner",
    cafe: "Chai & Co., Mumbai",
    metric: "40% faster orders",
  },
  {
    quote:
      "The kitchen display changed everything. No more paper chits, no more missed orders. Our kitchen runs like clockwork now.",
    name: "Rahul Verma",
    role: "Manager",
    cafe: "Street Bites, Delhi",
    metric: "Zero missed orders",
  },
  {
    quote:
      "Set up the entire menu in one afternoon. Our customers love the QR experience — it feels modern and premium.",
    name: "Anjali Mehta",
    role: "Founder",
    cafe: "Brew House, Bangalore",
    metric: "Live same day",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium tracking-wide text-indigo-600 uppercase">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Trusted by cafe owners across India
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            From Mumbai street food to Bangalore brew houses — here&apos;s what
            cafe owners say about QRslice.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div className="mb-4 inline-flex self-start rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-100">
                {t.metric}
              </div>
              <blockquote className="flex-1 leading-relaxed text-slate-600">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-sm text-slate-500">
                  {t.role}, {t.cafe}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          * Illustrative testimonials. Metrics shown are representative of typical use
          cases and may vary by restaurant.
        </p>
      </div>
    </section>
  );
}
