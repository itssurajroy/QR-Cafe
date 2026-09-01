"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CoffeeIcon } from "@/components/Icons";
import { useCart } from "@/hooks/useCart";
import { useAudioTone } from "@/hooks/useAudioTone";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { generateSlug, paise, getItemImage } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Category, MenuItem as Item } from "@/types";

// Extracted UI Features
import { MenuHeader } from "./MenuHeader";
import { MenuCategoryFilter } from "./MenuCategoryFilter";
import { MenuItemCard } from "./MenuItemCard";
import { MenuCartDrawer } from "./MenuCartDrawer";
import { MenuServiceModal } from "./MenuServiceModal";
import { MenuCustomizationSheet } from "./MenuCustomizationSheet";
import { MenuFloatingCartButton } from "./MenuFloatingCartButton";
import { MenuLightbox } from "./MenuLightbox";

const I18N = {
  en: {
    dineIn: "Dine-In Menu",
    vegOnly: "Veg Only",
    all: "All Items",
    search: "Search handcrafted coffee, bites, pizzas…",
    add: "+ ADD",
    viewCart: "View Order Cart",
    orderSummary: "Your Order Summary",
    payAtCounter: "Pay at Counter",
    payOnline: "Pay via UPI / QR",
    customNotes: "Custom notes (e.g. less spicy, extra cheese)...",
    namePlaceholder: "Your Name (optional)",
    phonePlaceholder: "Phone Number (optional)",
    totalBill: "Total Bill:",
    keepBrowsing: "Keep Browsing",
    placeOrder: "Place Order →",
    submitting: "Submitting Order…",
    callWaiter: "Call Waiter",
    needWater: "Need Water",
    cleanTable: "Clean Table",
    serviceSent: "Staff has been notified for Table",
    emptyMenu: "No items available in this section.",
  },
};

