import { paise } from "@/lib/utils";

interface ZReportModalProps {
  showZReportModal: boolean;
  setShowZReportModal: (v: boolean) => void;
  loadingZReport: boolean;
  zReportData: any;
  liveOrders: any[];
  restaurant: any;
  openingFloat: string;
  setOpeningFloat: (v: string) => void;
}

export function ZReportModal({
  showZReportModal,
  setShowZReportModal,
  loadingZReport,
  zReportData,
  liveOrders,
  restaurant,
  openingFloat,
  setOpeningFloat,
}: ZReportModalProps) {
  if (!showZReportModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto no-print"
      onClick={() => setShowZReportModal(false)}
    >
      <div
        className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl my-8 text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📑 Shift Day-End Z-Report</span>
            </h3>
            <p className="text-[11px] text-stone-400 font-mono">
              Daily Register Reconciliation •{" "}
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <button
            onClick={() => setShowZReportModal(false)}
            className="text-stone-400 hover:text-white text-xs px-2"
          >
            ✕
          </button>
        </div>

        {loadingZReport ? (
          <div className="py-12 text-center text-xs text-stone-500 font-mono animate-pulse">
            Fetching register transactions…
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Financial Summary Grid */}
            {(() => {
              const m = zReportData?.metrics || {};
              const todayRev = m.todayRevenuePaise || 0;
              const todayCash = m.todayCashPaise || 0;
              const todayUpi = m.todayUpiPaise || 0;
              const todayCard = m.todayCardPaise || 0;
              const floatRupees = parseFloat(openingFloat) || 0;
              const expectedCashInDrawer = floatRupees + todayCash / 100;
              const taxRate = Number(restaurant?.tax_rate || 5);
              const cgst = Math.round((todayRev * (taxRate / 2)) / 100);
              const sgst = cgst;

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
                      <span className="text-[9px] text-stone-500 uppercase font-bold block">Today Orders</span>
                      <span className="text-base font-black font-mono text-white">
                        {m.todayPaidCount ?? liveOrders.length ?? 0}
                      </span>
                    </div>
                    <div className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
                      <span className="text-[9px] text-stone-500 uppercase font-bold block">Cash Collected</span>
                      <span className="text-base font-black font-mono text-emerald-400">
                        {paise(todayCash)}
                      </span>
                    </div>
                    <div className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
                      <span className="text-[9px] text-stone-500 uppercase font-bold block">UPI Payments</span>
                      <span className="text-base font-black font-mono text-purple-400">
                        {paise(todayUpi)}
                      </span>
                    </div>
                    <div className="bg-stone-950 p-2.5 rounded-2xl border border-stone-800">
                      <span className="text-[9px] text-stone-500 uppercase font-bold block">Total Today Sale</span>
                      <span className="text-base font-black font-mono text-amber-400">
                        {paise(todayRev)}
                      </span>
                    </div>
                  </div>

                  {/* Cash Drawer Reconciliation */}
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      <span>💵 Cash Drawer Reconciliation</span>
                      <span className="font-mono">Opening Float</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[9px] text-stone-400 block mb-1">Opening Cash Float (₹)</label>
                        <input
                          type="number"
                          value={openingFloat}
                          onChange={(e) => setOpeningFloat(e.target.value)}
                          className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2 text-xs text-white font-mono"
                          placeholder="2000"
                        />
                      </div>

                      <div className="bg-stone-900/80 p-2 rounded-xl border border-stone-800 flex flex-col justify-center">
                        <span className="text-[9px] text-stone-400 block">Expected In Cash Drawer:</span>
                        <span className="text-sm font-black font-mono text-emerald-400">
                          ₹{expectedCashInDrawer.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-stone-400">
                      <span>CGST @ {taxRate / 2}%:</span>
                      <span>{paise(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-stone-400">
                      <span>SGST @ {taxRate / 2}%:</span>
                      <span>{paise(sgst)}</span>
                    </div>
                    {todayCard > 0 && (
                      <div className="flex justify-between text-stone-400">
                        <span>Card POS Settlements:</span>
                        <span>{paise(todayCard)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-300 font-bold pt-1 border-t border-stone-800">
                      <span>Net Today Sales (Gross):</span>
                      <span className="text-emerald-400 font-mono">{paise(todayRev)}</span>
                    </div>
                  </div>

                  {/* Top Selling */}
                  {zReportData?.topItems && zReportData.topItems.length > 0 && (
                    <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                        🔥 Top Selling Dishes Today
                      </span>
                      <div className="space-y-1">
                        {zReportData.topItems.map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-stone-300">
                              {idx + 1}. {it.name}
                            </span>
                            <span className="font-mono text-amber-400 font-bold">
                              {it.count} sold ({paise(it.revenue)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs cursor-pointer shadow-md"
              >
                Print Z-Report Slip 🖨️
              </button>
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
