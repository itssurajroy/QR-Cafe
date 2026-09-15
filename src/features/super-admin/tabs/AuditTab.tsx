// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React from "react";
import { useSuperAdmin } from "../SuperAdminContext";

export function AuditTab() {
  const ctx = useSuperAdmin();
  const { auditRows, auditActionFilter, loadFilteredAudit, auditLoading } = ctx;

  const filters = [
    { id: "", label: "All Audit Events" },
    { id: "super_impersonate", label: "Impersonation" },
    { id: "super_extend_trial", label: "Trial Extension" },
    { id: "super_mark_paid", label: "Plan & Billing" },
    { id: "self_onboarding", label: "Self Onboarding" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">Platform Audit Event Stream</h3>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                Immutable
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tamper-evident logs tracking administrative overrides, tenant impersonation, and billing actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => loadFilteredAudit(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  auditActionFilter === f.id
                    ? "bg-[#5738F5] text-white border-[#5738F5] shadow-sm"
                    : "bg-slate-50 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="pb-3 px-2">Timestamp</th>
                <th className="pb-3 px-2">Entity</th>
                <th className="pb-3 px-2">Action</th>
                <th className="pb-3 px-2">Café Target</th>
                <th className="pb-3 px-2">Metadata Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {auditRows.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{new Date(a.created_at).toLocaleTimeString("en-IN")}</span>
                    <span className="text-slate-400 ml-1.5 text-[11px] font-sans">
                      {new Date(a.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-bold text-[#5738F5]">
                    <span className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-100 text-[11px]">
                      {a.entity}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-bold text-slate-900 font-sans">
                    {a.action}
                  </td>
                  <td className="py-3 px-2 text-slate-700 font-sans font-medium">
                    {a.restaurants?.name || a.restaurant_id || <span className="text-slate-400">System Platform</span>}
                  </td>
                  <td className="py-3 px-2 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                    <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200/60 block truncate text-slate-600">
                      {JSON.stringify(a.metadata || {})}
                    </span>
                  </td>
                </tr>
              ))}
              {auditRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans text-xs">
                    {auditLoading ? "Streaming audit records…" : "No audit events found for this filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
