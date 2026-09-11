import { PosCatalogGrid } from "./PosCatalogGrid";
import { PosCartDrawer } from "./PosCartDrawer";
import { tableFloorState } from "@/features/booking/floorStatus";
import type { Category, MenuItem as Item, CartLine, Table } from "@/types";

interface RegisterViewProps {
  restaurant?: { id: string; name: string };
  categories: Category[];
  items: Item[];
  tables: Table[];

  orderType: "dine_in" | "takeaway" | "delivery";
  setOrderType: (v: "dine_in" | "takeaway" | "delivery") => void;
  selectedTable: Table | null;
  setSelectedTable: (t: Table | null) => void;
  tableOrderCounts: Record<string, number>;
  reservations: { table_ids: string[]; starts_at: string; ends_at: string; status: string }[];

  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  vegOnly: boolean;
  setVegOnly: (v: boolean) => void;

  cart: CartLine[];
  addToCart?: (item: Item) => void;
  onAddToCart?: (item: Item) => void;
  clearCart: () => void;
  updateQty: (id: string, delta: number) => void;
  setItemNotes: (id: string, note: string) => void;

  handleParkTab: () => void;
  parkedTabs?: Array<{ id: string; time: string; customer: string; cart: CartLine[] }>;
  handleRecallTab?: (tab: { id: string; time: string; customer: string; cart: CartLine[] }) => void;

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

  mobileCartOpen: boolean;
  setMobileCartOpen: (v: boolean) => void;
  msg: { kind: "ok" | "err"; text: string } | null;
  totalItemCount: number;


  liveOrders?: any[];
  handleUpdateOrderStatus?: (id: string, status: string, orderNumber: string, tableLabel: string) => void;
}

