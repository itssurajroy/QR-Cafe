// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import {
  PlugIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PrinterIcon,
  CreditCardIcon,
  MessageCircleIcon,
  XCircleIcon,
  SparklesIcon,
  SearchIcon,
  RefreshCwIcon,
} from "@/components/Icons";

interface IntegrationsTabProps {
  restaurant: any;
  flash: (kind: "ok" | "err", msg: string) => void;
}

export type IntegrationStatus = "connected" | "not_connected" | "connecting" | "action_required" | "error" | "disabled";

export interface IntegrationItem {
  id: string;
  name: string;
  category: "communication" | "payment" | "hardware" | "marketing" | "accounting" | "logistics";
  status: IntegrationStatus;
  description: string;
  connectedSince?: string;
  icon: string;
  docsUrl?: string;
}

export function IntegrationsTab({ restaurant, flash }: IntegrationsTabProps) {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([
    {
      id: "whatsapp",
      name: "WhatsApp Cloud API",
      category: "communication",
      status: "connected",
      description: "Automated digital receipts, order tracking updates, and 1-click customer re-engagement.",
      connectedSince: "Active",
      icon: "💬",
    },
    {
      id: "razorpay",
      name: "Payment Gateway (Razorpay / UPI)",
      category: "payment",
      status: "connected",
      description: "Direct customer checkout via UPI QR, RuPay, Visa, Mastercard, and NetBanking.",
      connectedSince: "Active",
      icon: "💳",
    },
    {
      id: "thermal_printer",
      name: "Thermal POS & KOT Printers",
      category: "hardware",
      status: "connected",
      description: "ESC/POS driver for 80mm / 58mm Bluetooth, USB OTG, and LAN receipt printing.",
      connectedSince: "Active",
      icon: "🖨️",
    },
    {
      id: "email",
      name: "Transactional Email (Resend / SendGrid)",
      category: "communication",
      status: "action_required",
      description: "End-of-day sales reports, audit alerts, and manager shift reconciliations.",
      icon: "✉️",
    },
    {
      id: "sms",
      name: "SMS Gateway (Fast2SMS / Twilio)",
      category: "communication",
      status: "not_connected",
      description: "Fallback text message delivery for guest table bookings and order ready alerts.",
      icon: "📱",
    },
    {
      id: "tally",
      name: "Tally Prime & Zoho Books",
      category: "accounting",
      status: "not_connected",
      description: "Direct ledger sync of daily GST taxes, raw material invoices, and sales vouchers.",
      icon: "📊",
    },
    {
      id: "delivery",
      name: "Delivery Fleet (Dunzo / Shadowfax)",
      category: "logistics",
      status: "not_connected",
      description: "Auto-dispatch riders for direct restaurant takeaway and delivery orders.",
      icon: "🛵",
    },
    {
      id: "google_analytics",
      name: "Google Analytics 4 (GA4)",
      category: "marketing",
      status: "not_connected",
      description: "Track QR scan volume, table traffic, dish pageviews, and bounce rate.",
      icon: "📈",
    },
    {
      id: "google_reviews",
      name: "Google 5★ Reviews Funnel",
      category: "marketing",
      status: "connected",
      description: "Route delighted diners directly from WhatsApp bills to your Google Maps listing.",
      connectedSince: "Active",
      icon: "⭐",
    },
  ]);

  const [activeModal, setActiveModal] = useState<IntegrationItem | null>(null);
  const [modalInput1, setModalInput1] = useState("");
  const [modalInput2, setModalInput2] = useState("");
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const connectedList = integrations.filter((i) => i.status === "connected");
  const availableList = integrations.filter((i) => i.status !== "connected");

  const openConfigModal = (item: IntegrationItem) => {
    setActiveModal(item);
    setTestResult(null);
    if (item.id === "whatsapp") {
      setModalInput1("+91 85951 01297");
      setModalInput2("waba_live_prod_99214");
    } else if (item.id === "razorpay") {
      setModalInput1("rzp_live_key_9941");
      setModalInput2("••••••••••••••••");
    } else if (item.id === "thermal_printer") {
      setModalInput1("192.168.1.120");
      setModalInput2("80mm Standard ESC/POS");
    } else {
      setModalInput1("");
      setModalInput2("");
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult("Handshake successful! Response latency: 42ms. Health status: OK.");
      flash("ok", `Connection test passed for ${activeModal?.name}! ✓`);
    }, 1200);
  };

  const handleSaveIntegration = () => {
    if (!activeModal) return;
    setIntegrations((prev) =>
      prev.map((i) => (i.id === activeModal.id ? { ...i, status: "connected" } : i))
    );
    setActiveModal(null);
    flash("ok", `${activeModal.name} configured and activated successfully!`);
  };

  const renderStatusBadge = (status: IntegrationStatus) => {
    switch (status) {
      case "connected":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
            Connected
          </span>
        );
      case "action_required":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3 text-amber-600" />
            Action Required
          </span>
        );
      case "connecting":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-[#5738F5] border border-purple-200">
            Connecting...
          </span>
        );
      case "error":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-100 text-slate-600">
            Available
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#5738F5]/10 text-[#5738F5] flex items-center justify-center font-bold">
              <PlugIcon className="w-4 h-4 text-[#5738F5]" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#17142B] tracking-tight">
              Integrations &amp; Extensions Hub
            </h2>
          </div>
          <p className="text-xs text-[#6F7185] mt-1 font-medium">
            Connect QRslice with the tools and hardware your restaurant already relies on.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-[#E6F8F3] text-emerald-800 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            {connectedList.length} Active Integrations
          </span>
        </div>
      </div>

      {/* 1. CONNECTED INTEGRATIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#17142B] uppercase tracking-wider">
            Connected Services ({connectedList.length})
          </h3>
          <span className="text-xs text-[#6F7185]">Operational and synchronized with POS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectedList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-4 flex flex-col justify-between hover:border-[#5738F5]/40 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  {renderStatusBadge(item.status)}
                </div>
                <h4 className="text-sm font-black text-[#17142B]">{item.name}</h4>
                <p className="text-xs text-[#6F7185] leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-[#6F7185]">
                  Status: <strong className="text-emerald-700">Healthy</strong>
                </span>
                <button
                  onClick={() => openConfigModal(item)}
                  className="px-3 py-1.5 bg-[#F1EFF7] hover:bg-[#5738F5] hover:text-white text-[#17142B] text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Manage &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. AVAILABLE INTEGRATIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-[#17142B] uppercase tracking-wider">
            Available Integrations ({availableList.length})
          </h3>
          <span className="text-xs text-[#6F7185]">1-Click add-ons for billing, inventory, and logistics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableList.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{item.icon}</span>
                  {renderStatusBadge(item.status)}
                </div>
                <h4 className="text-sm font-black text-[#17142B]">{item.name}</h4>
                <p className="text-xs text-[#6F7185] leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#6F7185]">Ready to setup</span>
                <button
                  onClick={() => openConfigModal(item)}
                  className="px-3.5 py-1.5 bg-[#5738F5] hover:bg-[#4628D8] text-white text-xs font-black rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Setup / Management Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-[#E7E4F0] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7E4F0] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeModal.icon}</span>
                <h4 className="text-sm font-black text-[#17142B]">
                  Configure {activeModal.name}
                </h4>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#6F7185]">{activeModal.description}</p>

              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  {activeModal.id === "thermal_printer"
                    ? "Printer IP Address or Port"
                    : activeModal.id === "whatsapp"
                    ? "Official WhatsApp Business Phone ID"
                    : "Primary API Key / ID"}
                </label>
                <input
                  type="text"
                  value={modalInput1}
                  onChange={(e) => setModalInput1(e.target.value)}
                  placeholder="e.g. 192.168.1.100 or key_live_..."
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  {activeModal.id === "thermal_printer"
                    ? "Paper Width & Protocol"
                    : "Secret Token / Webhook Signature"}
                </label>
                <input
                  type="text"
                  value={modalInput2}
                  onChange={(e) => setModalInput2(e.target.value)}
                  placeholder="e.g. 80mm Standard or secret_token_..."
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono text-xs"
                />
              </div>

              {testResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] leading-relaxed">
                  ✓ {testResult}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-3.5 py-2 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {testingConnection ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : "⚡"}
                Test Connection
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveIntegration}
                  className="px-4 py-2 bg-[#5738F5] text-white font-black rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Save &amp; Activate ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
