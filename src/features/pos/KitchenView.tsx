// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

/* KDS Light Theme tokens (spec):
   --kds-bg:#f1f5f9; --kds-surface:#ffffff; --kds-border:#e2e8f0;
   --kds-amber:#f59e0b; --kds-amber-text:#b45309; --kds-text:#0f172a;
   --kds-text-muted:#64748b; --kds-danger:#dc2626; --kds-success:#059669;
   Geist Sans + Geist Mono for numbers and ticket IDs. */

import { useState, useEffect, useRef, useMemo } from "react";
import { KitchenOrderCard } from "./KitchenOrderCard";
import { useAudioTone } from "@/hooks/useAudioTone";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useWakeLock } from "@/hooks/useWakeLock";
import { speakHumanVoice } from "@/lib/tts";
import type { Order, Restaurant } from "@/types";

interface KitchenViewProps {
  liveOrders: Order[];
  fetchLiveOrders: () => void;
  handleUpdateOrderStatus: (
    id: string,
    status: string,
    orderNumber: string,
    tableLabel: string
  ) => void;
  restaurant?: Restaurant;
}

const STATIONS = [
  { id: "all", label: "All Stations" },
  { id: "hot", label: "Hot Kitchen" },
  { id: "bar", label: "Bar & Drinks" },
  { id: "bakery", label: "Bakery & Desserts" },
  { id: "grill", label: "Grill & Tandoor" },
];

const ORDER_TYPES = [
  { id: "all", label: "All Types" },
  { id: "dine_in", label: "Dine-In" },
  { id: "takeaway", label: "Takeaway" },
  { id: "delivery", label: "Delivery" },
];

const MOBILE_TABS = [
  { status: "pending", label: "New" },
  { status: "confirmed", label: "Queue" },
  { status: "preparing", label: "Cooking" },
  { status: "ready", label: "Ready" },
];

const OVERDUE_MINS = 12;

