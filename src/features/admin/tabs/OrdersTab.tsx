// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo } from "react";
import { paise } from "@/lib/utils";
import { StatusBadge } from "@/components/brand/StatusBadge";
import {
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@/components/Icons";

export interface OrderItemData {
  id: string;
  item_name: string;
  quantity: number;
  unit_price_paise: number;
  line_total_paise: number;
  notes?: string | null;
  spice_level?: string | null;
  size_variant?: string | null;
}

export interface OrderData {
  id: string;
  order_number: string | number;
  restaurant_id: string;
  table_label?: string | null;
  table?: { label: string };
  total_paise: number;
  subtotal_paise?: number;
  tax_paise?: number;
  payment_status: "unpaid" | "paid" | "refunded";
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed" | "cancelled" | "rejected";
  customer_name?: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  created_at: string;
  items?: OrderItemData[];
  order_items?: OrderItemData[];
}

interface OrdersTabProps {
  orders: OrderData[];
  onUpdateStatus: (orderId: string, status: string) => Promise<void>;
  onUpdatePayment?: (orderId: string, paymentStatus: string) => Promise<void>;
  flash: (kind: "ok" | "err", msg: string) => void;
}

const STATUS_TABS = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "served", label: "Served" },
  { id: "cancelled", label: "Cancelled" },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: ["completed"],
  completed: [],
  cancelled: [],
};

