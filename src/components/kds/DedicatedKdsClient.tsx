"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { QrSliceLogo } from "@/components/brand/QrSliceLogo";
import { StatusBadge } from "@/components/brand/StatusBadge";
import { useAudioTone } from "@/hooks/useAudioTone";
import { useWakeLock } from "@/hooks/useWakeLock";
import { speakHumanVoice } from "@/lib/tts";

interface KdsItem {
  id?: string;
  item_name: string;
  quantity: number;
  notes?: string | null;
  spice_level?: string | null;
  size_variant?: string | null;
}

interface KdsOrder {
  id: string;
  order_number: string | number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "completed";
  table_label?: string | null;
  table?: { label: string };
  created_at: string;
  items?: KdsItem[];
  order_items?: KdsItem[];
  notes?: string | null;
  customer_name?: string | null;
}

// Sample fallback tickets for demo mode or initial setup
const SAMPLE_KDS_ORDERS: KdsOrder[] = [
  {
    id: "demo-1",
    order_number: 1842,
    status: "pending",
    table_label: "08",
    created_at: new Date(Date.now() - 3 * 60000).toISOString(),
    items: [
      { item_name: "Butter Chicken", quantity: 1, spice_level: "Medium" },
      { item_name: "Garlic Naan", quantity: 2 },
      { item_name: "Masala Chai", quantity: 2, notes: "Less sugar please" },
    ],
  },
  {
    id: "demo-2",
    order_number: 1841,
    status: "preparing",
    table_label: "03",
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
    items: [
      { item_name: "Paneer Tikka", quantity: 1, notes: "Extra spicy mint chutney" },
      { item_name: "Cold Coffee", quantity: 1, size_variant: "Large" },
    ],
  },
  {
    id: "demo-3",
    order_number: 1840,
    status: "ready",
    table_label: "05",
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
    items: [
      { item_name: "Dal Makhani", quantity: 1 },
      { item_name: "Tandoori Roti", quantity: 4 },
    ],
  },
];

