// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo } from "react";
import {
  calculateDetailedTableStatus,
  type TableOperationalState,
  type DetailedTableStatus,
  type FloorReservation,
} from "@/features/booking/floorStatus";
import { paise } from "@/lib/utils";
import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  Printer,
  Sparkles,
  X,
  CreditCard,
  Search,
} from "lucide-react";
import type { Table } from "@/types";

interface VisualFloorGridProps {
  tables: Table[];
  orders: any[];
  reservations?: FloorReservation[];
  billRequestedTableIds?: Set<string> | string[];
  onSelectTable: (table: Table) => void;
  onOpenRegister: (table: Table) => void;
  onSettleOrder?: (orderId: string, table: Table) => void;
  onUpdateOrderStatus?: (orderId: string, status: string, orderNumber: string, tableLabel: string) => void;
  onPrintBill?: (order: any) => void;
  onActionReservation?: (
    id: string,
    action: "accept" | "seat" | "cancel" | "no_show",
    tableLabel?: string,
  ) => Promise<void>;
}

export function VisualFloorGrid({
  tables,
  orders,
  reservations = [],
  billRequestedTableIds = new Set(),
  onSelectTable,
  onOpenRegister,
  onSettleOrder,
  onUpdateOrderStatus,
  onPrintBill,
  onActionReservation,
}: VisualFloorGridProps) {
  const [filterState, setFilterState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectedTable, setInspectedTable] = useState<{
    table: Table;
    status: DetailedTableStatus;
  } | null>(null);

  // Compute status for all tables
  const tableStatuses = useMemo(() => {
    return tables.map((t) => {
      const status = calculateDetailedTableStatus(
        t,
        orders,
        reservations,
        billRequestedTableIds,
        new Date(),
      );
      return { table: t, status };
    });
  }, [tables, orders, reservations, billRequestedTableIds]);

  // Aggregate counts for KPI filter chips
  const counts = useMemo(() => {
    const res = {
      all: tableStatuses.length,
      available: 0,
      seated: 0,
      cooking: 0,
      needs_bill: 0,
      served: 0,
      paid: 0,
      reserved: 0,
    };
    tableStatuses.forEach(({ status }) => {
      if (status.state in res) {
        res[status.state as keyof typeof res]++;
      }
    });
    return res;
  }, [tableStatuses]);

  // Filter tables
  const filteredTables = useMemo(() => {
    return tableStatuses.filter(({ table, status }) => {
      // Status filter
      if (filterState !== "all" && status.state !== filterState) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesLabel = table.label.toLowerCase().includes(q);
        const matchesCustomer = status.customerName?.toLowerCase().includes(q);
        const matchesPhone = status.customerPhone?.includes(q);
        return matchesLabel || matchesCustomer || matchesPhone;
      }
      return true;
    });
  }, [tableStatuses, filterState, searchQuery]);

  return (
    <div className="flex-1 p-4 sm:p-6 bg-[#F8F9FA] overflow-y-auto space-y-6">
      {/* ═══ Top Controls & Filter Bar ═══ */}
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Visual Floor Command
              </h1>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live floor overview • Spot seated guests, kitchen prep timers, and pending bills at a glance.
            </p>
          </div>

          {/* Search Table */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table or guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#5738F5] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* ═══ Filter Chips Bar ═══ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: "All Tables", count: counts.all, color: "bg-slate-900 text-white" },
            {
              id: "needs_bill",
              label: "🔴 Needs Bill",
              count: counts.needs_bill,
              color: "bg-rose-600 text-white shadow-rose-200",
              urgent: counts.needs_bill > 0,
            },
            {
              id: "cooking",
              label: "🟠 Cooking in Kitchen",
              count: counts.cooking,
              color: "bg-amber-500 text-white shadow-amber-200",
            },
            {
              id: "seated",
              label: "🔵 Seated & Ordering",
              count: counts.seated,
              color: "bg-blue-600 text-white shadow-blue-200",
            },
            {
              id: "available",
              label: "🟢 Available (Free)",
              count: counts.available,
              color: "bg-emerald-600 text-white shadow-emerald-200",
            },
            {
              id: "reserved",
              label: "🟡 Reserved",
              count: counts.reserved,
              color: "bg-purple-600 text-white shadow-purple-200",
            },
          ].map((chip) => {
            const isSelected = filterState === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setFilterState(chip.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 shrink-0 border ${
                  isSelected
                    ? `${chip.color} shadow-sm border-transparent`
                    : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200/80 shadow-2xs"
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    isSelected ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ═══ Floor Grid ═══ */}
        {filteredTables.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
            <p className="text-sm font-semibold">No tables matching this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map(({ table, status }) => {
              const isNeedsBill = status.state === "needs_bill";
              const isCooking = status.state === "cooking";
              const isSeated = status.state === "seated";
              const isAvailable = status.state === "available";
              const isReserved = status.state === "reserved";
              const isPaid = status.state === "paid";

              // Style tokens based on operational state
              let cardBg = "bg-white border-slate-200/90";
              let badgeBg = "bg-slate-100 text-slate-600";
              let badgeDot = "bg-slate-400";
              let badgeText = status.badgeText;

              if (isNeedsBill) {
                cardBg = "bg-gradient-to-b from-rose-50/70 to-white border-rose-300 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/5";
                badgeBg = "bg-rose-100 text-rose-800 border-rose-200";
                badgeDot = "bg-rose-500 animate-ping";
                badgeText = "Needs Bill";
              } else if (isCooking) {
                cardBg = "bg-gradient-to-b from-amber-50/70 to-white border-amber-300 ring-2 ring-amber-500/10 shadow-sm";
                badgeBg = "bg-amber-100 text-amber-800 border-amber-200";
                badgeDot = "bg-amber-500 animate-pulse";
              } else if (isSeated) {
                cardBg = "bg-gradient-to-b from-blue-50/60 to-white border-blue-200/90 shadow-sm";
                badgeBg = "bg-blue-100 text-blue-800 border-blue-200";
                badgeDot = "bg-blue-500";
              } else if (isPaid) {
                cardBg = "bg-gradient-to-b from-purple-50/60 to-white border-purple-200 shadow-sm";
                badgeBg = "bg-purple-100 text-purple-800 border-purple-200";
                badgeDot = "bg-purple-500";
              } else if (isAvailable) {
                cardBg = "bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md";
                badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200/80";
                badgeDot = "bg-emerald-500";
              } else if (isReserved) {
                cardBg = "bg-gradient-to-b from-purple-50/40 to-white border-purple-200";
                badgeBg = "bg-purple-100 text-purple-800 border-purple-200";
                badgeDot = "bg-purple-500";
              }

              return (
                <div
                  key={table.id}
                  className={`rounded-3xl border-2 p-4 transition-all duration-200 flex flex-col justify-between min-h-[220px] relative group ${cardBg}`}
                >
                  {/* Top Header: Table Number & Status Pill */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-mono text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Table
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight flex items-baseline gap-1.5">
                          <span>#{table.label}</span>
                          <span className="text-xs font-semibold text-slate-400">
                            ({table.seats || 4}s)
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeBg}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${badgeDot}`} />
                        {badgeText}
                      </span>
                    </div>

                    {/* Middle: Content info depending on state */}
                    <div className="py-2.5 border-t border-black/[0.04] space-y-1.5 text-xs">
                      {/* Customer info if present */}
                      {status.customerName && (
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{status.customerName}</span>
                        </div>
                      )}

                      {/* Items Preview */}
                      {status.itemsSummary.length > 0 ? (
                        <div className="text-slate-600 font-medium line-clamp-2 leading-tight">
                          {status.itemsSummary.join(", ")}
                        </div>
                      ) : isAvailable ? (
                        <div className="text-slate-400 text-xs italic py-2">
                          Ready for seating. Scan QR to order.
                        </div>
                      ) : isReserved ? (
                        <div className="text-purple-700 font-semibold text-xs py-1">
                          {status.badgeText}
                        </div>
                      ) : null}

                      {/* Elapsed Timer & Order Total */}
                      {status.orderCount > 0 && (
                        <div className="flex items-center justify-between pt-1 text-slate-500 font-semibold text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {status.elapsedMinutes}m elapsed
                          </span>
                          <span className="text-slate-900 font-black text-xs">
                            {paise(status.totalPaise)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-3 border-t border-black/[0.05] flex items-center gap-2">
                    {/* Primary Context Action Button */}
                    {isNeedsBill ? (
                      <button
                        onClick={() => {
                          const unpaidOrder = status.activeOrders.find(
                            (o) => o.payment_status === "unpaid",
                          );
                          if (unpaidOrder && onSettleOrder) {
                            onSettleOrder(unpaidOrder.id, table);
                          } else {
                            onSelectTable(table);
                            onOpenRegister(table);
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Settle {paise(status.totalPaise)}</span>
                      </button>
                    ) : isCooking ? (
                      <button
                        onClick={() => {
                          onSelectTable(table);
                          setInspectedTable({ table, status });
                        }}
                        className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Kitchen Prep</span>
                      </button>
                    ) : isSeated ? (
                      <button
                        onClick={() => {
                          onSelectTable(table);
                          onOpenRegister(table);
                        }}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Manage Tab</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : isPaid ? (
                      <button
                        onClick={() => {
                          const paidOrder = status.activeOrders[0];
                          if (paidOrder && onUpdateOrderStatus) {
                            onUpdateOrderStatus(
                              paidOrder.id,
                              "completed",
                              paidOrder.order_number,
                              table.label,
                            );
                          }
                        }}
                        className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Clear Table</span>
                      </button>
                    ) : isReserved ? (
                      <button
                        onClick={() => {
                          if (status.reservation?.status === "pending" && onActionReservation) {
                            onActionReservation(status.reservation.id, "accept", table.label);
                          } else if (onActionReservation && status.reservation) {
                            onActionReservation(status.reservation.id, "seat", table.label);
                            onSelectTable(table);
                            onOpenRegister(table);
                          } else {
                            onSelectTable(table);
                            onOpenRegister(table);
                          }
                        }}
                        className={`flex-1 py-2 px-3 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          status.reservation?.status === "pending"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {status.reservation?.status === "pending"
                            ? `Confirm #${status.reservation?.code || "Booking"}`
                            : `Seat #${status.reservation?.code || "Guest"}`}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onSelectTable(table);
                          onOpenRegister(table);
                        }}
                        className="flex-1 py-2 px-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Seat & Order</span>
                      </button>
                    )}

                    {/* Inspection / Info Button */}
                    <button
                      onClick={() => setInspectedTable({ table, status })}
                      className="p-2 text-slate-400 hover:text-slate-800 hover:bg-black/[0.05] rounded-xl transition-colors cursor-pointer"
                      title="Inspect table orders"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Slide-Over Modal: Table Detailed Inspector ═══ */}
      {inspectedTable && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                  <div className="font-mono text-xs uppercase font-bold text-slate-400">
                    Floor Command Inspector
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">
                    Table #{inspectedTable.table.label}
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Capacity: {inspectedTable.table.seats || 4} seats •{" "}
                    <span className="font-bold text-[#5738F5]">
                      {inspectedTable.status.label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedTable(null)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Banner if available */}
              {inspectedTable.status.customerName && !inspectedTable.status.reservation && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {inspectedTable.status.customerName}
                    </div>
                    {inspectedTable.status.customerPhone && (
                      <div className="text-slate-500 font-mono text-[11px]">
                        {inspectedTable.status.customerPhone}
                      </div>
                    )}
                  </div>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[10px]">
                    Table Guest
                  </span>
                </div>
              )}

              {/* Table Reservation Card if booked */}
              {inspectedTable.status.reservation && (
                <div className="p-4 bg-purple-50/80 rounded-2xl border border-purple-200/90 mb-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase font-bold text-purple-600 tracking-wider">
                        Table Booking
                      </div>
                      <div className="text-xl font-black text-purple-950 font-mono tracking-tight">
                        #{inspectedTable.status.reservation.code}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        inspectedTable.status.reservation.status === "pending"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {inspectedTable.status.reservation.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-purple-100">
                    <div>
                      <div className="text-[10px] text-purple-700/80 font-semibold uppercase">
                        Guest
                      </div>
                      <div className="font-bold text-purple-950 truncate">
                        {inspectedTable.status.reservation.name}
                      </div>
                      <div className="font-mono text-[11px] text-purple-700">
                        {inspectedTable.status.reservation.phone}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-purple-700/80 font-semibold uppercase">
                        Party & Time
                      </div>
                      <div className="font-bold text-purple-950">
                        {inspectedTable.status.reservation.party_size || inspectedTable.table.seats || 2} Guests
                      </div>
                      <div className="text-[11px] text-purple-700 font-mono">
                        {new Date(inspectedTable.status.reservation.starts_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  {onActionReservation && (
                    <div className="flex gap-2 pt-1">
                      {inspectedTable.status.reservation.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              await onActionReservation(
                                inspectedTable.status.reservation.id,
                                "accept",
                                inspectedTable.table.label,
                              );
                              setInspectedTable(null);
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept & Confirm</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onActionReservation(
                                inspectedTable.status.reservation.id,
                                "cancel",
                                inspectedTable.table.label,
                              );
                              setInspectedTable(null);
                            }}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              await onActionReservation(
                                inspectedTable.status.reservation.id,
                                "seat",
                                inspectedTable.table.label,
                              );
                              onSelectTable(inspectedTable.table);
                              onOpenRegister(inspectedTable.table);
                              setInspectedTable(null);
                            }}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Seat Guest Now</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onActionReservation(
                                inspectedTable.status.reservation.id,
                                "no_show",
                                inspectedTable.table.label,
                              );
                              setInspectedTable(null);
                            }}
                            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            No-Show
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Active Orders Breakdown */}
              <div className="space-y-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Active Orders ({inspectedTable.status.activeOrders.length})
                </div>

                {inspectedTable.status.activeOrders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                    No active orders placed yet. Table is available.
                  </div>
                ) : (
                  inspectedTable.status.activeOrders.map((ord: any) => {
                    const its = ord.items || ord.order_items || [];
                    const isUnpaid = ord.payment_status === "unpaid";
                    return (
                      <div
                        key={ord.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-slate-800">
                            #{ord.order_number}
                          </span>
                          <div className="flex gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isUnpaid
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isUnpaid ? "Unpaid" : "Paid"}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase">
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                          {its.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center">
                              <span>
                                {item.quantity}× {item.item_name || item.item?.name || "Dish"}
                              </span>
                              <span className="font-mono font-semibold text-slate-500">
                                {paise(item.unit_price_paise ? item.unit_price_paise * item.quantity : 0)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-600">Total</span>
                          <span className="font-black text-slate-900 text-sm">
                            {paise(ord.total_paise || 0)}
                          </span>
                        </div>

                        {/* Direct KOT print button */}
                        {onPrintBill && (
                          <button
                            onClick={() => onPrintBill(ord)}
                            className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Print KOT / Bill Receipt</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-5 border-t border-slate-200 space-y-2.5 mt-6">
              {inspectedTable.status.totalPaise > 0 && onSettleOrder && (
                <button
                  onClick={() => {
                    const unpaidOrder = inspectedTable.status.activeOrders.find(
                      (o) => o.payment_status === "unpaid",
                    );
                    if (unpaidOrder) {
                      onSettleOrder(unpaidOrder.id, inspectedTable.table);
                      setInspectedTable(null);
                    }
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Settle Bill ({paise(inspectedTable.status.totalPaise)})</span>
                </button>
              )}

              <button
                onClick={() => {
                  onSelectTable(inspectedTable.table);
                  onOpenRegister(inspectedTable.table);
                  setInspectedTable(null);
                }}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Open in POS Register</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
