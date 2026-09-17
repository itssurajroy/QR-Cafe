// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

export function StaffTab() {
  const { staff, tab } = useSuperAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredStaff = (staff || []).filter((s: any) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = s.display_name?.toLowerCase().includes(q) || false;
    const cafeMatch = s.restaurant_name?.toLowerCase().includes(q) || false;
    const roleMatch = s.role?.toLowerCase().includes(q) || false;
    return nameMatch || cafeMatch || roleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Staff & Team Roster</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Active staff members, managers, and owners across all tenant cafés ({staff.length} total)
          </p>
        </div>

        <div className="w-full sm:w-80 flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-xs">
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, café, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none flex-1 font-medium text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <th className="p-4">Member Name</th>
                <th className="p-4">System Role</th>
                <th className="p-4">Assigned Tenant Café</th>
                <th className="p-4">Status</th>
                <th className="p-4">Joined On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 text-[#5738F5] font-black text-xs flex items-center justify-center shrink-0">
                        {(user.display_name || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {user.display_name || "Unnamed Staff Member"}
                        </div>
                        {user.email && (
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      user.role === "super_admin"
                        ? "bg-violet-50 text-[#5738F5] border-violet-200"
                        : user.role === "owner"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">
                      {user.restaurant_name || <span className="text-slate-400 italic">Global Platform</span>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.active !== false ? "bg-emerald-500 shadow-sm shadow-emerald-500/50" : "bg-slate-300"}`}></span>
                      <span className={`font-semibold ${user.active !== false ? "text-emerald-700" : "text-slate-400"}`}>
                        {user.active !== false ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-500 font-mono text-[11px]">
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 font-medium text-xs">
                    No staff members match the current search criteria.
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
