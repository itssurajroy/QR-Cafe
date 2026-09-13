// Copyright (c) 2026 QRslice. All rights reserved.
const STEPS = [
  {
    number: "01",
    title: "SCAN",
    description: "Guest scans the table QR.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
        <path d="M13.5 14.625v4.5m3.375-6.75v6.75m3.375-4.5v4.5" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "ORDER",
    description: "Guest browses the menu and orders.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "KITCHEN",
    description: "The kitchen receives the ticket instantly.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "SERVE",
    description: "Staff sees what needs attention.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "GROW",
    description: "Owners understand what is happening through analytics.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
];

export function ProductFlow() {
  return (
    <section id="product-flow" className="bg-[#EEEAFE]">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            One flow. Every part of service.
          </h2>
        </div>

        {/* Desktop: horizontal, Mobile: vertical */}
        <div className="relative">
          {/* Connector line — desktop only */}
          <div className="absolute top-12 left-[10%] right-[10%] hidden h-px bg-[#E7E4F0] lg:block" aria-hidden="true" />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center relative">
                {/* Icon container */}
                <div className="relative z-10 mb-5 flex h-[64px] w-[64px] items-center justify-center rounded-[20px] bg-white text-[#5738F5] shadow-[0_8px_30px_rgba(23,20,43,0.06)] border border-[#E7E4F0]">
                  {step.icon}
                </div>

                {/* Number + Title */}
                <p
                  className="text-xs font-bold tracking-widest text-[#6F7185] mb-1"
                  style={{ fontFamily: 'var(--font-dm-mono), monospace' }}
                >
                  {step.number}
                </p>
                <h3
                  className="text-lg font-bold text-[#17142B] mb-2"
                  style={{ fontFamily: 'var(--font-dm-mono), monospace' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-[#6F7185] font-medium max-w-[200px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