export function MenuClient({
  qrToken,
  tableLabel,
  restaurantName,
  categories,
  items,
  accentColor,
  upiQrUrl,
}: {
  qrToken: string;
  tableLabel: string;
  restaurantName: string;
  categories: Category[];
  items: Item[];
  accentColor?: string;
  upiQrUrl?: string;
}) {
  const router = useRouter();
  const t = I18N.en;

  // Apply per-café accent color
  useEffect(() => {
    if (accentColor && typeof document !== "undefined") {
      document.documentElement.style.setProperty("--accent", accentColor);
      const hex = accentColor.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        document.documentElement.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
      }
    }
  }, [accentColor]);

  // Use custom hooks
  const {
    cart,
    cartLines,
    totalQty,
    totalPaise,
    addItem,
    decreaseQty,
    increaseQty,
    updateNotes,
    clearCart,
  } = useCart(qrToken);

  const { playAudioTone } = useAudioTone();
  const isOffline = useOfflineStatus();

  // Local state
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"counter" | "online">("counter");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [cartOpen, setCartOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<Item | null>(null);
  const [customizeItem, setCustomizeItem] = useState<Item | null>(null);
  const [customSpice, setCustomSpice] = useState("Medium");
  const [customSize, setCustomSize] = useState("Regular");
  const [customNote, setCustomNote] = useState("");
  const [upsellItem, setUpsellItem] = useState<Item | null>(null);
  const upsellTimeout = useRef<NodeJS.Timeout | null>(null);
  const [cartPulse, setCartPulse] = useState(false);
  const [serviceModal, setServiceModal] = useState(false);
  const [serviceMsg, setServiceMsg] = useState<string | null>(null);

  // Derived state
  const visibleItems = useMemo(() => {
    return items.filter((i) => {
      const matchesCat = activeCat === "all" ? true : i.category_id === activeCat;
      const matchesVeg = !vegOnly || i.is_veg;
      const matchesSearch =
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(search.toLowerCase()));
      return i.available && matchesCat && matchesVeg && matchesSearch;
    });
  }, [items, activeCat, vegOnly, search]);

  const loyaltyPoints = Math.floor(totalPaise / 10000); // 1 pt per ₹100

  // Actions
  function handleAdd(item: Item, spiceLevel?: string, sizeVariant?: string, note?: string) {
    playAudioTone("add");
    addItem(item, { spiceLevel, sizeVariant, notes: note });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 600);

    const related = items.filter(
      (i) => i.id !== item.id && i.category_id === item.category_id && i.available && !cart[i.id]
    );
    if (related.length > 0) {
      const suggestion = related[Math.floor(Math.random() * Math.min(related.length, 3))];
      if (upsellTimeout.current) clearTimeout(upsellTimeout.current);
      setUpsellItem(suggestion);
      upsellTimeout.current = setTimeout(() => setUpsellItem(null), 5000);
    }
  }

  function handleIncrease(id: string) {
    playAudioTone("add");
    increaseQty(id);
  }

  function openCustomizeModal(item: Item) {
    setCustomizeItem(item);
    setCustomSpice("Medium");
    setCustomSize("Regular");
    setCustomNote("");
  }

  function confirmCustomization() {
    if (!customizeItem) return;
    handleAdd(customizeItem, customSpice, customSize, customNote);
    setCustomizeItem(null);
  }

  async function handleServiceRequest(type: "waiter" | "water" | "clean") {
    playAudioTone("alert");
    try {
      const res = await fetch("/api/table-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_token: qrToken,
          request_type: type,
        }),
      });
      if (res.ok) {
        setServiceMsg(`${t.serviceSent} ${tableLabel}!`);
        setTimeout(() => {
          setServiceMsg(null);
          setServiceModal(false);
        }, 2500);
      }
    } catch {
      setServiceMsg("Service request failed. Please wave to staff.");
    }
  }

  async function submitOrder() {
    if (totalQty === 0) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        qrToken,
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        paymentMethod,
        items: cartLines.map((l) => ({
          itemId: l.item.id,
          quantity: l.quantity,
          notes: l.notes,
          spiceLevel: l.spiceLevel,
          sizeVariant: l.sizeVariant,
        })),
      };

      const res = await api.placeOrder(payload);
      if (res.error) {
        setError(res.error + (res.details ? ` ${JSON.stringify(res.details).slice(0,120)}` : ""));
        return;
      }

      playAudioTone("order");
      clearCart();
      const token = (res.data as any)?.status_token || (res.data as any)?.statusToken;
      if (token) {
        sessionStorage.setItem(`status:${qrToken}`, token);
        router.push(`/order/${token}`);
      } else if ((res.data as any)?.order_id) {
        router.push(`/order/${(res.data as any).order_id}`);
      }
    } catch (err: any) {
      setError(err?.message ? `Failed: ${err.message}` : "Network connection error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 pb-36 font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Offline Awareness Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-xs font-bold text-center py-2 px-4 flex items-center justify-center gap-2 animate-fade-in-up">
          <span>⚠️</span>
          <span>You appear offline — orders may not submit. Check your connection.</span>
        </div>
      )}

      <MenuHeader
        restaurantName={restaurantName}
        tableLabel={tableLabel}
        onHelpClick={() => setServiceModal(true)}
        vegOnly={vegOnly}
        onVegToggle={() => setVegOnly(!vegOnly)}
        t={t}
      />

      <section className="max-w-xl mx-auto px-4 mt-1">
        <MenuCategoryFilter
          categories={categories}
          search={search}
          onSearchChange={setSearch}
          activeCat={activeCat}
          onCatChange={setActiveCat}
          tSearch={t.search}
          tAll={t.all}
        />
      </section>

      {/* Menu Item Cards */}
      <section className="max-w-xl mx-auto p-4 space-y-3">
        {visibleItems.map((i, idx) => (
          <MenuItemCard
            key={i.id}
            item={i}
            inCartQty={cart[i.id]?.quantity || 0}
            idx={idx}
            onAdd={openCustomizeModal}
            onIncrease={handleIncrease}
            onDecrease={decreaseQty}
            onImageClick={setLightboxItem}
            tAdd={t.add}
          />
        ))}

        {visibleItems.length === 0 && (
          <div className="text-center py-20 px-4 bg-stone-900/40 rounded-3xl border border-dashed border-stone-800">
            <CoffeeIcon className="w-10 h-10 text-stone-500 mx-auto mb-4 animate-float" />
            <p className="text-stone-200 font-bold text-base">{t.emptyMenu}</p>
            <p className="text-stone-500 text-xs mt-1">Try browsing all categories or clear your search</p>
          </div>
        )}
      </section>

      {/* Smart Upsell Prompt */}
      {upsellItem && (
        <div className="fixed bottom-28 left-0 right-0 z-40 px-4 pointer-events-auto">
          <div className="max-w-xl mx-auto">
            <div className="bg-stone-900/95 border border-amber-500/30 rounded-2xl p-3 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-slide-in-bottom">
              <img
                src={upsellItem.image_url || getItemImage(upsellItem.name, upsellItem.is_veg)}
                alt={upsellItem.name}
                className="w-12 h-12 rounded-xl object-cover border border-stone-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Customers also ordered</p>
                <p className="text-xs font-bold text-white truncate">{upsellItem.name}</p>
                <p className="text-xs text-amber-400 font-mono font-bold">{paise(upsellItem.price_paise)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => { openCustomizeModal(upsellItem); setUpsellItem(null); }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-black text-xs cursor-pointer active:scale-95"
                >
                  + Add
                </button>
                <button
                  type="button"
                  onClick={() => setUpsellItem(null)}
                  className="text-stone-500 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Overlays & Modals */}
      <MenuFloatingCartButton
        totalQty={totalQty}
        totalPaise={totalPaise}
        cartPulse={cartPulse}
        onOpenCart={() => setCartOpen(true)}
        tViewCart={t.viewCart}
      />

      <MenuLightbox
        item={lightboxItem}
        onClose={() => setLightboxItem(null)}
        onAddClick={(i) => { openCustomizeModal(i); setLightboxItem(null); }}
        tAdd={t.add}
      />

      <MenuCustomizationSheet
        item={customizeItem}
        onClose={() => setCustomizeItem(null)}
        customSpice={customSpice}
        setCustomSpice={setCustomSpice}
        customSize={customSize}
        setCustomSize={setCustomSize}
        customNote={customNote}
        setCustomNote={setCustomNote}
        onConfirm={confirmCustomization}
      />

      <MenuServiceModal
        serviceModal={serviceModal}
        onClose={() => setServiceModal(false)}
        tableLabel={tableLabel}
        serviceMsg={serviceMsg}
        onRequest={handleServiceRequest}
        t={t}
      />

      <MenuCartDrawer
        cartOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartLines={cartLines}
        tableLabel={tableLabel}
        restaurantName={restaurantName}
        totalQty={totalQty}
        totalPaise={totalPaise}
        loyaltyPoints={loyaltyPoints}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        error={error}
        submitting={submitting}
        onSubmit={submitOrder}
        onIncrease={handleIncrease}
        onDecrease={decreaseQty}
        onUpdateNote={updateNotes}
        t={t}
        upiQrUrl={upiQrUrl}
      />
    </main>
  );
}
