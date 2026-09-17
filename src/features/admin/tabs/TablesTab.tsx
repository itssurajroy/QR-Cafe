// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Table } from "@/types";
import { QRCodeDisplay } from "@/components/brand/QRCodeDisplay";
import { calculateDetailedTableStatus, type DetailedTableStatus } from "@/features/booking/floorStatus";
import { paise } from "@/lib/utils";
import {
  ChairIcon,
  QrCodeIcon,
  SearchIcon,
  PlusIcon,
  PrinterIcon,
  PencilIcon,
  TrashIcon,
  RefreshCwIcon,
  ArrowRightIcon,
  CheckIcon,
  FlameIcon,
} from "@/components/Icons";

interface TablesTabProps {
  tableList: Table[];
  isAddingTable: boolean;
  newTableLabel: string;
  newTableSeats: number;
  showQr: (t: Table) => void;
  showBulkQr?: () => void;
  handleDeleteTable: (id: string) => void;
  setNewTableLabel: (label: string) => void;
  setNewTableSeats: (seats: number) => void;
  handleAddTable: (e: React.FormEvent) => void;
  handleUpdateTable?: (tableId: string, updates: { label?: string; seats?: number; active?: boolean }) => Promise<boolean>;
  handleToggleTableActive?: (tableId: string, currentActive: boolean) => Promise<void>;
  handleRegenerateQr?: (tableId: string) => Promise<void>;
  handleBulkCreateTables?: (params: { prefix: string; start: number; count: number; seats: number }) => Promise<boolean>;
  restaurantName?: string;
  restaurantSlug?: string;
  recentOrders?: any[];
}

