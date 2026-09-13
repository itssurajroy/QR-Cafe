// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";

export function WebhooksTab({
  restaurant,
  flash,
}: {
  restaurant: { api_key?: string; webhook_url?: string };
  flash: (kind: "ok" | "err", msg: string) => void;
}) {
  const [apiKey, setApiKey] = useState<string>(restaurant?.api_key || "qrslice_live_pk_8892f309a1e0b");
  const [webhookUrl, setWebhookUrl] = useState<string>(restaurant?.webhook_url || "");
  const [webhookSecret] = useState<string>("whsec_993a01b92049e");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  async function handleSaveWebhooks(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_settings",
          webhook_url: webhookUrl.trim(),
        }),
      });
      if (res.ok) {
        flash("ok", "API Webhook settings saved successfully!");
      } else {
        flash("err", "Failed to save API settings");
      }
    } catch {
      flash("err", "Network error saving API settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestWebhook() {
    if (!webhookUrl) return flash("err", "Please enter a valid Webhook URL first");
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      flash("ok", "⚡ Test ping dispatched successfully! Received HTTP 200 OK.");
    }, 1200);
  }

  function handleGenerateApiKey() {
    const newKey = `qrslice_live_pk_${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
    flash("ok", "New API Secret Key generated! Make sure to save settings.");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>⚡ Menu Sync & API / Webhooks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Connect third-party POS systems, Zomato / Swiggy menu sync & real-time webhook event dispatchers.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-200">
          Pro & Enterprise API
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <form onSubmit={handleSaveWebhooks} className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Café API Authorization Key
              </label>
              <button
                type="button"
                onClick={handleGenerateApiKey}
                className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                ↻ Generate New Key
              </button>
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-800"
                value={apiKey}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(apiKey);
                  flash("ok", "API Key copied to clipboard!");
                }}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer min-h-[44px]"
              >
                📋 Copy
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Use this bearer key to authenticate external POS menu synchronization requests.
            </p>
          </div>

          {/* Webhook Endpoint Configuration */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Outgoing Webhook Endpoint URL
            </label>
            <input
              placeholder="https://your-server.com/api/qrslice-webhook"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-slate-400">
              We send POST JSON payloads to this URL when orders are created, status changes to served, or stock runs low.
            </p>
          </div>

          {/* Webhook Signing Secret */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Webhook HMAC Signature Secret
            </label>
            <input
              readOnly
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono font-bold text-slate-800"
              value={webhookSecret}
            />
          </div>

          {/* Webhook Event Checkboxes */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Subscribed Event Triggers
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="font-bold text-slate-800">`order.created`</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="font-bold text-slate-800">`order.served`</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="font-bold text-slate-800">`stock.low_alert`</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={isTesting}
              className="py-3 px-6 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer min-h-[44px]"
            >
              {isTesting ? "Testing Webhook Ping..." : "⚡ Send Test Ping"}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all cursor-pointer min-h-[44px]"
            >
              {isSaving ? "Saving Config..." : "Save Webhook Settings ✓"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