export function RegisterView(props: RegisterViewProps) {
  const handleAddToCart = props.addToCart || props.onAddToCart || (() => {});
  const effectiveOrderType = props.orderType || "dine_in";
  const pendingCount = props.reservations.filter((r) => r.status === "pending").length;
  const confirmedReservations = props.reservations.filter((r) => r.status === "confirmed");

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden no-print relative bg-slate-100 text-slate-900">
      {/* Mobile Horizontal Tables & Order Type */}
      <div className="md:hidden bg-white border-b border-slate-200 p-2 overflow-x-auto flex flex-col gap-2 shrink-0 no-scrollbar">
        <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 shrink-0">
          <button
            onClick={() => props.setOrderType("dine_in")}
            className={`flex-1 py-1.5 rounded-lg transition-all ${effectiveOrderType === "dine_in" ? "bg-white text-indigo-600 shadow-sm" : "hover:text-slate-700"}`}
          >
            Dine-In
          </button>
          <button
            onClick={() => { props.setOrderType("takeaway"); props.setSelectedTable(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${effectiveOrderType === "takeaway" ? "bg-white text-amber-600 shadow-sm" : "hover:text-slate-700"}`}
          >
            Takeaway
          </button>
          <button
            onClick={() => { props.setOrderType("delivery"); props.setSelectedTable(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${effectiveOrderType === "delivery" ? "bg-white text-emerald-600 shadow-sm" : "hover:text-slate-700"}`}
          >
            Delivery
          </button>
        </div>
        {effectiveOrderType === "dine_in" && (
          <div className="flex gap-2">
          {props.tables.map((t) => {
            const activeCount = props.tableOrderCounts[t.id] || 0;
            const fs = tableFloorState(t.id, new Date(), confirmedReservations, new Set(Object.keys(props.tableOrderCounts)));
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => props.setSelectedTable(t)}
                className={`px-3 py-2 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 relative cursor-pointer min-h-[44px] transition-all active:scale-95 ${
                  props.selectedTable?.id === t.id
                    ? "bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                {t.label} ({t.seats}s){fs.detail && fs.state !== "occupied" && fs.state !== "free" && ` • ${fs.detail}`}
                {activeCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
          </div>
        )}
      </div>

      {/* DESKTOP LEFT COLUMN: Tables & Categories */}
      <aside className="hidden md:flex w-52 lg:w-56 bg-slate-50 border-r border-slate-200 flex-col shrink-0 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="flex bg-slate-200/60 p-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-inner">
            <button
              onClick={() => props.setOrderType("dine_in")}
              className={`flex-1 py-2 rounded-lg transition-all ${effectiveOrderType === "dine_in" ? "bg-white text-indigo-600 shadow-sm" : "hover:text-slate-700 hover:bg-slate-200"}`}
            >
              Dine-In
            </button>
            <button
              onClick={() => { props.setOrderType("takeaway"); props.setSelectedTable(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${effectiveOrderType === "takeaway" ? "bg-white text-amber-600 shadow-sm" : "hover:text-slate-700 hover:bg-slate-200"}`}
            >
              Pickup
            </button>
            <button
              onClick={() => { props.setOrderType("delivery"); props.setSelectedTable(null); }}
              className={`flex-1 py-2 rounded-lg transition-all ${effectiveOrderType === "delivery" ? "bg-white text-emerald-600 shadow-sm" : "hover:text-slate-700 hover:bg-slate-200"}`}
            >
              Delivery
            </button>
          </div>
        </div>

        {props.orderType === "dine_in" && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest block">
                Active Tables
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black">
                  ⏳ {pendingCount} pending approval
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {props.tables.map((t) => {
                const activeCount = props.tableOrderCounts[t.id] || 0;
                const fs = tableFloorState(t.id, new Date(), confirmedReservations, new Set(Object.keys(props.tableOrderCounts)));
                const isSelected = props.selectedTable?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => props.setSelectedTable(t)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 relative active:scale-95 min-h-[50px] ${
                      isSelected
                        ? "bg-amber-500 border-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-400/30"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    {activeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                        {activeCount}
                      </span>
                    )}
                    <div className="text-xs font-extrabold">{t.label}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? "text-slate-950 font-bold" : "text-slate-400 font-mono"
                      }`}
                    >
                      {t.seats} Seats
                    </div>
                    {fs.detail && fs.state !== "occupied" && fs.state !== "free" && (
                      <div className={`text-[10px] font-bold ${fs.state === "held" ? "text-indigo-600" : "text-amber-600"}`}>{fs.detail}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest block mb-2 px-1">
            Categories
          </span>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => props.setSelectedCategory("all")}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all duration-200 flex justify-between items-center min-h-[44px] active:scale-95 ${
                props.selectedCategory === "all"
                  ? "bg-amber-500 border border-amber-400 text-slate-950 font-black shadow-md"
                  : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <span>All Dishes</span>
              <span className={`text-[10px] font-mono ${props.selectedCategory === "all" ? "text-slate-950 font-bold" : "text-slate-400"}`}>({props.items.length})</span>
            </button>
            {props.categories.map((c) => {
              const count = props.items.filter((i) => i.category_id === c.id).length;
              const isSelected = props.selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => props.setSelectedCategory(c.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all duration-200 flex justify-between items-center min-h-[44px] active:scale-95 ${
                    isSelected
                      ? "bg-amber-500 border border-amber-400 text-slate-950 font-black shadow-md"
                      : "bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
                  }`}
                >
                  <span className="truncate pr-2">{c.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? "text-slate-950 font-bold" : "text-slate-400"}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* POS CATALOG GRID */}
      <PosCatalogGrid
        categories={props.categories}
        items={props.items}
        selectedCategory={props.selectedCategory}
        setSelectedCategory={props.setSelectedCategory}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        vegOnly={props.vegOnly}
        setVegOnly={props.setVegOnly}
        onAddToCart={handleAddToCart}
        msg={props.msg}
        totalItemCount={props.totalItemCount}
        finalTotalPaise={props.finalTotalPaise}
        onOpenMobileCart={() => props.setMobileCartOpen(true)}
        cartLength={props.cart.length}
      />

      {/* POS CART & BILL DRAWER */}
      <PosCartDrawer
        mobileCartOpen={props.mobileCartOpen}
        setMobileCartOpen={props.setMobileCartOpen}
        cart={props.cart}
        orderType={props.orderType}
        setOrderType={props.setOrderType}
        selectedTable={props.selectedTable}
        setSelectedTable={props.setSelectedTable}
        clearCart={props.clearCart}
        updateQty={props.updateQty}
        setItemNotes={props.setItemNotes}
        handleParkTab={props.handleParkTab}
        parkedTabs={props.parkedTabs || []}
        handleRecallTab={props.handleRecallTab || (() => {})}
        discountPercent={props.discountPercent}
        setDiscountPercent={props.setDiscountPercent}
        flatDiscountRupees={props.flatDiscountRupees}
        setFlatDiscountRupees={props.setFlatDiscountRupees}
        subtotalPaise={props.subtotalPaise}
        discountPaise={props.discountPaise}
        finalTotalPaise={props.finalTotalPaise}
        paymentMethod={props.paymentMethod}
        setPaymentMethod={props.setPaymentMethod}
        isSplitTender={props.isSplitTender}
        setIsSplitTender={props.setIsSplitTender}
        splitCashAmount={props.splitCashAmount}
        setSplitCashAmount={props.setSplitCashAmount}
        splitUpiAmount={props.splitUpiAmount}
        setSplitUpiAmount={props.setSplitUpiAmount}
        amountReceived={props.amountReceived}
        setAmountReceived={props.setAmountReceived}
        handleSettle={props.handleSettle}
        isSettling={props.isSettling}
        liveOrders={props.liveOrders}
        handleUpdateOrderStatus={props.handleUpdateOrderStatus}

      />
    </div>
  );
}