"use client";

import { ShoppingBagIcon } from "@/components/Icons";
import { paise } from "@/lib/utils";
import type { CartLine } from "@/types";

interface MenuCartDrawerProps {
  cartOpen: boolean;
  onClose: () => void;
  cartLines: CartLine[];
  tableLabel: string;
  restaurantName: string;
  totalQty: number;
  totalPaise: number;
  loyaltyPoints: number;
  paymentMethod: "counter" | "online";
  setPaymentMethod: (m: "counter" | "online") => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  t: Record<string, string>;
  upiQrUrl?: string;
  bookingCode?: string;
  setBookingCode?: (v: string) => void;
}

export function MenuCartDrawer({
  cartOpen,
  onClose,
  cartLines,
  tableLabel,
  restaurantName,
  totalQty,
  totalPaise,
  loyaltyPoints,
  paymentMethod,
  setPaymentMethod,
  name,
  setName,
  phone,
  setPhone,
  error,
  submitting,
  onSubmit,
  onIncrease,
  onDecrease,
  onUpdateNote,
  t,
  upiQrUrl,
  bookingCode,
  setBookingCode,
}: MenuCartDrawerProps) {
  if (!cartOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5 text-indigo-600" />
              <span>{t.orderSummary}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Table {tableLabel} • {restaurantName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 text-xs font-bold cursor-pointer touch-manipulation"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Cart Item Lines */}
          <div className="space-y-2.5">
            {cartLines.map((l) => (
              <div
                key={l.item.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-slate-900 text-sm block truncate">
                      {l.item.name}
                    </span>
                    <span className="text-xs text-indigo-600 font-bold font-mono">
                      {paise(l.item.price_paise * l.quantity)}
                    </span>
                    {(l.spiceLevel || l.sizeVariant) && (
                      <div className="text-xs text-slate-500 mt-0.5 flex gap-1.5 font-medium">
                        {l.spiceLevel && <span>🌶️ {l.spiceLevel}</span>}
                        {l.sizeVariant && <span>📏 {l.sizeVariant}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer touch-manipulation shadow-sm"
                      onClick={() => onDecrease(l.item.id)}
                    >
                      −
                    </button>
                    <span className="font-black text-xs text-slate-900 min-w-6 text-center font-mono">
                      {l.quantity}
                    </span>
                    <button
                      type="button"
                      className="w-10 h-10 min-h-[40px] min-w-[40px] rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer touch-manipulation shadow-sm"
                      onClick={() => onIncrease(l.item.id)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <input
                  placeholder={t.customNotes}
                  value={l.notes || ""}
                  maxLength={200}
                  onChange={(e) => onUpdateNote(l.item.id, e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-xl w-full p-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          {/* Loyalty Points Preview */}
          {loyaltyPoints > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="text-xs text-amber-800 font-bold">
                🏆 Loyalty Points Earned
              </span>
              <span className="text-xs font-black text-amber-700 font-mono">
                +{loyaltyPoints} pts
              </span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Select Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("counter")}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  paymentMethod === "counter"
                    ? "bg-indigo-50 border-indigo-500 text-slate-900 shadow-md shadow-indigo-500/10"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">💵</span>
                  <span className="text-xs font-black text-slate-900">
                    Pay at Counter
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  Settle cash/card after meal
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("online")}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  paymentMethod === "online"
                    ? "bg-purple-50 border-purple-500 text-slate-900 shadow-md shadow-purple-500/15"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">📱</span>
                  <span className="text-xs font-black text-purple-600">
                    Scan UPI QR
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block leading-tight">
                  GPay, PhonePe, Paytm QR
                </span>
              </button>
            </div>
          </div>

          {/* Render UPI QR if selected and available */}
          {paymentMethod === "online" && upiQrUrl && (
            <div className="flex flex-col items-center p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-fade-in-up">
              <span className="text-xs font-black text-slate-900 mb-2 uppercase tracking-widest text-center">
                Scan Store QR to Pay
              </span>
              <img src={upiQrUrl} alt="Store UPI QR" className="w-32 h-32 rounded-xl bg-white p-2 border border-slate-200 shadow-sm" />
              <span className="text-xs font-bold text-indigo-600 mt-2 text-center font-mono">
                Pay exact amount ₹{(totalPaise / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Guest Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <span>📝 Your Details</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Your Name (Optional)
                </label>
                <input
                  placeholder="e.g. Alex Smith"
                  value={name}
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  maxLength={15}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
            {setBookingCode && (
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Booking Code (if reserved)
                </label>
                <input
                  placeholder="e.g. A1B2C3"
                  value={bookingCode ?? ""}
                  maxLength={6}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono uppercase"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${paymentMethod === "counter" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}>
            <span>{paymentMethod === "counter" ? "⚠️" : "✓"}</span>
            <span>{paymentMethod === "counter" ? "Pay at counter after meal. Kitchen will start now." : "Prepaid — Complete UPI payment to confirm."}</span>
          </div>
        </div>

        {/* Sticky Bottom Action Bar */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
              {t.totalBill}
            </span>
            <span className="text-xl font-black text-indigo-600 font-mono">
              {paise(totalPaise)}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer touch-manipulation min-h-[44px]"
            >
              {t.keepBrowsing}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || totalQty === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30 cursor-pointer touch-manipulation active:scale-95 min-h-[44px]"
            >
              {submitting ? t.submitting : t.placeOrder}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}