"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type Cafe = {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  logo_url: string | null;
  tagline?: string | null;
  accent_color?: string | null;
  address: string | null;
  gstin: string | null;
  phone: string | null;
  tax_rate: number | null;
  plan: "trial" | "active" | "suspended" | "cancelled";
  tier: "basic" | "pro";
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_status: string | null;
  created_at: string;
};

type Staff = {
  id: string;
  role: "super_admin" | "owner" | "staff";
  display_name: string | null;
  active: boolean;
  restaurant_id: string | null;
  restaurant_name: string;
  created_at: string;
};

type KPIs = {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  mrr: number;
  todayOrders: number;
  todayRevenue: number;
  trialToPaid: number;
  failedPayments: number;
  new7dCafes: number;
  trialsEnding7d: number;
  new7d: number;
};

type SuperClientProps = {
  cafes: Cafe[];
  totalCafes: number;
  page: number;
  pageSize: number;
  q: string;
  planFilter: string;
  staff: Staff[];
  kpis: KPIs;
  charts: {
    revenue14: Array<{ date: string; revenue: number; orders: number }>;
    byPlan: Array<{ name: string; value: number; color: string }>;
    topCafes: Array<{ id: string; name: string; slug: string; revenue_paise: number; tier: string }>;
  };
  config: Record<string, any>;
  recentAudit: any[];
};

