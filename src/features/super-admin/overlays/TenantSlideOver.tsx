// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import Link from "next/link";
import { useSuperAdmin } from "../SuperAdminContext";

export function TenantSlideOver() {
  const ctx = useSuperAdmin();
  const {
    drawerCafeId,
    setDrawerCafeId,
    drawerData,
    loadingDrawer,
    drawerTab,
    setDrawerTab,
    openDrawer,
    handleSetPlan,
    handleExtendTrial,
    handleMarkPaid,
    handleDeleteCafe,
  } = ctx;

  if (!drawerCafeId) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end animate-in fade-in duration-150"
      onClick={() => setDrawerCafeId(null)}
    >
      <div
        className="w-full max-w-xl bg-white border-l border-slate-200/80 h-full p-6 flex flex-col justify-between space-y-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200 text-slate-900 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {loadingDrawer ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-[#5738F5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : drawerData?.tenant ? (
          <div className="space-y-6 flex-1">
            {/* Top Drawer Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {drawerData.tenant.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-violet-50 text-[#5738F5] border border-violet-100">
                    {drawerData.tenant.tier || "pro"}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  /c/{drawerData.tenant.slug}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(drawerCafeId)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  title="Refresh snapshot"
                >
                  ↻
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerCafeId(null)}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-100">
              {[
                { id: "overview", label: "Overview" },
                { id: "menu", label: `Menu (${drawerData.items?.length || 0})` },
                { id: "tables", label: `Tables (${drawerData.tables?.length || 0})` },
                { id: "orders", label: `Orders (${drawerData.orders?.length || 0})` },
                { id: "billing", label: "Billing Overrides" },
                { id: "danger", label: "Danger" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDrawerTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                    drawerTab === t.id
                      ? "bg-[#5738F5] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* DRAWER TAB 1: OVERVIEW */}
            {drawerTab === "overview" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plan Status</span>
                    <div className="font-extrabold text-slate-900 uppercase">
                      {drawerData.tenant.plan}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tier</span>
                    <div className="font-extrabold text-[#5738F5] uppercase">
                      {drawerData.tenant.tier || "pro"}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200/80 space-y-2">
                  <div className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                    Contact & Tax Identity
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div>📞 Phone: {drawerData.tenant.phone || "Not set"}</div>
                    <div>📍 Address: {drawerData.tenant.address || "Not set"}</div>
                    <div>🧾 GSTIN: {drawerData.tenant.gstin || "Not set"} ({drawerData.tenant.tax_rate ?? 5}% Tax)</div>
                    <div>🔖 Tagline: {drawerData.tenant.tagline || "None"}</div>
                  </div>
                </div>

                <Link
                  href={`/super/cafe/${drawerData.tenant.id}`}
                  className="block w-full py-3 rounded-xl bg-[#5738F5] hover:bg-[#492ee0] text-white font-bold text-center text-xs shadow-sm shadow-[#5738F5]/25 cursor-pointer transition-colors"
                >
                  Launch Impersonation View &rarr;
                </Link>
              </div>
            )}

            {/* DRAWER TAB 2: MENU */}
            {drawerTab === "menu" && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-700">
                  Registered Dishes ({drawerData.items?.length || 0})
                </div>
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {drawerData.items?.map((it: any) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-[#FAF9F6] border border-slate-200/80 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${it.is_veg ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                        <span className="font-bold text-slate-900">{it.name}</span>
                      </div>
                      <span className="font-mono text-[#5738F5] font-bold">
                        ₹{((it.price_paise || 0) / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                  {(!drawerData.items || drawerData.items.length === 0) && (
                    <p className="text-slate-400 text-center py-4">No menu dishes created yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* DRAWER TAB 3: TABLES */}
            {drawerTab === "tables" && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-700">
                  Tables ({drawerData.tables?.length || 0})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {drawerData.tables?.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200/80 text-center space-y-0.5"
                    >
                      <div className="font-black text-[#5738F5] font-mono text-sm">{t.label}</div>
                      <div className="text-[11px] text-slate-500">{t.seats} Seats</div>
                    </div>
                  ))}
                  {(!drawerData.tables || drawerData.tables.length === 0) && (
                    <p className="text-slate-400 col-span-3 text-center py-4">No tables configured yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* DRAWER TAB 4: ORDERS */}
            {drawerTab === "orders" && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700">
                  Recent Orders ({drawerData.orders?.length || 0})
                </div>
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {drawerData.orders?.map((o: any) => (
                    <div
                      key={o.id}
                      className="p-2.5 rounded-xl bg-[#FAF9F6] border border-slate-200/80 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900 font-mono">
                          #{o.order_number}
                        </span>
                        <span className="text-slate-500 ml-2 uppercase text-[10px] font-bold">{o.status}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={o.payment_status === "paid" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                          {o.payment_status}
                        </span>
                        <span className="font-bold text-slate-900">
                          ₹{((o.total_paise || 0) / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!drawerData.orders || drawerData.orders.length === 0) && (
                    <p className="text-slate-400 text-center py-4">No recent orders recorded.</p>
                  )}
                </div>
              </div>
            )}

            {/* DRAWER TAB 5: BILLING OVERRIDES */}
            {drawerTab === "billing" && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-slate-200/80 space-y-3">
                  <div className="font-bold text-[#5738F5] uppercase text-[11px] tracking-wider">
                    Super Admin Billing Controls
                  </div>
                  <p className="text-slate-500 text-xs">
                    Override tenant access immediately without requiring external payment gateway callbacks.
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExtendTrial(7)}
                      className="py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      +7 Days Trial
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExtendTrial(30)}
                      className="py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      +30 Days Trial
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleMarkPaid}
                      className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-100 cursor-pointer transition-colors"
                    >
                      Mark Paid (1 Year)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPlan("suspended")}
                      className="py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs hover:bg-rose-100 cursor-pointer transition-colors"
                    >
                      Force Suspend
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER TAB 6: DANGER */}
            {drawerTab === "danger" && (
              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3 text-xs">
                <div className="font-black text-rose-700 uppercase text-[11px]">Danger Zone</div>
                <p className="text-rose-700/90 text-xs">
                  Permanently delete this café tenant and all associated records. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteCafe(drawerData.tenant.id)}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Delete Café Tenant Permanently
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
