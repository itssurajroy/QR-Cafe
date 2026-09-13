// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";
import { paise } from "@/lib/utils";
import { SearchIcon, StarIcon, ShieldCheckIcon } from "@/components/Icons";

export interface CustomerData {
  id: string;
  phone: string;
  name: string | null;
  loyalty_points: number;
  total_spent_paise: number;
  visit_count: number;
  last_visit_at: string;
}

interface CrmTabProps {
  flash: (kind: "ok" | "err", msg: string) => void;
}

export function CrmTab({ flash }: CrmTabProps) {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"last_visit_at" | "total_spent" | "points">("last_visit_at");
  const [isAdjusting, setIsAdjusting] = useState<string | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm?q=${encodeURIComponent(search)}&sort=${sort}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      flash("err", "Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  const handleAdjustPoints = async (customerId: string, amount: number) => {
    setIsAdjusting(customerId);
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, adjustPoints: amount, reason: "Manual adjustment by Admin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCustomers((prev) =>
        prev.map((c) => (c.id === customerId ? { ...c, loyalty_points: data.newPoints } : c))
      );
      flash("ok", `Points adjusted by ${amount > 0 ? "+" : ""}${amount}`);
    } catch (err: any) {
      flash("err", err.message || "Failed to adjust points");
    } finally {
      setIsAdjusting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-xs">
        <div>
          <h2 className="text-xl font-black text-[#17142B] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Customer Loyalty & CRM
          </h2>
          <p className="text-xs text-[#6F7185] font-medium mt-0.5">
            Track returning guests, manage loyalty points, and view top spenders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono font-bold bg-[#E6F8F3] text-emerald-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5" />
            {customers.length} Guests
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E4F0] flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {[
            { id: "last_visit_at", label: "Recent Visitors" },
            { id: "total_spent", label: "Top Spenders" },
            { id: "points", label: "Most Points" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                sort === s.id
                  ? "bg-[#5738F5] text-white shadow-xs font-extrabold"
                  : "bg-slate-50 text-[#6F7185] hover:bg-slate-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5]"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-[#E7E4F0] overflow-hidden shadow-xs">
        {loading && customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-sm">Loading guests...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E7E4F0] bg-slate-50/70 text-[#6F7185] uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Visits</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Loyalty Points</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E4F0]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#17142B]">{c.name || "Anonymous Guest"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Last: {new Date(c.last_visit_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#6F7185]">{c.phone}</td>
                    <td className="py-3.5 px-4 font-black text-[#17142B]">{c.visit_count}</td>
                    <td className="py-3.5 px-4 font-mono text-[#5738F5] font-bold">
                      {paise(c.total_spent_paise)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg inline-flex">
                        <StarIcon className="w-3.5 h-3.5" />
                        {c.loyalty_points} pts
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={isAdjusting === c.id}
                          onClick={() => handleAdjustPoints(c.id, -10)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 font-bold text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                          title="Deduct 10 points"
                        >
                          -10
                        </button>
                        <button
                          type="button"
                          disabled={isAdjusting === c.id}
                          onClick={() => handleAdjustPoints(c.id, 50)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 font-bold text-[10px] transition-colors cursor-pointer disabled:opacity-50"
                          title="Add 50 points manually"
                        >
                          +50
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
