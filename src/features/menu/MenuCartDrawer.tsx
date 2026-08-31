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
}

export function MenuCartDrawer({
  cartOpen,
  onClose,
  cartLines,
  tableLabel,
  restaurantName,
  totalQty,
  totalPaise,

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
}: MenuCartDrawerProps) {
  if (!cartOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-stone-200 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-h-[90vh] flex flex-col shadow-2xl animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <ShoppingBagIcon className="w-5 h-5 text-amber-400" />
              <span>{t.orderSummary}</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Table {tableLabel} • {restaurantName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-500 hover:text-stone-900 text-xs cursor-pointer touch-manipulation"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {cartLines.map((l) => (
            <div
              key={l.item.id}
              className="bg-stone-50/80 border border-stone-200 rounded-2xl p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 text-sm">
                    {l.item.name}
                  </span>
                  <span className="text-xs text-amber-400 ml-2 font-semibold font-mono">
                    {paise(l.item.price_paise * l.quantity)}
                  </span>
                  {(l.spiceLevel || l.sizeVariant) && (
                    <div className="text-[10px] text-stone-500 mt-0.5 flex gap-1.5">
                      {l.spiceLevel && <span>🌶️ {l.spiceLevel}</span>}
                      {l.sizeVariant && <span>📏 {l.sizeVariant}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-sm flex items-center justify-center cursor-pointer touch-manipulation"
                    onClick={() => onDecrease(l.item.id)}
                  >
                    −
                  </button>
                  <span className="font-black text-xs text-stone-900 min-w-5 text-center font-mono">
                    {l.quantity}
                  </span>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-black text-sm flex items-center justify-center cursor-pointer touch-manipulation"
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
                className="text-xs bg-white border border-stone-200 rounded-xl w-full p-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          ))}
        </div>

        <div className="border-t border-stone-200 pt-3 space-y-2.5">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("counter")}
              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                paymentMethod === "counter"
                  ? "bg-amber-500/15 border-amber-500 text-stone-900 shadow-md shadow-amber-500/10"
                  : "bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">💵</span>
                <span className="text-xs font-black text-stone-900">
                  Pay at Counter
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block leading-tight">
                Pay with cash at the billing counter after your meal.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("online")}
              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                paymentMethod === "online"
                  ? "bg-purple-950/60 border-purple-500 text-stone-900 shadow-md shadow-purple-500/15"
                  : "bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-700"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">📱</span>
                <span className="text-xs font-black text-purple-300">
                  Scan UPI QR
                </span>
              </div>
              <span className="text-[10px] text-stone-500 block leading-tight">
                Scan and pay instantly using Google Pay, PhonePe, or Paytm.
              </span>
            </button>
          </div>

          {/* Render UPI QR if selected and available */}
          {paymentMethod === "online" && upiQrUrl && (
            <div className="flex flex-col items-center p-4 bg-white border border-stone-200 rounded-2xl animate-fade-in-up">
              <span className="text-xs font-black text-stone-900 mb-2 uppercase tracking-widest text-center">
                Scan to Pay
              </span>
              <img src={upiQrUrl} alt="Store UPI QR" className="w-32 h-32 rounded-xl bg-white p-2" />
              <span className="text-[10px] text-stone-500 mt-2 text-center">
                Please pay exact amount ₹{(totalPaise / 100).toFixed(2)}
              </span>
            </div>
          )}

          {/* Guest Details */}
          <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>💬 WhatsApp Bill</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">
                  Your Name
                </label>
                <input
                  placeholder="e.g. Alex Smith"
                  value={name}
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-500 block mb-1">
                  WhatsApp Phone (For Bill)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  maxLength={15}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
            <p className="text-[10px] text-stone-500">
              Enter your phone number to receive your digital bill directly on WhatsApp.
            </p>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs uppercase tracking-wider text-stone-500 font-bold">
              {t.totalBill}
            </span>
            <span className="text-xl font-black text-amber-400 font-mono">
              {paise(totalPaise)}
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-600 font-bold text-xs transition-colors cursor-pointer touch-manipulation"
            >
              {t.keepBrowsing}
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || totalQty === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs transition-all disabled:opacity-50 shadow-lg shadow-amber-500/30 cursor-pointer touch-manipulation active:scale-95"
            >
              {submitting ? t.submitting : t.placeOrder}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