export function OrdersTab({ orders, onUpdateStatus, onUpdatePayment, flash }: OrdersTabProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Extract unique table names
  const uniqueTables = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      const tbl = o.table?.label || o.table_label;
      if (tbl) set.add(tbl);
    });
    return Array.from(set).sort();
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

    return orders.filter((o) => {
      // Date filter
      const orderDate = o.created_at ? o.created_at.slice(0, 10) : "";
      if (dateFilter === "today" && orderDate !== todayStr) return false;
      if (dateFilter === "yesterday" && orderDate !== yesterday) return false;

      // Status filter
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      // Table filter
      const tbl = o.table?.label || o.table_label || "";
      if (tableFilter !== "all" && tbl !== tableFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const numMatch = String(o.order_number).toLowerCase().includes(q);
        const nameMatch = (o.customer_name || "").toLowerCase().includes(q);
        const tblMatch = tbl.toLowerCase().includes(q);
        return numMatch || nameMatch || tblMatch;
      }

      return true;
    });
  }, [orders, statusFilter, dateFilter, tableFilter, searchQuery]);

  const handleTransition = async (orderId: string, nextStatus: string) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, nextStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
      }
      flash("ok", `Order #${selectedOrder?.order_number || ""} marked as ${nextStatus.toUpperCase()}`);
    } catch {
      flash("err", "Failed to transition order status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header & Metric Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Order Management
          </h2>
          <p className="text-xs text-[#6F7185] font-medium mt-0.5">
            Real-time customer tickets, status verification & line items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-100 rounded-xl">
            {(["today", "yesterday", "all"] as const).map((df) => (
              <button
                key={df}
                type="button"
                onClick={() => setDateFilter(df)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  dateFilter === df
                    ? "bg-white text-[#17142B] shadow-xs font-black"
                    : "text-[#6F7185] hover:text-[#17142B]"
                }`}
              >
                {df === "all" ? "All Time" : df}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E4F0] flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-[#5738F5] text-white shadow-xs font-extrabold"
                    : "bg-slate-50 text-[#6F7185] hover:bg-slate-100 hover:text-[#17142B]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Table Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Table filter */}
          {uniqueTables.length > 0 && (
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#17142B] focus:outline-none focus:border-[#5738F5]"
            >
              <option value="all">All Tables</option>
              {uniqueTables.map((tbl) => (
                <option key={tbl} value={tbl}>
                  Table {tbl}
                </option>
              ))}
            </select>
          )}

          {/* Search box */}
          <div className="relative flex-1 md:w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search #order, guest, table…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#17142B] placeholder-slate-400 focus:outline-none focus:border-[#5738F5]"
            />
          </div>
        </div>
      </div>

      {/* Orders Table View */}
      <div className="bg-white rounded-3xl border border-[#E7E4F0] overflow-hidden shadow-xs">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EEEAFE] text-[#5738F5] flex items-center justify-center mx-auto">
              <ClipboardListIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-[#17142B]">No orders found</h3>
            <p className="text-xs text-[#6F7185] max-w-sm mx-auto">
              {searchQuery
                ? "Try searching for a different order ID, customer name, or table number."
                : "New incoming customer orders will appear here automatically."}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E4F0] bg-slate-50/70 text-[#6F7185] uppercase tracking-wider font-extrabold text-[10px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Guest</th>
                    <th className="py-3 px-4">Dishes</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E4F0]">
                  {filteredOrders.map((o) => {
                    const itemsList = o.order_items || o.items || [];
                    const tbl = o.table?.label || o.table_label || "Counter";
                    const isSelected = selectedOrder?.id === o.id;

                    return (
                      <tr
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className={`hover:bg-[#EEEAFE]/30 transition-colors cursor-pointer ${
                          isSelected ? "bg-[#EEEAFE]/40" : ""
                        }`}
                      >
                        {/* Order Number */}
                        <td className="py-3.5 px-4 font-mono font-black text-sm text-[#17142B]">
                          #{o.order_number}
                        </td>

                        {/* Time */}
                        <td className="py-3.5 px-4 font-mono text-[#6F7185]">
                          {new Date(o.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Table */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-[#17142B] border border-slate-200">
                            {tbl}
                          </span>
                        </td>

                        {/* Guest Name */}
                        <td className="py-3.5 px-4 font-semibold text-[#17142B]">
                          {o.customer_name || "Dine-in Guest"}
                        </td>

                        {/* Items Preview */}
                        <td className="py-3.5 px-4 text-[#6F7185] max-w-xs truncate">
                          {itemsList.map((it) => `${it.quantity}× ${it.item_name}`).join(", ") || "—"}
                        </td>

                        {/* Total */}
                        <td className="py-3.5 px-4 font-mono font-black text-[#17142B]">
                          {paise(o.total_paise)}
                        </td>

                        {/* Payment */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={o.payment_status} type="payment" size="sm" />
                        </td>

                        {/* Order Status */}
                        <td className="py-3.5 px-4">
                          <StatusBadge status={o.status} type="order" size="sm" pulse={o.status === "pending"} />
                        </td>

                        {/* Detail CTA */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(o);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#5738F5] hover:text-white font-bold text-[11px] transition-colors"
                          >
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (md:hidden) */}
            <div className="md:hidden divide-y divide-[#E7E4F0]">
              {filteredOrders.map((o) => {
                const itemsList = o.order_items || o.items || [];
                const tbl = o.table?.label || o.table_label || "Counter";

                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="p-4 space-y-2.5 hover:bg-[#EEEAFE]/20 active:bg-[#EEEAFE]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-[#17142B]">
                          #{o.order_number}
                        </span>
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-[#17142B] border border-slate-200">
                          {tbl}
                        </span>
                      </div>
                      <span className="font-mono font-black text-sm text-[#17142B]">
                        {paise(o.total_paise)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6F7185]">
                      <span className="font-semibold text-[#17142B]">
                        {o.customer_name || "Dine-in Guest"}
                      </span>
                      <span className="font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-[#6F7185] line-clamp-2">
                      {itemsList.map((it) => `${it.quantity}× ${it.item_name}`).join(", ") || "—"}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={o.status} type="order" size="sm" pulse={o.status === "pending"} />
                        <StatusBadge status={o.payment_status} type="payment" size="sm" />
                      </div>
                      <span className="text-[#5738F5] text-xs font-bold flex items-center gap-1">
                        View Details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SLIDE-OVER / BOTTOM SHEET ORDER DETAIL DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-none max-h-[90dvh] sm:max-h-full sm:h-full shadow-2xl flex flex-col z-10 animate-slide-in-bottom sm:animate-slide-in-right overflow-y-auto pb-safe">
            {/* iOS Drag Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E7E4F0] flex items-start justify-between bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#5738F5] bg-[#EEEAFE] px-2 py-0.5 rounded-md">
                    TABLE {selectedOrder.table?.label || selectedOrder.table_label || "Counter"}
                  </span>
                  <span className="text-xs text-[#6F7185] font-mono">
                    {new Date(selectedOrder.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <h3 className="text-2xl font-black font-mono text-[#17142B]">
                  ORDER #{selectedOrder.order_number}
                </h3>
                <p className="text-xs text-[#6F7185] mt-0.5">
                  Guest: <span className="font-bold text-[#17142B]">{selectedOrder.customer_name || "Dine-in Guest"}</span>
                  {selectedOrder.customer_phone ? ` · ${selectedOrder.customer_phone}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#6F7185] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status Flow Actions */}
            <div className="p-6 border-b border-[#E7E4F0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6F7185] uppercase tracking-wider">Current Status</span>
                <StatusBadge status={selectedOrder.status} type="order" size="md" />
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedOrder.status === "pending" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleTransition(selectedOrder.id, "confirmed")}
                    className="flex-1 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs shadow-md shadow-[#5738F5]/20 cursor-pointer"
                  >
                    Accept Order ✓
                  </button>
                )}
                {selectedOrder.status === "confirmed" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleTransition(selectedOrder.id, "preparing")}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Start Cooking 🔥
                  </button>
                )}
                {selectedOrder.status === "preparing" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleTransition(selectedOrder.id, "ready")}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Mark Ready 🔔
                  </button>
                )}
                {selectedOrder.status === "ready" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleTransition(selectedOrder.id, "served")}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
                  >
                    Serve to Table ✓
                  </button>
                )}
                {selectedOrder.status === "served" && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleTransition(selectedOrder.id, "completed")}
                    className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Complete & Archive
                  </button>
                )}
                {!["served", "completed", "cancelled"].includes(selectedOrder.status) && (
                  <button
                    type="button"
                    disabled={updatingId === selectedOrder.id}
                    onClick={() => handleTransition(selectedOrder.id, "cancelled")}
                    className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Line Items List */}
            <div className="p-6 flex-1 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#6F7185]">
                Order Items ({((selectedOrder.order_items || selectedOrder.items) ?? []).length})
              </h4>

              <div className="space-y-3">
                {((selectedOrder.order_items || selectedOrder.items) ?? []).map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-[#E7E4F0] space-y-1"
                  >
                    <div className="flex justify-between items-start text-xs font-extrabold text-[#17142B]">
                      <span>
                        {it.item_name}{" "}
                        <span className="text-[#5738F5] font-mono">×{it.quantity}</span>
                      </span>
                      <span className="font-mono">{paise(it.line_total_paise || (it.unit_price_paise * it.quantity))}</span>
                    </div>

                    {(it.size_variant || it.spice_level) && (
                      <div className="flex gap-2 text-[11px] text-[#6F7185]">
                        {it.size_variant && <span>Variant: {it.size_variant}</span>}
                        {it.spice_level && <span>Spice: {it.spice_level}</span>}
                      </div>
                    )}

                    {it.notes && (
                      <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-1.5 font-medium">
                        “{it.notes}”
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div className="p-3 rounded-2xl bg-slate-100 text-xs text-[#17142B]">
                  <span className="font-bold text-[#6F7185] block mb-1">Customer Note:</span>
                  {selectedOrder.notes}
                </div>
              )}
            </div>

            {/* Bill Summary Footer */}
            <div className="p-6 border-t border-[#E7E4F0] bg-slate-50/50 space-y-2">
              <div className="flex justify-between text-xs text-[#6F7185]">
                <span>Payment Status</span>
                <StatusBadge status={selectedOrder.payment_status} type="payment" size="sm" />
              </div>
              <div className="flex justify-between text-base font-black text-[#17142B] pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="font-mono text-lg text-[#5738F5]">
                  {paise(selectedOrder.total_paise)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

