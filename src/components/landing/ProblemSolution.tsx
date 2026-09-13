// Copyright (c) 2026 QRslice. All rights reserved.
const OLD_STEPS = ["Wait for menu", "Find server", "Place order", "Write order", "Send to kitchen", "Wait", "Bill"];
const NEW_STEPS = ["SCAN", "ORDER", "KITCHEN", "SERVE"];

export function ProblemSolution() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            Restaurant ordering shouldn&apos;t slow your team down.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#6F7185] sm:text-lg">
            Most cafés run QR menus, WhatsApp orders, paper KOTs, and separate stock sheets.
            QRslice replaces them with one fast, unified system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
          {/* Old way */}
          <div className="rounded-[20px] border border-[#E7E4F0] bg-[#FAFAFA] p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6F7185] mb-6" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>
              THE OLD WAY
            </p>
            <div className="space-y-3">
              {OLD_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E7E4F0] text-[10px] font-bold text-[#6F7185]">
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#6F7185] line-through decoration-[#E7E4F0]">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QrSlice way */}
          <div className="rounded-[20px] border-2 border-[#5738F5] bg-white p-8 shadow-[0_8px_30px_rgba(87,56,245,0.08)]">
            <p className="text-xs font-bold uppercase tracking-widest text-[#5738F5] mb-6" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>
              WITH QRSLICE
            </p>
            <div className="space-y-4">
              {NEW_STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#5738F5] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span
                    className="text-base font-bold text-[#17142B]"
                    style={{ fontFamily: 'var(--font-dm-mono), monospace' }}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

