// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useEffect } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type Outlet = {
  id: string;
  name: string;
  restaurant: string;
  restaurantSlug: string;
  location: string;
  plan: string;
  tables: number;
  ordersToday: number;
  gmv30d: number;
  lastActive: string;
  health: "Healthy" | "Attention" | "Offline";
  status: "Active" | "Maintenance" | "Suspended";
  posDevices: number;
  kdsDevices: number;
  printers: number;
};

export function OutletsTab() {
  const { cafes, openDrawer } = useSuperAdmin();
  const [search, setSearch] = useState("");
  const [selectedHealth, setSelectedHealth] = useState("all");
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/super/outlets")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok && Array.isArray(d.rows)) {
          setOutlets(d.rows);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = outlets.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.restaurant.toLowerCase().includes(search.toLowerCase()) ||
      o.location.toLowerCase().includes(search.toLowerCase());
    const matchesHealth = selectedHealth === "all" || o.health.toLowerCase() === selectedHealth.toLowerCase();
    return matchesSearch && matchesHealth;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Outlets Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage multi-location restaurant branches, dining areas, POS/KDS workstations, and hardware.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Total Outlets: <strong className="text-slate-900 font-mono">{outlets.length}</strong>
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search outlet or location..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#5738F5] focus:ring-1 focus:ring-[#5738F5]"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedHealth}
            onChange={(e) => setSelectedHealth(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
          >
            <option value="all">All Health States</option>
            <option value="healthy">Healthy Only</option>
            <option value="attention">Needs Attention</option>
          </select>
        </div>
      </div>

      {/* Outlets Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading outlets…</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3 px-4">Outlet Name</th>
                    <th className="py-3 px-4">Restaurant</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Tables</th>
                    <th className="py-3 px-4">Today Orders</th>
                    <th className="py-3 px-4">30D GMV</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4">Health</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((outlet) => (
                    <tr key={outlet.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{outlet.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID: {outlet.id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {outlet.restaurant}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={outlet.location}>
                        {outlet.location}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {outlet.tables} tables
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {outlet.ordersToday}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                        ₹{(outlet.gmv30d / 100).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {outlet.lastActive}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            outlet.health === "Healthy"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              outlet.health === "Healthy" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          ></span>
                          <span>{outlet.health}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOutlet(outlet)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#5738F5] font-bold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No outlets match your search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing <strong>{filtered.length}</strong> outlets
              </span>
            </div>
          </>
        )}
      </div>

      {/* Outlet Detail Modal */}
      {selectedOutlet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#5738F5] uppercase tracking-wider">
                  Outlet Station Inspection
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedOutlet.name}</h3>
                <p className="text-xs text-slate-500">{selectedOutlet.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOutlet(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Tables</span>
                <span className="text-lg font-mono font-black text-slate-900">{selectedOutlet.tables}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">POS Units</span>
                <span className="text-lg font-mono font-black text-slate-900">{selectedOutlet.posDevices}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">KDS Screens</span>
                <span className="text-lg font-mono font-black text-slate-900">{selectedOutlet.kdsDevices}</span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">Parent Restaurant:</span>
                <span className="font-bold text-slate-800">{selectedOutlet.restaurant}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">Thermal Printers:</span>
                <span className="font-mono font-bold text-emerald-600">{selectedOutlet.printers} Online</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">WhatsApp Bill Dispatch:</span>
                <span className="font-semibold text-emerald-600">Active (Auto-send)</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-500 font-medium">30-Day GMV:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(selectedOutlet.gmv30d / 100).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSelectedOutlet(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedOutlet(null);
                  openDrawer(cafes?.[0]?.id || "");
                }}
                className="px-4 py-2 rounded-xl bg-[#5738F5] text-white text-xs font-bold hover:bg-[#492ee0] shadow-sm shadow-[#5738F5]/25 cursor-pointer"
              >
                Open Parent Restaurant Console →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
