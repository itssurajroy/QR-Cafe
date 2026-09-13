// Copyright (c) 2026 QRslice. All rights reserved.
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

  customerPhone?: string;
  setCustomerPhone?: (v: string) => void;
  customerPoints?: number | null;
  redeemPoints?: number;
  setRedeemPoints?: (v: number) => void;
  handleCheckPoints?: () => void;
  isCheckingPoints?: boolean;

  mobileCartOpen: boolean;
  setMobileCartOpen: (v: boolean) => void;
  msg: { kind: "ok" | "err"; text: string } | null;
  totalItemCount: number;


  liveOrders?: any[];
  handleUpdateOrderStatus?: (id: string, status: string, orderNumber: string, tableLabel: string) => void;
  onOpenWaModal?: (ord: any) => void;
}

export function RegisterView(props: RegisterViewProps) {
  const handleAddToCart = props.addToCart || props.onAddToCart || (() => {});
  const effectiveOrderType = props.orderType || "dine_in";
  const pendingCount = props.reservations.filter((r) => r.status === "pending").length;
  const confirmedReservations = props.reservations.filter((r) => r.status === "confirmed");

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden no-print relative bg-[#F5F5F7] text-slate-900">
      {/* Mobile Horizontal Tables & Order Type */}
      <div className="md:hidden bg-white border-b border-black/[0.06] p-2.5 overflow-x-auto flex flex-col gap-2 shrink-0 no-scrollbar">
        <div className="flex bg-black/[0.04] p-1 rounded-2xl text-xs font-semibold text-slate-600 shrink-0">
          <button
            onClick={() => props.setOrderType("dine_in")}
            className={`flex-1 py-1.5 rounded-xl transition-all ${effectiveOrderType === "dine_in" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"}`}
          >
            Dine-In
          </button>
          <button
            onClick={() => { props.setOrderType("takeaway"); props.setSelectedTable(null); }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${effectiveOrderType === "takeaway" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"}`}
          >
            Pickup
          </button>
          <button
            onClick={() => { props.setOrderType("delivery"); props.setSelectedTable(null); }}
            className={`flex-1 py-1.5 rounded-xl transition-all ${effectiveOrderType === "delivery" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"}`}
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
                className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 relative cursor-pointer min-h-[44px] transition-all active:scale-95 ${
                  props.selectedTable?.id === t.id
                    ? "bg-[#007AFF] border-[#007AFF] text-white font-bold shadow-sm"
                    : "bg-white border-black/[0.06] text-slate-700 hover:border-black/[0.12]"
                }`}
              >
                {t.label} ({t.seats}s){fs.detail && fs.state !== "occupied" && fs.state !== "free" && ` • ${fs.detail}`}
                {activeCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#FF3B30] text-white text-[9px] font-bold animate-pulse">
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
      <aside className="hidden md:flex w-52 lg:w-56 bg-white/70 backdrop-blur-md border-r border-black/[0.06] flex-col shrink-0 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="flex bg-black/[0.04] p-1 rounded-2xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => props.setOrderType("dine_in")}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${effectiveOrderType === "dine_in" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"}`}
            >
              Dine-In
            </button>
            <button
              onClick={() => { props.setOrderType("takeaway"); props.setSelectedTable(null); }}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${effectiveOrderType === "takeaway" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"}`}
            >
              Pickup
            </button>
            <button
              onClick={() => { props.setOrderType("delivery"); props.setSelectedTable(null); }}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${effectiveOrderType === "delivery" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"}`}
            >
              Delivery
            </button>
          </div>
        </div>

        {props.orderType === "dine_in" && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tables
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#FF9500]/15 text-[#FF9500] text-[10px] font-bold">
                  {pendingCount} wait
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
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative active:scale-95 min-h-[52px] ${
                      isSelected
                        ? "bg-[#007AFF] border-[#007AFF] text-white shadow-sm font-bold"
                        : "bg-white border-black/[0.06] hover:border-black/[0.12] text-slate-800"
                    }`}
                  >
                    {activeCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
                        {activeCount}
                      </span>
                    )}
                    <div className="text-xs font-bold">{t.label}</div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? "text-white/80 font-medium" : "text-slate-400 font-mono"
                      }`}
                    >
                      {t.seats} Seats
                    </div>
                    {fs.detail && fs.state !== "occupied" && fs.state !== "free" && (
                      <div className={`text-[10px] font-bold ${fs.state === "held" ? "text-white" : "text-[#FF9500]"}`}>{fs.detail}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 px-1">
            Categories
          </span>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => props.setSelectedCategory("all")}
              className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-all duration-200 flex justify-between items-center min-h-[40px] active:scale-95 ${
                props.selectedCategory === "all"
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "bg-white/80 border border-black/[0.04] text-slate-700 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <span>All Dishes</span>
              <span className={`text-[10px] font-mono ${props.selectedCategory === "all" ? "text-white/80" : "text-slate-400"}`}>({props.items.length})</span>
            </button>
            {props.categories.map((c) => {
              const count = props.items.filter((i) => i.category_id === c.id).length;
              const isSelected = props.selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => props.setSelectedCategory(c.id)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold text-left cursor-pointer transition-all duration-200 flex justify-between items-center min-h-[40px] active:scale-95 ${
                    isSelected
                      ? "bg-slate-900 text-white font-bold shadow-xs"
                      : "bg-white/80 border border-black/[0.04] text-slate-700 hover:text-slate-900 hover:bg-white"
                  }`}
                >
                  <span className="truncate pr-2">{c.name}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? "text-white/80" : "text-slate-400"}`}>({count})</span>
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
        isSettling={props.isSettling}
        handleSettle={props.handleSettle}
        customerPhone={props.customerPhone}
        setCustomerPhone={props.setCustomerPhone}
        customerPoints={props.customerPoints}
        redeemPoints={props.redeemPoints}
        setRedeemPoints={props.setRedeemPoints}
        handleCheckPoints={props.handleCheckPoints}
        isCheckingPoints={props.isCheckingPoints}
        liveOrders={props.liveOrders}
        handleUpdateOrderStatus={props.handleUpdateOrderStatus}
        onOpenWaModal={props.onOpenWaModal}
      />
    </div>
  );
}
