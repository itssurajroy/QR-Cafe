// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useSuperAdmin } from "../SuperAdminContext";
import Link from "next/link";
import { tenantsToCsv } from "@/lib/platform-csv";

export function TenantsTab() {
  const ctx = useSuperAdmin();
  const {
    kpis,
    applyFilter,
    openDrawer,
    totalPages,
    cafes,
    page,
    totalCafes,
    searchQuery,
    selectedPlan,
    handleFastToggleStatus,
    handleFastExtendTrial,
    setSearchQuery,
    setSelectedPlan,
  } = ctx;

  // Bulk selection + bulk actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const allSelected = cafes.length > 0 && selectedIds.length === cafes.length;
  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : cafes.map((c: any) => c.id));

  async function runBulk(kind: "extend" | "activate") {
    if (selectedIds.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      for (const id of selectedIds) {
        const body =
          kind === "extend"
            ? { action: "extend_trial", id, days: 14 }
            : { action: "set_plan", id, plan: "active" };
        const res = await fetch("/api/super/crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`Bulk ${kind} failed for ${id}`);
      }
      setSelectedIds([]);
      applyFilter(searchQuery, selectedPlan, page);
    } catch {
      alert("Bulk action partially failed — refresh and retry");
    } finally {
      setBulkBusy(false);
    }
  }

  function handleExportLocal() {
    const csv = tenantsToCsv(
      (cafes as any[]).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        plan: c.plan,
        tier: c.tier,
        tax_rate: c.tax_rate,
        created_at: c.created_at,
        subscription_ends_at: c.subscription_ends_at,
        trial_ends_at: c.trial_ends_at,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qrslice-tenants-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const plansList = [
    { id: "", label: "All Cafés", count: totalCafes },
    { id: "active", label: "Active Paying", count: kpis?.active || 0 },
    { id: "trial", label: "Free Trial", count: kpis?.trial || 0 },
    { id: "suspended", label: "Suspended", count: kpis?.suspended || 0 },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full flex items-center gap-2.5 bg-[#FAF9F6] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search café name, slug or outlet…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilter(searchQuery, selectedPlan);
              }}
              className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1 text-xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  applyFilter("", selectedPlan);
                }}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => applyFilter(searchQuery, selectedPlan)}
              className="px-4 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#492ee0] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Search
            </button>

            <button
              type="button"
              onClick={handleExportLocal}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-slate-200/80 shadow-2xs transition-colors"
              title="Export filtered records to CSV"
            >
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          {plansList.map((p) => {
            const isSelected = selectedPlan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlan(p.id);
                  applyFilter(searchQuery, p.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#5738F5] text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200"
                }`}>
                  {p.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-violet-50 border border-violet-200 p-3.5 rounded-2xl text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#5738F5]">
              {selectedIds.length} café{selectedIds.length > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => runBulk("extend")}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
            >
              Extend Trial +14d
            </button>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => runBulk("activate")}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
            >
              Set Active
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-white text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs cursor-pointer shadow-2xs"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 uppercase tracking-wider text-[11px] font-bold">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all cafés"
                    className="rounded border-slate-300 text-[#5738F5] focus:ring-[#5738F5] cursor-pointer"
                  />
                </th>
                <th className="p-4">Café & Slug</th>
                <th className="p-4">Tier</th>
                <th className="p-4">Plan Status</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Pricing</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cafes.map((c: any) => {
                const isTrial = c.plan === "trial";
                const isActive = c.plan === "active";
                const isSuspended = c.plan === "suspended";

                return (
                  <tr
                    key={c.id}
                    onClick={() => openDrawer(c.id)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        aria-label={`Select ${c.name}`}
                        className="rounded border-slate-300 text-[#5738F5] focus:ring-[#5738F5] cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 group-hover:text-[#5738F5] transition-colors flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        /c/{c.slug}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                        {c.tier || "pro"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] border ${
                          isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : isTrial
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                        }`}
                      >
                        {c.plan}
                      </span>
                    </td>

                    <td className="p-4 text-slate-600 font-mono text-xs">
                      {isActive
                        ? c.subscription_ends_at
                          ? new Date(c.subscription_ends_at).toLocaleDateString("en-IN")
                          : "Continuous"
                        : isTrial && c.trial_ends_at
                        ? `${new Date(c.trial_ends_at).toLocaleDateString("en-IN")}`
                        : "Expired"}
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-900 text-xs">
                      ₹999/mo
                    </td>

                    <td className="p-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={(e) => handleFastExtendTrial(c.id, e)}
                        title="Add 7 Free Trial Days"
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                      >
                        +7d Trial
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleFastToggleStatus(c, e)}
                        title="Toggle Active / Suspended"
                        className={`px-2.5 py-1 rounded-lg border font-bold text-xs cursor-pointer shadow-2xs transition-colors ${
                          c.plan === "suspended"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        {c.plan === "suspended" ? "Activate" : "Suspend"}
                      </button>
                      <Link
                        href={`/super/cafe/${c.id}`}
                        className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-[#5738F5] border border-violet-200 font-bold text-xs inline-block transition-colors cursor-pointer shadow-2xs"
                      >
                        Impersonate
                      </Link>
                      <Link
                        href={`/c/${c.slug}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 font-bold text-xs inline-block transition-colors shadow-2xs"
                      >
                        View ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {cafes.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No cafés match the selected filter query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{cafes.length}</strong> of <strong className="text-slate-900">{totalCafes}</strong> cafés (Page {page} of {totalPages})
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => applyFilter(searchQuery, selectedPlan, page - 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer font-bold shadow-2xs transition-colors"
            >
              &larr; Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => applyFilter(searchQuery, selectedPlan, page + 1)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none cursor-pointer font-bold shadow-2xs transition-colors"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
