"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import Link from "next/link";

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
  notes?: string;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  table_label: string | null;
  customer_name?: string;
  customer_phone?: string;
  order_items?: OrderItem[];
};

const COLUMNS = [
  { key: "pending", label: "New Tickets", badgeColor: "border-amber-500/60 bg-amber-950/40 text-amber-400" },
  { key: "confirmed", label: "Accepted", badgeColor: "border-blue-500/60 bg-blue-950/40 text-blue-400" },
  { key: "preparing", label: "In Kitchen", badgeColor: "border-purple-500/60 bg-purple-950/40 text-purple-400" },
  { key: "ready", label: "Ready to Serve", badgeColor: "border-emerald-500/60 bg-emerald-950/40 text-emerald-400" },
];

function nextAction(status: string): { next: string; label: string; bg: string } | null {
  switch (status) {
    case "pending":
      return { next: "confirmed", label: "Accept Order", bg: "bg-blue-600 hover:bg-blue-500 text-white" };
    case "confirmed":
      return { next: "preparing", label: "Start Cooking 🔥", bg: "bg-purple-600 hover:bg-purple-500 text-white" };
    case "preparing":
      return { next: "ready", label: "Mark Ready 🔔", bg: "bg-emerald-600 hover:bg-emerald-500 text-white" };
    case "ready":
      return { next: "served", label: "Mark Served ✓", bg: "bg-stone-700 hover:bg-stone-600 text-stone-200" };
    default:
      return null;
  }
}

