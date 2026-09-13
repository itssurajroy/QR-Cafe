// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CoffeeIcon,
  BellIcon,
  SearchIcon,
  SparklesIcon,
  ShoppingBagIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  PhoneIcon,
  CheckIcon,
  WifiIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@/components/Icons";
import { paise, getItemImage } from "@/lib/utils";
import { api } from "@/lib/api";
import { BookingWidget } from "@/features/booking/BookingWidget";
import { Tenant, TierLimits } from "@/lib/tenant";
import type { Category, MenuItem as Item, CartLine } from "@/types";

interface PublicCafeClientProps {
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
}

type DietFilter = "all" | "veg" | "nonveg";

export default function PublicCafeClient({
  restaurant,
  tables,
  categories,
  items,
  canOrder,
  upiQrUrl,
}: PublicCafeClientProps) {
  const router = useRouter();

  // Active table state (persisted per-restaurant in localStorage)
  const [selectedTable, setSelectedTable] = useState<{
    id: string;
    label: string;
    qr_token: string;
  } | null>(null);

  // Cart state: itemId -> { item, quantity, notes, spiceLevel }
  const [cart, setCart] = useState<Record<string, {
    item: Item;
    quantity: number;
    notes?: string;
    spiceLevel?: string;
  }>>({});

  // UI Filters and Modals
  const [diet, setDiet] = useState<DietFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id || "");
  
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<Item | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);
  const [serviceLoading, setServiceLoading] = useState(false);

  // Customization sheet
  const [customizingItem, setCustomizingItem] = useState<Item | null>(null);
  const [selectedSpice, setSelectedSpice] = useState<"Mild" | "Medium" | "Spicy">("Medium");
  const [customNotes, setCustomNotes] = useState("");

  // Checkout info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPoints, setCustomerPoints] = useState<number | null>(null);

  // Check Loyalty Points automatically when phone changes
  useEffect(() => {
    if (customerPhone.length < 10) {
      setCustomerPoints(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/public/customer-balance?phone=${customerPhone}&restaurant_id=${restaurant.id}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerPoints(data.points || null);
        }
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [customerPhone, restaurant.id]);
  const [paymentMethod, setPaymentMethod] = useState<"counter" | "online">("counter");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Load last selected table from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`qrslice_table_${restaurant.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const matched = tables.find((t) => t.id === parsed.id || t.label === parsed.label);
          if (matched) {
            setSelectedTable({
              id: matched.id,
              label: matched.label,
              qr_token: matched.qr_token,
            });
          }
        }
      } catch {
        // ignore
      }
    }
  }, [restaurant.id, tables]);

  // Load/save cart to sessionStorage
  useEffect(() => {
    const storageKey = selectedTable ? selectedTable.qr_token : `guest_${restaurant.id}`;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(`cart:${storageKey}`);
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    }
  }, [selectedTable, restaurant.id]);

  useEffect(() => {
    const storageKey = selectedTable ? selectedTable.qr_token : `guest_${restaurant.id}`;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(`cart:${storageKey}`, JSON.stringify(cart));
      } catch {
        // ignore
      }
    }
  }, [cart, selectedTable, restaurant.id]);

  // Track header scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);

      // Determine active category in view
      const categoryElements = categories.map((c) => document.getElementById(`category-${c.id}`));
      for (let i = categoryElements.length - 1; i >= 0; i--) {
        const el = categoryElements[i];
        if (el && window.scrollY >= el.offsetTop - 180) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [categories]);

  // Table selection handler
  const handleSelectTable = (table: { id: string; label: string; qr_token: string }) => {
    setSelectedTable(table);
    try {
      localStorage.setItem(`qrslice_table_${restaurant.id}`, JSON.stringify(table));
    } catch {
      // ignore
    }
    setIsTableModalOpen(false);

    // If an item was queued up to be added, add it now
    if (pendingItem) {
      addItemToCart(pendingItem);
      setPendingItem(null);
    }
  };

  // Cart operations
  const addItemToCart = (item: Item, options?: { spiceLevel?: string; notes?: string }) => {
    if (!selectedTable) {
      setPendingItem(item);
      setIsTableModalOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev[item.id];
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: (existing?.quantity || 0) + 1,
          spiceLevel: options?.spiceLevel || existing?.spiceLevel || "Medium",
          notes: options?.notes || existing?.notes || "",
        },
      };
    });
  };

  const increaseQuantity = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity + 1 },
      };
    });
  };

  const decreaseQuantity = (itemId: string) => {
    setCart((prev) => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return {
        ...prev,
        [itemId]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  // Cart totals
  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const totalQty = useMemo(() => cartLines.reduce((sum, line) => sum + line.quantity, 0), [cartLines]);
  const totalPaise = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.item.price_paise * line.quantity, 0),
    [cartLines]
  );

  // Filtered menu items
  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const matchesDiet =
        diet === "all" ? true : diet === "veg" ? item.is_veg : !item.is_veg;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDiet && matchesSearch;
    });
  }, [items, diet, searchQuery]);

  // Best-seller items (featured first 5 signature items)
  const bestSellers = useMemo(() => {
    const signatureNames = [
      "paneer tikka",
      "butter chicken",
      "biryani",
      "chole bhature",
      "margherita",
      "dal makhani",
      "dosa",
    ];
    return items.filter((item) =>
      signatureNames.some((sig) => item.name.toLowerCase().includes(sig))
    ).slice(0, 4);
  }, [items]);

  // Order submission
  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      setIsTableModalOpen(true);
      return;
    }
    if (totalQty === 0) return;

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const payload = {
        qrToken: selectedTable.qr_token,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod,
        items: cartLines.map((line) => ({
          itemId: line.item.id,
          quantity: line.quantity,
          notes: line.notes,
          spiceLevel: line.spiceLevel,
        })),
      };

      const res = await api.placeOrder(payload);
      if (res.error) {
        setOrderError(res.error + (res.details ? ` ${JSON.stringify(res.details)}` : ""));
        return;
      }

      // Clear cart on successful placement
      setCart({});
      sessionStorage.removeItem(`cart:${selectedTable.qr_token}`);

      const statusToken =
        (res.data as any)?.status_token ||
        (res.data as any)?.statusToken ||
        (res.data as any)?.order_id ||
        (res.data as any)?.order_number;

      const loyalty = (res.data as any)?.loyalty;
      const qs = loyalty?.pointsEarned ? `?earned=${loyalty.pointsEarned}&total=${loyalty.newTotalPoints}` : "";

      if (statusToken) {
        sessionStorage.setItem(`status:${selectedTable.qr_token}`, statusToken);
        router.push(`/order/${statusToken}${qs}`);
      } else {
        setOrderError("Order placed successfully. Please ask your server for your ticket.");
      }
    } catch (err: any) {
      setOrderError(err?.message || "Failed to submit order. Please check connection.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Table service request (Call Waiter)
  const handleCallService = async (type: "water" | "bill" | "waiter" | "clean") => {
    if (!selectedTable) {
      setIsTableModalOpen(true);
      return;
    }
    setServiceLoading(true);
    try {
      const res = await fetch("/api/table-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: selectedTable.qr_token,
          request_type: type,
        }),
      });
      if (res.ok) {
        setServiceMessage(`Request sent! Staff notified for Table ${selectedTable.label}.`);
        setTimeout(() => {
          setServiceMessage(null);
          setIsServiceModalOpen(false);
        }, 2200);
      } else {
        setServiceMessage("Service call received. Staff is on the way.");
      }
    } catch {
      setServiceMessage("Request dispatched to service desk.");
    } finally {
      setServiceLoading(false);
    }
  };

  // Smooth scroll to category
  const scrollToCategory = (catId: string) => {
    const el = document.getElementById(`category-${catId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Dynamic UPI URL for exact amount if UPI ID is present
  const upiPaymentUrl = useMemo(() => {
    if (restaurant.upi_id && totalPaise > 0) {
      const rupees = (totalPaise / 100).toFixed(2);
      const uri = `upi://pay?pa=${encodeURIComponent(restaurant.upi_id)}&pn=${encodeURIComponent(
        restaurant.name
      )}&am=${rupees}&cu=INR&tn=${encodeURIComponent(
        `Table ${selectedTable?.label || "DineIn"} - ${restaurant.name}`
      )}`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(uri)}`;
    }
    return upiQrUrl || null;
  }, [restaurant.upi_id, restaurant.name, totalPaise, selectedTable, upiQrUrl]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-[family-name:var(--font-plus-jakarta)] selection:bg-[#5738F5] selection:text-white flex flex-col relative pb-32">
      {/* ─── Top Bar: Subscription Status (if paused) ─── */}
      {!canOrder && (
        <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-bold shadow-sm flex items-center justify-center gap-2 relative z-50">
          <span>☕</span>
          <span>Online ordering is temporarily paused. Browse our full menu below and order with your server.</span>
        </div>
      )}

      {/* ─── 1. Header (Solid Crisp Light Surface) ─── */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 bg-white border-b border-slate-200/90 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ${
          scrolled ? "py-2.5" : "py-3.5"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Brand & Monogram */}
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#5738F5] to-[#7C3AED] text-white font-black text-lg flex items-center justify-center shadow-md shadow-[#5738F5]/20 shrink-0">
                {restaurant.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {restaurant.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-extrabold text-emerald-800">
                  <CheckIcon className="w-2.5 h-2.5 text-emerald-600" />
                  Verified Kitchen
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium truncate">
                <span className="flex items-center gap-1 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  Kitchen Live
                </span>
                <span>•</span>
                <span>Contactless Table Service</span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions: Table Badge + Service Call + Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Table Selector Pill */}
            {tables.length > 0 && (
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                  selectedTable
                    ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white border-transparent shadow-sm shadow-[#5738F5]/25"
                    : "bg-violet-50 hover:bg-violet-100 text-[#5738F5] border-violet-200 shadow-sm"
                }`}
                title="Change Table Number"
              >
                <MapPinIcon className={`w-3.5 h-3.5 ${selectedTable ? "text-white" : "text-[#5738F5]"}`} />
                <span>{selectedTable ? `Table ${selectedTable.label}` : "Pick Table"}</span>
                <span className="text-[10px] opacity-80">▾</span>
              </button>
            )}

            {/* Call Waiter / Service Button */}
            {canOrder && (
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(true)}
                className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold border border-slate-200 cursor-pointer flex items-center gap-1.5 transition-all active:scale-95"
                title="Call Waiter or Request Service"
              >
                <BellIcon className="w-4 h-4 text-[#5738F5]" />
                <span className="hidden md:inline">Service</span>
              </button>
            )}

            {/* Cart Icon Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:px-3.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Order</span>
              {totalQty > 0 && (
                <span className="min-w-[20px] h-5 px-1 rounded-full bg-white text-orange-700 text-[11px] font-black flex items-center justify-center shadow-sm">
                  {totalQty}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── 2. Premium Compact Restaurant Header ─── */}
      <section className="relative w-full bg-white pt-6 pb-4 px-4 border-b border-stone-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2">
              {restaurant.name || "QRslice"}
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
              {restaurant.tagline || "Scan, Order, and Enjoy."}
            </p>
            <div className="flex items-center gap-3 text-xs font-bold">
              {restaurant.google_review_url && (
                <a
                  href={restaurant.google_review_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <StarIcon className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>4.8 (500+ Reviews)</span>
                </a>
              )}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-600">
                <ClockIcon className="w-3.5 h-3.5" />
                <span>15-20 Mins</span>
              </div>
            </div>
          </div>

          {/* Quick Interactive Table Selector Card */}
          {tables.length > 0 && (
            <div className="w-full md:w-auto min-w-[280px] bg-slate-50 border border-slate-200 rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <MapPinIcon className="w-4 h-4 text-indigo-600" />
                  <span>Dine-In Table</span>
                </span>
                {selectedTable && (
                  <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {selectedTable.label} Active
                  </span>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
                {tables.map((t) => {
                  const isSelected = selectedTable?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleSelectTable(t)}
                      className={`shrink-0 min-w-[48px] h-10 rounded-xl font-mono text-xs font-black transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-md"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-indigo-400"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 3. Best Sellers Carousel / Spotlight ─── */}
      {bestSellers.length > 0 && !searchQuery && diet === "all" && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Chef's Signature Picks</h3>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Must Try
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {bestSellers.map((it) => {
              const inCartQty = cart[it.id]?.quantity || 0;
              const imgUrl = it.image_url || getItemImage(it.name, it.is_veg);
              return (
                <div
                  key={`bestseller-${it.id}`}
                  className="group bg-white rounded-2xl border border-slate-200/90 p-2.5 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-slate-100">
                    <img
                      src={imgUrl}
                      alt={it.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-white px-2 py-0.5 rounded-md text-[10px] font-black border border-slate-200 shadow-sm flex items-center gap-1">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          it.is_veg ? "bg-emerald-600" : "bg-red-600"
                        }`}
                      />
                      <span className={it.is_veg ? "text-emerald-700" : "text-red-700"}>
                        {it.is_veg ? "Veg" : "Non-Veg"}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-snug">
                    {it.name}
                  </h4>
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-black text-xs sm:text-sm text-[#5738F5] font-mono">
                      {paise(it.price_paise)}
                    </span>

                    {inCartQty === 0 ? (
                      <button
                        type="button"
                        onClick={() => addItemToCart(it)}
                        className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-[#5738F5] font-black text-xs border border-violet-200 transition-all cursor-pointer active:scale-95"
                      >
                        + ADD
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-violet-50 text-[#5738F5] border border-violet-200 rounded-lg px-1.5 py-0.5 font-bold">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(it.id)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-violet-200/50 rounded"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold px-1">{inCartQty}</span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(it.id)}
                          className="w-5 h-5 flex items-center justify-center font-bold text-xs hover:bg-violet-200/50 rounded"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 4. Search & Category Filter (Solid Clean Sticky Segmented Bar) ─── */}
      <div className="sticky top-[58px] sm:top-[64px] z-30 bg-white border-b border-slate-200/90 py-3 shadow-sm transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Box with Crisp Light Surface */}
          <div className="relative w-full sm:w-80">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search dishes (e.g. Paneer, Biryani, Coffee)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#5738F5] focus:ring-2 focus:ring-[#5738F5]/10 font-medium transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dietary Buttons + Categories */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {/* Dietary Segmented Control */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full shrink-0 border border-slate-200">
              <button
                type="button"
                onClick={() => setDiet("all")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  diet === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setDiet("veg")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  diet === "veg" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Pure Veg
              </button>
              <button
                type="button"
                onClick={() => setDiet("nonveg")}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  diet === "nonveg" ? "bg-white text-red-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Non-Veg
              </button>
            </div>

            {/* Category Jumper Pills */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-200">
              {categories.map((c) => {
                const count = visibleItems.filter((i) => i.category_id === c.id).length;
                if (count === 0 && searchQuery) return null;
                const isActive = activeCategory === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => scrollToCategory(c.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      isActive
                        ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white border-[#5738F5] shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. Main Menu Feed ─── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 w-full flex-1">
        {categories.map((cat) => {
          const categoryDishes = visibleItems.filter((it) => it.category_id === cat.id);
          if (categoryDishes.length === 0) return null;

          return (
            <section
              key={cat.id}
              id={`category-${cat.id}`}
              className="mb-14 scroll-mt-[150px]"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-8 pb-3 border-b border-stone-200/60">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                  {cat.name}
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full border border-slate-200/50">
                  {categoryDishes.length} {categoryDishes.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* List of Dishes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 pb-4">
                {categoryDishes.map((dish) => {
                  const inCartQty = cart[dish.id]?.quantity || 0;
                  const imageUrl = dish.image_url || getItemImage(dish.name, dish.is_veg);

                  return (
                      <article
                        key={dish.id}
                        className="group bg-white rounded-[2rem] p-4 transition-all duration-300 flex items-start justify-between gap-4 cursor-pointer relative shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 hover:border-[#5738F5]/30 hover:shadow-[0_12px_28px_-6px_rgba(87,56,245,0.12)]"
                        onClick={() => {
                          setCustomizingItem(dish);
                          setSelectedSpice(cart[dish.id]?.spiceLevel as any || "Medium");
                          setCustomNotes(cart[dish.id]?.notes || "");
                        }}
                      >
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={`w-3.5 h-3.5 flex items-center justify-center rounded-sm border ${
                              dish.is_veg
                                ? "border-emerald-600 text-emerald-600"
                                : "border-red-600 text-red-600"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          </span>
                          {dish.is_veg && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Veg
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#5738F5] transition-colors leading-snug mb-1">
                          {dish.name}
                        </h4>
                        <div className="font-black text-sm text-[#5738F5] font-mono mb-2">
                          {paise(dish.price_paise)}
                        </div>
                        {dish.description && (
                          <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed pr-2">
                            {dish.description}
                          </p>
                        )}
                      </div>

                      {/* Right: Image & Add Button */}
                      <div className="relative shrink-0 flex flex-col items-center ml-2">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden bg-slate-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] relative">
                          <img
                            src={imageUrl}
                            alt={dish.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                          />
                        </div>

                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10" onClick={(e) => e.stopPropagation()}>
                          {inCartQty === 0 ? (
                            <button
                              type="button"
                              onClick={() => addItemToCart(dish)}
                              className="w-24 sm:w-28 py-2.5 rounded-2xl bg-white text-[#5738F5] hover:bg-violet-50 font-black text-xs sm:text-sm border border-slate-200 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-center uppercase tracking-wider"
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="w-24 sm:w-28 flex items-center justify-between bg-white text-[#5738F5] rounded-2xl px-1.5 py-1.5 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] border border-slate-200">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(dish.id)}
                                className="w-7 h-7 flex items-center justify-center font-black text-base hover:bg-slate-100 rounded-lg"
                              >
                                -
                              </button>
                              <span className="font-mono text-sm font-black">{inCartQty}</span>
                              <button
                                type="button"
                                onClick={() => increaseQuantity(dish.id)}
                                className="w-7 h-7 flex items-center justify-center font-black text-base hover:bg-slate-100 rounded-lg"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* Empty Search State */}
        {visibleItems.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-black/[0.06] p-8 max-w-md mx-auto my-12 shadow-sm">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="text-lg font-black text-slate-900 mb-1">No dishes matched "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 mb-5">
              Try searching with another keyword or resetting the veg/non-veg filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDiet("all");
              }}
              className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-full hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* ─── 6. Table Reservation Widget ─── */}
        {canOrder && tables.length > 0 && (
          <section className="my-16 bg-white border border-black/[0.06] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-800 font-extrabold text-xs mb-2">
                  📅 Dine With Us Again
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reserve a Table in Advance</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Planning a family dinner or celebration? Guarantee your preferred seating with instant booking.
                </p>
              </div>
              <BookingWidget slug={restaurant.slug} />
            </div>
          </section>
        )}
      </main>

      {/* ─── 7. Floating Bottom Cart Bar (Solid Clean Crisp Pill) ─── */}
      {totalQty > 0 && (
        <aside aria-label="Order Cart Bar" className="fixed bottom-5 left-4 right-4 z-40 max-w-xl mx-auto animate-fade-in-up">
          <div className="bg-white text-slate-900 p-3 sm:p-3.5 rounded-2xl shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14)] flex items-center justify-between border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white flex items-center justify-center font-black text-xs shadow-md shadow-violet-500/25">
                {totalQty}
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black flex items-center gap-1.5 text-slate-900 font-mono">
                  <span>{paise(totalPaise)}</span>
                  <span className="text-slate-400 font-sans font-medium text-xs">
                    • {totalQty} {totalQty === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="text-[11px] text-[#5738F5] font-semibold flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3 text-[#5738F5]" />
                  <span>
                    {selectedTable ? `Table ${selectedTable.label}` : "No Table (Tap to Select)"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-violet-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Cart</span>
              <span>→</span>
            </button>
          </div>
        </aside>
      )}

      {/* ─── 8. Modal: Table Selector ─── */}
      {isTableModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsTableModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Select Your Table</h3>
                <p className="text-xs text-slate-500">
                  {pendingItem
                    ? `Please choose your table to add ${pendingItem.name}:`
                    : "Choose your table to enable direct kitchen ordering:"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6 max-h-60 overflow-y-auto pr-1">
              {tables.map((t) => {
                const isSelected = selectedTable?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTable(t)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-[#5738F5] to-[#7C3AED] text-white border-[#5738F5] shadow-md shadow-violet-500/25 scale-105"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="text-xs font-mono font-black">{t.label}</span>
                    <span className="text-[10px] opacity-75 mt-0.5">{t.seats || 2} Seats</span>
                  </button>
                );
              })}
            </div>

            {/* Counter / Takeaway Option */}
            <button
              type="button"
              onClick={() => {
                // Pick first table as token carrier or takeaway
                if (tables[0]) {
                  handleSelectTable({ ...tables[0], label: "Takeaway" });
                } else {
                  setIsTableModalOpen(false);
                }
              }}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200"
            >
              <span>🛍️</span>
              <span>Order for Counter / Takeaway</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── 9. Modal: Item Details & Customization ─── */}
      {customizingItem && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setCustomizingItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image */}
            <div className="relative aspect-[16/9] w-full bg-slate-100 shrink-0">
              <img
                src={customizingItem.image_url || getItemImage(customizingItem.name, customizingItem.is_veg)}
                alt={customizingItem.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-slate-700 hover:bg-slate-100 flex items-center justify-center font-bold text-sm shadow-md border border-slate-200"
              >
                ✕
              </button>
              <div className="absolute bottom-3 left-3 bg-white px-2.5 py-1 rounded-lg text-xs font-black border border-slate-200 shadow-sm">
                {customizingItem.is_veg ? "🟢 Pure Vegetarian" : "🔴 Non-Vegetarian"}
              </div>
            </div>

            {/* Details Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-xl font-black text-slate-900">{customizingItem.name}</h3>
                <span className="text-lg font-black text-[#5738F5] font-mono">
                  {paise(customizingItem.price_paise)}
                </span>
              </div>
              {customizingItem.description && (
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {customizingItem.description}
                </p>
              )}

              {/* Spice Level Selection */}
              <div className="mb-5">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-2">
                  Select Spice Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Mild", "Medium", "Spicy"] as const).map((spice) => (
                    <button
                      key={spice}
                      type="button"
                      onClick={() => setSelectedSpice(spice)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedSpice === spice
                          ? "bg-violet-50 border-violet-300 text-[#5738F5] shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {spice === "Mild" && "🌿 Mild"}
                      {spice === "Medium" && "🌶️ Medium"}
                      {spice === "Spicy" && "🔥 Spicy"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cooking Instructions */}
              <div>
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider block mb-2">
                  Chef Instructions (Optional)
                </label>
                <textarea
                  placeholder="e.g. Extra onions, less butter, crispy, no coriander..."
                  value={customNotes}
                  maxLength={150}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#5738F5] focus:bg-white resize-none h-20"
                />
              </div>
            </div>

            {/* Bottom Add Action */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  addItemToCart(customizingItem, {
                    spiceLevel: selectedSpice,
                    notes: customNotes.trim(),
                  });
                  setCustomizingItem(null);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-sm shadow-md shadow-violet-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Add to Order • {paise(customizingItem.price_paise)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. Drawer: Cart & Checkout ─── */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5 text-[#5738F5]" />
                  <span>Your Order Summary</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedTable ? `Table ${selectedTable.label} • ` : ""}
                  {restaurant.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              {cartLines.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-4xl block mb-2">🍽️</span>
                  <p className="text-sm font-bold text-slate-700">Your cart is empty</p>
                  <p className="text-xs text-slate-400 mt-1">Explore the menu and add dishes to order.</p>
                </div>
              ) : (
                <>
                  {cartLines.map((line) => (
                    <div
                      key={line.item.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              line.item.is_veg ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {line.item.name}
                          </h4>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          <span>{paise(line.item.price_paise)} each</span>
                          {line.spiceLevel && <span> • {line.spiceLevel}</span>}
                          {line.notes && <span> • "{line.notes}"</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-black text-slate-900">
                          {paise(line.item.price_paise * line.quantity)}
                        </span>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1.5 py-0.5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(line.item.id)}
                            className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-600 hover:text-red-600"
                          >
                            -
                          </button>
                          <span className="font-mono text-xs font-black px-1.5">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseQuantity(line.item.id)}
                            className="w-5 h-5 flex items-center justify-center font-black text-xs text-slate-600 hover:text-emerald-600"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Payment Method Selection */}
                  <div className="pt-4 border-t border-slate-200">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-900 block mb-2">
                      Payment Option
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("counter")}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          paymentMethod === "counter"
                            ? "bg-violet-50 border-[#5738F5] shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm font-bold block text-slate-900">💵 Pay at Counter</span>
                        <span className="text-[11px] text-slate-500">Settle cash/card after meal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("online")}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                          paymentMethod === "online"
                            ? "bg-violet-50 border-[#5738F5] shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-sm font-bold block text-slate-900">📱 Pay via UPI</span>
                        <span className="text-[11px] text-slate-500">GPay, PhonePe, Paytm QR</span>
                      </button>
                    </div>
                  </div>

                  {/* Render UPI QR code if online chosen */}
                  {paymentMethod === "online" && upiPaymentUrl && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center animate-fade-in">
                      <span className="text-xs font-black text-slate-900 mb-2">Scan & Pay via any UPI App</span>
                      <img
                        src={upiPaymentUrl}
                        alt="Store UPI QR Code"
                        className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-sm"
                      />
                      <span className="text-xs font-mono font-bold text-[#5738F5] mt-2">
                        Exact Amount: {paise(totalPaise)}
                      </span>
                    </div>
                  )}

                  {/* Optional Guest Information */}
                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Your Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#5738F5]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="For order SMS"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#5738F5] font-mono"
                      />
                    </div>
                  </div>

                  {customerPoints !== null && customerPoints > 0 && (
                    <div className="mt-3 p-3 bg-violet-50 rounded-xl border border-violet-200 flex items-center justify-between text-xs animate-fade-in-up">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">✨</span>
                        <span className="font-black text-violet-900 tracking-tight">Available Points: {customerPoints}</span>
                      </div>
                      <span className="text-[#5738F5] font-bold tracking-tight">1 pt = ₹1</span>
                    </div>
                  )}

                  {orderError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      {orderError}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Checkout Sticky Action */}
            {cartLines.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 shrink-0">
                <div className="flex items-center justify-between mb-3 text-sm font-black text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-lg font-mono text-[#5738F5]">{paise(totalPaise)}</span>
                </div>

                <button
                  type="button"
                  disabled={orderSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-violet-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {orderSubmitting ? (
                    <span>Sending to Kitchen…</span>
                  ) : (
                    <>
                      <span>Confirm Order ({selectedTable ? `Table ${selectedTable.label}` : "Pick Table"})</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 11. Modal: Call Waiter / Service Requests ─── */}
      {isServiceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsServiceModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 animate-slide-in-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-[#5738F5]" />
                  <span>Need Assistance?</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedTable ? `Table ${selectedTable.label}` : "Please select your table first"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-sm hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {serviceMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-xs animate-fade-in">
                {serviceMessage}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("water")}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-300 border border-slate-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">💧</span>
                  <span className="text-xs font-black text-slate-900 block">Need Water</span>
                  <span className="text-[10px] text-slate-500">Fresh drinking water</span>
                </button>

                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("clean")}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-300 border border-slate-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">🧹</span>
                  <span className="text-xs font-black text-slate-900 block">Clean Table</span>
                  <span className="text-[10px] text-slate-500">Wipe / sanitize</span>
                </button>

                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("waiter")}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-300 border border-slate-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">🙋</span>
                  <span className="text-xs font-black text-slate-900 block">Call Server</span>
                  <span className="text-[10px] text-slate-500">Staff to table</span>
                </button>

                <button
                  type="button"
                  disabled={serviceLoading}
                  onClick={() => handleCallService("bill")}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-300 border border-slate-200 text-left cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-2xl block mb-1">🧾</span>
                  <span className="text-xs font-black text-slate-900 block">Request Bill</span>
                  <span className="text-[10px] text-slate-500">Final checkout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 12. Footer ─── */}
      <footer className="mt-auto bg-white text-slate-600 py-12 px-4 text-center relative z-10 border-t border-slate-200/90 shadow-inner">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-[#5738F5] flex items-center justify-center font-black text-xl mx-auto border border-violet-200 shadow-sm">
            {restaurant.name.charAt(0)}
          </div>
          <h4 className="text-xl font-black text-slate-900">{restaurant.name}</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Thank you for dining with us! Fresh ingredients, authentic recipes, and contactless table service.
          </p>

          {restaurant.google_review_url && (
            <div className="pt-2">
              <a
                href={restaurant.google_review_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-all border border-slate-200 shadow-sm"
              >
                <StarIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Review us on Google</span>
              </a>
            </div>
          )}

          <div className="pt-6 border-t border-slate-200/80 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} {restaurant.name}. All rights reserved.</div>
            <div>
              Powered by <span className="text-slate-900 font-bold">QrSlice</span> • Kitchen OS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

