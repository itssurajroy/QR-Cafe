import { paise } from "@/lib/utils";
import type { CartLine } from "@/types";

interface PosCartDrawerProps {
  mobileCartOpen: boolean;
  setMobileCartOpen: (v: boolean) => void;
  cart: CartLine[];
  orderType: "dine_in" | "takeaway" | "delivery";
  selectedTable: { id: string; label: string } | null;
  clearCart: () => void;
  updateQty: (id: string, delta: number) => void;
  setItemNotes: (id: string, note: string) => void;
  
  handleParkTab: () => void;
  parkedTabs: Array<{ id: string; time: string; customer: string }>;
  handleRecallTab: (tab: any) => void;

  discountPercent: number;
  setDiscountPercent: (v: number) => void;
  flatDiscountRupees: string;
  setFlatDiscountRupees: (v: string) => void;

  subtotalPaise: number;
  discountPaise: number;
  finalTotalPaise: number;

  paymentMethod: "cash" | "upi" | "card" | "mixed";
  setPaymentMethod: (m: "cash" | "upi" | "card" | "mixed") => void;
  isSplitTender: boolean;
  setIsSplitTender: (v: boolean) => void;
  splitCashAmount: string;
  setSplitCashAmount: (v: string) => void;
  splitUpiAmount: string;
  setSplitUpiAmount: (v: string) => void;

  amountReceived: string;
  setAmountReceived: (v: string) => void;
  
  handleSettle: (status: "paid" | "unpaid") => void;
  isSettling: boolean;
}

const QUICK_TAGS = ["🌶️ Spicy", "🧀 Extra Cheese", "🚫 No Sugar", "🥣 On Side", "🧊 Extra Ice"];