function elapsed(createdAt: string) {
  const s = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

function getUrgencyCardStyle(createdAt: string) {
  const mins = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (mins > 15) return "border-red-500/80 bg-red-950/25 shadow-lg shadow-red-500/10 animate-pulse";
  if (mins > 8) return "border-amber-500/60 bg-amber-950/20";
  return "border-stone-800/90 bg-stone-900";
}

export default function KdsClient({
  restaurantId,
  initialOrders,
}: {
  restaurantId: string;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [online, setOnline] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeServiceAlert, setActiveServiceAlert] = useState<{ table: string; text: string; time: string } | null>(null);
  const prevCountRef = useRef(initialOrders.length);

  const supabase = getSupabaseBrowserClient();

  // Tick clock for urgency heatmaps
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 2000);
    return () => clearInterval(id);
  }, []);

  function speakVoice(text: string) {
    if (!soundEnabled) return;
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel(); // cancel previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      /* ignore if speech not supported */
    }
  }

  function playChime() {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      /* ignore if audio gesture blocked */
    }
  }

  // Robust Server-Side Ticket Fetcher
  async function fetchLiveTickets() {
    try {
      const res = await fetch("/api/kds/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) {
          if (data.orders.length > prevCountRef.current) {
            playChime();
            const latest = data.orders[0];
            speakVoice(`New Order for Table ${latest?.table_label || "Takeaway"}`);
          }
          prevCountRef.current = data.orders.length;
          setOrders(data.orders);
          setOnline(true);
        }
      }
    } catch {
      setOnline(false);
    }
  }

  // 1. Setup Supabase Postgres Changes Channel for Orders & Table Service Calls
  useEffect(() => {
    const channel = supabase
      .channel(`kds-realtime:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchLiveTickets();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_events",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload: any) => {
          if (payload.new?.entity === "table_service") {
            const req = payload.new?.action;
            const table = payload.new?.metadata?.table_label || "Table";
            playChime();
            if (req === "water") {
              speakVoice(`Table ${table} needs Water`);
              setActiveServiceAlert({ table, text: `💧 Table ${table} requested Water!`, time: new Date().toLocaleTimeString() });
            } else if (req === "clean") {
              speakVoice(`Table ${table} needs Table Cleaned`);
              setActiveServiceAlert({ table, text: `✨ Table ${table} requested Table Clean!`, time: new Date().toLocaleTimeString() });
            } else {
              speakVoice(`Table ${table} is calling Waiter`);
              setActiveServiceAlert({ table, text: `🔔 Table ${table} is calling Waiter!`, time: new Date().toLocaleTimeString() });
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, supabase]);

  // 2. High-Frequency Realtime Fallback Polling (Every 2 seconds)
  useEffect(() => {
    fetchLiveTickets();
    const interval = setInterval(fetchLiveTickets, 2000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  async function advanceStatus(orderId: string, nextStatus: string) {
    setLoadingId(orderId);
    // Optimistic Update
    setOrders((prev) =>
      prev
        .map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
        .filter((o) => o.status !== "served" && o.status !== "cancelled"),
    );

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        fetchLiveTickets();
      }
    } catch {
      fetchLiveTickets();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navbar */}
      <header className="bg-stone-900 border-b border-stone-800 px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black text-xl shadow-md shadow-amber-500/20">
            👨‍🍳
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-base tracking-tight">
                Kitchen Display System (KDS)
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black border flex items-center gap-1 ${
                  online
                    ? "bg-emerald-950/80 border-emerald-700 text-emerald-400"
                    : "bg-red-950/80 border-red-700 text-red-400 animate-pulse"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400 animate-ping" : "bg-red-400"}`}></span>
                {online ? "REALTIME LIVE" : "CONNECTING..."}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Live ticket stream • Auto-refreshing every 2s
            </p>
          </div>
        </div>

        {/* Audio Toggle & Quick Links */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) speakVoice("Audio announcements enabled");
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                : "bg-stone-800 border-stone-700 text-stone-500"
            }`}
          >
            <span>{soundEnabled ? "🔊 Voice Calls: ON" : "🔇 Voice Calls: OFF"}</span>
          </button>

          <Link
            href="/pos"
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-black hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
          >
            ⚡ Open POS
          </Link>

          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs border border-stone-700 transition-colors"
          >
            Admin &rarr;
          </Link>
        </div>
      </header>

      {/* Floating Table Service Alert Banner */}
      {activeServiceAlert && (
        <div className="bg-amber-500 text-stone-950 px-6 py-2.5 flex items-center justify-between font-black text-xs shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span className="text-base animate-bounce">📢</span>
            <span>{activeServiceAlert.text}</span>
            <span className="opacity-75 font-mono text-xs">({activeServiceAlert.time})</span>
          </div>
          <button
            type="button"
            onClick={() => setActiveServiceAlert(null)}
            className="px-2.5 py-0.5 rounded-lg bg-stone-950 text-amber-400 font-black text-xs uppercase hover:bg-stone-900 cursor-pointer"
          >
            Dismiss ✕
          </button>
        </div>
      )}

      {/* 4-Column Live Kanban Board */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.key);
          return (
            <div
              key={col.key}
              className="bg-stone-900/60 border border-stone-800/80 rounded-3xl p-4 flex flex-col shadow-lg backdrop-blur-sm min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-800">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                  {col.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${col.badgeColor}`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Order Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colOrders.map((o) => {
                  const action = nextAction(o.status);
                  const time = elapsed(o.created_at);
                  const urgencyStyle = getUrgencyCardStyle(o.created_at);

                  return (
                    <div
                      key={o.id}
                      className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all ${urgencyStyle}`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                        <div>
                          <div className="font-black text-white text-base">
                            #{o.order_number}
                          </div>
                          <div className="text-xs text-amber-400 font-bold">
                            {o.table_label ? `Table: ${o.table_label}` : "Takeaway / Counter"}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs text-stone-300 font-bold bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
                            ⏱️ {time}
                          </span>
                          <div className="text-xs text-stone-500 uppercase mt-0.5 font-semibold">
                            {o.payment_status === "paid" ? "PAID ✓" : "UNPAID"}
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5 py-1">
                        {o.order_items && o.order_items.length > 0 ? (
                          o.order_items.map((it) => (
                            <div key={it.id} className="text-xs">
                              <div className="flex justify-between font-bold text-stone-100">
                                <span>{it.item_name}</span>
                                <span className="font-mono text-amber-400 font-black">
                                  ×{it.quantity}
                                </span>
                              </div>
                              {it.notes && (
                                <p className="text-xs text-amber-300/80 italic pl-1">
                                  Note: {it.notes}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-stone-500 italic">Chef Special Order</p>
                        )}
                      </div>

                      {/* One-Tap Advance Button */}
                      {action && (
                        <button
                          onClick={() => advanceStatus(o.id, action.next)}
                          disabled={loadingId === o.id}
                          className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 ${action.bg}`}
                        >
                          {loadingId === o.id ? "Updating..." : action.label}
                        </button>
                      )}
                    </div>
                  );
                })}

                {colOrders.length === 0 && (
                  <div className="h-40 flex items-center justify-center text-xs text-stone-600 italic">
                    No tickets in queue
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
