const POINTS = [
  "Fewer unnecessary steps between table and kitchen",
  "Less order confusion during rush hours",
  "Faster communication between staff and kitchen",
  "Easier menu management — changes go live instantly",
  "Better visibility into what's happening across the floor",
  "Smoother service from scan to serve",
];

export function Differentiation() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            Built for the way restaurants actually work.
          </h2>
        </div>

        <ul className="mx-auto max-w-2xl space-y-3">
          {POINTS.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 rounded-[16px] border border-[#E7E4F0] bg-white px-5 py-4 text-sm font-medium text-[#17142B] shadow-[0_4px_16px_rgba(23,20,43,0.03)]"
            >
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5738F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