export function PosCartDrawer({
  mobileCartOpen,
  setMobileCartOpen,
  cart,
  orderType,
  selectedTable,
  clearCart,
  updateQty,
  setItemNotes,
  handleParkTab,
  parkedTabs,
  handleRecallTab,
  discountPercent,
  setDiscountPercent,
  flatDiscountRupees,
  setFlatDiscountRupees,
  subtotalPaise,
  discountPaise,
  finalTotalPaise,
  paymentMethod,
  setPaymentMethod,
  isSplitTender,
  setIsSplitTender,
  splitCashAmount,
  setSplitCashAmount,
  splitUpiAmount,
  setSplitUpiAmount,
  amountReceived,
  setAmountReceived,
  handleSettle,
  isSettling,
}: PosCartDrawerProps) {
  return (
    <aside
      className={`${
        mobileCartOpen ? "fixed inset-0 z-50 flex flex-col bg-stone-950 p-4" : "hidden"
      } md:flex md:static w-full md:w-80 lg:w-96 bg-stone-900 border-l border-stone-800 flex-col shrink-0 shadow-2xl overflow-y-auto`}
    >
      <div className="p-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-950/40 shrink-0">
        <div>
          <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
            <span>🧾 Current POS Ticket</span>
            {orderType === "dine_in" && selectedTable && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {selectedTable.label}
              </span>
            )}
          </h2>
          <p className="text-[10px] text-stone-400">{cart.length} item lines</p>
        </div>
        <div className="flex gap-2 items-center">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
          {mobileCartOpen && (
            <button
              onClick={() => setMobileCartOpen(false)}
              className="md:hidden px-2.5 py-1 bg-stone-800 text-stone-200 rounded-lg text-xs font-bold"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Cart Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.map((ci) => (
          <div
            key={ci.item.id}
            className="bg-stone-950 border border-stone-800/80 rounded-xl p-2.5 space-y-1.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-white truncate">{ci.item.name}</div>
                <div className="text-[10px] text-stone-400 font-mono">
                  {paise(ci.item.price_paise)} × {ci.quantity} ={" "}
                  <span className="text-amber-400 font-bold">
                    {paise(ci.item.price_paise * ci.quantity)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => updateQty(ci.item.id, -1)}
                  className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-black flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="w-5 text-center font-mono font-bold text-xs text-white">
                  {ci.quantity}
                </span>
                <button
                  onClick={() => updateQty(ci.item.id, 1)}
                  className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-black flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Kitchen Modifier Pills */}
            <div className="flex items-center gap-1 flex-wrap pt-0.5 border-t border-stone-900">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    const current = ci.notes || "";
                    const next = current.includes(tag)
                      ? current.replace(tag, "").trim()
                      : `${current} ${tag}`.trim();
                    setItemNotes(ci.item.id, next);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-colors ${
                    ci.notes?.includes(tag)
                      ? "bg-amber-500 text-stone-950 font-black"
                      : "bg-stone-900 hover:bg-stone-800 text-stone-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        {cart.length === 0 && (
          <div className="py-16 text-center text-xs text-stone-500">
            <span className="text-2xl block mb-2">🛒</span>
            Cart is empty. Tap any dish to start billing.
          </div>
        )}
      </div>

      {/* Bill Settle Area */}
      <div className="p-3.5 bg-stone-950/80 border-t border-stone-800 space-y-3 shrink-0">
        {/* Park & Recall Row */}
        <div className="flex justify-between items-center bg-stone-900/60 p-1.5 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={handleParkTab}
            disabled={cart.length === 0}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-bold border border-stone-700 cursor-pointer disabled:opacity-50 flex items-center gap-1"
          >
            <span>🅿️ Park Tab</span>
          </button>
          {parkedTabs.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[9px] text-amber-400 font-bold">Held ({parkedTabs.length}):</span>
              {parkedTabs.map((pt) => (
                <button
                  key={pt.id}
                  onClick={() => handleRecallTab(pt)}
                  className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-[9px] font-mono font-bold border border-amber-500/30 cursor-pointer whitespace-nowrap"
                >
                  {pt.customer.slice(0, 8)} ({pt.time})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Discount Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 uppercase">
            <span>Apply Discount:</span>
            {discountPaise > 0 && (
              <button
                onClick={() => {
                  setDiscountPercent(0);
                  setFlatDiscountRupees("");
                }}
                className="text-red-400 hover:underline normal-case"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  setFlatDiscountRupees("");
                  setDiscountPercent(pct);
                }}
                className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                  discountPercent === pct && !flatDiscountRupees
                    ? "bg-amber-500 text-stone-950"
                    : "bg-stone-900 text-stone-400 hover:text-white"
                }`}
              >
                {pct}%
              </button>
            ))}
            <div className="flex items-center gap-1 bg-stone-900 px-1.5 py-0.5 rounded-md border border-stone-800">
              <span className="text-[10px] text-stone-500 font-mono">₹</span>
              <input
                type="number"
                placeholder="Flat"
                value={flatDiscountRupees}
                onChange={(e) => {
                  setDiscountPercent(0);
                  setFlatDiscountRupees(e.target.value);
                }}
                className="w-12 bg-transparent text-[10px] font-mono text-white focus:outline-none text-right"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1 text-xs pt-1 border-t border-stone-800">
          <div className="flex justify-between text-stone-400">
            <span>Subtotal:</span>
            <span className="font-mono">{paise(subtotalPaise)}</span>
          </div>
          {discountPaise > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>
                Discount {flatDiscountRupees ? `(Flat ₹${flatDiscountRupees})` : `(${discountPercent}%)`}:
              </span>
              <span className="font-mono">-{paise(discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base font-black text-white pt-1">
            <span>Total Payable:</span>
            <span className="text-amber-400 font-mono">{paise(finalTotalPaise)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                { id: "cash", label: "💵 Cash" },
                { id: "upi", label: "📱 UPI" },
                { id: "card", label: "💳 Card" },
                { id: "mixed", label: "⚡ Split" },
              ] as const
            ).map((pm) => (
              <button
                key={pm.id}
                onClick={() => {
                  setPaymentMethod(pm.id);
                  setIsSplitTender(pm.id === "mixed");
                }}
                className={`py-1.5 rounded-xl text-[10px] font-black border cursor-pointer transition-all ${
                  paymentMethod === pm.id
                    ? "bg-amber-500 text-stone-950 border-amber-400 shadow-md shadow-amber-500/20"
                    : "bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700"
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>

          {/* Mixed Tender Split Breakdown */}
          {isSplitTender && (
            <div className="p-2.5 rounded-xl bg-stone-900 border border-amber-500/30 space-y-2 animate-in fade-in">
              <div className="text-[10px] font-bold text-amber-400 uppercase">Mixed Tender Split:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">Cash Tender (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 300"
                    value={splitCashAmount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSplitCashAmount(val);
                      const rem = Math.max(0, finalTotalPaise / 100 - (parseFloat(val) || 0));
                      setSplitUpiAmount(rem > 0 ? rem.toFixed(2) : "0");
                    }}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-stone-400 block mb-0.5">UPI Tender (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={splitUpiAmount}
                    onChange={(e) => setSplitUpiAmount(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-1.5 text-xs text-emerald-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!isSplitTender && (
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-bold text-stone-400 uppercase block">
                Amount Received (₹)
              </label>
              {amountReceived && Number(amountReceived) > finalTotalPaise / 100 && (
                <span className="text-[10px] text-emerald-400 font-bold font-mono">
                  Change: ₹{(Number(amountReceived) - finalTotalPaise / 100).toFixed(2)}
                </span>
              )}
            </div>
            <input
              type="number"
              placeholder={`e.g. ${(finalTotalPaise / 100).toFixed(2)}`}
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full bg-stone-900 border border-stone-800 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
            {/* Quick Cash Tender Pills */}
            <div className="flex gap-1.5 mt-1.5 overflow-x-auto no-scrollbar">
              {[
                Math.ceil(finalTotalPaise / 100),
                100,
                200,
                500,
                1000,
                2000,
              ]
                .filter((v, i, a) => v >= finalTotalPaise / 100 && a.indexOf(v) === i)
                .slice(0, 4)
                .map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountReceived(String(val))}
                    className="px-2 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg text-[10px] font-mono font-bold text-stone-300 cursor-pointer shrink-0"
                  >
                    ₹{val}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="p-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 bg-amber-950/30 border-amber-800/50 text-amber-300">
          <span>⚠️</span>
          <span>Payment Status: {`KOT = Unpaid (collect at counter) • Pay = Paid (payment ${paymentMethod === "cash" ? "cash" : paymentMethod === "upi" ? "UPI" : "card"} received)`}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleSettle("unpaid")}
            disabled={isSettling || cart.length === 0}
            className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold text-[11px] cursor-pointer border border-amber-500/30 disabled:opacity-50"
          >
            KOT &amp; Bill Later (Unpaid)
          </button>
          <button
            onClick={() => handleSettle("paid")}
            disabled={isSettling || cart.length === 0}
            className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-[11px] cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {isSettling ? "Settling..." : `Pay ${paise(finalTotalPaise)} (Paid)`}
          </button>
        </div>
      </div>
    </aside>
  );
}
