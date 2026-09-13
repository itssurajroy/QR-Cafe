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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200"
      onClick={() => setDrawerCafeId(null)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 border-l border-slate-200 dark:border-stone-800 h-full p-6 flex flex-col justify-between space-y-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {loadingDrawer ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : drawerData?.tenant ? (
          <div className="space-y-6 flex-1">
            {/* Top Drawer Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {drawerData.tenant.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {drawerData.tenant.tier || "pro"}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-stone-400 font-mono">
                  /c/{drawerData.tenant.slug}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDrawer(drawerCafeId)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                  title="Refresh snapshot"
                >
                  🔄
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerCafeId(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Drawer Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200 dark:border-stone-800">
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                    drawerTab === t.id
                      ? "bg-indigo-600 text-white font-black shadow-sm"
                      : "text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white"
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
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">Plan Status</span>
                    <div className="font-bold text-slate-900 dark:text-white uppercase">
                      {drawerData.tenant.plan}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-1">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tier</span>
                    <div className="font-bold text-indigo-600 uppercase">
                      {drawerData.tenant.tier || "pro"}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-2">
                  <div className="font-bold text-slate-700 dark:text-stone-300 uppercase text-xs">
                    Contact & Tax Identity
                  </div>
                  <div className="space-y-1 text-slate-600 dark:text-stone-400">
                    <div>📞 Phone: {drawerData.tenant.phone || "Not set"}</div>
                    <div>📍 Address: {drawerData.tenant.address || "Not set"}</div>
                    <div>🧾 GSTIN: {drawerData.tenant.gstin || "Not set"} ({drawerData.tenant.tax_rate ?? 5}% Tax)</div>
                    <div>🔖 Tagline: {drawerData.tenant.tagline || "None"}</div>
                  </div>
                </div>

                <Link
                  href={`/super/cafe/${drawerData.tenant.id}`}
                  className="block w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-center text-xs shadow-md cursor-pointer"
                >
                  🕵️‍♂️ Launch Impersonation View &rarr;
                </Link>
              </div>
            )}

            {/* DRAWER TAB 2: MENU */}
            {drawerTab === "menu" && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-700 dark:text-stone-300">
                  Registered Dishes ({drawerData.items?.length})
                </div>
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {drawerData.items?.map((it: any) => (
                    <div
                      key={it.id}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span>{it.is_veg ? "🥗" : "🍗"}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{it.name}</span>
                      </div>
                      <span className="font-mono text-indigo-600 font-bold">
                        ₹{(it.price_paise / 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DRAWER TAB 3: TABLES */}
            {drawerTab === "tables" && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-700 dark:text-stone-300">
                  Tables ({drawerData.tables?.length})
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {drawerData.tables?.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-center"
                    >
                      <div className="font-black text-indigo-600 font-mono text-sm">{t.label}</div>
                      <div className="text-xs text-slate-500">{t.seats} Seats</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DRAWER TAB 4: ORDERS */}
            {drawerTab === "orders" && (
              <div className="space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-stone-300">
                  Recent Orders ({drawerData.orders?.length})
                </div>
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {drawerData.orders?.map((o: any) => (
                    <div
                      key={o.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900 dark:text-white font-mono">
                          #{o.order_number}
                        </span>
                        <span className="text-slate-500 ml-2 uppercase text-[10px] font-bold">{o.status}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className={o.payment_status === "paid" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                          {o.payment_status}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{(o.total_paise / 100).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DRAWER TAB 5: BILLING OVERRIDES */}
            {drawerTab === "billing" && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-3">
                  <div className="font-bold text-indigo-600 uppercase text-xs">Super Admin Billing Controls</div>
                  <p className="text-slate-500 text-xs">Override tenant access immediately without Razorpay transactions.</p>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExtendTrial(7)}
                      className="py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 cursor-pointer"
                    >
                      +7 Days Trial
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExtendTrial(30)}
                      className="py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 cursor-pointer"
                    >
                      +30 Days Trial
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleMarkPaid}
                      className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                    >
                      Mark Paid (1 Year)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetPlan("suspended")}
                      className="py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs hover:bg-red-100 cursor-pointer"
                    >
                      Force Suspend
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DRAWER TAB 6: DANGER */}
            {drawerTab === "danger" && (
              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 space-y-3 text-xs">
                <div className="font-black text-red-700 uppercase">Danger Zone</div>
                <p className="text-red-700/80 text-xs">
                  Permanently delete this café tenant and all associated records. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteCafe(drawerData.tenant.id)}
                  className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-md"
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
