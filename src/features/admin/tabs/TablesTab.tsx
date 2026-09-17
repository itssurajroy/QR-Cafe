// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Table } from "@/types";
import { QRCodeDisplay } from "@/components/brand/QRCodeDisplay";
import { PrintStandCardModal } from "@/components/admin/PrintStandCardModal";
import { printSingleStandCard, printBulkStandCards } from "@/lib/print-standee";
import { generateBeautifulQrDataUrl } from "@/lib/qr-designer";
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
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedDrawerTable, setSelectedDrawerTable] = useState<Table | null>(null);
  const [printStandModalTable, setPrintStandModalTable] = useState<{
    table: Table;
    qrDataUrl: string;
    directUrl: string;
    mode?: "single" | "bulk";
  } | null>(null);
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

  // Statistics & Summary Counters matching Spec
  const stats = useMemo(() => {
    const total = tableList.length;
    const active = tableList.filter((t) => t.active !== false).length;
    const inactive = total - active;
    let available = 0;
    let occupied = 0;
    let billing = 0;
    let cooking = 0;
    let seated = 0;
    let reserved = 0;

    tableList.forEach((tbl) => {
      if (tbl.active === false) return;
      const op = tableOperationalMap.get(tbl.id);
      if (!op || op.state === "available") {
        available++;
      } else if (op.state === "needs_bill") {
        billing++;
        occupied++;
      } else if (op.state === "cooking") {
        cooking++;
        occupied++;
      } else if (op.state === "seated") {
        seated++;
        occupied++;
      } else if (op.state === "reserved") {
        reserved++;
      } else {
        occupied++;
      }
    });

    return { total, active, inactive, available, occupied, billing, cooking, seated, reserved };
  }, [tableList, tableOperationalMap]);

  // Filtered tables with Zone support
  const filteredTables = useMemo(() => {
    return tableList.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.label.toLowerCase().includes(q)) return false;
      }

      // Zone filter based on label prefix or naming
      if (selectedZone !== "all") {
        const lbl = t.label.toLowerCase();
        if (selectedZone === "patio" && !lbl.includes("p") && !lbl.includes("patio")) return false;
        if (selectedZone === "bar" && !lbl.includes("b") && !lbl.includes("bar")) return false;
        if (selectedZone === "rooftop" && !lbl.includes("r") && !lbl.includes("roof")) return false;
        if (selectedZone === "main" && (lbl.includes("p-") || lbl.includes("bar-") || lbl.includes("roof-"))) return false;
      }

      const op = tableOperationalMap.get(t.id);
      const isTableActive = t.active !== false;

      if (filterStatus === "active") return isTableActive;
      if (filterStatus === "inactive") return !isTableActive;
      if (filterStatus === "available") return isTableActive && (!op || op.state === "available");
      if (filterStatus === "occupied") return isTableActive && op && op.state !== "available";
      if (filterStatus === "needs_bill" || filterStatus === "billing") return isTableActive && op?.state === "needs_bill";
      if (filterStatus === "cooking") return isTableActive && op?.state === "cooking";
      if (filterStatus === "seated") return isTableActive && op?.state === "seated";
      if (filterStatus === "reserved") return isTableActive && op?.state === "reserved";

      return true;
    });
  }, [tableList, search, filterStatus, selectedZone, tableOperationalMap]);

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
              Dining Floor &amp; Table Operations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Live Floor Plan
            </span>
          </div>
          <p className="text-xs text-[#6F7185] font-medium max-w-xl">
            Live restaurant floor plan. Click any table to open the detail drawer, inspect orders, print stand cards, or manage table billing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={() => {
              const firstTable = tableList.find((t) => t.active !== false) || tableList[0] || {
                id: "1",
                label: "01",
                seats: 4,
                active: true,
              };
              const directUrl = firstTable.qr_token
                ? `${appUrl}/t/${firstTable.qr_token}`
                : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(firstTable.label)}`;
              setPrintStandModalTable({
                table: firstTable,
                qrDataUrl: generateBeautifulQrDataUrl({
                  text: directUrl,
                  size: 500,
                  theme: "violet",
                  centerIcon: "utensils",
                  dotShape: "dots",
                }),
                directUrl,
                mode: "bulk",
              });
            }}
            className="px-3.5 py-2 rounded-xl bg-[#EEEAFE] hover:bg-purple-100 text-[#5738F5] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            <span>Print All Standees</span>
          </button>

          <Link
            href="/pos"
            className="px-4 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-violet-500/20 transition-all cursor-pointer"
          >
            <span>Open POS Terminal</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Control Bar: Search + Zone + Status + Add */}
      <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-72">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tables (e.g. 05, T01)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Zone Filter Dropdown */}
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#17142B] focus:outline-none focus:border-[#5738F5] cursor-pointer"
            >
              <option value="all">All Zones (Entire Floor)</option>
              <option value="main">Main Dining Room</option>
              <option value="patio">Patio &amp; Terrace</option>
              <option value="rooftop">Rooftop Lounge</option>
              <option value="bar">Bar Counter</option>
            </select>

            {/* Status Filter Dropdown */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#17142B] focus:outline-none focus:border-[#5738F5] cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available (Free)</option>
              <option value="occupied">Occupied (Active)</option>
              <option value="billing">Needs Bill</option>
              <option value="cooking">Cooking in Kitchen</option>
              <option value="seated">Seated (Ordering)</option>
              <option value="reserved">Reserved</option>
              <option value="inactive">Out of Service</option>
            </select>

            <a
              href="#add-table-section"
              className="px-3.5 py-2 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs whitespace-nowrap cursor-pointer transition-all"
            >
              + Add Table
            </a>
          </div>
        </div>

        {/* Floor Summary Counter Pills (Section 3 Spec) */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === "all" ? "bg-[#5738F5] text-white shadow-xs font-extrabold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>All</span>
            <span className="font-mono">{stats.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("available")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === "available" ? "bg-emerald-600 text-white shadow-xs font-extrabold" : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Available</span>
            <span className="font-mono">{stats.available}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("occupied")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === "occupied" ? "bg-amber-600 text-white shadow-xs font-extrabold" : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Occupied</span>
            <span className="font-mono">{stats.occupied}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("billing")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === "billing" ? "bg-rose-600 text-white shadow-xs font-extrabold" : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
            }`}
          >
            <span>Billing</span>
            <span className="font-mono">{stats.billing}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus("reserved")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterStatus === "reserved" ? "bg-blue-600 text-white shadow-xs font-extrabold" : "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100"
            }`}
          >
            <span>Reserved</span>
            <span className="font-mono">{stats.reserved}</span>
          </button>
        </div>
      </div>

      {/* Interactive Floor Plan Cards */}
      {filteredTables.length === 0 ? (
        <div className="bg-white border border-[#E7E4F0] rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            🪑
          </div>
          <h3 className="text-sm font-black text-[#17142B]">No tables found</h3>
          <p className="text-xs text-[#6F7185] max-w-sm mx-auto">
            {search
              ? `No tables matching "${search}". Try searching for another table number.`
              : "No tables matching this filter. Add a new table below to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {filteredTables.map((t) => {
            const isTableActive = t.active !== false;
            const detailed = tableOperationalMap.get(t.id);
            const qrUrl = t.qr_token
              ? `${appUrl}/t/${t.qr_token}`
              : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;

            const isOccupied = detailed && detailed.state !== "available";
            const orderTotal = detailed && detailed.totalPaise > 0 ? paise(detailed.totalPaise) : null;
            const elapsed = detailed && detailed.elapsedMinutes > 0 ? `${detailed.elapsedMinutes}m ago` : null;

            return (
              <div
                key={t.id}
                onClick={() => setSelectedDrawerTable(t)}
                className={`group relative rounded-3xl p-4.5 transition-all cursor-pointer border flex flex-col justify-between space-y-3 ${
                  !isTableActive
                    ? "bg-slate-50 border-slate-200 opacity-60"
                    : detailed?.state === "needs_bill"
                    ? "bg-amber-50/50 border-amber-300 shadow-xs hover:shadow-md ring-2 ring-amber-400/20"
                    : detailed?.state === "cooking"
                    ? "bg-orange-50/40 border-orange-300 shadow-xs hover:shadow-md ring-1 ring-orange-400/20"
                    : detailed?.state === "seated"
                    ? "bg-blue-50/40 border-blue-200 shadow-xs hover:shadow-md"
                    : "bg-white border-[#E7E4F0] shadow-xs hover:shadow-md hover:border-[#5738F5]/40"
                }`}
              >
                {/* Table Top: Badge & Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-lg text-[#17142B] tracking-tight">
                      {t.label.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTable({
                          id: t.id,
                          label: t.label,
                          seats: t.seats || 4,
                          active: isTableActive,
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#5738F5] transition-opacity p-0.5"
                      title="Edit table"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Operational Status Dot */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        !isTableActive
                          ? "bg-slate-400"
                          : detailed?.state === "needs_bill"
                          ? "bg-amber-500 animate-pulse"
                          : detailed?.state === "cooking"
                          ? "bg-orange-500 animate-pulse"
                          : detailed?.state === "seated"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {!isTableActive
                        ? "Off"
                        : detailed?.state === "needs_bill"
                        ? "Bill"
                        : detailed?.state === "cooking"
                        ? "Cooking"
                        : detailed?.state === "seated"
                        ? "Seated"
                        : "Open"}
                    </span>
                  </div>
                </div>

                {/* Middle: Order Value & Guests */}
                <div className="py-1">
                  <div className="text-base font-black font-mono tracking-tight text-[#17142B]">
                    {orderTotal || "Available"}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6F7185] font-medium pt-0.5">
                    <span>{t.seats || 4} guests</span>
                    {elapsed && <span className="text-amber-700 font-bold">{elapsed}</span>}
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const directUrl = t.qr_token
                        ? `${appUrl}/t/${t.qr_token}`
                        : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;
                      setPrintStandModalTable({
                        table: t,
                        qrDataUrl: generateBeautifulQrDataUrl({
                          text: directUrl,
                          size: 500,
                          theme: "violet",
                          centerIcon: "utensils",
                          dotShape: "dots",
                        }),
                        directUrl,
                        mode: "single",
                      });
                    }}
                    className="text-[#5738F5] hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
                    title="Design & Print Stand Card"
                  >
                    <PrinterIcon className="w-3 h-3" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const directUrl = t.qr_token
                        ? `${appUrl}/t/${t.qr_token}`
                        : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;
                      setPrintStandModalTable({
                        table: t,
                        qrDataUrl: generateBeautifulQrDataUrl({
                          text: directUrl,
                          size: 500,
                          theme: "violet",
                          centerIcon: "utensils",
                          dotShape: "dots",
                        }),
                        directUrl,
                        mode: "single",
                      });
                    }}
                    className="text-slate-600 hover:text-[#5738F5] font-bold cursor-pointer flex items-center gap-1"
                    title="Quick QR Studio"
                  >
                    <span>QR Studio</span>
                    <QrCodeIcon className="w-3 h-3 text-[#5738F5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Single Table Bar */}
      <div id="add-table-section" className="bg-white border border-[#E7E4F0] rounded-3xl p-6 shadow-xs space-y-3">
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
                  onClick={() => {
                    printBulkStandCards({
                      restaurantName,
                      tables: tableList
                        .filter((t) => t.active !== false)
                        .map((t) => {
                          const directUrl = t.qr_token
                            ? `${appUrl}/t/${t.qr_token}`
                            : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;
                          return {
                            label: t.label,
                            seats: t.seats,
                            qrDataUrl: generateBeautifulQrDataUrl({
                              text: directUrl,
                              size: 400,
                              theme: "violet",
                              centerIcon: "utensils",
                              dotShape: "dots",
                            }),
                            directUrl,
                          };
                        }),
                    });
                  }}
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
              onPrint={() => {
                const directUrl = activeSignageTable.qr_token
                  ? `${appUrl}/t/${activeSignageTable.qr_token}`
                  : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(activeSignageTable.label)}`;
                printSingleStandCard({
                  restaurantName,
                  tableLabel: activeSignageTable.label,
                  qrDataUrl: generateBeautifulQrDataUrl({
                    text: directUrl,
                    size: 500,
                    theme: "violet",
                    centerIcon: "utensils",
                    dotShape: "dots",
                  }),
                  directUrl,
                  seats: activeSignageTable.seats,
                });
              }}
            />
          </div>
        </div>
      )}

      {/* TABLE DETAIL DRAWER (Section 4 Specification) */}
      {selectedDrawerTable && (() => {
        const t = selectedDrawerTable;
        const isTableActive = t.active !== false;
        const detailed = tableOperationalMap.get(t.id);
        const activeOrders = detailed?.activeOrders || [];
        const currentOrder = activeOrders[0] || null;
        const items = currentOrder?.order_items || currentOrder?.items || [];
        const runningTotal = detailed && detailed.totalPaise > 0 ? paise(detailed.totalPaise) : null;
        const elapsed = detailed && detailed.elapsedMinutes > 0 ? `${detailed.elapsedMinutes}m ago` : "Just seated";
        const directUrl = t.qr_token
          ? `${appUrl}/t/${t.qr_token}`
          : `${appUrl}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setSelectedDrawerTable(null)}
            />

            {/* Slide-over Drawer Panel */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col justify-between p-6 border-l border-slate-200 animate-slide-left overflow-y-auto">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5738F5]">
                      TABLE STATION
                    </span>
                    <h3 className="text-2xl font-black font-mono text-[#17142B] tracking-tight">
                      TABLE {t.label.toUpperCase()}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                        !isTableActive
                          ? "bg-slate-100 text-slate-600"
                          : detailed?.state === "needs_bill"
                          ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                          : detailed?.state === "cooking"
                          ? "bg-orange-100 text-orange-900 border border-orange-200"
                          : detailed?.state === "seated"
                          ? "bg-blue-100 text-blue-900 border border-blue-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      ● {!isTableActive ? "Out of Service" : detailed?.state === "needs_bill" ? "Needs Bill" : detailed?.state === "cooking" ? "Cooking" : detailed?.state === "seated" ? "Seated" : "Open"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedDrawerTable(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Table Overview: Total, Guests, Order # */}
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-bold text-slate-500">Current Running Bill</span>
                    <span className="text-2xl font-black font-mono text-[#17142B]">
                      {runningTotal || "₹0"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/70 text-slate-600 font-medium">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Capacity</span>
                      <span className="font-bold text-[#17142B]">{t.seats || 4} Guests</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Order</span>
                      <span className="font-mono font-bold text-[#17142B]">
                        {currentOrder ? `#${currentOrder.id.slice(0, 6)} · ${elapsed}` : "No order placed"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Items Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Active Order Items
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {items.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No dishes active right now.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {items.map((it: any, idx: number) => {
                        const q = it.quantity || 1;
                        const name = it.item_name || it.name || "Dish";
                        const price = (it.unit_price_paise || it.price_paise || 0) * q;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                          >
                            <span className="font-bold text-[#17142B]">
                              <span className="text-[#5738F5] mr-1.5 font-black">{q} ×</span>
                              {name}
                            </span>
                            <span className="font-mono font-bold text-slate-700">
                              {paise(price)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Fast Action Buttons matching Section 4 */}
              <div className="space-y-2 pt-6 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/pos?table=${encodeURIComponent(t.label)}`}
                    className="py-2.5 px-3 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs text-center shadow-sm cursor-pointer transition-all"
                  >
                    + Add Items / POS
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintStandModalTable({
                        table: t,
                        qrDataUrl: generateBeautifulQrDataUrl({
                          text: directUrl,
                          size: 500,
                          theme: "violet",
                          centerIcon: "utensils",
                          dotShape: "dots",
                        }),
                        directUrl,
                      });
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#EEEAFE] hover:bg-purple-100 text-[#5738F5] font-black text-xs text-center cursor-pointer transition-all flex items-center justify-center gap-1"
                  >
                    <PrinterIcon className="w-3.5 h-3.5" />
                    <span>Print Stand Card</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentOrder) {
                        window.open(`/receipt/${currentOrder.status_token || currentOrder.id}`, "_blank");
                      } else {
                        window.print();
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center cursor-pointer transition-all"
                  >
                    Print Bill 🧾
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPrintStandModalTable({
                        table: t,
                        qrDataUrl: generateBeautifulQrDataUrl({
                          text: directUrl,
                          size: 500,
                          theme: "violet",
                          centerIcon: "utensils",
                          dotShape: "dots",
                        }),
                        directUrl,
                        mode: "single",
                      });
                    }}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs text-center cursor-pointer transition-all"
                  >
                    Generate / View QR
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* DEDICATED MULTI-TEMPLATE PRINT STAND CARD MODAL */}
      {printStandModalTable && (
        <PrintStandCardModal
          restaurantName={restaurantName}
          tableLabel={printStandModalTable.table.label}
          qrDataUrl={printStandModalTable.qrDataUrl}
          directUrl={printStandModalTable.directUrl}
          seats={printStandModalTable.table.seats}
          allTables={tableList}
          restaurantSlug={restaurantSlug}
          initialMode={printStandModalTable.mode || "single"}
          onClose={() => setPrintStandModalTable(null)}
        />
      )}
    </div>
  );
}
