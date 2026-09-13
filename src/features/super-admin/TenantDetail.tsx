// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { paise } from "@/lib/utils";
import { format } from "date-fns";
import {
  CreditCardIcon,
  ClipboardListIcon,
  BookOpenIcon,
  ChairIcon,
  ArrowRightIcon,
  QrCodeIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  CalendarIcon,
} from "@/components/Icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import SubscriptionForm from "@/app/super/tenants/[id]/SubscriptionForm";
import TenantDangerZone from "@/app/super/tenants/[id]/TenantDangerZone";

interface TenantDetailProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    tier: string;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    billing_status: string;
    created_at: string;
    upi_id: string | null;
    upi_qr_url: string | null;
    whatsapp_enabled: boolean;
    accent_color: string;
    tagline: string | null;
    google_review_url: string | null;
    address: string | null;
    phone: string | null;
    tax_rate: number | null;
  };
  owner: any;
  staff: any[];
  recentOrders: any[];
  todayRevenue: number;
  todayOrdersCount: number;
}

export function TenantDetail({
  tenant,
  owner,
  staff,
  recentOrders,
  todayRevenue,
  todayOrdersCount,
}: TenantDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "billing" | "usage" | "liveops" | "settings" | "danger">("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<{
    categories: any[]; items: any[]; tables: any[]; orders: any[]; audit: any[];
  } | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/super/tenant?cafeId=${tenant.id}`)
      .then((r) => r.json())
      .then((d) => { if (live && d?.ok) setDrawer(d); })
      .catch(() => {});
    return () => { live = false; };
  }, [tenant.id]);

  const suspended = (tenant as any).is_suspended ?? tenant.plan === "suspended";

  const supabase = getSupabaseBrowserClient();

  const daysLeft = () => {
    if (!tenant.trial_ends_at) return "N/A";
    const diff = new Date(tenant.trial_ends_at).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    return Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 864e5);
  };

  const trialDaysLeft = daysLeft();

  const daysUntil = () => {
    if (!tenant.trial_ends_at) return "N/A";
    const diff = new Date(tenant.trial_ends_at).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / 864e5);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tenant?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">/{tenant?.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            tenant.plan === "active" ? "bg-emerald-100 text-emerald-700" :
            tenant.plan === "trial" ? "bg-amber-100 text-amber-800" :
            tenant.plan === "expired" ? "bg-red-100 text-red-700" :
            tenant.plan === "suspended" ? "bg-slate-800 text-white" :
            "bg-slate-100 text-slate-600"
          }`}>
            {tenant.plan?.toUpperCase()}
          </span>
          {tenant.plan === "trial" && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {Number(daysUntil()) > 0 ? `${tenant.trial_ends_at ? Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / 864e5) : 0} days left` : "Expired"}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 px-4 -mb-px" aria-label="Tabs">
          {[
            { id: "overview", label: "Overview", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 002-2V6a2 2 0 012-2h4a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 00-2 2H6a2 2 0 00-2 2v10.5a.5.5 0 00.5.5h9a.5.5 0 010 1H6a2 2 0 00-2 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2h2.5" /></svg> },
            { id: "users", label: "Users", icon: <UsersIcon className="w-4 h-4" /> },
            { id: "billing", label: "Billing", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s.895 2 3 2 3 .895 3-2 .895-2 3-2-.895-2-3-2-.895-2-3-.895-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18m-3-6l4-4m0 0L7 14M7 7h.01M17 21h-10a2 2 0 00-2 2v4a2 2 0 002 2h12a2 2 0 002-2v-6.009A4.988 4.988 0 0017 8c0-2.206-1.523-3.662-4-4.408V2a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h2.5"/></svg> },
            { id: "usage", label: "Usage", icon: <ClipboardListIcon className="w-4 h-4" /> },
            { id: "liveops", label: "Live Ops", icon: <QrCodeIcon className="w-4 h-4" /> },
            { id: "settings", label: "Settings", icon: <PencilIcon className="w-4 h-4" /> },
            { id: "danger", label: "Danger", icon: <AlertTriangleIcon className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Revenue</p>
                <p className="text-3xl font-black text-slate-900 font-mono">₹{(todayRevenue / 100).toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today's Orders</p>
                <p className="text-3xl font-black text-slate-900 font-mono">{todayOrdersCount}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trial Days Left</p>
                <p className="text-3xl font-black text-slate-900 font-mono">{typeof trialDaysLeft === "number" ? trialDaysLeft : trialDaysLeft}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Today's Orders</p>
                <p className="text-3xl font-black text-slate-900 font-mono">{todayOrdersCount}</p>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
                <span className="text-xs text-slate-500">{recentOrders.length} recent</span>
              </div>
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v2.5l-1.5 1.5a2 2 0 000 2.828l7 7 2.828-2.828a2 2 0 012.828 0l7-7 2.828 2.828a2 2 0 010 2.828l-7 7-2.828 2.828a2 2 0 000 2.828l7 7 2.828 2.828a2 2 0 002.828 0l7-7 2.828-2.828a2 2 0 000-2.828l-7-7-2.828-2.828a2 2 0 00-2.828 0l-7-7-2.828-2.828a2 2 0 00-2.828 0l-7-7-2.828-2.828a2 2 0 00-2.828 0l-7-7-2.828-2.828a2 2 0 00-2.828 0l-7-7-2.828-2.828a2 2 0 00-2.828 0l-7-7-2.828-2.828a2 2 0 00-2.828 0l-7-7z" /></svg>
                  <p className="text-slate-500 mt-2">No orders today yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                        <th className="p-4 text-left">Order #</th>
                        <th className="p-4">Table</th>
                        <th className="p-4">Items</th>
                        <th className="text-right">Amount</th>
                        <th>Status</th>
                        <th className="text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.slice(0, 10).map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 text-xs line-clamp-2 truncate">#{order.order_number}</td>
                          <td className="text-slate-600 text-xs">{order.table_label || "—"}</td>
                          <td className="text-slate-600 text-xs">{recentOrders.length} items</td>
                          <td className="text-right font-mono font-bold text-indigo-600">₹{(order.total_paise / 100).toFixed(2)}</td>
                          <td>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              order.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" :
                              order.status === "preparing" ? "bg-amber-100 text-amber-800" :
                              order.status === "ready" ? "bg-emerald-100 text-emerald-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {recentOrders.length} items
                            </span>
                          </td>
                          <td className="text-right text-slate-500 font-mono text-xs">
                            {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Subscription Details</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {tenant.plan === "trial" && tenant.trial_ends_at
                      ? `${daysUntil()} days left in trial`
                      : tenant.plan === "active"
                        ? "Active subscription"
                        : tenant.plan === "expired"
                        ? "Trial expired"
                        : "Subscription suspended"}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1.5"></span>
                      Trial
                    </span>
                    <span className="text-xs text-slate-400">• {daysUntil()} days left</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block">Current Status</span>
                    <h3 className="text-base font-black text-white">{tenant.plan === "active" ? "Active" : tenant.plan === "trial" ? "Trial" : "Expired"}</h3>
                  </div>
                  <span className="text-lg font-black text-amber-400 font-mono">
                    {typeof trialDaysLeft === "number" ? trialDaysLeft : trialDaysLeft}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Payment Method</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["Cash", "UPI", "Card"].map((method) => (
                      <button
                        key={method}
                        className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          "Cash" === "Cash" ? "bg-indigo-600 text-white shadow-md" : "bg-white text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-3">Billing Actions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer">
                      <span className="block">Extend Trial</span>
                      <span className="text-xs text-slate-500">+14 days</span>
                    </button>
                    <button className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs">
                      Mark Paid
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs">
                      Upgrade to Pro
                    </button>
                    <button className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs">
                      Suspend
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <SubscriptionForm id={tenant.id} plan={tenant.plan} trialEndsAt={tenant.trial_ends_at} tier={tenant.tier} />
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Staff Members</h3>
              {staff.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500">No staff members found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                        <th className="p-4 text-left">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Joined</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staff.map((member: any) => (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-medium text-slate-900">{member.display_name || "—"}</td>
                          <td className="p-4 text-slate-600 text-sm">{member.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              member.role === "owner" ? "bg-indigo-100 text-indigo-700" :
                              member.role === "manager" ? "bg-violet-100 text-violet-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              member.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {member.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 text-sm">{new Date(member.created_at).toLocaleDateString("en-IN")}</td>
                          <td className="p-4 text-right">
                            <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === "usage" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Menu Categories", value: drawer ? drawer.categories.length : "…" },
                { label: "Menu Items", value: drawer ? drawer.items.length : "…" },
                { label: "Tables", value: drawer ? drawer.tables.length : "…" },
                { label: "Staff Members", value: staff.length },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-3xl font-black text-slate-900 font-mono">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Orders (last 50)</h3>
              {!drawer ? (
                <p className="text-sm text-slate-400 py-8 text-center">Loading live usage…</p>
              ) : drawer.orders.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No orders recorded</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                        <th className="p-4 text-left">Order #</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Payment</th>
                        <th className="p-4 text-right">Amount</th>
                        <th className="p-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drawer.orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900">#{order.order_number}</td>
                          <td className="text-slate-600">{order.status}</td>
                          <td className="text-slate-600">{order.payment_status}</td>
                          <td className="text-right font-mono font-bold text-indigo-600">₹{(order.total_paise / 100).toFixed(2)}</td>
                          <td className="text-right text-slate-500 font-mono">
                            {new Date(order.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Ops Tab */}
        {activeTab === "liveops" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today&apos;s Revenue</p>
                <p className="text-3xl font-black text-slate-900 font-mono">₹{(todayRevenue / 100).toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Today&apos;s Orders</p>
                <p className="text-3xl font-black text-slate-900 font-mono">{todayOrdersCount}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Audit Trail (last 25)</h3>
              {!drawer ? (
                <p className="text-sm text-slate-400 py-8 text-center">Loading audit trail…</p>
              ) : drawer.audit.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No audit events for this tenant yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                        <th className="p-4 text-left">Action</th>
                        <th className="p-4">Entity</th>
                        <th className="p-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drawer.audit.map((e: any) => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900">{e.action}</td>
                          <td className="text-slate-600">{e.entity}:{String(e.entity_id).slice(0, 8)}</td>
                          <td className="text-right text-slate-500 font-mono">
                            {new Date(e.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tenant Settings</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Slug", `/${tenant.slug}`],
                  ["Tier", tenant.tier],
                  ["Phone", tenant.phone ?? "—"],
                  ["Address", tenant.address ?? "—"],
                  ["UPI ID", tenant.upi_id ?? "—"],
                  ["WhatsApp", tenant.whatsapp_enabled ? "Enabled" : "Disabled"],
                  ["Accent color", tenant.accent_color],
                  ["Tagline", tenant.tagline ?? "—"],
                  ["Google review URL", tenant.google_review_url ?? "—"],
                  ["Tax rate", tenant.tax_rate ?? "—"],
                  ["Billing status", tenant.billing_status],
                  ["Created", new Date(tenant.created_at).toLocaleString("en-IN")],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">{k}</dt>
                    <dd className="mt-1 font-medium text-slate-900 break-words">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {/* Danger Zone Tab */}
        {activeTab === "danger" && (
          <div className="space-y-6">
            <TenantDangerZone id={tenant.id} slug={tenant.slug} suspended={suspended} />
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantDetail;
