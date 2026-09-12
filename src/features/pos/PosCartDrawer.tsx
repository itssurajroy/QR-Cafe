// Copyright (c) 2026 QRslice. All rights reserved.
import { useState } from "react";
import { paise } from "@/lib/utils";
import type { CartLine } from "@/types";
import { CreditCardIcon } from "@/components/Icons";

interface PosCartDrawerProps {
  mobileCartOpen: boolean;
  setMobileCartOpen: (v: boolean) => void;
  cart: CartLine[];
  orderType: "dine_in" | "takeaway" | "delivery";
  setOrderType: (v: "dine_in" | "takeaway" | "delivery") => void;
  selectedTable: { id: string; label: string } | null;
  setSelectedTable: (t: any) => void;
  clearCart: () => void;
  updateQty: (id: string, delta: number) => void;
  setItemNotes: (id: string, note: string) => void;

  handleParkTab: () => void;
  parkedTabs: Array<{ id: string; time: string; customer: string; cart: CartLine[] }>;
  handleRecallTab: (tab: { id: string; time: string; customer: string; cart: CartLine[] }) => void;

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

  liveOrders?: any[];
  handleUpdateOrderStatus?: (id: string, status: string, orderNumber: string, tableLabel: string) => void;
}

const QUICK_TAGS = ["🌶️ Spicy", "🧀 Extra Cheese", "🚫 No Sugar", "🥣 On Side", "🧊 Extra Ice"];