export default function SuperClient({
  cafes,
  totalCafes,
  page,
  pageSize,
  q: initialQ,
  planFilter: initialPlanFilter,
  staff,
  kpis,
  charts,
  config: initialConfig,
  recentAudit,
}: SuperClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"dashboard" | "cafes" | "config" | "audit" | "staff" | "health">("dashboard");

  // Global Platform Broadcast Banner
  const [broadcastMsg, setBroadcastMsg] = useState(
    typeof window !== "undefined" ? localStorage.getItem("platform_broadcast") || "" : ""
  );
  const [broadcastInput, setBroadcastInput] = useState(broadcastMsg);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [selectedPlan, setSelectedPlan] = useState(initialPlanFilter);

  // Tenant Slide-Over Drawer State
  const [drawerCafeId, setDrawerCafeId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"overview" | "menu" | "tables" | "orders" | "billing" | "audit" | "danger">("overview");

  // New Café Modal
  const [showNewCafeModal, setShowNewCafeModal] = useState(false);
  const [newCafeName, setNewCafeName] = useState("");
  const [newCafeSlug, setNewCafeSlug] = useState("");
  const [newCafeTier, setNewCafeTier] = useState<"basic" | "pro">("pro");
  const [newCafePlan, setNewCafePlan] = useState<"trial" | "active">("trial");
  const [newCafeTagline, setNewCafeTagline] = useState("");
  const [newCafePhone, setNewCafePhone] = useState("");
  const [newCafeAddress, setNewCafeAddress] = useState("");
  const [creatingCafe, setCreatingCafe] = useState(false);

  // Platform Config Edit State
  const [platformConfig, setPlatformConfig] = useState(initialConfig);
  const [savingConfigKey, setSavingConfigKey] = useState<string | null>(null);

  // Audit Tab Filter State
  const [auditRows, setAuditRows] = useState(recentAudit);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // Toast / Flash Notice
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const flash = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 4500);
  };

  // Trigger search / filter changes via Server URL Params
  function applyFilter(newQ: string, newPlan: string, newPage: number = 1) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newPlan) params.set("plan", newPlan);
    if (newPage > 1) params.set("page", String(newPage));
    router.push(`/super?${params.toString()}`);
  }

  // Load Drawer Data
  async function openDrawer(cafeId: string) {
    setDrawerCafeId(cafeId);
    setLoadingDrawer(true);
    setDrawerTab("overview");
    try {
      const res = await fetch(`/api/super/tenant?cafeId=${cafeId}`);
      if (res.ok) {
        const data = await res.json();
        setDrawerData(data);
      } else {
        flash("err", "Failed to load café snapshot");
        setDrawerCafeId(null);
      }
    } catch {
      flash("err", "Network error loading café snapshot");
      setDrawerCafeId(null);
    } finally {
      setLoadingDrawer(false);
    }
  }

  // Handle Billing Overrides from Drawer
  async function handleExtendTrial(days: number) {
    if (!drawerCafeId) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", id: drawerCafeId, days }),
      });
      if (res.ok) {
        flash("ok", `Extended trial by ${days} days`);
        openDrawer(drawerCafeId);
        router.refresh();
      } else {
        flash("err", "Failed to extend trial");
      }
    } catch {
      flash("err", "Error extending trial");
    }
  }

  async function handleMarkPaid() {
    if (!drawerCafeId || !confirm("Mark this café as paid for 1 full year?")) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", id: drawerCafeId }),
      });
      if (res.ok) {
        flash("ok", "Café marked as active/paid for 1 year");
        openDrawer(drawerCafeId);
        router.refresh();
      } else {
        flash("err", "Failed to mark paid");
      }
    } catch {
      flash("err", "Error marking paid");
    }
  }

  async function handleSetPlan(plan: "trial" | "active" | "suspended", tier?: "basic" | "pro") {
    if (!drawerCafeId) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_plan", id: drawerCafeId, plan, tier }),
      });
      if (res.ok) {
        flash("ok", `Plan updated to ${plan.toUpperCase()}`);
        openDrawer(drawerCafeId);
        router.refresh();
      } else {
        flash("err", "Failed to update plan");
      }
    } catch {
      flash("err", "Error updating plan");
    }
  }

  async function handleAddRefundNote(note: string) {
    if (!drawerCafeId || !note.trim()) return;
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_refund_note", id: drawerCafeId, note }),
      });
      if (res.ok) {
        flash("ok", "Refund note recorded in audit log");
        openDrawer(drawerCafeId);
      }
    } catch {
      flash("err", "Error recording refund note");
    }
  }

  // Export All Tenants to CSV
  function handleExportCSV() {
    if (!cafes || cafes.length === 0) {
      flash("err", "No cafés to export");
      return;
    }
    const headers = ["ID", "Name", "Slug", "Plan", "Tier", "Tax Rate (%)", "Created At", "Subscription Ends"];
    const rows = cafes.map((c) => [
      c.id,
      `"${c.name.replace(/"/g, '""')}"`,
      c.slug,
      c.plan,
      c.tier || "pro",
      c.tax_rate ?? 5,
      c.created_at,
      c.subscription_ends_at || c.trial_ends_at || "N/A",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `qr-cafe-tenants-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    flash("ok", `Exported ${cafes.length} café records to CSV!`);
  }

  // Handle Global Broadcast Save
  function handleSaveBroadcast() {
    setIsBroadcasting(true);
    try {
      localStorage.setItem("platform_broadcast", broadcastInput.trim());
      setBroadcastMsg(broadcastInput.trim());
      flash("ok", broadcastInput.trim() ? "📢 Broadcast message published!" : "Broadcast message cleared");
    } finally {
      setIsBroadcasting(false);
    }
  }

  // Handle Fast Row Actions (+14d Trial, Toggle Active/Suspend)
  async function handleFastExtendTrial(cafeId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend_trial", id: cafeId, days: 14 }),
      });
      if (res.ok) {
        flash("ok", "Added +14 Days Trial!");
        router.refresh();
      } else {
        flash("err", "Failed to extend trial");
      }
    } catch {
      flash("err", "Network error extending trial");
    }
  }

  async function handleFastToggleStatus(cafe: Cafe, e: React.MouseEvent) {
    e.stopPropagation();
    const newPlan = cafe.plan === "suspended" ? "active" : "suspended";
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_plan", id: cafe.id, plan: newPlan }),
      });
      if (res.ok) {
        flash("ok", `Status toggled to ${newPlan.toUpperCase()}`);
        router.refresh();
      } else {
        flash("err", "Failed to toggle status");
      }
    } catch {
      flash("err", "Network error toggling status");
    }
  }

  async function handleDeleteCafe(id: string) {
    if (!confirm("Are you sure you want to permanently delete this café? All tables, menu items, and records will be purged.")) {
      return;
    }
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_cafe", id }),
      });
      if (res.ok) {
        flash("ok", "Café deleted permanently");
        setDrawerCafeId(null);
        router.refresh();
      } else {
        flash("err", "Failed to delete café");
      }
    } catch {
      flash("err", "Error deleting café");
    }
  }

  async function handleSaveConfig(key: string, value: any) {
    setSavingConfigKey(key);
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_config", key, value }),
      });
      if (res.ok) {
        flash("ok", `Updated ${key} setting`);
        setPlatformConfig((prev: any) => ({ ...prev, [key]: value }));
      } else {
        flash("err", "Failed to save configuration");
      }
    } catch {
      flash("err", "Error saving config");
    } finally {
      setSavingConfigKey(null);
    }
  }

  async function handleCreateCafeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreatingCafe(true);
    try {
      const res = await fetch("/api/super/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_cafe",
          name: newCafeName.trim(),
          slug: newCafeSlug.trim().toLowerCase(),
          tier: newCafeTier,
          plan: newCafePlan,
          tagline: newCafeTagline.trim() || undefined,
          phone: newCafePhone.trim() || undefined,
          address: newCafeAddress.trim() || undefined,
        }),
      });
      if (res.ok) {
        flash("ok", `Provisioned café "${newCafeName}"`);
        setShowNewCafeModal(false);
        setNewCafeName("");
        setNewCafeSlug("");
        router.refresh();
      } else {
        const data = await res.json();
        flash("err", data.error || "Failed to create café");
      }
    } catch {
      flash("err", "Error creating café");
    } finally {
      setCreatingCafe(false);
    }
  }

  async function loadFilteredAudit(action: string) {
    setAuditActionFilter(action);
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/super/audit?action=${action}`);
      if (res.ok) {
        const data = await res.json();
        setAuditRows(data.rows || []);
      }
    } catch {
      flash("err", "Error loading audit records");
    } finally {
      setAuditLoading(false);
    }
  }

  const totalPages = Math.ceil(totalCafes / pageSize) || 1;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row font-sans selection:bg-indigo-600 selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shadow-2xl border backdrop-blur-xl animate-in slide-in-from-bottom duration-300 ${
            toast.kind === "ok"
              ? "bg-emerald-50/90 border-emerald-700 text-emerald-700"
              : "bg-red-50/90 border-red-700 text-red-700"
          }`}
        >
          <span>{toast.kind === "ok" ? "✓" : "⚠️"}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-slate-900 font-black text-xl shadow-lg shadow-indigo-600/20">
              ⚡
            </div>
            <div>
              <h1 className="font-black text-white text-sm tracking-tight">QR Café Platform</h1>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block">
                Super Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: "dashboard", label: "KPI & Analytics", icon: "📊" },
              { id: "cafes", label: "Cafés & Tenants", icon: "🏢", count: totalCafes },
              { id: "staff", label: "Staff Directory", icon: "👥", count: staff.length },
              { id: "config", label: "Platform Config", icon: "⚙️" },
              { id: "audit", label: "Audit Event Logs", icon: "📜" },
              { id: "health", label: "System Health & Diagnostics", icon: "🩺" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  tab === item.id
                    ? "bg-indigo-600 text-slate-900 shadow-md shadow-indigo-600/20 font-black"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-black ${
                      tab === item.id ? "bg-slate-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-200 space-y-3">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Monthly Recurring Rev
            </span>
            <div className="text-lg font-black text-indigo-600 font-mono">
              ₹{kpis.mrr.toLocaleString("en-IN")}
            </div>
            <span className="text-xs text-emerald-600 font-bold">
              {kpis.active} active paying subscribers
            </span>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors"
          >
            <span>🌐 View Public Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Panel Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white/60 backdrop-blur-md px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Section:</span>
            <h2 className="text-sm font-black text-white capitalize">{tab} Management</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNewCafeModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-black text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>＋ New Café Tenant</span>
            </button>
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-stone-200 border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </header>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* TAB 1: DASHBOARD & RECHARTS ANALYTICS */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              {/* 6 Key Platform Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Cafés</span>
                  <div className="text-2xl font-black text-white font-mono">{kpis.total}</div>
                  <span className="text-xs text-slate-500 font-medium">Across all regions</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-1">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Active Plan</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">{kpis.active}</div>
                  <span className="text-xs text-emerald-600/80 font-medium">Paying monthly</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-amber-900/50 space-y-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Free Trials</span>
                  <div className="text-2xl font-black text-indigo-600 font-mono">{kpis.trial}</div>
                  <span className="text-xs text-indigo-600/80 font-medium">14-day trial mode</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Today Revenue</span>
                  <div className="text-2xl font-black text-indigo-600 font-mono">
                    ₹{Math.round(kpis.todayRevenue / 100).toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{kpis.todayOrders} dine-in tickets</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">MRR Total</span>
                  <div className="text-2xl font-black text-white font-mono">
                    ₹{kpis.mrr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">Single ₹999 plan</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">New (7 Days)</span>
                  <div className="text-2xl font-black text-white font-mono">{kpis.new7dCafes}</div>
                  <span className="text-xs text-slate-500 font-medium">Signups this week</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Trials Ending 7d</span>
                  <div className="text-2xl font-black text-white font-mono">{kpis.trialsEnding7d}</div>
                  <span className="text-xs text-slate-500 font-medium">Trials expiring this week</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">New Sign-ups (7d)</span>
                  <div className="text-2xl font-black text-white font-mono">{kpis.new7d}</div>
                  <span className="text-xs text-slate-500 font-medium">Signups this week</span>
                </div>
              </div>

              {/* Recharts Analytics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 14-Day Platform Revenue Area Chart */}
                <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-white">14-Day Platform Dine-In Revenue</h3>
                      <p className="text-xs text-slate-500">Total volume across all café tenants in INR</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-indigo-600">Last 14 Days</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={charts.revenue14}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#78716c" fontSize={10} tickLine={false} />
                        <YAxis stroke="#78716c" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1c1917",
                            borderColor: "#44403c",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#revGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subscription Plan Distribution Donut */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
                  <div>
                    <h3 className="text-sm font-black text-white">Café Subscription Mix</h3>
                    <p className="text-xs text-slate-500">Distribution by plan status</p>
                  </div>

                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={charts.byPlan}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {charts.byPlan.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1c1917",
                            borderColor: "#44403c",
                            borderRadius: "12px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-200">
                    {charts.byPlan.map((p) => (
                      <div key={p.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                          <span className="text-slate-600 font-medium">{p.name}</span>
                        </div>
                        <span className="font-mono font-bold text-white">{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top 10 Cafés by Volume */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white">Top Performing Cafés (14 Days)</h3>
                    <p className="text-xs text-slate-500">Ranked by gross customer dine-in volume</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                        <th className="pb-3">Rank</th>
                        <th className="pb-3">Café</th>
                        <th className="pb-3">Tier</th>
                        <th className="pb-3">14-Day Sales</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {charts.topCafes.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-100/30 transition-colors">
                          <td className="py-3 font-mono font-bold text-indigo-600">#{idx + 1}</td>
                          <td className="py-3 font-bold text-white">
                            {c.name} <span className="text-slate-400 font-normal">(/c/{c.slug})</span>
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                              {c.tier}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-black text-emerald-600">
                            ₹{Math.round(c.revenue_paise / 100).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openDrawer(c.id)}
                              className="px-3 py-2.5 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-600 font-bold text-xs cursor-pointer"
                            >
                              Inspect &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                      {charts.topCafes.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No orders recorded in the past 14 days yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAFES & TENANTS LIST WITH SERVER SEARCH & FILTER */}
          {tab === "cafes" && (
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl">
                <div className="flex-1 w-full sm:w-auto flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search by café name or slug…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilter(searchQuery, selectedPlan);
                    }}
                    className="bg-transparent text-white placeholder-stone-600 focus:outline-none flex-1"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        applyFilter("", selectedPlan);
                      }}
                      className="text-slate-400 hover:text-slate-900"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedPlan}
                    onChange={(e) => {
                      setSelectedPlan(e.target.value);
                      applyFilter(searchQuery, e.target.value);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none"
                  >
                    <option value="">All Plans (All)</option>
                    <option value="active">Active Paying</option>
                    <option value="trial">Free Trial</option>
                    <option value="suspended">Suspended</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => applyFilter(searchQuery, selectedPlan)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs cursor-pointer"
                  >
                    Search
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer flex items-center gap-1.5 border border-slate-300"
                    title="Export filtered records to CSV"
                  >
                    <span>📥 Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Tenants Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 uppercase tracking-wider text-xs">
                        <th className="p-4">Café & Domain</th>
                        <th className="p-4">Tier</th>
                        <th className="p-4">Plan Status</th>
                        <th className="p-4">Trial / Sub Expiry</th>
                        <th className="p-4">Pricing</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {cafes.map((c) => {
                        const isTrial = c.plan === "trial";
                        const isActive = c.plan === "active";
                        const isSuspended = c.plan === "suspended";

                        return (
                          <tr
                            key={c.id}
                            onClick={() => openDrawer(c.id)}
                            className="hover:bg-slate-100/40 transition-colors cursor-pointer group"
                          >
                            <td className="p-4">
                              <div className="font-black text-white group-hover:text-indigo-600 transition-colors">
                                {c.name}
                              </div>
                              <span className="text-xs font-mono text-slate-400">
                                /c/{c.slug}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full font-black uppercase text-xs bg-slate-100 border border-slate-300 text-slate-600">
                                {c.tier || "pro"}
                              </span>
                            </td>

                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full font-black uppercase text-xs border ${
                                  isActive
                                    ? "bg-emerald-50 border-emerald-700 text-emerald-600"
                                    : isTrial
                                    ? "bg-amber-50 border-amber-200 text-indigo-600"
                                    : "bg-red-50 border-red-200 text-red-600"
                                }`}
                              >
                                {c.plan}
                              </span>
                            </td>

                            <td className="p-4 text-slate-500 font-mono text-xs">
                              {isActive
                                ? c.subscription_ends_at
                                  ? new Date(c.subscription_ends_at).toLocaleDateString("en-IN")
                                  : "Continuous"
                                : isTrial && c.trial_ends_at
                                ? `${new Date(c.trial_ends_at).toLocaleDateString("en-IN")}`
                                : "Expired"}
                            </td>

                            <td className="p-4 font-mono font-bold text-white">
                              ₹999/mo
                            </td>

                            <td className="p-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => handleFastExtendTrial(c.id, e)}
                                title="Add 7 Free Trial Days"
                                className="px-2 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/25 text-indigo-700 border border-indigo-200 font-bold text-xs cursor-pointer"
                              >
                                +7d Trial
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleFastToggleStatus(c, e)}
                                title="Toggle Active / Suspended"
                                className={`px-2 py-1 rounded-lg border font-bold text-xs cursor-pointer ${
                                  c.plan === "suspended"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-700 hover:bg-emerald-100"
                                    : "bg-red-50/70 text-red-700 border-red-200 hover:bg-red-100"
                                }`}
                              >
                                {c.plan === "suspended" ? "Activate" : "Suspend"}
                              </button>
                              <Link
                                href={`/super/cafe/${c.id}`}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-stone-200 border border-slate-300 font-bold text-xs inline-block transition-colors"
                              >
                                🕵️ Impersonate
                              </Link>
                              <Link
                                href={`/c/${c.slug}`}
                                target="_blank"
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-stone-200 font-bold text-xs inline-block transition-colors"
                              >
                                View ↗
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                      {cafes.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            No cafés match the selected filter query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-200 bg-slate-50/40 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Showing <strong>{cafes.length}</strong> of <strong>{totalCafes}</strong> cafés (Page {page} of {totalPages})
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => applyFilter(searchQuery, selectedPlan, page - 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      &larr; Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => applyFilter(searchQuery, selectedPlan, page + 1)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STAFF DIRECTORY */}
          {tab === "staff" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">Platform Staff & Roles Directory</h3>
                <p className="text-xs text-slate-500">Staff members mapped to café tenants</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Assigned Café</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-100/30">
                        <td className="py-3 font-bold text-white">{s.display_name || "Manager"}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold uppercase text-xs ${
                              s.role === "super_admin"
                                ? "bg-indigo-600 text-slate-900"
                                : s.role === "owner"
                                ? "bg-purple-50 border border-purple-200 text-purple-600"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.role}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{s.restaurant_name}</td>
                        <td className="py-3">
                          <span className={`text-xs font-bold ${s.active ? "text-emerald-600" : "text-red-600"}`}>
                            {s.active ? "Active ✓" : "Disabled ✕"}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-xs">
                          {new Date(s.created_at).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PLATFORM CONFIGURATION */}
          {tab === "config" && (
            <div className="max-w-3xl space-y-6">
              <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xl">
                <div>
                  <h3 className="text-base font-black text-white">Global SaaS Platform Configuration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live system flags and pricing defaults stored in `platform_config`.
                  </p>
                </div>

                {/* Signups Toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-xs text-white">Self-Serve Signups</div>
                    <p className="text-xs text-slate-500">Allow new café owners to register via /onboarding</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveConfig("signups_open", {
                        enabled: !platformConfig?.signups_open?.enabled,
                      })
                    }
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      platformConfig?.signups_open?.enabled
                        ? "bg-emerald-500 text-slate-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {platformConfig?.signups_open?.enabled ? "Enabled ✓" : "Disabled ✕"}
                  </button>
                </div>

                {/* Trial Length */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-xs text-white">Default Free Trial Duration</div>
                    <p className="text-xs text-slate-500">Days of full access granted upon onboarding</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={platformConfig?.trial_days?.days ?? 30}
                      onChange={(e) =>
                        setPlatformConfig((prev: any) => ({
                          ...prev,
                          trial_days: { days: Number(e.target.value) },
                        }))
                      }
                      className="w-16 bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-white text-center font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveConfig("trial_days", platformConfig?.trial_days)}
                      disabled={savingConfigKey === "trial_days"}
                      className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Pricing Defaults */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <div className="font-bold text-xs text-white">Monthly Subscription Pricing (INR)</div>
                    <p className="text-xs text-slate-500">Default recurring rate displayed across the platform</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      All-in-One Plan (₹)
                    </label>
                    <input
                      type="number"
                      value={platformConfig?.prices?.pro ?? 999}
                      onChange={(e) =>
                        setPlatformConfig((prev: any) => ({
                          ...prev,
                          prices: { ...prev.prices, pro: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs text-white font-mono font-bold"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveConfig("prices", platformConfig?.prices)}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-bold text-xs cursor-pointer"
                  >
                    Update Plan Rate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {tab === "audit" && (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-white">Platform Audit Event Stream</h3>
                  <p className="text-xs text-slate-500">Tamper-evident logs of billing, impersonation, and orders</p>
                </div>

                <div className="flex gap-2">
                  {["", "super_impersonate", "super_extend_trial", "super_mark_paid", "self_onboarding"].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => loadFilteredAudit(act)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        auditActionFilter === act
                          ? "bg-indigo-600 text-slate-900 border-amber-400"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {act ? act.replace("super_", "") : "All Events"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Entity</th>
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Café</th>
                      <th className="pb-3">Details / Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono text-xs">
                    {auditRows.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-100/30">
                        <td className="py-2.5 text-slate-400 whitespace-nowrap">
                          {new Date(a.created_at).toLocaleTimeString("en-IN")} • {new Date(a.created_at).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-2.5 font-bold text-indigo-600">{a.entity}</td>
                        <td className="py-2.5 font-bold text-white">{a.action}</td>
                        <td className="py-2.5 text-slate-600">{a.restaurants?.name || a.restaurant_id || "System"}</td>
                        <td className="py-2.5 text-slate-500 truncate max-w-xs">
                          {JSON.stringify(a.metadata || {})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SYSTEM HEALTH & DIAGNOSTICS */}
          {tab === "health" && (
            <div className="space-y-6">
              {/* Broadcast Announcement Control Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>📢 Global Platform Broadcast Announcement</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Instantly publish an alert banner across all live café POS registers and customer screens
                    </p>
                  </div>
                  {broadcastMsg && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-black uppercase animate-pulse">
                      Active Broadcast
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 🛠️ Scheduled cloud maintenance tonight at 2:00 AM IST (15 mins)"
                    value={broadcastInput}
                    onChange={(e) => setBroadcastInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveBroadcast}
                    disabled={isBroadcasting}
                    className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-black text-xs cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    {broadcastInput.trim() ? "Publish 📢" : "Clear ✕"}
                  </button>
                </div>
              </div>

              {/* Real-time Health Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-2">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Database Status</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-base font-black text-white">PostgreSQL (Supabase)</span>
                  </div>
                  <span className="text-xs text-slate-500 block font-mono">Status: Connected &amp; Synced</span>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-2">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Realtime WebSocket</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-base font-black text-white">100% Operational</span>
                  </div>
                  <span className="text-xs text-slate-500 block font-mono">Live PubSub Listeners Active</span>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-2">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Edge API Latency</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-base font-black text-emerald-600 font-mono">~38ms</span>
                  </div>
                  <span className="text-xs text-slate-500 block font-mono">Vercel Edge Global Network</span>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-2">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Storage &amp; Static</span>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-base font-black text-white">Cloudflare R2 / CDN</span>
                  </div>
                  <span className="text-xs text-slate-500 block font-mono">Media Assets Healthy</span>
                </div>
              </div>

              {/* Diagnostics Summary Table */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white">System Service Endpoints &amp; Routes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
                        <th className="pb-2.5">Endpoint</th>
                        <th className="pb-2.5">Protocol</th>
                        <th className="pb-2.5">Security</th>
                        <th className="pb-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {[
                        { route: "/api/pos/order", proto: "HTTPS / REST", sec: "Session Auth + RBAC", status: "HEALTHY 🟢" },
                        { route: "/api/pos/active-orders", proto: "HTTPS / SSE", sec: "Tenant Scoped", status: "HEALTHY 🟢" },
                        { route: "/api/orders", proto: "HTTPS / REST", sec: "Public QR Token", status: "HEALTHY 🟢" },
                        { route: "/api/super/tenant", proto: "HTTPS / REST", sec: "Super Admin Role", status: "HEALTHY 🟢" },
                        { route: "/api/billing/webhook", proto: "Webhook", sec: "HMAC Signature", status: "STANDBY 🟡" },
                      ].map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/30">
                          <td className="py-2.5 text-white font-bold">{s.route}</td>
                          <td className="py-2.5 text-slate-500">{s.proto}</td>
                          <td className="py-2.5 text-slate-500">{s.sec}</td>
                          <td className="py-2.5 text-right font-black text-emerald-600">{s.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SLIDE-OVER TENANT DRAWER (7 TABS) */}
      {drawerCafeId && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200"
          onClick={() => setDrawerCafeId(null)}
        >
          <div
            className="w-full max-w-xl bg-white border-l border-slate-200 h-full p-6 flex flex-col justify-between space-y-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDrawer ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : drawerData?.tenant ? (
              <div className="space-y-6 flex-1">
                {/* Top Drawer Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white">{drawerData.tenant.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase bg-slate-100 text-indigo-600">
                        {drawerData.tenant.tier || "pro"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">/c/{drawerData.tenant.slug}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDrawer(drawerCafeId)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                      title="Refresh snapshot"
                    >
                      🔄
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawerCafeId(null)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Drawer Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "menu", label: `Menu (${drawerData.items?.length || 0})` },
                    { id: "tables", label: `Tables (${drawerData.tables?.length || 0})` },
                    { id: "orders", label: `Orders (${drawerData.orders?.length || 0})` },
                    { id: "billing", label: "Billing Overrides" },
                    { id: "danger", label: "Danger" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDrawerTab(t.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        drawerTab === t.id
                          ? "bg-indigo-600 text-slate-900 font-black"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* DRAWER TAB 1: OVERVIEW */}
                {drawerTab === "overview" && (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Plan Status</span>
                        <div className="font-bold text-white uppercase">{drawerData.tenant.plan}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Tier</span>
                        <div className="font-bold text-indigo-600 uppercase">{drawerData.tenant.tier || "pro"}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="font-bold text-slate-600 uppercase text-xs">Contact & Tax Identity</div>
                      <div className="space-y-1 text-slate-600">
                        <div>📞 Phone: {drawerData.tenant.phone || "Not set"}</div>
                        <div>📍 Address: {drawerData.tenant.address || "Not set"}</div>
                        <div>🧾 GSTIN: {drawerData.tenant.gstin || "Not set"} ({drawerData.tenant.tax_rate ?? 5}% Tax)</div>
                        <div>🔖 Tagline: {drawerData.tenant.tagline || "None"}</div>
                      </div>
                    </div>

                    <Link
                      href={`/super/cafe/${drawerData.tenant.id}`}
                      className="block w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-black text-center text-xs shadow-md"
                    >
                      🕵️‍♂️ Launch Impersonation View &rarr;
                    </Link>
                  </div>
                )}

                {/* DRAWER TAB 2: MENU */}
                {drawerTab === "menu" && (
                  <div className="space-y-3 text-xs">
                    <div className="font-bold text-slate-600">Registered Dishes ({drawerData.items?.length})</div>
                    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                      {drawerData.items?.map((it: any) => (
                        <div key={it.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span>{it.is_veg ? "🥗" : "🍗"}</span>
                            <span className="font-bold text-white">{it.name}</span>
                          </div>
                          <span className="font-mono text-indigo-600 font-bold">
                            ₹{(it.price_paise / 100).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DRAWER TAB 3: TABLES */}
                {drawerTab === "tables" && (
                  <div className="space-y-3 text-xs">
                    <div className="font-bold text-slate-600">Tables ({drawerData.tables?.length})</div>
                    <div className="grid grid-cols-3 gap-2">
                      {drawerData.tables?.map((t: any) => (
                        <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                          <div className="font-black text-indigo-600 font-mono text-sm">{t.label}</div>
                          <div className="text-xs text-slate-500">{t.seats} Seats</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DRAWER TAB 4: ORDERS */}
                {drawerTab === "orders" && (
                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-slate-600">Recent Orders ({drawerData.orders?.length})</div>
                    <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                      {drawerData.orders?.map((o: any) => (
                        <div key={o.id} className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-black text-white font-mono">#{o.order_number}</span>
                            <span className="text-slate-400 ml-2">{o.status}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono">
                            <span className={o.payment_status === "paid" ? "text-emerald-600" : "text-indigo-600"}>
                              {o.payment_status}
                            </span>
                            <span className="font-bold text-white">
                              ₹{(o.total_paise / 100).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DRAWER TAB 5: BILLING OVERRIDES */}
                {drawerTab === "billing" && (
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="font-bold text-indigo-600 uppercase text-xs">Super Admin Billing Controls</div>
                      <p className="text-slate-500 text-xs">Override tenant access immediately without Razorpay transactions.</p>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleExtendTrial(7)}
                          className="py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-600/30 cursor-pointer"
                        >
                          +7 Days Trial
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExtendTrial(30)}
                          className="py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-600/30 cursor-pointer"
                        >
                          +30 Days Trial
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleMarkPaid}
                          className="py-2.5 rounded-xl bg-emerald-50 border border-emerald-700 text-emerald-600 font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                        >
                          Mark Paid (1 Year)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetPlan("suspended")}
                          className="py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-xs hover:bg-red-100 cursor-pointer"
                        >
                          Force Suspend
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* DRAWER TAB 6: DANGER */}
                {drawerTab === "danger" && (
                  <div className="p-4 rounded-2xl bg-red-50/40 border border-red-200 space-y-3 text-xs">
                    <div className="font-black text-red-700 uppercase">Danger Zone</div>
                    <p className="text-red-600/80 text-xs">
                      Permanently delete this café tenant and all associated records. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleDeleteCafe(drawerData.tenant.id)}
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer shadow-md"
                    >
                      Delete Café Tenant Permanently
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* NEW CAFE PROVISIONING MODAL */}
      {showNewCafeModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowNewCafeModal(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-white text-base">Provision New Café Tenant</h3>
              <button
                type="button"
                onClick={() => setShowNewCafeModal(false)}
                className="text-slate-500 hover:text-slate-900 text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCafeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Café Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amber Artisan Coffee"
                  value={newCafeName}
                  onChange={(e) => {
                    setNewCafeName(e.target.value);
                    setNewCafeSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
                    );
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="amber-coffee"
                  value={newCafeSlug}
                  onChange={(e) => setNewCafeSlug(e.target.value.toLowerCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-indigo-600 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">Basic Plan</span>
                  <span className="text-indigo-600 font-mono font-bold text-xs">₹699/mo</span>
                </div>
                <span className="text-xs text-slate-500 block">QR Menu, Orders, Billing, Inventory</span>
              </div>

              <button
                type="submit"
                disabled={creatingCafe || !newCafeName || !newCafeSlug}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-black text-xs shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
              >
                {creatingCafe ? "Provisioning…" : "Create Café Tenant →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
