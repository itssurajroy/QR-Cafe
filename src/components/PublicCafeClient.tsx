"use client";

import { useState } from "react";
import { MenuClient } from "@/features/menu/MenuClient";
import { BookingWidget } from "@/features/booking/BookingWidget";
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

type DietFilter = "all" | "veg" | "nonveg";

function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shortDesc(desc: string | null | undefined): string {
  if (!desc) return "";
  const clean = desc.trim();
  return clean.length > 60 ? `${clean.slice(0, 60).trimEnd()}…` : clean;
}

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
  const [diet, setDiet] = useState<DietFilter>("all");

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
            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
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

  const tagline = restaurant.tagline?.trim() || "Order at your table. No waiting.";
  const visibleItems = items.filter((i) => {
    if (diet === "veg") return i.is_veg;
    if (diet === "nonveg") return !i.is_veg;
    return true;
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Banner if Subscription Expired */}
      {!canOrder && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-3 text-center text-xs font-bold shadow-lg flex items-center justify-center gap-2">
          <span>🚫</span>
          <span>
            Café ordering is currently paused due to an expired subscription. Menu is available for viewing only.
          </span>
        </div>
      )}

      {/* 1. Top Brand Bar (sticky) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 h-16 sm:h-[72px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <h1 className="text-[18px] sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
              {restaurant.name}
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Kitchen
          </span>
        </div>
      </header>

      {/* 2. Hero (max 480px centred) */}
      <section className="w-full max-w-[480px] mx-auto px-4 pt-6 pb-5 text-center">
        <p className="text-[15px] text-slate-600 font-medium leading-relaxed">{tagline}</p>
        <button
          type="button"
          onClick={() => scrollToId("menu")}
          className="mt-4 w-full h-12 sm:h-[52px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-extrabold text-[15px] shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
        >
          Browse Menu &amp; Order
        </button>
        <button
          type="button"
          onClick={() => scrollToId("reserve")}
          className="mt-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
        >
          Reserve a Table
        </button>
        <div className="mt-5 border-t border-slate-200" />
      </section>

      {/* 3. Table QR Gate Notice */}
      <div className="max-w-3xl mx-auto px-4 w-full">
        <div
          id="table-qr"
          className="min-h-[48px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-center gap-2 text-center scroll-mt-20"
        >
          <span aria-hidden="true" className="text-base">📱</span>
          <p className="text-[15px] text-slate-700 font-medium">
            <span className="hidden sm:inline">Scan the QR on your table for the fastest order — no app required.</span>
            <span className="sm:hidden">Scan table QR to order instantly</span>
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl mx-auto px-4 w-full flex-1 space-y-5 mt-5">
        {/* 4. Menu Section Header */}
        <section id="menu" className="scroll-mt-20 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Menu</h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {items.length} dish{items.length === 1 ? "" : "es"}
              </p>
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Dietary filter">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "veg", label: "Veg" },
                  { id: "nonveg", label: "Non-Veg" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDiet(f.id)}
                  aria-pressed={diet === f.id}
                  className={`px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer min-h-[44px] ${
                    diet === f.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5 + 6. Categories + Menu Cards */}
          <div className="space-y-5">
            {categories.map((cat) => {
              const catItems = visibleItems.filter((i) => i.category_id === cat.id);
              if (catItems.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-3">
                  <h3 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mt-2">
                    {cat.name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {catItems.map((it) => (
                      <article
                        key={it.id}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {it.image_url ? (
                          <img
                            src={it.image_url}
                            alt={it.name}
                            loading="lazy"
                            className="w-full aspect-[16/10] object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-[16/10] bg-slate-100 flex items-center justify-center text-3xl">
                            {it.is_veg ? "🥗" : "🍗"}
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              aria-label={it.is_veg ? "Veg" : "Non-veg"}
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                it.is_veg ? "bg-emerald-500" : "bg-red-700"
                              }`}
                            ></span>
                            <h4 className="font-bold text-[15px] text-slate-900 truncate">{it.name}</h4>
                          </div>
                          {shortDesc(it.description) && (
                            <p className="text-[15px] text-slate-600 leading-snug line-clamp-1 mt-1" title={it.description || undefined}>
                              {shortDesc(it.description)}
                            </p>
                          )}
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="font-extrabold text-[15px] text-slate-900 font-mono">
                              ₹{(it.price_paise / 100).toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              onClick={() => scrollToId("table-qr")}
                              aria-label={`Order ${it.name} — scan your table QR`}
                              className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
            {visibleItems.length === 0 && (
              <p className="text-center text-sm text-slate-500 py-10">
                No dishes in this filter — try another.
              </p>
            )}
          </div>
        </section>

        {/* 7. Reservation (below menu) */}
        {canOrder && tables.length > 0 && (
          <section id="reserve" className="scroll-mt-20">
            <BookingWidget slug={restaurant.slug} />
          </section>
        )}
      </div>

      {/* 8. Footer (minimal) */}
      <footer className="mt-10 border-t border-slate-200 py-8 px-4 text-center">
        <p className="text-sm font-extrabold text-slate-900">{restaurant.name}</p>
        <p className="text-xs text-slate-500 mt-1">Powered by QR Café</p>
        {restaurant.google_review_url && (
          <a
            href={restaurant.google_review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
          >
            Leave us a review on Google
          </a>
        )}
      </footer>
    </main>
  );
}
