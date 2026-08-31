import { PosCatalogGrid } from "./PosCatalogGrid";
import { PosCartDrawer } from "./PosCartDrawer";
import type { Category, MenuItem as Item, CartLine } from "@/types";

interface RegisterViewProps {
  categories: Category[];
  items: Item[];
  tables: any[];
  
  orderType: "dine_in" | "takeaway" | "delivery";
  selectedTable: any | null;
  setSelectedTable: (t: any) => void;
  tableOrderCounts: Record<string, number>;
  
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  vegOnly: boolean;
  setVegOnly: (v: boolean) => void;

  cart: CartLine[];
  onAddToCart: (item: Item) => void;
  clearCart: () => void;
  updateQty: (id: string, delta: number) => void;
  setItemNotes: (id: string, note: string) => void;
  
  handleParkTab: () => void;
  parkedTabs: Array<any>;
  handleRecallTab: (tab: any) => void;

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
}

export function RegisterView(props: RegisterViewProps) {
  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden no-print relative">
      {/* Mobile Horizontal Tables */}
      <div className="md:hidden bg-stone-900 border-b border-stone-800 p-2 overflow-x-auto flex gap-2 shrink-0 no-scrollbar">
        {props.orderType === "dine_in" &&
          props.tables.map((t) => {
            const activeCount = props.tableOrderCounts[t.id] || 0;
            return (
              <button
                key={t.id}
                onClick={() => props.setSelectedTable(t)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap shrink-0 relative ${
                  props.selectedTable?.id === t.id
                    ? "bg-amber-500 border-amber-400 text-stone-950 font-black"
                    : "bg-stone-950 border-stone-800 text-stone-300"
                }`}
              >
                {t.label} ({t.seats}s)
                {activeCount > 0 && (
                  <span className="ml-1 px-1 rounded-full bg-red-500 text-white text-[8px] font-black">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* DESKTOP LEFT COLUMN: Tables & Categories */}
      <aside className="hidden md:flex w-52 lg:w-56 bg-stone-900/60 border-r border-stone-800 flex-col shrink-0 overflow-y-auto p-3 space-y-3">
        {props.orderType === "dine_in" && (
          <div>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2 px-1">
              Active Tables
            </span>
            <div className="grid grid-cols-2 gap-2">
              {props.tables.map((t) => {
                const activeCount = props.tableOrderCounts[t.id] || 0;
                return (
                  <button
                    key={t.id}
                    onClick={() => props.setSelectedTable(t)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative ${
                      props.selectedTable?.id === t.id
                        ? "bg-amber-500 border-amber-400 text-stone-950 font-black shadow-md shadow-amber-500/20"
                        : "bg-stone-950/80 border-stone-800 text-stone-300 hover:border-stone-700"
                    }`}
                  >
                    {activeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-pulse">
                        {activeCount}
                      </span>
                    )}
                    <div className="text-xs font-extrabold">{t.label}</div>
                    <div
                      className={`text-[10px] ${
                        props.selectedTable?.id === t.id ? "text-stone-900" : "text-stone-500"
                      }`}
                    >
                      {t.seats} Seats
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2 px-1">
            Categories
          </span>
          <div className="space-y-1.5">
            <button
              onClick={() => props.setSelectedCategory("all")}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left cursor-pointer transition-all flex justify-between items-center ${
                props.selectedCategory === "all"
                  ? "bg-stone-800 text-amber-400 font-black border border-stone-700"
                  : "text-stone-400 hover:bg-stone-900/80 hover:text-stone-200"
              }`}
            >
              <span>🔥 All Items</span>
              <span className="text-[10px] font-mono opacity-60">({props.items.length})</span>
            </button>
            {props.categories.map((c) => {
              const count = props.items.filter((i) => i.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => props.setSelectedCategory(c.id)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left cursor-pointer transition-all flex justify-between items-center ${
                    props.selectedCategory === c.id
                      ? "bg-stone-800 text-amber-400 font-black border border-stone-700"
                      : "text-stone-400 hover:bg-stone-900/80 hover:text-stone-200"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-[10px] font-mono opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* MIDDLE COLUMN: Items Catalog Grid */}
      <PosCatalogGrid
        categories={props.categories}
        items={props.items}
        selectedCategory={props.selectedCategory}
        setSelectedCategory={props.setSelectedCategory}
        searchQuery={props.searchQuery}
        setSearchQuery={props.setSearchQuery}
        vegOnly={props.vegOnly}
        setVegOnly={props.setVegOnly}
        onAddToCart={props.onAddToCart}
        msg={props.msg}
        totalItemCount={props.totalItemCount}
        finalTotalPaise={props.finalTotalPaise}
        onOpenMobileCart={() => props.setMobileCartOpen(true)}
        cartLength={props.cart.length}
      />

      {/* DESKTOP RIGHT DRAWER & MOBILE DRAWER POPUP */}
      <PosCartDrawer
        mobileCartOpen={props.mobileCartOpen}
        setMobileCartOpen={props.setMobileCartOpen}
        cart={props.cart}
        orderType={props.orderType}
        selectedTable={props.selectedTable}
        clearCart={props.clearCart}
        updateQty={props.updateQty}
        setItemNotes={props.setItemNotes}
        handleParkTab={props.handleParkTab}
        parkedTabs={props.parkedTabs}
        handleRecallTab={props.handleRecallTab}
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
      />
    </div>
  );
}