export function PosCartDrawer({
  mobileCartOpen,
  setMobileCartOpen,
  cart,
  orderType,
  setOrderType,
  selectedTable,
  setSelectedTable,
  clearCart,
  updateQty,
  setItemNotes,
  handleParkTab,
  parkedTabs: _parkedTabs,
  handleRecallTab: _handleRecallTab,
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
  liveOrders,
  handleUpdateOrderStatus,
}: PosCartDrawerProps) {
  const [splitGuests, setSplitGuests] = useState<number>(1);
  const [gstin, setGstin] = useState<string>("");
  const [isRushKOT, setIsRushKOT] = useState<boolean>(false);

  // Filter active KDS orders for current table
  const activeTableOrders = selectedTable && liveOrders
    ? liveOrders.filter(
        (o) => o.table_label === selectedTable.label && o.status !== "served" && o.status !== "cancelled"
      )
    : [];

  return (
    <aside
      className={`${
        mobileCartOpen ? "fixed inset-0 z-50 flex flex-col bg-white p-4" : "hidden"
      } md:flex md:static w-full md:w-80 lg:w-96 bg-white border-l border-black/[0.06] flex-col shrink-0 shadow-xs overflow-y-auto`}
    >
      <div className="p-3.5 border-b border-black/[0.06] flex items-center justify-between bg-[#F5F5F7]/80 backdrop-blur-md shrink-0">
        <div>
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span>Register Ticket</span>
            {orderType === "dine_in" && selectedTable && (
              <span className="px-2.5 py-0.5 rounded-full text-xs bg-[#007AFF]/10 text-[#007AFF] font-bold border border-[#007AFF]/20">
                {selectedTable.label}
              </span>
            )}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{cart.length} item lines</p>
        </div>
        <div className="flex gap-2 items-center">
          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-[#FF3B30] hover:text-[#FF3B30]/80 font-bold cursor-pointer transition-colors p-1"
            >
              Clear
            </button>
          )}
          {mobileCartOpen && (
            <button
              type="button"
              onClick={() => setMobileCartOpen(false)}
              className="md:hidden px-3 py-1.5 bg-black/[0.05] text-slate-800 rounded-xl text-xs font-semibold min-h-[44px]"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* ORDER TYPE SELECTOR */}
      <div className="px-3 pt-3 shrink-0">
        <div className="flex bg-black/[0.04] p-1 rounded-2xl text-xs font-semibold text-slate-600">
          {(
            [
              { id: "dine_in", label: "Dine-in" },
              { id: "takeaway", label: "Takeaway" },
              { id: "delivery", label: "Delivery" },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setOrderType(o.id);
                if (o.id !== "dine_in") setSelectedTable(null);
              }}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                orderType === o.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* LIVE KDS KITCHEN STREAM MONITOR FOR SELECTED TABLE */}
      {selectedTable && activeTableOrders.length > 0 && (
        <div className="p-3 bg-amber-50/90 border-b border-amber-200 space-y-2 text-xs shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-amber-950 flex items-center gap-1.5">
              <span>👨‍🍳 Kitchen Live Sync Stream</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold text-[10px]">
                {selectedTable.label} ({activeTableOrders.length})
              </span>
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {activeTableOrders.map((ord) => {
              const isReady = ord.status === "ready";
              return (
                <div
                  key={ord.id}
                  className="p-2 bg-white rounded-xl border border-amber-200 flex items-center justify-between gap-2 shadow-sm"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <span>Order #{ord.order_number}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isReady
                            ? "bg-emerald-500 text-white animate-pulse"
                            : ord.status === "preparing"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isReady ? "🛎️ READY TO SERVE" : ord.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {ord.items?.length || 0} items in kitchen
                    </div>
                  </div>

                  {isReady && handleUpdateOrderStatus && (
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateOrderStatus(
                          ord.id,
                          "served",
                          String(ord.order_number),
                          String(ord.table_label || "")
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-sm active:scale-95 whitespace-nowrap shrink-0"
                    >
                      ✓ Serve Table
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cart Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
        {cart.map((ci) => (
          <div
            key={ci.item.id}
            className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 text-xs shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-bold text-slate-900 truncate">{ci.item.name}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {paise(ci.item.price_paise)} × {ci.quantity} ={" "}
                  <span className="text-indigo-600 font-bold">
                    {paise(ci.item.price_paise * ci.quantity)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQty(ci.item.id, -1)}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 text-base border border-slate-200"
                >
                  -
                </button>
                <span className="w-6 text-center font-mono font-bold text-xs text-slate-900">
                  {ci.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQty(ci.item.id, 1)}
                  className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center justify-center cursor-pointer transition-all active:scale-95 text-base shadow-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Kitchen Modifier Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-slate-100">
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
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all active:scale-95 ${
                    ci.notes?.includes(tag)
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                      : "bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        {cart.length === 0 && (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <CreditCardIcon className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-slate-500 font-medium">Cart is empty. Tap any dish to start billing.</p>
          </div>
        )}
      </div>

      {/* Bill Settle Area */}
      <div className="p-3.5 bg-white border-t border-slate-200 space-y-3 shrink-0">
        {/* Corporate GSTIN Input Field */}
        <div className="text-xs">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">💼 B2B GSTIN (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 27AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-500 font-bold"
          />
        </div>

        {/* Rush KOT Toggle & Park Tab Row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsRushKOT(!isRushKOT)}
            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer min-h-[40px] flex items-center justify-center gap-1.5 active:scale-95 ${
              isRushKOT
                ? "bg-red-600 text-white border-red-500 shadow-md animate-pulse"
                : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300"
            }`}
          >
            <span>🔥 Rush KOT</span>
          </button>

          <button
            type="button"
            onClick={handleParkTab}
            disabled={cart.length === 0}
            className="flex-1 py-2 px-3 min-h-[40px] rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-300 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <span>Park Tab (F8)</span>
          </button>
        </div>

        {/* Discount Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Apply Discount:</span>
            {discountPaise > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDiscountPercent(0);
                  setFlatDiscountRupees("");
                }}
                className="text-red-600 hover:underline normal-case cursor-pointer font-bold"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => {
                  setFlatDiscountRupees("");
                  setDiscountPercent(pct);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold cursor-pointer transition-all active:scale-95 min-h-[36px] ${
                  discountPercent === pct && !flatDiscountRupees
                    ? "bg-[#007AFF] text-white font-bold shadow-xs"
                    : "bg-black/[0.03] border border-black/[0.04] text-slate-600 hover:bg-black/[0.06]"
                }`}
              >
                {pct}%
              </button>
            ))}
            <div className="flex items-center gap-1 bg-black/[0.03] px-2.5 py-1 rounded-xl border border-black/[0.04] min-h-[36px]">
              <span className="text-xs text-slate-400 font-mono">₹</span>
              <input
                type="number"
                placeholder="Flat"
                value={flatDiscountRupees}
                onChange={(e) => {
                  setDiscountPercent(0);
                  setFlatDiscountRupees(e.target.value);
                }}
                className="w-14 bg-transparent text-xs font-mono text-slate-900 focus:outline-none text-right font-bold"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs pt-2.5 border-t border-black/[0.06]">
          <div className="flex justify-between text-slate-500 font-medium">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-slate-700">{paise(subtotalPaise)}</span>
          </div>
          {discountPaise > 0 && (
            <div className="flex justify-between text-[#34C759] font-semibold">
              <span>
                Discount {flatDiscountRupees ? `(Flat ₹${flatDiscountRupees})` : `(${discountPercent}%)`}:
              </span>
              <span className="font-mono">-{paise(discountPaise)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm sm:text-base font-bold text-slate-900 pt-1">
            <span>Total Payable:</span>
            <span className="text-[#007AFF] font-mono font-bold">{paise(finalTotalPaise)}</span>
          </div>
        </div>

        {/* Split Bill per Guest Calculator */}
        <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.04] space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-slate-700">
            <span>👥 Split per Guest:</span>
            {splitGuests > 1 && (
              <span className="font-mono text-[#007AFF] font-bold text-sm">
                {paise(Math.round(finalTotalPaise / splitGuests))} / guest
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setSplitGuests(num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                  splitGuests === num
                    ? "bg-[#007AFF] text-white border-[#007AFF] shadow-xs font-bold"
                    : "bg-white text-slate-700 border-black/[0.06] hover:bg-slate-50"
                }`}
              >
                {num === 1 ? "1 Guest" : `${num} Guests`}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                { id: "cash", label: "Cash" },
                { id: "upi", label: "UPI" },
                { id: "card", label: "Card" },
                { id: "mixed", label: "Split" },
              ] as const
            ).map((pm) => {
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => {
                    setPaymentMethod(pm.id);
                    setIsSplitTender(pm.id === "mixed");
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all active:scale-95 min-h-[44px] ${
                    isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs font-bold"
                      : "bg-[#F5F5F7] border-black/[0.04] text-slate-700 hover:bg-black/[0.06]"
                  }`}
                >
                  {pm.label}
                </button>
              );
            })}
          </div>

          {/* Mixed Tender Split Breakdown */}
          {isSplitTender && (
            <div className="p-3 rounded-2xl bg-[#F5F5F7] border border-black/[0.06] space-y-2 animate-in fade-in">
              <div className="text-xs font-semibold text-[#007AFF] uppercase tracking-wider">Mixed Tender Split:</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Cash Tender (₹)</label>
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
                    className="w-full bg-white border border-black/[0.08] rounded-xl p-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007AFF] font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">UPI Tender (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={splitUpiAmount}
                    onChange={(e) => setSplitUpiAmount(e.target.value)}
                    className="w-full bg-white border border-black/[0.08] rounded-xl p-2 text-xs text-[#34C759] font-mono focus:outline-none focus:border-[#34C759] font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!isSplitTender && (
          <div className="pt-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-500 uppercase block">
                Amount Received (₹)
              </label>
              {amountReceived && Number(amountReceived) > finalTotalPaise / 100 && (
                <span className="text-xs text-[#34C759] font-bold font-mono">
                  Change: ₹{(Number(amountReceived) - finalTotalPaise / 100).toFixed(2)}
                </span>
              )}
            </div>
            <input
              type="number"
              placeholder={`e.g. ${(finalTotalPaise / 100).toFixed(2)}`}
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#007AFF] focus:bg-white min-h-[44px] transition-all font-bold shadow-xs"
            />
            {amountReceived && Number(amountReceived) > 0 && (
              <p className="text-[11px] font-semibold text-slate-600">
                Change due: ₹{Math.max(0, Number(amountReceived) * 100 - finalTotalPaise) / 100}
                {Number(amountReceived) * 100 < finalTotalPaise ? " (short — collect more)" : ""}
              </p>
            )}
            {/* Quick Cash Tender Pills */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
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
                    className="px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.04] rounded-xl text-xs font-mono font-semibold text-slate-800 cursor-pointer shrink-0 min-h-[36px] active:scale-95 transition-all"
                  >
                    ₹{val}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => handleSettle("unpaid")}
            disabled={isSettling || cart.length === 0}
            className="flex-1 py-3.5 rounded-2xl bg-black/[0.05] hover:bg-black/[0.08] text-slate-700 font-semibold text-xs cursor-pointer border border-transparent disabled:opacity-40 min-h-[46px] transition-all active:scale-95"
          >
            KOT & Bill Later
          </button>
          <button
            type="button"
            onClick={() => handleSettle("paid")}
            disabled={isSettling || cart.length === 0}
            className="flex-1 py-3.5 rounded-2xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs cursor-pointer shadow-sm disabled:opacity-40 min-h-[46px] transition-all active:scale-95"
          >
            {isSettling ? "Settling..." : `Pay ${paise(finalTotalPaise)} (F4)`}
          </button>
        </div>
      </div>
    </aside>
  );
}