export function TablesTab({
  tableList,
  isAddingTable,
  newTableLabel,
  newTableSeats,
  showQr,
  handleDeleteTable,
  setNewTableLabel,
  setNewTableSeats,
  handleAddTable,
  handleUpdateTable,
  handleToggleTableActive,
  handleRegenerateQr,
  handleBulkCreateTables,
  restaurantName = "QRslice",
  restaurantSlug = "cafe",
  recentOrders = [],
}: TablesTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeSignageTable, setActiveSignageTable] = useState<Table | null>(null);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [editingTable, setEditingTable] = useState<{ id: string; label: string; seats: number; active: boolean } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Bulk add modal states
  const [bulkPrefix, setBulkPrefix] = useState("T");
  const [bulkStart, setBulkStart] = useState(1);
  const [bulkCount, setBulkCount] = useState(5);
  const [bulkSeats, setBulkSeats] = useState(4);
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  // Derive real operational status for all tables
  const tableOperationalMap = useMemo(() => {
    const map = new Map<string, DetailedTableStatus>();
    for (const t of tableList) {
      const detailed = calculateDetailedTableStatus(t, recentOrders, [], new Set(), new Date());
      map.set(t.id, detailed);
    }
    return map;
  }, [tableList, recentOrders]);

  // Statistics
  const stats = useMemo(() => {
    const total = tableList.length;
    const active = tableList.filter((t) => t.active !== false).length;
    const inactive = total - active;
    let needsBill = 0;
    let cooking = 0;
    let seated = 0;

    tableOperationalMap.forEach((status, tableId) => {
      const tbl = tableList.find((t) => t.id === tableId);
      if (tbl && tbl.active !== false) {
        if (status.state === "needs_bill") needsBill++;
        else if (status.state === "cooking") cooking++;
        else if (status.state === "seated") seated++;
      }
    });

    return { total, active, inactive, needsBill, cooking, seated };
  }, [tableList, tableOperationalMap]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    return tableList.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.label.toLowerCase().includes(q)) return false;
      }

      const op = tableOperationalMap.get(t.id);
      const isTableActive = t.active !== false;

      if (filterStatus === "active") return isTableActive;
      if (filterStatus === "inactive") return !isTableActive;
      if (filterStatus === "needs_bill") return isTableActive && op?.state === "needs_bill";
      if (filterStatus === "cooking") return isTableActive && op?.state === "cooking";
      if (filterStatus === "seated") return isTableActive && op?.state === "seated";
      if (filterStatus === "available") return isTableActive && op?.state === "available";

      return true;
    });
  }, [tableList, search, filterStatus, tableOperationalMap]);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://qrslice.com";

  async function handleSaveTableEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTable || !handleUpdateTable) return;
    setIsSavingEdit(true);
    const ok = await handleUpdateTable(editingTable.id, {
      label: editingTable.label.trim(),
      seats: editingTable.seats,
      active: editingTable.active,
    });
    setIsSavingEdit(false);
    if (ok) {
      setEditingTable(null);
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!handleBulkCreateTables) return;
    setIsBulkSubmitting(true);
    const ok = await handleBulkCreateTables({
      prefix: bulkPrefix.trim(),
      start: bulkStart,
      count: bulkCount,
      seats: bulkSeats,
    });
    setIsBulkSubmitting(false);
    if (ok) {
      setShowBulkAddModal(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Table & QR Signage Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-[#5738F5]">
              Live Ready
            </span>
          </div>
          <p className="text-xs text-[#6F7185] font-medium max-w-xl">
            Configure floor tables, monitor real-time order states, rotate QR security tokens, and print high-resolution branded table standees.
          </p>
        </div>

        {/* Quick KPI Stats & Primary Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-2xl text-xs">
            <span className="font-bold text-[#17142B]">{stats.total}</span>
            <span className="text-slate-400">Total</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="font-bold text-emerald-600">{stats.active}</span>
            <span className="text-slate-400">Active</span>
            {stats.inactive > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span className="font-bold text-slate-500">{stats.inactive} Off</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowBulkAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Bulk Add</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrintAllModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#EEEAFE] hover:bg-purple-100 text-[#5738F5] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span>Print All Standees</span>
          </button>

          <Link
            href="/pos?view=live_tables"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5738F5] to-[#7C3AED] hover:opacity-95 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/20 transition-all cursor-pointer"
          >
            <span>Live Floor Grid</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E4F0] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Tables", count: stats.total },
            { id: "active", label: "Active", count: stats.active },
            { id: "needs_bill", label: "Needs Bill", count: stats.needsBill, alert: stats.needsBill > 0 },
            { id: "cooking", label: "Cooking", count: stats.cooking },
            { id: "seated", label: "Seated", count: stats.seated },
            { id: "inactive", label: "Out of Service", count: stats.inactive },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === item.id
                  ? "bg-[#5738F5] text-white shadow-xs font-extrabold"
                  : "bg-slate-50 text-[#6F7185] hover:bg-slate-100"
              }`}
            >
              <span>{item.label}</span>
              {item.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    filterStatus === item.id
                      ? "bg-white/25 text-white"
                      : item.alert
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search table number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            🪑
          </div>
          <h3 className="text-sm font-black text-[#17142B]">No tables found</h3>
          <p className="text-xs text-[#6F7185] max-w-sm mx-auto">
            {search
              ? `No tables matching "${search}". Try searching for another table number.`
              : "You have no tables matching this filter. Add a new table below to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
            const isTableActive = t.active !== false;
            const detailed = tableOperationalMap.get(t.id);
            const qrUrl = t.qr_token
              ? `${appUrl}/t/${t.qr_token}`
              : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;

            // Badge styling
            let statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Available
              </span>
            );

            if (!isTableActive) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Out of Service
                </span>
              );
            } else if (detailed?.state === "needs_bill") {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  <span>Needs Bill{detailed.totalPaise > 0 ? ` (${paise(detailed.totalPaise)})` : ""}</span>
                </span>
              );
            } else if (detailed?.state === "cooking") {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                  <FlameIcon className="w-3 h-3 text-orange-600" />
                  <span>Cooking</span>
                </span>
              );
            } else if (detailed?.state === "seated") {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Seated
                </span>
              );
            } else if (detailed?.state === "paid") {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Paid
                </span>
              );
            }

            return (
              <div
                key={t.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  !isTableActive ? "border-slate-200 opacity-70 bg-slate-50/50" : "border-[#E7E4F0]"
                }`}
              >
                {/* Header: Label, Capacity, Active Toggle */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-black text-[#17142B] font-mono text-xl block"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        TABLE {t.label.padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingTable({
                            id: t.id,
                            label: t.label,
                            seats: t.seats || 4,
                            active: isTableActive,
                          })
                        }
                        className="text-slate-400 hover:text-[#5738F5] p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit table label / seats"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#6F7185] font-semibold mt-0.5">
                      <ChairIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.seats || 4} Seats</span>
                    </div>
                  </div>

                  {/* Active Toggle Switch */}
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleTableActive?.(t.id, isTableActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isTableActive ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title={isTableActive ? "Click to set Out of Service" : "Click to Activate"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isTableActive ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                      {isTableActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="pt-1 flex items-center justify-between">
                  <div className="text-[11px] text-[#6F7185] font-medium">Floor Status:</div>
                  <div>{statusBadge}</div>
                </div>

                {/* QR Standee & Direct Actions */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveSignageTable(t)}
                    className="w-full py-2 px-3 rounded-xl bg-[#EEEAFE] hover:bg-purple-100 text-[#5738F5] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <QrCodeIcon className="w-4 h-4" />
                    <span>Print Table Standee</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-[#6F7185]">
                    <button
                      type="button"
                      onClick={() => showQr(t)}
                      className="text-[#5738F5] hover:underline font-bold cursor-pointer"
                    >
                      Direct QR View
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRegenerateQr?.(t.id)}
                        className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer flex items-center gap-1"
                        title="Rotate QR security token"
                      >
                        <RefreshCwIcon className="w-3 h-3" />
                        <span>Rotate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTable(t.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
                        title="Delete table"
                      >
                        <TrashIcon className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Single Table Bar */}
      <div className="bg-white border border-[#E7E4F0] rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#17142B] flex items-center gap-2">
            <span>+ Add New Table</span>
            <span className="text-[10px] font-normal text-[#6F7185]">(Auto-generates secure QR code token)</span>
          </h3>
        </div>

        <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
              Table Number / Label
            </label>
            <input
              type="text"
              placeholder="e.g. 09, Patio-1, or Bar-A"
              value={newTableLabel}
              onChange={(e) => setNewTableLabel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5] focus:bg-white"
            />
          </div>

          <div className="w-full sm:w-36">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
              Seats Capacity
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={newTableSeats}
              onChange={(e) => setNewTableSeats(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] text-center focus:outline-none focus:border-[#5738F5] focus:bg-white"
            />
          </div>

          <div className="pt-4 sm:pt-4 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isAddingTable || !newTableLabel.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs shadow-md shadow-[#5738F5]/20 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>{isAddingTable ? "Creating Table…" : "Add Table & QR"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* EDIT TABLE MODAL */}
      {editingTable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingTable(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-[#17142B]">Edit Table {editingTable.label}</h3>
              <button
                type="button"
                onClick={() => setEditingTable(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTableEdit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                  Table Label
                </label>
                <input
                  type="text"
                  value={editingTable.label}
                  onChange={(e) => setEditingTable({ ...editingTable, label: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editingTable.seats}
                  onChange={(e) => setEditingTable({ ...editingTable, seats: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-[#17142B]">Table Active Status</span>
                <button
                  type="button"
                  onClick={() => setEditingTable({ ...editingTable, active: !editingTable.active })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    editingTable.active ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      editingTable.active ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit || !editingTable.label.trim()}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs shadow-md shadow-violet-500/20 disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ADD TABLES MODAL */}
      {showBulkAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowBulkAddModal(false)}
        >
          <div
            className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#17142B]">Bulk Generate Tables</h3>
                <p className="text-[11px] text-[#6F7185]">Batch create multiple tables with unique QR tokens.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                    Label Prefix
                  </label>
                  <input
                    type="text"
                    value={bulkPrefix}
                    onChange={(e) => setBulkPrefix(e.target.value)}
                    placeholder="e.g. T, Table , Patio-"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                    Starting Number
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={bulkStart}
                    onChange={(e) => setBulkStart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                    Number of Tables
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={bulkCount}
                    onChange={(e) => setBulkCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
                    Seats Per Table
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={bulkSeats}
                    onChange={(e) => setBulkSeats(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
                  />
                </div>
              </div>

              {/* Preview Chips */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Sequence Preview
                </span>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: Math.min(6, bulkCount) }).map((_, i) => {
                    const num = bulkStart + i;
                    const label = `${bulkPrefix}${num < 10 ? "0" + num : num}`;
                    return (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[10px] font-bold"
                      >
                        {label}
                      </span>
                    );
                  })}
                  {bulkCount > 6 && (
                    <span className="px-2 py-0.5 text-slate-400 font-mono text-[10px] font-bold">
                      … +{bulkCount - 6} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkAddModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkSubmitting || bulkCount < 1}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs shadow-md shadow-violet-500/20 disabled:opacity-50"
                >
                  {isBulkSubmitting ? "Generating…" : `Create ${bulkCount} Tables`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT ALL STANDEES MODAL */}
      {showPrintAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="relative max-w-4xl w-full bg-white rounded-3xl p-6 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#17142B]">Print Table Standees Sheet</h3>
                <p className="text-xs text-[#6F7185]">
                  High-resolution QR standees for all active tables. Formatted for A4 / Letter printing.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/20 cursor-pointer"
                >
                  <PrinterIcon className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintAllModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Standees Printable Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto p-2">
              {tableList
                .filter((t) => t.active !== false)
                .map((t) => {
                  const directUrl = t.qr_token
                    ? `${appUrl}/t/${t.qr_token}`
                    : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;
                  return (
                    <div key={t.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
                      <QRCodeDisplay
                        url={directUrl}
                        restaurantName={restaurantName}
                        tableLabel={t.label}
                        seats={t.seats}
                        showSignage={true}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SINGLE PRINTABLE SIGNAGE MODAL */}
      {activeSignageTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveSignageTable(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
            >
              ✕
            </button>

            <QRCodeDisplay
              url={
                activeSignageTable.qr_token
                  ? `${appUrl}/t/${activeSignageTable.qr_token}`
                  : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(activeSignageTable.label)}`
              }
              restaurantName={restaurantName}
              tableLabel={activeSignageTable.label}
              seats={activeSignageTable.seats}
              showSignage={true}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
