// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo } from "react";
import type { Table } from "@/types";
import { StatusBadge, type TableStatusType } from "@/components/brand/StatusBadge";
import { QRCodeDisplay } from "@/components/brand/QRCodeDisplay";
import {
  ChairIcon,
  QrCodeIcon,
  SearchIcon,
  PlusIcon,
  PrinterIcon,
} from "@/components/Icons";

interface TablesTabProps {
  tableList: Table[];
  isAddingTable: boolean;
  newTableLabel: string;
  newTableSeats: number;
  showQr: (t: Table) => void;
  handleDeleteTable: (id: string) => void;
  setNewTableLabel: (label: string) => void;
  setNewTableSeats: (seats: number) => void;
  handleAddTable: (e: React.FormEvent) => void;
  restaurantName?: string;
  restaurantSlug?: string;
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
  restaurantName = "QRslice",
  restaurantSlug = "cafe",
}: TablesTabProps) {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeSignageTable, setActiveSignageTable] = useState<Table | null>(null);

  // Table status map (mock or live)
  const [tableStatusMap, setTableStatusMap] = useState<Record<string, TableStatusType>>(() => {
    const map: Record<string, TableStatusType> = {};
    tableList.forEach((t, i) => {
      map[t.id] = i === 1 ? "ordering" : i === 3 ? "occupied" : i === 6 ? "needs_attention" : "available";
    });
    return map;
  });

  const filteredTables = useMemo(() => {
    return tableList.filter((t) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!t.label.toLowerCase().includes(q)) return false;
      }
      const st = tableStatusMap[t.id] || "available";
      if (filterStatus !== "all" && st !== filterStatus) return false;
      return true;
    });
  }, [tableList, search, filterStatus, tableStatusMap]);

  const cycleStatus = (id: string) => {
    const current = tableStatusMap[id] || "available";
    const next: Record<TableStatusType, TableStatusType> = {
      available: "ordering",
      ordering: "occupied",
      occupied: "needs_attention",
      needs_attention: "available",
    };
    setTableStatusMap((prev) => ({ ...prev, [id]: next[current] }));
  };

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://qrslice.app";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Table & QR Signage Studio
          </h2>
          <p className="text-xs text-[#6F7185] font-medium mt-0.5">
            Configure floor tables, manage active seating, and print customized table tents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-mono font-bold bg-[#EEEAFE] text-[#5738F5] px-3 py-1.5 rounded-xl">
            {tableList.length} Tables Active
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E4F0] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {["all", "available", "ordering", "occupied", "needs_attention"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-all cursor-pointer ${
                filterStatus === st
                  ? "bg-[#5738F5] text-white shadow-xs font-extrabold"
                  : "bg-slate-50 text-[#6F7185] hover:bg-slate-100"
              }`}
            >
              {st === "all" ? "All Tables" : st.replace("_", " ")}
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
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTables.map((t) => {
          const status = tableStatusMap[t.id] || "available";
          const qrUrl = t.qr_token
            ? `${appUrl}/t/${t.qr_token}`
            : `${appUrl}/c/${restaurantSlug}?table=${encodeURIComponent(t.label)}`;

          return (
            <div
              key={t.id}
              className="bg-white border border-[#E7E4F0] rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="font-black text-[#17142B] font-mono text-xl block"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    TABLE {t.label.padStart(2, "0")}
                  </span>
                  <span className="text-xs text-[#6F7185] font-semibold">{t.seats || 4} Seats Capacity</span>
                </div>

                <button
                  type="button"
                  onClick={() => cycleStatus(t.id)}
                  title="Click to toggle table status"
                  className="cursor-pointer"
                >
                  <StatusBadge status={status} type="table" size="sm" />
                </button>
              </div>

              {/* QR Standee CTA */}
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
                    className="text-[#5738F5] hover:underline font-bold"
                  >
                    Direct QR View
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTable(t.id)}
                    className="hover:text-rose-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Bar */}
      <form
        onSubmit={handleAddTable}
        className="bg-white border border-[#E7E4F0] rounded-3xl p-5 flex flex-col sm:flex-row gap-3 items-center shadow-xs"
      >
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
            Table Number / Label
          </label>
          <input
            type="text"
            placeholder="e.g. 09 or Patio-1"
            value={newTableLabel}
            onChange={(e) => setNewTableLabel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
          />
        </div>

        <div className="w-full sm:w-32">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#6F7185] block mb-1">
            Seats Capacity
          </label>
          <input
            type="number"
            min={1}
            max={30}
            value={newTableSeats}
            onChange={(e) => setNewTableSeats(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] text-center focus:outline-none focus:border-[#5738F5]"
          />
        </div>

        <div className="pt-4 sm:pt-4 w-full sm:w-auto">
          <button
            type="submit"
            disabled={isAddingTable || !newTableLabel.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs shadow-md shadow-[#5738F5]/20 cursor-pointer disabled:opacity-50 transition-all"
          >
            + Add Table & QR
          </button>
        </div>
      </form>

      {/* Printable Signage Modal */}
      {activeSignageTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
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
                  : `${appUrl}/c/${restaurantSlug}?table=${encodeURIComponent(activeSignageTable.label)}`
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

