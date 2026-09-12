// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { RegisterView } from "@/features/pos/RegisterView";
import { KitchenView } from "@/features/pos/KitchenView";
import { generateBeautifulBillPdf } from "@/lib/bill-pdf";
import { api } from "@/lib/api";
import { getWaLink } from "@/lib/utils";
import { speakHumanVoice } from "@/lib/tts";
import { useToast } from "@/components/ToastProvider";
import type { Category, MenuItem as Item, CartLine, Table } from "@/types";

interface RestaurantProps {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  fssai?: string;
  currency_symbol?: string;
}

interface ParkedTab {
  id: string;
  time: string;
  customer: string;
  cart: CartLine[];
}

interface BillItemSnapshot {
  item?: { name: string; price_paise: number };
  item_name?: string;
  quantity: number;
  unit_price_paise?: number;
}

interface BillData {
  id?: string;
  order_number?: string;
  orderNumber?: string;
  total_paise?: number;
  subtotal_paise?: number;
  discount_paise?: number;
  finalTotalPaise?: number;
  subtotalPaise?: number;
  discountPaise?: number;
  payment_status: "paid" | "unpaid";
  payment_method?: string;
  paymentMethod?: string;
  table_label?: string;
  customer_phone?: string;
  itemsSnapshot?: CartLine[];
  order_items?: BillItemSnapshot[];
  items?: any[];
}

interface PosOrder {
  id: string;
  order_number: string;
  restaurant_id: string;
  table_label?: string;
  status: string;
  payment_status: string;
  payment_method?: string;
  split_cash_paise?: number;
  split_upi_paise?: number;
  total_paise: number;
  created_at: string;
  items?: BillItemSnapshot[];
}