export function DedicatedKdsClient({
  restaurantId,
  restaurantName = "QrSlice Kitchen",
  restaurantSlug = "cafe",
  initialOrders = [],
}: {
  restaurantId?: string;
  restaurantName?: string;
  restaurantSlug?: string;
  initialOrders?: KdsOrder[];
}) {
  const [orders, setOrders] = useState<KdsOrder[]>(
    initialOrders.length > 0 ? initialOrders : SAMPLE_KDS_ORDERS
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [isDemo, setIsDemo] = useState(initialOrders.length === 0);

  // Keep screen awake
  useWakeLock(true);
  const { playAudioTone } = useAudioTone();
  const supabase = getSupabaseBrowserClient();

  // Tick clock every second for elapsed time
  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live orders
  const fetchTickets = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const res = await fetch("/api/kds/tickets");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.tickets)
          ? data.tickets
          : [];
        if (list.length > 0) {
          setOrders(list);
          setIsDemo(false);
        }
      }
    } catch {
      /* ignore */
    }
  }, [restaurantId]);

  // Realtime subscription
  useEffect(() => {
    if (!restaurantId) return;
    fetchTickets();

    const channel = supabase
      .channel("kds-live-dedicated")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchTickets();
          if (soundEnabled) playAudioTone("newOrder");
          if (voiceEnabled) speakHumanVoice("New order received in kitchen queue");
        }
      )
      .subscribe();

    const poll = setInterval(fetchTickets, 5000);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, soundEnabled, voiceEnabled, fetchTickets, playAudioTone, supabase]);

  const updateOrderStatus = async (orderId: string, status: string, orderNumber: string | number, tableLabel: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: status as any } : o))
    );

    if (soundEnabled) playAudioTone("statusChange");
    if (voiceEnabled) {
      if (status === "ready") {
        speakHumanVoice(`Order ${orderNumber} for Table ${tableLabel} is ready!`);
      }
    }

    if (!isDemo && restaurantId) {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch {
        /* ignore */
      }
    }
  };

  // Group into columns: NEW, PREPARING, READY
  const newColumn = useMemo(
    () => orders.filter((o) => o.status === "pending" || o.status === "confirmed"),
    [orders]
  );
  const prepColumn = useMemo(
    () => orders.filter((o) => o.status === "preparing"),
    [orders]
  );
  const readyColumn = useMemo(
    () => orders.filter((o) => o.status === "ready"),
    [orders]
  );

  const getElapsed = (iso: string) => {
    const elapsedSec = Math.max(0, Math.floor((nowTick - new Date(iso).getTime()) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#17142B] text-white flex flex-col font-sans select-none antialiased">
      {/* Top Operational Header */}
      <header className="h-16 px-4 sm:px-6 bg-[#211E38] border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <QrSliceLogo size="sm" inverted />
          <div className="border-l border-white/10 pl-4 hidden sm:block">
            <div className="font-extrabold text-sm text-white">{restaurantName}</div>
            <div className="text-[11px] text-[#B9B6C8] font-mono">
              KITCHEN OS · ACTIVE EXPEDITOR
            </div>
          </div>
        </div>

        {/* Action Controls & Sound Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-[#5738F5] text-white"
                : "bg-white/10 text-[#B9B6C8] hover:text-white"
            }`}
          >
            <span>{soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF"}</span>
          </button>

          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer hidden md:flex items-center gap-1.5 ${
              voiceEnabled
                ? "bg-emerald-600 text-white"
                : "bg-white/10 text-[#B9B6C8] hover:text-white"
            }`}
          >
            <span>{voiceEnabled ? "🎙️ Voice: ON" : "🎙️ Voice: OFF"}</span>
          </button>

          <Link
            href="/admin"
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
          >
            ← Admin
          </Link>
        </div>
      </header>

      {/* Demo Notice if active */}
      {isDemo && (
        <div className="bg-[#5738F5]/30 border-b border-[#5738F5]/40 px-4 py-1.5 text-center text-xs text-[#EEEAFE]">
          Displaying realistic sample kitchen queue. When new customer orders arrive via QR, they appear here live.
        </div>
      )}

      {/* 3-COLUMN KANBAN BOARD */}
      <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* COLUMN 1: NEW */}
        <div className="flex flex-col bg-[#211E38]/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-[#5738F5] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider font-mono">NEW INCOMING</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-[#5738F5] font-mono font-black text-xs">
              {newColumn.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {newColumn.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#B9B6C8] text-xs">
                <span className="text-2xl mb-1">✨</span>
                <span>No new incoming tickets</span>
              </div>
            ) : (
              newColumn.map((order) => {
                const items = order.order_items || order.items || [];
                const tbl = order.table?.label || order.table_label || "01";
                const elapsed = getElapsed(order.created_at);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-[#17142B] border-2 border-[#5738F5]/40 shadow-lg space-y-4"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div
                          className="font-mono font-black text-lg text-white tracking-tight"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          ORDER #{order.order_number}
                        </div>
                        <div
                          className="text-xs font-mono font-black text-[#5738F5] bg-[#EEEAFE] px-2 py-0.5 rounded-md inline-block mt-1"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          TABLE {tbl.padStart(2, "0")}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-amber-400 text-sm">{elapsed}</div>
                        <span className="text-[10px] uppercase font-bold text-[#B9B6C8]">
                          {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 border-t border-b border-white/10 py-3">
                      {items.map((it, idx) => (
                        <div key={idx} className="text-sm font-bold text-white">
                          <div className="flex justify-between">
                            <span>{it.item_name}</span>
                            <span className="text-[#5738F5] font-mono text-base">×{it.quantity}</span>
                          </div>
                          {(it.spice_level || it.size_variant) && (
                            <div className="text-xs text-[#B9B6C8] font-normal">
                              {it.size_variant ? `Variant: ${it.size_variant} ` : ""}
                              {it.spice_level ? `(${it.spice_level})` : ""}
                            </div>
                          )}
                          {it.notes && (
                            <div className="text-xs text-amber-300 font-normal bg-amber-500/10 p-1.5 rounded-lg mt-1">
                              ⚠ {it.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "preparing", order.order_number, tbl)}
                      className="w-full min-h-[48px] rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#5738F5]/30 cursor-pointer active:scale-98 transition-all"
                    >
                      Start Preparing 🔥
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: PREPARING */}
        <div className="flex flex-col bg-[#211E38]/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-amber-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider font-mono">PREPARING (COOKING)</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-amber-700 font-mono font-black text-xs">
              {prepColumn.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {prepColumn.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#B9B6C8] text-xs">
                <span>Nothing currently on the cooking line</span>
              </div>
            ) : (
              prepColumn.map((order) => {
                const items = order.order_items || order.items || [];
                const tbl = order.table?.label || order.table_label || "01";
                const elapsed = getElapsed(order.created_at);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-[#17142B] border-2 border-amber-500/50 shadow-lg space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div
                          className="font-mono font-black text-lg text-white"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          ORDER #{order.order_number}
                        </div>
                        <div
                          className="text-xs font-mono font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md inline-block mt-1"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          TABLE {tbl.padStart(2, "0")}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-amber-400 text-sm">{elapsed}</div>
                        <span className="text-[10px] uppercase font-bold text-[#B9B6C8]">
                          {items.length} {items.length === 1 ? "ITEM" : "ITEMS"}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 border-t border-b border-white/10 py-3">
                      {items.map((it, idx) => (
                        <div key={idx} className="text-sm font-bold text-white">
                          <div className="flex justify-between">
                            <span>{it.item_name}</span>
                            <span className="text-amber-400 font-mono text-base">×{it.quantity}</span>
                          </div>
                          {it.notes && (
                            <div className="text-xs text-amber-300 font-normal bg-amber-500/10 p-1.5 rounded-lg mt-1">
                              ⚠ {it.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Mark Ready Button */}
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "ready", order.order_number, tbl)}
                      className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 cursor-pointer active:scale-98 transition-all"
                    >
                      Mark Ready 🔔
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 3: READY */}
        <div className="flex flex-col bg-[#211E38]/80 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
              <h2 className="text-sm font-black uppercase tracking-wider font-mono">READY TO SERVE</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 font-mono font-black text-xs">
              {readyColumn.length}
            </span>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {readyColumn.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center text-[#B9B6C8] text-xs">
                <span>All ready dishes have been served!</span>
              </div>
            ) : (
              readyColumn.map((order) => {
                const items = order.order_items || order.items || [];
                const tbl = order.table?.label || order.table_label || "01";
                const elapsed = getElapsed(order.created_at);

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-[#17142B] border-2 border-emerald-500/60 shadow-lg space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div
                          className="font-mono font-black text-lg text-white"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          ORDER #{order.order_number}
                        </div>
                        <div
                          className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md inline-block mt-1"
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          TABLE {tbl.padStart(2, "0")}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-400 text-sm">{elapsed}</div>
                        <span className="text-[10px] uppercase font-bold text-emerald-300">
                          CALL BELL ON 🔔
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="space-y-1.5 border-t border-b border-white/10 py-3 text-xs font-bold text-slate-300">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.item_name}</span>
                          <span className="text-emerald-400 font-mono">×{it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Serve and Clear */}
                    <button
                      type="button"
                      onClick={() => updateOrderStatus(order.id, "served", order.order_number, tbl)}
                      className="w-full min-h-[48px] rounded-xl bg-slate-100 hover:bg-white text-[#17142B] font-black text-sm uppercase tracking-wider shadow-lg cursor-pointer active:scale-98 transition-all"
                    >
                      Served & Clear Ticket ✓
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
