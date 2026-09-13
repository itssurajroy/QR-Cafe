// Copyright (c) 2026 QRslice. All rights reserved.
const BENEFITS = [
  { label: "FAST", description: "From scan to service." },
  { label: "SIMPLE", description: "Easy for guests and staff." },
  { label: "RELIABLE", description: "Built around real restaurant workflows." },
  { label: "HOSPITALITY-FIRST", description: "Technology that stays out of the way." },
];

export function TrustBar() {
  return (
    <section className="bg-[#EEEAFE] border-y border-[#E7E4F0]">
      <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-center text-sm font-semibold text-[#6F7185] mb-10">
          Built for busy restaurants.
        </p>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.label} className="text-center">
              <p
                className="text-sm font-bold tracking-widest text-[#5738F5] mb-2"
                style={{ fontFamily: 'var(--font-dm-mono), monospace' }}
              >
                {b.label}
              </p>
              <p className="text-sm text-[#6F7185] font-medium">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