export function KitchenView({
  liveOrders,
  fetchLiveOrders,
  handleUpdateOrderStatus,
  restaurant,
}: KitchenViewProps) {
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedOrderType, setSelectedOrderType] = useState("all");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [activeTab, setActiveTab] = useState<string>("pending");

  // Keep kitchen screens awake — tablets die mid-shift otherwise.
  useWakeLock(true);

  // Sound & Voice Alert state (persisted across reloads for wall tablets)
  const [soundMuted, setSoundMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("qrslice_kds_sound") === "muted";
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("qrslice_kds_voice") !== "off";
  });

  // Fresh-ticket tracking for the Awake indicator (green < 90s)
  const [lastTicketAt, setLastTicketAt] = useState(0);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Rush Priority State
  const [priorityMap, setPriorityMap] = useState<Record<string, boolean>>({});

  // Modals state
  const [showPrepSummary, setShowPrepSummary] = useState(false);
  const [showServedHistory, setShowServedHistory] = useState(false);

  // Fullscreen state for wall-mounted tablets
  const [isFullscreen, setIsFullscreen] = useState(false);

  const prevIds = useRef<Set<string>>(new Set());
  const { playAudioTone, playRushAlert } = useAudioTone();

  // Voice announcement helper (human tone engine)
  function announceVoice(text: string) {
    if (soundMuted || !voiceEnabled) return;
    speakHumanVoice(text);
  }

  function toggleSound() {
    setSoundMuted((m) => {
      const next = !m;
      try {
        if (next) localStorage.setItem("qrslice_kds_sound", "muted");
        else localStorage.removeItem("qrslice_kds_sound");
      } catch { /* storage unavailable */ }
      return next;
    });
  }

  function toggleVoice() {
    setVoiceEnabled((v) => {
      const next = !v;
      try {
        if (!next) localStorage.setItem("qrslice_kds_voice", "off");
        else localStorage.removeItem("qrslice_kds_voice");
      } catch { /* storage unavailable */ }
      return next;
    });
  }

  function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      } else {
        void document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch { /* fullscreen unsupported */ }
  }

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // 15s ticker so the Awake dot goes stale without new tickets
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  // Alert on new order arrival — Rush orders get tone + vibration.
  useEffect(() => {
    const fresh = liveOrders.filter((o) => !prevIds.current.has(o.id));
    prevIds.current = new Set(liveOrders.map((o) => o.id));
    if (fresh.length === 0) return;
    setLastTicketAt(Date.now());
    const rush = fresh.filter(
      (o) => (o as { priority?: boolean }).priority || priorityMap[o.id],
    );
    if (!soundMuted) {
      if (rush.length > 0) {
        playRushAlert();
      } else {
        playAudioTone("newOrder");
      }
    }
    announceVoice(
      rush.length > 0
        ? `Rush order arrived in kitchen queue`
        : "New order arrived in kitchen queue",
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOrders, playAudioTone, playRushAlert, soundMuted, priorityMap]);

  const togglePriority = (orderId: string) => {
    setPriorityMap((prev) => {
      const nextVal = !prev[orderId];
      if (nextVal) {
        announceVoice("High priority rush order flagged");
      }
      return { ...prev, [orderId]: nextVal };
    });
  };

  const handleServe = (id: string, status: string, orderNumber: string, tableLabel: string) => {
    handleUpdateOrderStatus(id, status, orderNumber, tableLabel);

    if (status === "ready") {
      announceVoice(`Table ${tableLabel} order number ${orderNumber} is ready to serve`);
    }
  };

  const recallOrder = (id: string, orderNumber: string, tableLabel: string) => {
    handleUpdateOrderStatus(id, "ready", orderNumber, tableLabel);
    announceVoice(`Ticket number ${orderNumber} recalled to queue`);
  };

  // Station & Order Type Filtering Logic
  const filteredOrders = useMemo(() => {
    return liveOrders.map((o) => ({
      ...o,
      priority: priorityMap[o.id] || false,
    })).filter((order) => {
      // 1. Order Type Filter
      if (selectedOrderType !== "all") {
        const type = (order as any).order_type || (order.table_label ? "dine_in" : "takeaway");
        if (type !== selectedOrderType) return false;
      }

      // 2. Station Filter
      if (selectedStation === "all") return true;
      if (!order.items || order.items.length === 0) return true;
      return order.items.some((it) => {
        const name = (it.item_name || "").toLowerCase();
        if (selectedStation === "bar")
          return (
            name.includes("chai") ||
            name.includes("coffee") ||
            name.includes("drink") ||
            name.includes("juice") ||
            name.includes("shake")
          );
        if (selectedStation === "bakery")
          return (
            name.includes("cake") ||
            name.includes("pastry") ||
            name.includes("brownie") ||
            name.includes("cookie") ||
            name.includes("muffin")
          );
        if (selectedStation === "grill")
          return (
            name.includes("tikka") ||
            name.includes("kebab") ||
            name.includes("grill") ||
            name.includes("tandoor") ||
            name.includes("paneer")
          );
        return true;
      });
    });
  }, [liveOrders, selectedOrderType, selectedStation, priorityMap]);

  // Aggregate item quantities across all active (non-served) kitchen tickets for Prep Batching Summary
  const prepSummary = useMemo(() => {
    const activeOrders = filteredOrders.filter((o) => o.status !== "served" && o.status !== "cancelled");
    const summary: Record<string, { name: string; quantity: number; notes: string[] }> = {};

    activeOrders.forEach((ord) => {
      (ord.items || []).forEach((it) => {
        const name = it.item_name || "Custom Item";
        if (!summary[name]) {
          summary[name] = { name, quantity: 0, notes: [] };
        }
        summary[name].quantity += it.quantity;
        if (it.notes && !summary[name].notes.includes(it.notes)) {
          summary[name].notes.push(it.notes);
        }
      });
    });

    return Object.values(summary).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  // Live performance metrics
  const cookingCount = filteredOrders.filter((o) => o.status === "preparing").length;
  const servedCount = liveOrders.filter((o) => o.status === "served").length;

  const overdueCount = useMemo(() => {
    return filteredOrders.filter((o) => {
      if (o.status === "served" || !o.created_at) return false;
      const mins = (Date.now() - new Date(o.created_at).getTime()) / 60000;
      return mins >= OVERDUE_MINS;
    }).length;
  }, [filteredOrders]);

  const awakeFresh = lastTicketAt > 0 && nowTick - lastTicketAt < 90000;

  const columns = [
    {
      status: "pending",
      title: "1. New Tickets",
      accent: "border-t-amber-500",
      badge: "border-amber-400 bg-amber-100 text-amber-900",
      nextLabel: "Accept",
      nextStatus: "confirmed",
    },
    {
      status: "confirmed",
      title: "2. In Queue",
      accent: "border-t-slate-400",
      badge: "border-slate-300 bg-slate-100 text-slate-700",
      nextLabel: "Start Prep",
      nextStatus: "preparing",
    },
    {
      status: "preparing",
      title: "3. Cooking Line",
      accent: "border-t-orange-500",
      badge: "border-orange-300 bg-orange-100 text-orange-900",
      nextLabel: "Mark Ready",
      nextStatus: "ready",
    },
    {
      status: "ready",
      title: "4. Ready to Serve",
      accent: "border-t-emerald-500",
      badge: "border-emerald-300 bg-emerald-100 text-emerald-900",
      nextLabel: "Bump ✓ Served",
      nextStatus: "served",
    },
  ];

  const controlBtn =
    "px-3 h-11 min-h-[44px] rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden no-print antialiased bg-[#F5F5F7] text-slate-900">
      {/* 1. Global Chrome — 56px top bar */}
      <header className="h-14 shrink-0 bg-white/80 backdrop-blur-xl border-b border-black/[0.06] px-3 sm:px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-[#007AFF] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            Q
          </span>
          <span className="font-bold text-sm tracking-tight truncate">
            {restaurant?.name || "WAH JI WAH"} <span className="text-slate-400 font-medium">· Kitchen KDS</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono font-semibold text-slate-700 whitespace-nowrap">
          <span className="px-2 py-0.5 rounded-lg bg-[#FF9500]/10 text-[#FF9500] font-bold">{cookingCount} Cooking</span>
          <span className="text-slate-300">·</span>
          <span>{servedCount} Served Today</span>
          <span className="text-slate-300">·</span>
          <span>Batch {prepSummary.length}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={toggleSound} title="Toggle sound alerts"
            className={`${controlBtn} ${soundMuted ? "bg-black/[0.04] text-slate-500 border-transparent" : "bg-white text-slate-700 border-black/[0.08] hover:bg-slate-50"}`}>
            <span>{soundMuted ? "🔇 Muted" : "🔔 Sound On"}</span>
          </button>
          <span title={awakeFresh ? "Ticket received in the last 90 seconds" : "No recent tickets"}
            className={`px-3 h-10 min-h-[40px] rounded-xl border text-xs font-semibold hidden sm:flex items-center gap-1.5 ${
              awakeFresh ? "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20" : "bg-black/[0.04] text-slate-500 border-transparent"
            }`}>
            <span className={`w-2 h-2 rounded-full ${awakeFresh ? "bg-[#34C759] animate-pulse" : "bg-slate-400"}`} />
            <span>Awake</span>
          </span>
          <button type="button" onClick={toggleVoice} title="Toggle voice announcements"
            className={`${controlBtn} ${voiceEnabled ? "bg-white text-slate-700 border-black/[0.08] hover:bg-slate-50" : "bg-black/[0.04] text-slate-500 border-transparent"}`}>
            <span>Voice</span>
          </button>
          <button type="button" onClick={fetchLiveOrders} title="Refresh queue now"
            className={`${controlBtn} bg-white text-slate-700 border-black/[0.08] hover:bg-slate-50`}>
            <span>Sync</span>
          </button>
          <button type="button" onClick={() => setShowPrepSummary(true)} title="Prep batch summary"
            className={`${controlBtn} bg-[#FF9500] hover:bg-[#FF9500]/90 text-white border-transparent shadow-xs`}>
            <span>Prep</span>
          </button>
          <button type="button" onClick={() => setShowServedHistory(true)} title="Served ticket history"
            className={`${controlBtn} bg-white text-slate-700 border-black/[0.08] hover:bg-slate-50 hidden sm:flex`}>
            <span>History</span>
          </button>
          <button type="button" onClick={toggleFullscreen} title="Toggle fullscreen"
            className={`${controlBtn} bg-white text-slate-700 border-black/[0.08] hover:bg-slate-50`}>
            <span>{isFullscreen ? "⛶ Exit" : "⛶ Full"}</span>
          </button>
        </div>
      </header>

      {/* 2. Station & Order-Type Filter Bar — 48px */}
      <div className="h-12 shrink-0 bg-white/60 backdrop-blur-md border-b border-black/[0.06] px-3 sm:px-4 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 shrink-0 bg-black/[0.04] p-1 rounded-xl" role="group" aria-label="Kitchen stations">
          {STATIONS.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStation(st.id)}
              aria-pressed={selectedStation === st.id}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedStation === st.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
        <div className="w-px h-5 bg-black/[0.08] shrink-0" />
        <div className="flex items-center gap-1 shrink-0 bg-black/[0.04] p-1 rounded-xl" role="group" aria-label="Order types">
          {ORDER_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedOrderType(t.id)}
              aria-pressed={selectedOrderType === t.id}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedOrderType === t.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {overdueCount > 0 && (
          <span className="ml-auto shrink-0 px-2.5 py-1 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/20 text-[#FF3B30] text-xs font-bold animate-pulse">
            🚨 {overdueCount} Overdue
          </span>
        )}
      </div>

      {/* 3. Main Kanban Board (desktop) */}
      {isDesktop && (
      <div className="flex-1 min-h-0 overflow-x-auto grid grid-cols-4 gap-3 p-3">
        {columns.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className={`bg-white border border-[#e2e8f0] border-t-4 ${col.accent} rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm`}
              aria-label={col.title}
            >
              <header className="sticky top-0 z-10 bg-white px-3.5 py-2.5 border-b border-[#e2e8f0] flex items-center justify-between shrink-0">
                <h2 className="font-extrabold text-[13px] text-[#0f172a] tracking-tight">{col.title}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-black border ${col.badge}`}>
                  {colOrders.length}
                </span>
              </header>

              <div className="flex-1 overflow-y-auto space-y-2.5 p-2.5">
                {colOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    nextStatus={col.nextStatus}
                    nextLabel={col.nextLabel}
                    onUpdateStatus={handleServe}
                    onTogglePriority={togglePriority}
                  />
                ))}

                {colOrders.length === 0 && (
                  <p className="py-10 text-center text-xs text-slate-400 font-medium">
                    No tickets
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      )}

      {/* Mobile single-column list + bottom nav */}
      {!isDesktop && (
      <>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 p-3 pb-28">
          {(() => {
            const activeCol = columns.find((c) => c.status === activeTab) ?? columns[0];
            const tabOrders = filteredOrders.filter((o) => o.status === activeCol.status);
            if (tabOrders.length === 0) {
              return (
                <p className="py-16 text-center text-xs text-slate-400 font-medium">
                  No tickets
                </p>
              );
            }
            return tabOrders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                nextStatus={activeCol.nextStatus}
                nextLabel={activeCol.nextLabel}
                onUpdateStatus={handleServe}
                onTogglePriority={togglePriority}
              />
            ));
          })()}
        </div>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e2e8f0] pb-[env(safe-area-inset-bottom)]" aria-label="Kitchen columns">
          <div className="grid grid-cols-4">
            {MOBILE_TABS.map((tab) => {
              const count = filteredOrders.filter((o) => o.status === tab.status).length;
              const isActive = activeTab === tab.status;
              return (
                <button
                  key={tab.status}
                  type="button"
                  onClick={() => setActiveTab(tab.status)}
                  aria-pressed={isActive}
                  className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold cursor-pointer transition-colors ${
                    isActive ? "text-amber-600" : "text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.label}
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                        isActive
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                  <span className={`h-0.5 w-8 rounded-full ${isActive ? "bg-amber-500" : "bg-transparent"}`} />
                </button>
              );
            })}
          </div>
        </nav>
      </>
      )}

      {/* 5. Prep Batch Summary Panel */}
      {showPrepSummary && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPrepSummary(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3 shadow-2xl border border-[#e2e8f0] animate-fade-in-up text-[#0f172a] relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Prep batch summary"
          >
            <button
              type="button"
              onClick={() => setShowPrepSummary(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">
                Prep Batch — Live
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Sorted by quantity · updates instantly on status change
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[160px]">
              {prepSummary.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-xs">
                  No tickets
                </p>
              ) : (
                prepSummary.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-between gap-3"
                  >
                    <span className="font-bold text-sm text-[#0f172a] truncate">
                      {item.name}
                    </span>
                    <span className="font-mono font-black text-sm text-[#0f172a] shrink-0">
                      {item.quantity}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Served Tickets History Modal */}
      {showServedHistory && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowServedHistory(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-5 space-y-3 shadow-2xl border border-[#e2e8f0] animate-fade-in-up text-[#0f172a] relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Served ticket history"
          >
            <button
              type="button"
              onClick={() => setShowServedHistory(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div>
              <h3 className="text-base font-extrabold text-[#0f172a]">
                Served History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Completed today — recall any ticket bumped by mistake.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {liveOrders.filter((o) => o.status === "served").length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-xs">
                  No tickets
                </p>
              ) : (
                liveOrders
                  .filter((o) => o.status === "served")
                  .map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 bg-slate-50 border border-[#e2e8f0] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          Table {ord.table_label || "Takeaway"} • Order #{ord.order_number}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {(ord.items || []).map((i) => `${i.item_name} ×${i.quantity}`).join(", ")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          recallOrder(ord.id, String(ord.order_number), String(ord.table_label || "Takeaway"));
                          setShowServedHistory(false);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer transition-all active:scale-95 shrink-0"
                      >
                        ↩ Recall
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

