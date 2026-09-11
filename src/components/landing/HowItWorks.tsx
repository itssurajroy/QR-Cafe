export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-[#EEEAFE]">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-bold uppercase tracking-widest text-[#5738F5] mb-3">
            Kitchen OS
          </p>
          <h2 className="text-[30px] font-extrabold text-[#17142B] sm:text-[42px] leading-[1.1]">
            Orders that reach the kitchen instantly.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6F7185] sm:text-lg">
            No paper chits, no shouting across the room. Every order flows to the right station.
          </p>
        </div>

        {/* Kitchen Display Mockup */}
        <div className="max-w-3xl mx-auto">
          <div className="rounded-[24px] border border-[#E7E4F0] bg-white p-1 shadow-[0_20px_60px_rgba(23,20,43,0.08)]">
            {/* KDS header bar */}
            <div className="rounded-t-[20px] bg-[#17142B] px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-bold text-white/60" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>
                  KITCHEN DISPLAY
                </span>
              </div>
              <span className="rounded-[999px] bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>
                ● LIVE
              </span>
            </div>

            {/* KDS content */}
            <div className="rounded-b-[20px] bg-white p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* New order */}
                <div className="rounded-[16px] border-2 border-[#5738F5] bg-[#EEEAFE] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-[999px] bg-[#5738F5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>NEW</span>
                    <span className="text-xs font-bold text-[#6F7185]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>02:41</span>
                  </div>
                  <p className="text-sm font-bold text-[#17142B] mb-1" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>TABLE 08</p>
                  <p className="text-xs text-[#6F7185] mb-3" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>ORDER #1842 · 2 ITEMS</p>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm text-[#17142B]">Butter Chicken</p>
                    <p className="text-sm text-[#17142B]">Garlic Naan × 2</p>
                  </div>
                  <button type="button" className="w-full rounded-[10px] bg-[#5738F5] py-2.5 text-xs font-semibold text-white">
                    Accept
                  </button>
                </div>

                {/* Preparing */}
                <div className="rounded-[16px] border border-[#E7E4F0] bg-white p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-[999px] bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>PREPARING</span>
                    <span className="text-xs font-bold text-[#6F7185]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>05:12</span>
                  </div>
                  <p className="text-sm font-bold text-[#17142B] mb-1" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>TABLE 03</p>
                  <p className="text-xs text-[#6F7185] mb-3" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>ORDER #1839 · 3 ITEMS</p>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm text-[#17142B]">Masala Chai × 2</p>
                    <p className="text-sm text-[#17142B]">Samosa × 1</p>
                  </div>
                  <button type="button" className="w-full rounded-[10px] border border-[#E7E4F0] bg-white py-2.5 text-xs font-semibold text-[#17142B]">
                    Mark Ready
                  </button>
                </div>

                {/* Ready */}
                <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="rounded-[999px] bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>READY</span>
                    <span className="text-xs font-bold text-[#6F7185]" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>08:30</span>
                  </div>
                  <p className="text-sm font-bold text-[#17142B] mb-1" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>TABLE 01</p>
                  <p className="text-xs text-[#6F7185] mb-3" style={{ fontFamily: 'var(--font-dm-mono), monospace' }}>ORDER #1836 · 1 ITEM</p>
                  <div className="space-y-1.5 mb-4">
                    <p className="text-sm text-[#17142B]">Cold Coffee</p>
                  </div>
                  <button type="button" className="w-full rounded-[10px] bg-emerald-500 py-2.5 text-xs font-semibold text-white">
                    Served ✓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
