"use client";

import { useState } from "react";
import { MenuClient } from "@/features/menu/MenuClient";
import { CoffeeIcon, SparklesIcon, QrCodeIcon, UtensilsIcon } from "@/components/Icons";
import { Tenant, TierLimits } from "@/lib/tenant";
import type { Category, MenuItem as Item } from "@/types";

type PublicCafeClientProps = {
  restaurant: Tenant;
  tables: Array<{
    id: string;
    label: string;
    seats: number;
    qr_token: string;
    active: boolean;
  }>;
  categories: Category[];
  items: Item[];
  canOrder: boolean;
  limits: TierLimits;
  upiQrUrl?: string;
};

export default function PublicCafeClient({
  restaurant,
  tables,
  categories,
  items,
  canOrder,
  upiQrUrl,
}: PublicCafeClientProps) {
  const [selectedQr, setSelectedQr] = useState<string | null>(null);
  const [selectedTableLabel, setSelectedTableLabel] = useState<string | null>(null);

  // If a table is selected and ordering is enabled, render the interactive MenuClient
  if (selectedQr && canOrder) {
    return (
      <div className="relative">
        {/* Floating Switch Table Button */}
        <div className="fixed top-3 right-3 z-50">
          <button
            type="button"
            onClick={() => {
              setSelectedQr(null);
              setSelectedTableLabel(null);
            }}
            className="px-3 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-700 text-stone-300 font-bold text-[11px] backdrop-blur-md shadow-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <span>⇄ Switch Table ({selectedTableLabel})</span>
          </button>
        </div>

        <MenuClient
          qrToken={selectedQr}
          tableLabel={selectedTableLabel || "T01"}
          restaurantName={restaurant.name}
          categories={categories}
          items={items}
          upiQrUrl={upiQrUrl}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Banner if Subscription Expired */}
      {!canOrder && (
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-4 py-3 text-center text-xs font-black shadow-lg flex items-center justify-center gap-2">
          <span>🚫</span>
          <span>
            Café ordering is currently paused due to an expired subscription. Menu is available for viewing only.
          </span>
        </div>
      )}

      {/* Hero Café Header */}
      <header className="relative bg-gradient-to-b from-stone-900 via-stone-900/90 to-stone-950 border-b border-stone-800/80 px-6 pt-10 pb-8 text-center">
        <div className="max-w-xl mx-auto space-y-3">
          {restaurant.logo_url ? (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-20 h-20 rounded-3xl object-cover mx-auto shadow-2xl border-2 border-amber-500/40"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-400 text-stone-950 font-black text-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
              {restaurant.name.charAt(0)}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{restaurant.name}</h1>
            {restaurant.tagline && (
              <p className="text-xs text-stone-400 mt-1 font-medium italic">
                &ldquo;{restaurant.tagline}&rdquo;
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="px-3 py-1 rounded-full bg-stone-800/80 border border-stone-700 text-stone-300 text-[11px] font-bold">
              📍 Dine-in & Digital Ordering
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[11px] font-bold">
              ⚡ Live Kitchen Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full flex-1 space-y-8">
        {/* Anti-Tampering Dine-in Order Security Notice */}
        <section className="bg-gradient-to-r from-amber-500/10 via-stone-900 to-amber-500/5 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-3 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-stone-950">
                  Digital Menu Showcase
                </span>
                <span className="text-xs font-bold text-stone-300">🍽️ Browse Dishes &amp; Pricing</span>
              </div>
              <h2 className="text-base font-black text-white">Dine-in at our café to order</h2>
              <p className="text-xs text-stone-400">
                To prevent false tickets, orders can only be dispatched by scanning the high-resolution QR stand on your dining table.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="px-4 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-stone-300 text-xs font-bold text-center flex-1 sm:flex-initial flex items-center justify-center gap-2">
                <span>📱 Scan Table QR</span>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Showcase */}
        <section className="space-y-6">
          <div className="border-b border-stone-800 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <UtensilsIcon className="w-5 h-5 text-amber-400" /> Complete Culinary Menu
            </h2>
            <span className="text-xs text-stone-400 font-mono">{items.length} Items Available</span>
          </div>

          <div className="space-y-8">
            {categories.map((cat) => {
              const catItems = items.filter((i) => i.category_id === cat.id);
              if (catItems.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <span>•</span> {cat.name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catItems.map((it) => (
                      <div
                        key={it.id}
                        className="bg-stone-900/70 border border-stone-800/80 rounded-2xl p-4 flex gap-3 shadow-md hover:border-stone-700 transition-colors"
                      >
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.name}
                            className="w-16 h-16 rounded-xl object-cover border border-stone-800"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center text-xl">
                            {it.is_veg ? "🥗" : "🍗"}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                it.is_veg ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            ></span>
                            <h4 className="font-bold text-xs text-white truncate">{it.name}</h4>
                          </div>
                          {it.description && (
                            <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">
                              {it.description}
                            </p>
                          )}
                          <span className="text-xs font-black text-amber-400 font-mono block mt-1.5">
                            ₹{(it.price_paise / 100).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-6 text-center text-xs text-stone-500 mt-12 bg-stone-900/40">
        <p>© {new Date().getFullYear()} {restaurant.name} • Powered by QR Café Cloud</p>
      </footer>
    </main>
  );
}
