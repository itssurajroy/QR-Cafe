// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type FunnelStage = {
  name: string;
  count: number;
  pctOfTotal: number;
  pctOfPrevious: number;
  description: string;
};

export function FunnelTab() {
  const { cafes } = useSuperAdmin();
  const [dateRange, setDateRange] = useState("30d");
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [deviceFilter, setDeviceFilter] = useState("all");

  const funnelStages: FunnelStage[] = [
    {
      name: "QR Code Scans",
      count: 10420,
      pctOfTotal: 100,
      pctOfPrevious: 100,
      description: "Customer scanned table QR sticker with camera app / Google Lens",
    },
    {
      name: "Menu Views",
      count: 8214,
      pctOfTotal: 78.8,
      pctOfPrevious: 78.8,
      description: "Digital menu successfully rendered in mobile browser",
    },
    {
      name: "Item Views & Customization",
      count: 5910,
      pctOfTotal: 56.7,
      pctOfPrevious: 71.9,
      description: "Customer inspected item details, spicy levels, or add-ons",
    },
    {
      name: "Cart Created",
      count: 3428,
      pctOfTotal: 32.9,
      pctOfPrevious: 58.0,
      description: "Added at least 1 dish to dining order ticket",
    },
    {
      name: "Checkout Started",
      count: 2840,
      pctOfTotal: 27.3,
      pctOfPrevious: 82.8,
      description: "Customer verified table number & clicked Place Order",
    },
    {
      name: "Payment Started",
      count: 2410,
      pctOfTotal: 23.1,
      pctOfPrevious: 84.9,
      description: "Selected UPI QR / Cash counter settlement mode",
    },
    {
      name: "Order Completed",
      count: 2310,
      pctOfTotal: 22.2,
      pctOfPrevious: 95.9,
      description: "KOT ticket routed to kitchen and bill finalized",
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Conversion Funnel</h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end dining conversion drop-off analysis from physical QR scan to kitchen bill settlement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            Overall Conversion: <strong className="text-emerald-600 font-mono font-bold">22.2%</strong>
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Restaurant:</span>
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
          >
            <option value="all">All Restaurants (Platform Total)</option>
            {cafes?.map((c: any) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Device:</span>
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:border-[#5738F5]"
            >
              <option value="all">All Devices</option>
              <option value="ios">iOS Safari (64%)</option>
              <option value="android">Android Chrome (34%)</option>
              <option value="other">Desktop / Other (2%)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {["7d", "30d", "90d"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase ${
                  dateRange === r
                    ? "bg-white text-[#5738F5] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel Visualization Cards */}
      <div className="space-y-3">
        {funnelStages.map((stage, idx) => {
          const isFirst = idx === 0;
          return (
            <div key={stage.name} className="relative">
              {!isFirst && (
                <div className="flex items-center justify-center my-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-0.5 rounded-full">
                    <span>↓</span>
                    <span>{stage.pctOfPrevious}% passed to next stage</span>
                    <span className="text-rose-500 font-normal">
                      (-{Math.round((100 - stage.pctOfPrevious) * 10) / 10}% drop-off)
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-violet-50 text-[#5738F5] font-black text-xs flex items-center justify-center border border-violet-100 font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{stage.name}</h3>
                      <p className="text-[11px] text-slate-500">{stage.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {stage.count.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-medium">sessions</span>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <span className="text-sm font-bold text-[#5738F5] font-mono">
                        {stage.pctOfTotal}%
                      </span>
                      <span className="text-[10px] text-slate-400 block">of scans</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                  <div
                    className="bg-[#5738F5] h-full rounded-full transition-all duration-500"
                    style={{ width: `${stage.pctOfTotal}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
