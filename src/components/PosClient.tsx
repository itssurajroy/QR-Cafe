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
        flash("err", err instanceof Error ? err.message : "Failed to settle order");
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
      <header
        className={`h-14 transition-colors duration-200 px-4 flex items-center justify-between shadow-sm shrink-0 z-30 ${
          viewMode === "kitchen"
            ? "bg-stone-950 border-b border-stone-800 text-stone-100"
            : "bg-white border-b border-slate-200 text-slate-900"
        }`}
      >
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20 transition-all duration-200">
              Q
            </div>
            <span
              className={`font-extrabold text-sm tracking-tight transition-colors hidden sm:inline ${
                viewMode === "kitchen"
                  ? "text-stone-100 group-hover:text-amber-400"
                  : "text-slate-900 group-hover:text-indigo-600"
              }`}
            >
              {restaurant.name}
            </span>
          </Link>
          <div
            className={`h-4 w-px ${
              viewMode === "kitchen" ? "bg-stone-800" : "bg-slate-200"
            }`}
          />
          <div
            className={`flex items-center p-1 rounded-xl shadow-inner transition-colors ${
              viewMode === "kitchen"
                ? "bg-stone-900 border border-stone-800"
                : "bg-slate-100 border border-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setViewMode("catalog")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer min-h-[36px] ${
                viewMode === "catalog"
                  ? "bg-white text-indigo-600 shadow-sm font-black"
                  : viewMode === "kitchen"
                  ? "text-stone-400 hover:text-stone-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Billing
            </button>

            <button
              type="button"
              onClick={() => setViewMode("live_tables")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                viewMode === "live_tables"
                  ? "bg-white text-indigo-600 shadow-sm font-black"
                  : viewMode === "kitchen"
                  ? "text-stone-400 hover:text-stone-100"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Live Tables</span>
              {tables.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setViewMode("kitchen")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer min-h-[36px] flex items-center gap-1.5 ${
                viewMode === "kitchen"
                  ? "bg-amber-500 text-stone-950 shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Kitchen (KDS)</span>
              {liveOrders.filter((o) => o.status === "placed" || o.status === "preparing").length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px]">
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
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5 ${
              soundEnabled
                ? viewMode === "kitchen"
                  ? "bg-indigo-950/80 border-indigo-700 text-indigo-300 shadow-sm"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                : viewMode === "kitchen"
                ? "bg-stone-900 border-stone-800 text-stone-500"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}
            title="Toggle Voice Alerts"
          >
            <span>{soundEnabled ? "🔔 Voice" : "🔕 Muted"}</span>
          </button>

          {/* Open Open/Custom Item Modal */}
          <button
            type="button"
            onClick={() => setShowCustomItemModal(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-200 cursor-pointer active:scale-95 min-h-[38px] ${
              viewMode === "kitchen"
                ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400"
                : "bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900"
            }`}
          >
            + Custom Item
          </button>

          {/* Parked Tabs Button */}
          {parkedTabs.length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1 cursor-pointer min-h-[38px]"
              >
                <span>Hold Tabs</span>
                <span className="w-4 h-4 rounded-full bg-slate-950 text-amber-400 font-mono text-[10px] flex items-center justify-center">
                  {parkedTabs.length}
                </span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl hidden group-hover:block z-50">
                <div className="text-[11px] font-black uppercase text-slate-500 px-2 py-1 border-b border-slate-100 mb-1">
                  Parked Orders (Hold)
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {parkedTabs.map((pt) => (
                    <div
                      key={pt.id}
                      onClick={() => handleRecallTab(pt)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{pt.customer}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{pt.time} • {pt.cart.length} items</div>
                      </div>
                      <span className="text-xs font-black text-indigo-600">Recall &rarr;</span>
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
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all duration-200 cursor-pointer min-h-[38px] ${
              viewMode === "kitchen"
                ? "bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-200"
                : "bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800"
            }`}
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
        <div className="flex-1 p-6 bg-slate-100 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-black text-slate-900 mb-2">Live Table Status & Active Billing</h2>
            <p className="text-xs text-slate-600 mb-6">Select any table to view active orders or assign a new guest tab</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {tables.map((tbl) => {
                const count = tableOrderCounts[tbl.id] || 0;
                return (
                  <div
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTable(tbl);
                      setViewMode("catalog");
                    }}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[120px] ${
                      count > 0
                        ? "bg-amber-50 border-amber-400 text-amber-950"
                        : "bg-white border-slate-200 text-slate-900 hover:border-indigo-400"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-[10px] uppercase font-black tracking-wider text-slate-400">Table</span>
                        {count > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>}
                      </div>
                      <div className="font-black text-xl text-slate-900">#{tbl.label}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{(tbl as unknown as { capacity?: number }).capacity || 4} Seats</div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className={`text-[11px] font-extrabold ${count > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                        {count > 0 ? `${count} Active Order` : "Available"}
                      </span>
                      <span className="text-xs text-indigo-600 font-bold">&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* OPEN / CUSTOM ITEM MODAL */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-lg text-slate-900">Add Open Custom Item</h3>
            <p className="text-xs text-slate-500">For unlisted specials, modifications, or open pricing</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Item Description</label>
                <input
                  type="text"
                  placeholder="e.g. Extra Cheese Slice / Special Thali"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  placeholder="50"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono min-h-[44px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCustomItemIsVeg(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border min-h-[40px] ${
                    customItemIsVeg ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  🟢 Veg
                </button>
                <button
                  type="button"
                  onClick={() => setCustomItemIsVeg(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border min-h-[40px] ${
                    !customItemIsVeg ? "bg-red-50 border-red-300 text-red-800 font-extrabold" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomItem}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md min-h-[44px]"
              >
                Add to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIFT Z-REPORT MODAL */}
      {showZReportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-lg text-white">Shift Z-Report & Cash Drawer</h3>
                <p className="text-xs text-slate-400">Terminal 1 Shift Closing & Cash Reconciliation</p>
              </div>
              <button onClick={() => setShowZReportModal(false)} className="text-slate-400 hover:text-white font-black text-sm">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Shift Sales</div>
                <div className="text-base font-black font-mono text-emerald-400">₹{(zReport.totalRevenuePaise / 100).toFixed(2)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{zReport.orderCount} Settled Orders</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Cash Sales</div>
                <div className="text-base font-black font-mono text-amber-400">₹{(zReport.cashSalesPaise / 100).toFixed(2)}</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">UPI Sales</div>
                <div className="text-base font-black font-mono text-indigo-400">₹{(zReport.upiSalesPaise / 100).toFixed(2)}</div>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Card Sales</div>
                <div className="text-base font-black font-mono text-cyan-400">₹{(zReport.cardSalesPaise / 100).toFixed(2)}</div>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Paid Out Expenses / Vendor Petty Cash (₹)</label>
                <input
                  type="number"
                  value={payoutsAmount}
                  onChange={(e) => setPayoutsAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Actual Physical Cash Count (₹)</label>
                <input
                  type="number"
                  placeholder={`Expected: ₹${(zReport.expectedDrawerCashPaise / 100).toFixed(2)}`}
                  value={actualCashCount}
                  onChange={(e) => setActualCashCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Expected Drawer Cash:</span>
                  <span className="font-mono text-slate-200">₹{(zReport.expectedDrawerCashPaise / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Cash Variance / Discrepancy:</span>
                  <span className={`font-mono ${zReport.cashVariancePaise < 0 ? "text-red-400" : zReport.cashVariancePaise > 0 ? "text-emerald-400" : "text-slate-300"}`}>
                    {zReport.cashVariancePaise === 0 ? "₹0.00 (Balanced ✓)" : `${zReport.cashVariancePaise > 0 ? "+" : ""}₹${(zReport.cashVariancePaise / 100).toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                  flash("ok", "Printing Z-Report slip...");
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md"
              >
                🖨️ Print Shift Z-Report
              </button>
              <button
                type="button"
                onClick={() => setShowZReportModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BILL SETTLEMENT MODAL WITH AUTOMATIC WHATSAPP DELIVER */}
      {showBill && lastBill && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowBill(false)}>
          <div className="bg-stone-900 text-stone-100 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-stone-800" onClick={(e) => e.stopPropagation()}>
            <div className={`p-3.5 text-center font-black text-xs ${lastBill.payment_status === "paid" ? "bg-emerald-500 text-stone-950 uppercase tracking-wider" : "bg-amber-500 text-stone-950 uppercase tracking-wider"}`}>
              {lastBill.payment_status === "paid" ? "✓ PAID — Payment Received" : "⚠️ UNPAID — Collect at Counter"}
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center border-b border-stone-800 pb-3">
                <h3 className="font-black text-lg text-white">{restaurant.name}</h3>
                <p className="text-xs text-stone-400">{restaurant.address || ""} • {restaurant.phone || ""}</p>
                <p className="text-xs font-mono text-amber-400 mt-1">Bill: {lastBill.order_number || lastBill.orderNumber} • Table: {lastBill.table_label} • {new Date().toLocaleString("en-IN")}</p>
              </div>
              <div className="space-y-1.5 text-xs">
                {(lastBill.itemsSnapshot || lastBill.order_items || []).map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-stone-200">
                    <span>{it.item?.name || it.item_name} × {it.quantity}</span>
                    <span className="font-mono font-bold">₹{(((it.item?.price_paise || it.unit_price_paise || 0) * it.quantity) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-400"><span>Subtotal</span><span className="font-mono">₹{(lastBill.subtotalPaise || lastBill.subtotal_paise || 0) / 100}</span></div>
                {(lastBill.discountPaise || lastBill.discount_paise || 0) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span className="font-mono">-₹{(lastBill.discountPaise || lastBill.discount_paise || 0) / 100}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-stone-100 pt-1"><span>Total</span><span className="font-mono text-amber-400">₹{(lastBill.finalTotalPaise || lastBill.total_paise || 0) / 100}</span></div>
                <div className={`p-2.5 rounded-xl text-center text-xs font-bold ${lastBill.payment_status === "paid" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-700" : "bg-amber-950/80 text-amber-400 border border-amber-700"}`}>
                  {lastBill.payment_status === "paid" ? `✓ Paid via ${lastBill.paymentMethod || "cash"} — No balance` : `⚠️ Unpaid — Please collect ₹${(lastBill.finalTotalPaise || lastBill.total_paise || 0) / 100} at counter`}
                </div>
              </div>
              <div className="flex gap-2">
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
                  className="py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs shadow-sm cursor-pointer"
                >
                  🖨️ Invoice PDF
                </button>
                <button type="button" onClick={() => setShowBill(false)} className="flex-1 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}