export default function PosClient({
  restaurant,
  categories,
  items,
  tables,
  reservations,
}: {
  restaurant: RestaurantProps;
  categories: Category[];
  items: Item[];
  tables: Table[];
  reservations: { table_ids: string[]; starts_at: string; ends_at: string; status: string }[];
}) {
  // Deep-linkable view: /pos?view=kitchen lands straight on the KDS.
  const [viewMode, setViewMode] = useState<"catalog" | "kitchen" | "live_tables">(() => {
    if (typeof window === "undefined") return "catalog";
    const v = new URLSearchParams(window.location.search).get("view");
    return v === "kitchen" || v === "live_tables" ? v : "catalog";
  });
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [selectedTable, setSelectedTable] = useState<Table | null>(tables[0] || null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [flatDiscountRupees, setFlatDiscountRupees] = useState<string>("");

  const [parkedTabs, setParkedTabs] = useState<ParkedTab[]>([]);

  const [isSplitTender, setIsSplitTender] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [splitUpiAmount, setSplitUpiAmount] = useState<string>("");

  const [liveOrders, setLiveOrders] = useState<PosOrder[]>([]);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "mixed">("cash");
  const [isSettling, setIsSettling] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [openingFloat, setOpeningFloat] = useState<string>("2000");
  const [payoutsAmount, setPayoutsAmount] = useState<string>("0");
  const [actualCashCount, setActualCashCount] = useState<string>("");
  const [showZReportModal, setShowZReportModal] = useState(false);

  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemIsVeg, setCustomItemIsVeg] = useState(true);

  const [lastBill, setLastBill] = useState<BillData | null>(null);
  const [showBill, setShowBill] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const supabase = getSupabaseBrowserClient();
  const { toast } = useToast();

  const flash = useCallback((kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  }, []);

  const speakVoice = useCallback(
    (text: string) => {
      if (!soundEnabled) return;
      speakHumanVoice(text);
    },
    [soundEnabled]
  );

  const fetchLiveOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("restaurant_id", restaurant.id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLiveOrders(data || []);
    } catch (err) {
      console.error("LiveOrders Fetch Error:", err);
    }
  }, [restaurant.id, supabase]);

  useEffect(() => {
    fetchLiveOrders();
    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=${restaurant.id}` },
        () => {
          fetchLiveOrders();
          speakVoice("New order received");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=${restaurant.id}` },
        () => {
          fetchLiveOrders();
        }
      )
      .subscribe();

    const poll = setInterval(fetchLiveOrders, 5000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [restaurant.id, supabase, fetchLiveOrders, speakVoice]);

  const addToCart = (it: Item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === it.id);
      if (existing) {
        return prev.map((c) => (c.item.id === it.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item: it, quantity: 1, notes: "" }];
    });
  };

  const handleAddCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice || Number(customItemPrice) <= 0) {
      flash("err", "Please enter valid item name and price");
      return;
    }
    const newItem: Item = {
      id: `custom-${Date.now()}`,
      restaurant_id: restaurant.id,
      category_id: categories[0]?.id || "custom",
      name: customItemName.trim(),
      price_paise: Math.round(Number(customItemPrice) * 100),
      is_veg: customItemIsVeg,
      available: true,
    };
    addToCart(newItem);
    setCustomItemName("");
    setCustomItemPrice("");
    setShowCustomItemModal(false);
    flash("ok", `Added open item: ${newItem.name}`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => (c.item.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)).filter((c) => c.quantity > 0)
    );
  };

  const setItemNotes = (id: string, note: string) => {
    setCart((prev) => prev.map((c) => (c.item.id === id ? { ...c, notes: note } : c)));
  };

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setFlatDiscountRupees("");
    setSplitCashAmount("");
    setSplitUpiAmount("");
    setAmountReceived("");
  }, []);

  const totalItemCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const subtotalPaise = cart.reduce((acc, c) => acc + c.item.price_paise * c.quantity, 0);

  let discountPaise = 0;
  if (flatDiscountRupees && Number(flatDiscountRupees) > 0) {
    discountPaise = Math.min(Number(flatDiscountRupees) * 100, subtotalPaise);
  } else if (discountPercent > 0) {
    discountPaise = Math.round((subtotalPaise * discountPercent) / 100);
  }

  const finalTotalPaise = Math.max(0, subtotalPaise - discountPaise);

  const handleParkTab = useCallback(() => {
    if (cart.length === 0) return;
    setParkedTabs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        customer: selectedTable?.label ? `Table ${selectedTable.label}` : "Walk-in",
        cart,
      },
    ]);
    clearCart();
    flash("ok", "Tab Parked (Hold)");
  }, [cart, selectedTable, clearCart, flash]);

  const handleRecallTab = (tab: ParkedTab) => {
    setCart(tab.cart);
    setParkedTabs((prev) => prev.filter((pt) => pt.id !== tab.id));
    flash("ok", "Tab Recalled");
  };

  const handleSettle = useCallback(
    async (status: "paid" | "unpaid") => {
      if (cart.length === 0 || isSettling) return;
      setIsSettling(true);
      try {
        const splitCashPaise = isSplitTender && splitCashAmount ? Math.round(Number(splitCashAmount) * 100) : 0;
        const splitUpiPaise = isSplitTender && splitUpiAmount ? Math.round(Number(splitUpiAmount) * 100) : 0;

        const res = await fetch("/api/pos/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_id: selectedTable?.id || null,
            order_type: orderType,
            customer_name: "Walk-in Guest",
            customer_phone: "",
            items: cart.map((c) => ({ id: c.item.id, quantity: c.quantity, notes: c.notes || "" })),
            discount_paise: discountPaise || 0,
            payment_method: paymentMethod || "cash",
            payment_status: status,
            split_cash_paise: splitCashPaise,
            split_upi_paise: splitUpiPaise,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Order failed");
        const billData = json.order || {
          id: json.id,
          order_number: `POS-${Date.now()}`,
          total_paise: finalTotalPaise,
          subtotal_paise: subtotalPaise,
          discount_paise: discountPaise,
          items: cart,
          payment_status: status,
          payment_method: paymentMethod,
          table_label: selectedTable?.label || "Counter",
        };
        const savedBill: BillData = {
          ...billData,
          id: billData.id || json.id || json.order?.id,
          payment_status: status,
          table_label: selectedTable?.label || "Counter",
          itemsSnapshot: [...cart],
          finalTotalPaise,
          subtotalPaise,
          discountPaise,
          paymentMethod,
        };
        setLastBill(savedBill);
        setShowBill(true);
        flash("ok", status === "paid" ? "Bill Generated ✓ — PAID" : "KOT Generated — UNPAID (Collect at counter)");
        if (status === "unpaid") speakVoice(`K O T sent to kitchen for table ${selectedTable?.label || "Counter"}`);
        clearCart();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to settle order";
        flash("err", message.includes("No active table") ? "Add a table first: Admin → Tables, then retry." : message);
      } finally {
        setIsSettling(false);
      }
    },
    [
      cart,
      isSettling,
      isSplitTender,
      splitCashAmount,
      splitUpiAmount,
      selectedTable,
      orderType,
      discountPaise,
      paymentMethod,
      finalTotalPaise,
      subtotalPaise,
      flash,
      speakVoice,
      clearCart,
    ]
  );

  // Keyboard shortcuts listener (F2: Search, F4: Settle, F8: Hold Tab, F9: Z-Report)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0 && !isSettling) {
          handleSettle("paid");
        }
      } else if (e.key === "F8") {
        e.preventDefault();
        handleParkTab();
      } else if (e.key === "F9") {
        e.preventDefault();
        setShowZReportModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, isSettling, handleSettle, handleParkTab]);

  const tableOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveOrders.forEach((o) => {
      if (o.status !== "served" && o.table_label) {
        const t = tables.find((tbl) => tbl.label === o.table_label);
        if (t) {
          counts[t.id] = (counts[t.id] || 0) + 1;
        }
      }
    });
    return counts;
  }, [liveOrders, tables]);

  const handleUpdateOrderStatus = async (id: string, status: string, orderNumber: string, _tableLabel: string) => {
    // Snapshot for revert, then move the ticket instantly (optimistic UI).
    const prevStatus = liveOrders.find((o) => o.id === id)?.status;
    setLiveOrders((list) => list.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      speakVoice(`Order ${orderNumber} is ${status}`);
    } catch (err: unknown) {
      // Revert to the previous column on failure.
      if (prevStatus !== undefined) {
        setLiveOrders((list) => list.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)));
      }
      toast.error("Network Error: Ticket not updated");
      flash("err", err instanceof Error ? err.message : "Failed to update order status");
    }
  };

  // Shift Z-Report calculations
  const zReport = useMemo(() => {
    const paidOrders = liveOrders.filter((o) => o.payment_status === "paid" && o.status !== "cancelled");
    const cashSalesPaise = paidOrders
      .filter((o) => o.payment_method === "cash" || (o.split_cash_paise && o.split_cash_paise > 0))
      .reduce((sum, o) => sum + (o.split_cash_paise && o.split_cash_paise > 0 ? o.split_cash_paise : o.total_paise || 0), 0);

    const upiSalesPaise = paidOrders
      .filter((o) => o.payment_method === "upi" || (o.split_upi_paise && o.split_upi_paise > 0))
      .reduce((sum, o) => sum + (o.split_upi_paise && o.split_upi_paise > 0 ? o.split_upi_paise : o.total_paise || 0), 0);

    const cardSalesPaise = paidOrders
      .filter((o) => o.payment_method === "card")
      .reduce((sum, o) => sum + (o.total_paise || 0), 0);

    const totalRevenuePaise = cashSalesPaise + upiSalesPaise + cardSalesPaise;

    const openFloatPaise = (Number(openingFloat) || 0) * 100;
    const payoutsPaise = (Number(payoutsAmount) || 0) * 100;
    const expectedDrawerCashPaise = openFloatPaise + cashSalesPaise - payoutsPaise;

    const actualCountPaise = actualCashCount !== "" ? Number(actualCashCount) * 100 : expectedDrawerCashPaise;
    const cashVariancePaise = actualCountPaise - expectedDrawerCashPaise;

    return {
      orderCount: paidOrders.length,
      cashSalesPaise,
      upiSalesPaise,
      cardSalesPaise,
      totalRevenuePaise,
      openFloatPaise,
      payoutsPaise,
      expectedDrawerCashPaise,
      actualCountPaise,
      cashVariancePaise,
    };
  }, [liveOrders, openingFloat, payoutsAmount, actualCashCount]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* POS HEADER / TOP NAVIGATION BAR */}
      <header className="h-14 bg-[#F5F5F7]/85 backdrop-blur-xl border-b border-black/[0.06] px-4 flex items-center justify-between shadow-xs shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#007AFF] text-white font-black text-sm flex items-center justify-center shadow-sm shadow-[#007AFF]/25 transition-all duration-200 group-hover:scale-105">
              Q
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-[#007AFF] transition-colors hidden sm:inline">
              {restaurant.name}
            </span>
          </Link>
          <div className="h-4 w-px bg-black/[0.08]" />
          
          {/* Apple Segmented Control */}
          <div className="flex items-center p-1 rounded-2xl bg-black/[0.05] border border-black/[0.04]">
            <button
              type="button"
              onClick={() => setViewMode("catalog")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[32px] ${
                viewMode === "catalog"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Billing
            </button>

            <button
              type="button"
              onClick={() => setViewMode("live_tables")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
                viewMode === "live_tables"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Live Tables</span>
              {tables.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#34C759] animate-pulse"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("kitchen")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
                viewMode === "kitchen"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Kitchen (KDS)</span>
              {liveOrders.filter((o) => o.status === "placed" || o.status === "preparing").length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#FF9500] text-white font-mono font-bold text-[10px]">
                  {liveOrders.filter((o) => o.status === "placed" || o.status === "preparing").length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              flash("ok", !soundEnabled ? "Audio Alerts Enabled 🔔" : "Audio Muted 🔕");
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[36px] flex items-center gap-1.5 active:scale-95 ${
              soundEnabled
                ? "bg-white border-black/[0.08] text-[#007AFF] shadow-xs"
                : "bg-black/[0.03] border-transparent text-slate-500"
            }`}
            title="Toggle Voice Alerts"
          >
            <span>{soundEnabled ? "🔔 Voice" : "🔕 Muted"}</span>
          </button>

          {/* Open Open/Custom Item Modal */}
          <button
            type="button"
            onClick={() => setShowCustomItemModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer active:scale-95 min-h-[36px] bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800"
          >
            ＋ Custom Item
          </button>

          {/* Parked Tabs Button */}
          {parkedTabs.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-xl bg-[#FF9500] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <span>Hold Tabs</span>
                <span className="w-4 h-4 rounded-full bg-white text-[#FF9500] font-mono text-[10px] flex items-center justify-center font-bold">
                  {parkedTabs.length}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-black/[0.08] rounded-2xl p-2 shadow-xl hidden group-hover:block z-50">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-black/[0.05] mb-1">
                  Parked Orders (Hold)
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {parkedTabs.map((pt) => (
                    <div
                      key={pt.id}
                      onClick={() => handleRecallTab(pt)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-[#007AFF]/10 border border-black/[0.04] cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{pt.customer}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{pt.time} • {pt.cart.length} items</div>
                      </div>
                      <span className="text-xs font-bold text-[#007AFF]">Recall &rarr;</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Shift / Z-Report Button */}
          <button
            type="button"
            onClick={() => setShowZReportModal(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer min-h-[36px] bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800"
          >
            📊 Shift / Z-Report (F9)
          </button>
        </div>
      </header>

      {/* POS MAIN WORKSPACE AREA */}
      {viewMode === "catalog" && (
        <RegisterView
          restaurant={restaurant}
          categories={categories}
          items={items}
          tables={tables}
          orderType={orderType}
          setOrderType={setOrderType}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          cart={cart}
          addToCart={addToCart}
          updateQty={updateQty}
          setItemNotes={setItemNotes}
          clearCart={clearCart}
          handleParkTab={handleParkTab}
          parkedTabs={parkedTabs}
          handleRecallTab={handleRecallTab}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          flatDiscountRupees={flatDiscountRupees}
          setFlatDiscountRupees={setFlatDiscountRupees}
          isSplitTender={isSplitTender}
          setIsSplitTender={setIsSplitTender}
          splitCashAmount={splitCashAmount}
          setSplitCashAmount={setSplitCashAmount}
          splitUpiAmount={splitUpiAmount}
          setSplitUpiAmount={setSplitUpiAmount}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          isSettling={isSettling}
          handleSettle={handleSettle}

          msg={msg}
          totalItemCount={totalItemCount}
          subtotalPaise={subtotalPaise}
          discountPaise={discountPaise}
          finalTotalPaise={finalTotalPaise}
          liveOrders={liveOrders as any}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          tableOrderCounts={tableOrderCounts}
          mobileCartOpen={mobileCartOpen}
          setMobileCartOpen={setMobileCartOpen}
          reservations={reservations}
        />
      )}

      {viewMode === "kitchen" && (
        <KitchenView
          liveOrders={liveOrders as any}
          fetchLiveOrders={fetchLiveOrders}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
          restaurant={restaurant as any}
        />
      )}

      {viewMode === "live_tables" && (
        <div className="flex-1 p-6 bg-[#F5F5F7] overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Live Table Floor Status</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select any table to review live guest orders or start a new tab</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]"></span> Available
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF9500]"></span> Active Order
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              {tables.map((tbl) => {
                const count = tableOrderCounts[tbl.id] || 0;
                return (
                  <div
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTable(tbl);
                      setViewMode("catalog");
                    }}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[128px] active:scale-[0.98] ${
                      count > 0
                        ? "bg-white border-[#FF9500]/40 ring-1 ring-[#FF9500]/20 text-slate-900"
                        : "bg-white border-black/[0.06] text-slate-900 hover:border-[#007AFF]/40"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">Table</span>
                        {count > 0 && <span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse"></span>}
                      </div>
                      <div className="font-bold text-2xl text-slate-900 tracking-tight">#{tbl.label}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{(tbl as unknown as { capacity?: number }).capacity || 4} Guests</div>
                    </div>
                    <div className="pt-2.5 border-t border-black/[0.04] flex items-center justify-between">
                      <span className={`text-[11px] font-semibold ${count > 0 ? "text-[#FF9500]" : "text-[#34C759]"}`}>
                        {count > 0 ? `${count} Active` : "Available"}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OPEN / CUSTOM ITEM MODAL (Apple Sheet Style) */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-black/[0.08] space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="font-bold text-lg text-slate-900">Add Open Custom Item</h3>
              <p className="text-xs text-slate-500 mt-0.5">For unlisted specials, modifications, or open pricing</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Extra Cheese Slice / Chef Special"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#007AFF] focus:bg-white font-medium min-h-[44px] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  placeholder="50"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#007AFF] focus:bg-white font-mono min-h-[44px] transition-all"
                />
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCustomItemIsVeg(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] transition-all cursor-pointer ${
                    customItemIsVeg
                      ? "bg-[#34C759]/10 border-[#34C759]/40 text-[#34C759] font-bold"
                      : "bg-white border-black/[0.08] text-slate-600"
                  }`}
                >
                  🟢 Pure Veg
                </button>
                <button
                  type="button"
                  onClick={() => setCustomItemIsVeg(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] transition-all cursor-pointer ${
                    !customItemIsVeg
                      ? "bg-[#FF3B30]/10 border-[#FF3B30]/40 text-[#FF3B30] font-bold"
                      : "bg-white border-black/[0.08] text-slate-600"
                  }`}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-black/[0.08] text-slate-700 font-semibold text-xs hover:bg-slate-50 min-h-[44px] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs shadow-sm min-h-[44px] cursor-pointer active:scale-95 transition-transform"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT Z-REPORT MODAL (Apple Light Bento Card) */}
      {showZReportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/[0.08] space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Shift Z-Report & Cash Drawer</h3>
                <p className="text-xs text-slate-500 mt-0.5">Terminal 1 Shift Closing & Cash Reconciliation</p>
              </div>
              <button
                onClick={() => setShowZReportModal(false)}
                className="w-8 h-8 rounded-full bg-black/[0.05] hover:bg-black/[0.1] text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Shift Sales</div>
                <div className="text-base font-bold font-mono text-[#34C759] mt-0.5">₹{(zReport.totalRevenuePaise / 100).toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{zReport.orderCount} Settled Orders</div>
              </div>
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Cash Sales</div>
                <div className="text-base font-bold font-mono text-[#FF9500] mt-0.5">₹{(zReport.cashSalesPaise / 100).toFixed(2)}</div>
              </div>
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">UPI Sales</div>
                <div className="text-base font-bold font-mono text-[#007AFF] mt-0.5">₹{(zReport.upiSalesPaise / 100).toFixed(2)}</div>
              </div>
              <div className="bg-[#F5F5F7] p-3 rounded-2xl border border-black/[0.04]">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Card Sales</div>
                <div className="text-base font-bold font-mono text-[#5856D6] mt-0.5">₹{(zReport.cardSalesPaise / 100).toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-black/[0.06] text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#007AFF] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Paid Out Expenses / Vendor Petty Cash (₹)</label>
                <input
                  type="number"
                  value={payoutsAmount}
                  onChange={(e) => setPayoutsAmount(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#007AFF] focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Actual Physical Cash Count (₹)</label>
                <input
                  type="number"
                  placeholder={`Expected: ₹${(zReport.expectedDrawerCashPaise / 100).toFixed(2)}`}
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-black/[0.06] rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-[#007AFF] focus:bg-white transition-colors"
                />
              </div>

              <div className="p-3 bg-[#F5F5F7] rounded-2xl border border-black/[0.04] space-y-1.5">
                <div className="flex justify-between text-slate-500">
                  <span>Expected Drawer Cash:</span>
                  <span className="font-mono font-medium text-slate-800">₹{(zReport.expectedDrawerCashPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-700">Cash Variance:</span>
                  <span className={`font-mono ${zReport.cashVariancePaise < 0 ? "text-[#FF3B30]" : zReport.cashVariancePaise > 0 ? "text-[#34C759]" : "text-slate-600"}`}>
                    {zReport.cashVariancePaise === 0 ? "₹0.00 (Balanced ✓)" : `${zReport.cashVariancePaise > 0 ? "+" : ""}₹${(zReport.cashVariancePaise / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  flash("ok", "Printing Z-Report slip...");
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#007AFF] hover:bg-[#007AFF]/90 text-white font-bold text-xs shadow-sm cursor-pointer active:scale-95 transition-transform"
              >
                🖨️ Print Shift Z-Report
              </button>
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="py-2.5 px-4 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL SETTLEMENT MODAL (Apple Clean Receipt Style) */}
      {showBill && lastBill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowBill(false)}>
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-black/[0.08] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className={`p-3 text-center font-bold text-xs ${lastBill.payment_status === "paid" ? "bg-[#34C759] text-white uppercase tracking-wider" : "bg-[#FF9500] text-white uppercase tracking-wider"}`}>
              {lastBill.payment_status === "paid" ? "✓ Payment Settled" : "⚠️ Payment Pending"}
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center border-b border-black/[0.06] pb-3">
                <h3 className="font-bold text-lg text-slate-900">{restaurant.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{restaurant.address || ""} • {restaurant.phone || ""}</p>
                <p className="text-[11px] font-mono text-[#007AFF] mt-1 font-medium">Bill: {lastBill.order_number || lastBill.orderNumber} • Table: {lastBill.table_label}</p>
              </div>
              <div className="space-y-2 text-xs max-h-48 overflow-y-auto">
                {(lastBill.itemsSnapshot || lastBill.order_items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>{it.item?.name || it.item_name} × {it.quantity}</span>
                    <span className="font-mono font-semibold text-slate-900">₹{(((it.item?.price_paise || it.unit_price_paise || 0) * it.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-black/[0.06] pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-mono font-medium text-slate-800">₹{(lastBill.subtotalPaise || lastBill.subtotal_paise || 0) / 100}</span></div>
                {(lastBill.discountPaise || lastBill.discount_paise || 0) > 0 && (
                  <div className="flex justify-between text-[#34C759]">
                    <span>Discount</span>
                    <span className="font-mono font-medium">-₹{(lastBill.discountPaise || lastBill.discount_paise || 0) / 100}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1"><span>Total</span><span className="font-mono text-[#007AFF]">₹{(lastBill.finalTotalPaise || lastBill.total_paise || 0) / 100}</span></div>
                <div className={`p-2.5 rounded-xl text-center text-xs font-semibold mt-2 ${lastBill.payment_status === "paid" ? "bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20" : "bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20"}`}>
                  {lastBill.payment_status === "paid" ? `✓ Paid via ${lastBill.paymentMethod || "cash"}` : `⚠️ Please collect ₹${(lastBill.finalTotalPaise || lastBill.total_paise || 0) / 100} at counter`}
                </div>
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    const doc = await generateBeautifulBillPdf({
                      restaurant: {
                        name: restaurant.name || "QRslice",
                        address: restaurant.address || "",
                        phone: restaurant.phone || "",
                        email: restaurant.email || "",
                        gstin: restaurant.gstin || "",
                        fssai: restaurant.fssai || "",
                      },
                      order: {
                        order_number: lastBill.order_number || lastBill.orderNumber || "POS-BILL",
                        table_label: lastBill.table_label || "Counter",
                        total_paise: lastBill.finalTotalPaise ?? lastBill.total_paise ?? 0,
                        subtotal_paise: lastBill.subtotalPaise ?? lastBill.subtotal_paise ?? 0,
                        discount_paise: lastBill.discountPaise ?? lastBill.discount_paise ?? 0,
                        payment_status: lastBill.payment_status || "paid",
                        payment_method: lastBill.paymentMethod || lastBill.payment_method || "cash",
                        cashier_name: "Terminal 1",
                        created_at: new Date().toISOString(),
                      },
                      items: (lastBill.itemsSnapshot || lastBill.order_items || lastBill.items || []).map((it: any) => ({
                        item_name: it.item?.name || it.item_name || it.name || "Item",
                        quantity: it.quantity || 1,
                        unit_price_paise: it.item?.price_paise ?? it.unit_price_paise ?? it.price_paise ?? it.unitPricePaise ?? 0,
                        notes: it.notes || "",
                      })),
                    });
                    doc.save(`TaxInvoice-${lastBill.order_number || lastBill.orderNumber}.pdf`);
                    flash("ok", "Tax Invoice PDF downloaded! 🖨️");
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#007AFF]/10 hover:bg-[#007AFF]/15 border border-[#007AFF]/20 text-[#007AFF] font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  🖨️ Invoice PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowBill(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black/[0.05] hover:bg-black/[0.08] text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
