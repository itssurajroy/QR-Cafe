// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import { useSuperAdmin } from "../SuperAdminContext";

type IntegrationDetail = {
  id: string;
  name: string;
  provider: string;
  description: string;
  connectedCount: number;
  attentionCount: number;
  status: "Operational" | "Degraded" | "Outage";
  uptime: string;
  metrics: {
    label1: string;
    val1: string;
    label2: string;
    val2: string;
    label3: string;
    val3: string;
    label4: string;
    val4: string;
  };
  recentLogs: Array<{ time: string; event: string; status: "success" | "warning" | "error" }>;
};

export function IntegrationsTab() {
  const { flash } = useSuperAdmin();
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDetail | null>(null);
  const [testingPing, setTestingPing] = useState(false);

  const integrations: IntegrationDetail[] = [
    {
      id: "whatsapp",
      name: "WhatsApp Cloud API",
      provider: "Meta Business Graph API v19.0",
      description: "Automated digital receipts, order status updates, kitchen dispatch alerts, and promotional announcements.",
      connectedCount: 842,
      attentionCount: 18,
      status: "Operational",
      uptime: "99.94%",
      metrics: {
        label1: "Messages Today",
        val1: "14,820",
        label2: "Delivered",
        val2: "99.2%",
        label3: "Read Rate",
        val3: "88.4%",
        label4: "Template Errors",
        val4: "18",
      },
      recentLogs: [
        { time: "2 min ago", event: "Receipt template dispatched for order #10482 (Wah Ji Wah)", status: "success" },
        { time: "11 min ago", event: "Webhook delivery verified for callback event waba_msg_status", status: "success" },
        { time: "28 min ago", event: "Template approval pending: bill_receipt_hindi_v2", status: "warning" },
        { time: "1 hour ago", event: "Batch promotional broadcast delivered to 482 customers", status: "success" },
      ],
    },
    {
      id: "payments",
      name: "Razorpay Payment Gateway",
      provider: "Razorpay Enterprise API & Webhooks",
      description: "Dine-in UPI QR payments, counter settlement, recurring subscription billing, and automated instant refunds.",
      connectedCount: 1102,
      attentionCount: 4,
      status: "Operational",
      uptime: "99.97%",
      metrics: {
        label1: "Transactions Today",
        val1: "₹3,42,000",
        label2: "UPI Success Rate",
        val2: "98.8%",
        label3: "Webhooks Processed",
        val3: "4,120",
        label4: "Pending Settlements",
        val4: "4",
      },
      recentLogs: [
        { time: "1 min ago", event: "Webhook payment.captured processed (pay_live_948a72)", status: "success" },
        { time: "8 min ago", event: "Subscription invoice INV-10482 collected successfully", status: "success" },
        { time: "42 min ago", event: "Customer bank UPI timeout reported on order #10476", status: "warning" },
        { time: "2 hours ago", event: "Daily merchant settlement batch queued to HDFC nodal account", status: "success" },
      ],
    },
    {
      id: "push",
      name: "WebPush & FCM Cloud Messaging",
      provider: "Firebase Cloud Messaging / VAPID",
      description: "Real-time kitchen display buzzers, cashier alerts, customer dine-in table status banners.",
      connectedCount: 1248,
      attentionCount: 12,
      status: "Operational",
      uptime: "99.99%",
      metrics: {
        label1: "Tokens Active",
        val1: "1,248",
        label2: "Push Sent (24h)",
        val2: "28,490",
        label3: "Delivery Latency",
        val3: "120ms",
        label4: "Invalid Tokens",
        val4: "12 pruned",
      },
      recentLogs: [
        { time: "Just now", event: "KDS audio chime push sent to Indiranagar Station 1", status: "success" },
        { time: "5 min ago", event: "Token refresh registered for browser agent Chrome 128", status: "success" },
        { time: "35 min ago", event: "Expired endpoint pruned (410 Gone)", status: "warning" },
        { time: "1 hour ago", event: "Order ready push sent to Customer Table 4", status: "success" },
      ],
    },
    {
      id: "printers",
      name: "Thermal ESC/POS Cloud Bridge",
      provider: "QRslice Print Bridge Agent v2.4",
      description: "Direct-to-kitchen ticket printing, KOT routing, bill generation on Epson / Star / generic 80mm & 58mm printers.",
      connectedCount: 642,
      attentionCount: 19,
      status: "Operational",
      uptime: "99.91%",
      metrics: {
        label1: "Active Bridges",
        val1: "642",
        label2: "Tickets Printed",
        val2: "8,920",
        label3: "Average Print Delay",
        val3: "480ms",
        label4: "Offline Bridges",
        val4: "19",
      },
      recentLogs: [
        { time: "4 min ago", event: "KOT ticket printed at Wah Ji Wah CP (Kitchen 1 - 80mm)", status: "success" },
        { time: "14 min ago", event: "Heartbeat received from local USB bridge agent", status: "success" },
        { time: "52 min ago", event: "Printer out of paper alert triggered: Curry Leaf Station 2", status: "warning" },
        { time: "2 hours ago", event: "Auto-reconnect successful for Star Micronics TSP650", status: "success" },
      ],
    },
  ];

  const handleTestPing = (integration: IntegrationDetail) => {
    setTestingPing(true);
    setTimeout(() => {
      setTestingPing(false);
      flash("ok", `Ping response from ${integration.provider}: 200 OK (latency 42ms)`);
    }, 800);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integrations Hub</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor WhatsApp Business API, Razorpay payment pipelines, push notification channels, and hardware printers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>All 4 Core Gateways Connected</span>
          </span>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-[#5738F5]/30 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.name}</h3>
                  <span className="text-[11px] font-mono text-slate-400 block">{item.provider}</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{item.status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Connected</span>
                <span className="text-base font-bold text-slate-900 font-mono">{item.connectedCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attention</span>
                <span className="text-base font-bold text-amber-600 font-mono">{item.attentionCount}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Uptime: <strong className="text-slate-700">{item.uptime}</strong></span>
              <button
                type="button"
                onClick={() => setSelectedIntegration(item)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#5738F5] font-bold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
              >
                <span>Inspect Pipeline</span>
                <span>→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Inspection Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold text-[#5738F5] uppercase tracking-wider">
                  Integration Diagnostics
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedIntegration.name}</h3>
                <p className="text-xs text-slate-500">{selectedIntegration.provider}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{selectedIntegration.metrics.label1}</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">{selectedIntegration.metrics.val1}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{selectedIntegration.metrics.label2}</span>
                <span className="text-sm font-bold text-emerald-600 font-mono mt-0.5 block">{selectedIntegration.metrics.val2}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{selectedIntegration.metrics.label3}</span>
                <span className="text-sm font-bold text-slate-800 font-mono mt-0.5 block">{selectedIntegration.metrics.val3}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{selectedIntegration.metrics.label4}</span>
                <span className="text-sm font-bold text-amber-600 font-mono mt-0.5 block">{selectedIntegration.metrics.val4}</span>
              </div>
            </div>

            {/* Diagnostic Logs */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-700 block">Recent Telemetry & Delivery Events</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedIntegration.recentLogs.map((log, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs flex items-center justify-between gap-3">
                    <span className="text-slate-700 truncate">{log.event}</span>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={testingPing}
                onClick={() => handleTestPing(selectedIntegration)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>{testingPing ? "Pinging Gateway..." : "⚡ Test Connection"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedIntegration(null)}
                className="px-4 py-2 rounded-xl bg-[#5738F5] text-white text-xs font-bold hover:bg-[#492ee0] shadow-sm shadow-[#5738F5]/25 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
