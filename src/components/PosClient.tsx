"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { RegisterView } from "@/features/pos/RegisterView";
import { KitchenView } from "@/features/pos/KitchenView";
import { ZReportModal } from "@/features/pos/ZReportModal";
import type { Category, MenuItem as Item, CartLine, Table } from "@/types";

export default function PosClient({
  restaurant,
  categories,
  items,
  tables,
}: {
  restaurant: any;
  categories: Category[];
  items: Item[];
  tables: Table[];
}) {
  const [viewMode, setViewMode] = useState<"catalog" | "kitchen" | "live_tables">("catalog");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<"dine_in" | "takeaway" | "delivery">("dine_in");
  const [selectedTable, setSelectedTable] = useState<Table | null>(tables[0] || null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [flatDiscountRupees, setFlatDiscountRupees] = useState<string>("");
  
  const [parkedTabs, setParkedTabs] = useState<any[]>([]);
  
  const [isSplitTender, setIsSplitTender] = useState(false);
  const [splitCashAmount, setSplitCashAmount] = useState<string>("");
  const [splitUpiAmount, setSplitUpiAmount] = useState<string>("");
  
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "mixed">("cash");
  const [isSettling, setIsSettling] = useState(false);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [zReportData, setZReportData] = useState<any | null>(null);
  const [loadingZReport, setLoadingZReport] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<string>("2000");

  const [soundEnabled, setSoundEnabled] = useState(true);
  const supabase = getSupabaseBrowserClient();

  const flash = (kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  };

  function speakVoice(text: string) {
    if (!soundEnabled) return;
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {}
  }

  const fetchLiveOrders = async () => {
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
  };

  useEffect(() => {
    fetchLiveOrders();
    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        () => {
          fetchLiveOrders();
          speakVoice("New order received");
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        () => {
          fetchLiveOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant.id, supabase]);

  const addToCart = (it: Item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === it.id);
      if (existing) {
        return prev.map((c) => (c.item.id === it.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item: it, quantity: 1, notes: "" }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => (c.item.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)).filter((c) => c.quantity > 0)
    );
  };

  const setItemNotes = (id: string, note: string) => {
    setCart((prev) => prev.map((c) => (c.item.id === id ? { ...c, notes: note } : c)));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setFlatDiscountRupees("");
    setSplitCashAmount("");
    setSplitUpiAmount("");
    setAmountReceived("");
  };

  const totalItemCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const subtotalPaise = cart.reduce((acc, c) => acc + c.item.price_paise * c.quantity, 0);

  let discountPaise = 0;
  if (flatDiscountRupees && Number(flatDiscountRupees) > 0) {
    discountPaise = Math.min(Number(flatDiscountRupees) * 100, subtotalPaise);
  } else if (discountPercent > 0) {
    discountPaise = Math.round((subtotalPaise * discountPercent) / 100);
  }

  const finalTotalPaise = Math.max(0, subtotalPaise - discountPaise);
  const tableOrderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveOrders.forEach((o) => {
      if (o.status !== "served" && o.table_label) {
        const t = tables.find((t) => t.label === o.table_label);
        if (t) {
          counts[t.id] = (counts[t.id] || 0) + 1;
        }
      }
    });
    return counts;
  }, [liveOrders, tables]);

  const handleParkTab = () => {
    if (cart.length === 0) return;
    setParkedTabs([...parkedTabs, { id: Date.now().toString(), time: new Date().toLocaleTimeString(), customer: "Walk-in", cart }]);
    clearCart();
    flash("ok", "Tab Parked");
  };

  const handleRecallTab = (tab: any) => {
    setCart(tab.cart);
    setParkedTabs(parkedTabs.filter((pt) => pt.id !== tab.id));
    flash("ok", "Tab Recalled");
  };

  const handleSettle = async (status: "paid" | "unpaid") => {
    if (cart.length === 0 || isSettling) return;
    setIsSettling(true);

    try {
      const orderNumber = Math.floor(1000 + Math.random() * 9000).toString();
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant.id,
          table_id: selectedTable?.id || null,
          customer_name: "Walk-in",
          total_paise: finalTotalPaise,
          status: status === "paid" ? "served" : "pending",
          payment_status: status,
          payment_method: status === "paid" ? paymentMethod : null,
          order_number: orderNumber,
        })
        .select()
        .single();

      if (error) throw error;

      const orderItems = cart.map((c) => ({
        order_id: order.id,
        item_id: c.item.id,
        item_name: c.item.name,
        quantity: c.quantity,
        line_total_paise: c.item.price_paise * c.quantity,
        notes: c.notes,
      }));

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      flash("ok", status === "paid" ? "Bill Settled ✓" : "KOT Sent to Kitchen 🔥");
      if (status === "unpaid") speakVoice(`K O T sent to kitchen for table ${selectedTable?.label || "Counter"}`);
      clearCart();
    } catch (err: any) {
      flash("err", err.message);
    } finally {
      setIsSettling(false);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string, orderNumber: string, tableLabel: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
      speakVoice(`Order ${orderNumber} is ${status}`);
    } catch (err: any) {
      flash("err", err.message);
    }
  };

  const handleOpenZReport = async () => {
    setShowZReportModal(true);
    setLoadingZReport(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = liveOrders.filter((o) => new Date(o.created_at) >= today);
      
      const paidOrders = todayOrders.filter((o) => o.payment_status === "paid");
      const todayRevenuePaise = paidOrders.reduce((sum, o) => sum + o.total_paise, 0);
      
      const todayCashPaise = paidOrders
        .filter(o => o.payment_method === "cash" || !o.payment_method)
        .reduce((sum, o) => sum + o.total_paise, 0);
      const todayUpiPaise = paidOrders
        .filter(o => o.payment_method === "upi")
        .reduce((sum, o) => sum + o.total_paise, 0);
      const todayCardPaise = paidOrders
        .filter(o => o.payment_method === "card")
        .reduce((sum, o) => sum + o.total_paise, 0);
      
      setZReportData({
        metrics: {
          todayPaidCount: paidOrders.length,
          todayRevenuePaise,
          todayCashPaise,
          todayUpiPaise,
          todayCardPaise,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingZReport(false);
    }
  };

  return (
    <main className="h-screen flex flex-col bg-stone-950 font-sans text-stone-200 selection:bg-amber-500/30 overflow-hidden">
      <header className="bg-stone-900 border-b border-stone-800 flex items-center justify-between px-3 sm:px-4 py-2 shrink-0 z-10 shadow-sm no-print">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href={`/c/${restaurant.slug}`} className="w-7 h-7 sm:w-8 sm:h-8 bg-amber-500 rounded-lg flex items-center justify-center font-black text-stone-950 text-xs shadow-md">
            QR
          </Link>
          <div className="hidden sm:block leading-tight">
            <h1 className="font-black text-[13px] text-white tracking-wide flex items-center gap-1.5">
              <span>{restaurant.name}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] uppercase tracking-wider">POS</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-mono">Terminal 1</p>
          </div>
        </div>

        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            onClick={() => setViewMode("catalog")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "catalog" ? "bg-stone-800 text-white shadow-md" : "text-stone-400 hover:text-stone-200"
            }`}
          >
            ⚡ Register
          </button>
          <button
            onClick={() => setViewMode("kitchen")}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "kitchen" ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md" : "text-stone-400 hover:text-purple-300"
            }`}
          >
            🔥 Kitchen
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleOpenZReport} className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-bold border border-stone-700 transition-colors cursor-pointer flex items-center gap-1">
            📑 Z-Report
          </button>
        </div>
      </header>

      {viewMode === "catalog" && (
        <RegisterView
          categories={categories}
          items={items}
          tables={tables}
          orderType={orderType}
          selectedTable={selectedTable}
          setSelectedTable={setSelectedTable}
          tableOrderCounts={tableOrderCounts}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          vegOnly={vegOnly}
          setVegOnly={setVegOnly}
          cart={cart}
          onAddToCart={addToCart}
          clearCart={clearCart}
          updateQty={updateQty}
          setItemNotes={setItemNotes}
          handleParkTab={handleParkTab}
          parkedTabs={parkedTabs}
          handleRecallTab={handleRecallTab}
          discountPercent={discountPercent}
          setDiscountPercent={setDiscountPercent}
          flatDiscountRupees={flatDiscountRupees}
          setFlatDiscountRupees={setFlatDiscountRupees}
          subtotalPaise={subtotalPaise}
          discountPaise={discountPaise}
          finalTotalPaise={finalTotalPaise}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          isSplitTender={isSplitTender}
          setIsSplitTender={setIsSplitTender}
          splitCashAmount={splitCashAmount}
          setSplitCashAmount={setSplitCashAmount}
          splitUpiAmount={splitUpiAmount}
          setSplitUpiAmount={setSplitUpiAmount}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          handleSettle={handleSettle}
          isSettling={isSettling}
          mobileCartOpen={mobileCartOpen}
          setMobileCartOpen={setMobileCartOpen}
          msg={msg}
          totalItemCount={totalItemCount}
        />
      )}

      {viewMode === "kitchen" && (
        <KitchenView
          liveOrders={liveOrders}
          fetchLiveOrders={fetchLiveOrders}
          handleUpdateOrderStatus={handleUpdateOrderStatus}
        />
      )}

      <ZReportModal
        showZReportModal={showZReportModal}
        setShowZReportModal={setShowZReportModal}
        loadingZReport={loadingZReport}
        zReportData={zReportData}
        liveOrders={liveOrders}
        restaurant={restaurant}
        openingFloat={openingFloat}
        setOpeningFloat={setOpeningFloat}
      />
    </main>
  );
}
