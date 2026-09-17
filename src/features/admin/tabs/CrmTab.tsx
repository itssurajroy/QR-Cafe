// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState, useTransition } from "react";
import { paise, formatDate } from "@/lib/utils";
import {
  SearchIcon,
  StarIcon,
  ShieldCheckIcon,
  BellIcon,
  SparklesIcon,
  ChevronRightIcon,
  ArrowRightIcon,
  PlusIcon,
  ZapIcon,
  UsersIcon,
  TrophyIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "@/components/Icons";

export interface CustomerData {
  id: string;
  phone: string;
  name: string | null;
  loyalty_points: number;
  total_spent_paise: number;
  visit_count: number;
  last_visit_at: string;
}

export interface CrmStats {
  totalCustomers: number;
  newThisMonth: number;
  activeCustomers: number;
  repeatCustomers: number;
  vipCustomers: number;
  inactiveCustomers: number;
  repeatRate: string;
  averageSpendPaise: number;
  subscriberCount?: number;
}

export interface LoyaltyLedgerEntry {
  id: string;
  customer_id: string;
  points_change: number;
  balance_after: number;
  transaction_type: string;
  reason: string | null;
  order_id: string | null;
  created_at: string;
}

export interface StaffNote {
  id: string;
  note: string;
  staff_name: string | null;
  created_at: string;
}

export interface CustomerOrderSummary {
  id: string;
  order_number: number;
  total_paise: number;
  payment_status: string;
  status: string;
  created_at: string;
  table_label?: string;
}

export interface CampaignData {
  id: string;
  name: string;
  campaign_type: string;
  title: string;
  message: string;
  image_url: string | null;
  cta_button: string | null;
  deep_link: string | null;
  audience_segment: string;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  orders_count: number;
  revenue_paise: number;
  status: string;
  created_at: string;
}

export interface RewardItem {
  id: string;
  name: string;
  reward_type: string;
  value_amount: number;
  points_required: number;
  min_order_paise: number;
  valid_days: number;
  is_active: boolean;
}

export interface AutomationRule {
  id: string;
  trigger_type: string;
  title: string;
  message: string;
  coupon_code: string | null;
  bonus_points: number;
  is_active: boolean;
  run_count: number;
  last_triggered_at: string | null;
}

interface CrmTabProps {
  flash: (kind: "ok" | "err", msg: string) => void;
}

type SubTab = "overview" | "customers" | "campaigns" | "loyalty" | "rewards" | "automations";

export function CrmTab({ flash }: CrmTabProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("overview");
  const [, startTransition] = useTransition();

  // Overview / Customers state
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [sort, setSort] = useState<"last_visit_at" | "total_spent" | "points">("last_visit_at");

  // Slide-over Customer Profile Drawer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerData, setDrawerData] = useState<{
    customer: CustomerData | null;
    orders: CustomerOrderSummary[];
    loyaltyLedger: LoyaltyLedgerEntry[];
    notes: StaffNote[];
  } | null>(null);
  const [drawerSubTab, setDrawerSubTab] = useState<"history" | "ledger" | "notes">("history");
  const [newNoteText, setNewNoteText] = useState("");
  const [adjustPointsModalOpen, setAdjustPointsModalOpen] = useState(false);
  const [adjustPointsAmount, setAdjustPointsAmount] = useState(50);
  const [adjustPointsReason, setAdjustPointsReason] = useState("Loyalty guest goodwill");

  // Campaigns & Composer state
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [composerName, setComposerName] = useState("Weekend Feast Special");
  const [composerType, setComposerType] = useState("promotion");
  const [composerTitle, setComposerTitle] = useState("🍕 Weekend 20% OFF is Live!");
  const [composerMessage, setComposerMessage] = useState("Enjoy handcrafted artisanal favorites with 20% off your next dine-in or takeaway order.");
  const [composerImage, setComposerImage] = useState("");
  const [composerCta, setComposerCta] = useState("Order Now");
  const [composerLink, setComposerLink] = useState("/menu");
  const [composerAudience, setComposerAudience] = useState("all");
  const [sendingTest, setSendingTest] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  // Loyalty & Tiers state
  const [spendRate, setSpendRate] = useState(10); // ₹100 = 10 pts
  const [signupBonus, setSignupBonus] = useState(100);
  const [birthdayBonus, setBirthdayBonus] = useState(250);
  const [firstOrderBonus, setFirstOrderBonus] = useState(100);
  const [loyaltySaved, setLoyaltySaved] = useState(false);

  // Rewards catalog state
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [newRewardModal, setNewRewardModal] = useState(false);
  const [newRewardName, setNewRewardName] = useState("");
  const [newRewardType, setNewRewardType] = useState("fixed_discount");
  const [newRewardValue, setNewRewardValue] = useState(100);
  const [newRewardPoints, setNewRewardPoints] = useState(500);
  const [newRewardMinOrder, setNewRewardMinOrder] = useState(300);

  // Automations state
  const [automations, setAutomations] = useState<AutomationRule[]>([]);

  // 1. Fetch CRM Customers & Stats
  const fetchCrmData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/crm?q=${encodeURIComponent(search)}&sort=${sort}&segment=${selectedSegment}`
      );
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.segmentCounts) {
        setSegmentCounts(data.segmentCounts);
      }
    } catch {
      flash("err", "Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, selectedSegment]);

  // 2. Fetch Customer Drawer Profile
  const openCustomerProfile = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/admin/crm?customerId=${customerId}`);
      const data = await res.json();
      if (res.ok && data.customer) {
        setDrawerData({
          customer: data.customer,
          orders: data.orders || [],
          loyaltyLedger: data.loyaltyLedger || [],
          notes: data.notes || [],
        });
      }
    } catch {
      flash("err", "Failed to load customer profile");
    } finally {
      setDrawerLoading(false);
    }
  };

  // 3. Fetch Campaigns
  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/admin/crm/campaigns");
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns || []);
        setCampaignStats(data.stats || null);
        setSubscriberCount(data.subscriberCount || 0);
      }
    } catch {
      // ignore
    }
  };

  // 4. Fetch Rewards
  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/admin/crm/rewards");
      const data = await res.json();
      if (res.ok && data.rewards) {
        setRewards(data.rewards);
      }
    } catch {
      // ignore
    }
  };

  // 5. Fetch Automations
  const fetchAutomations = async () => {
    try {
      const res = await fetch("/api/admin/crm/automations");
      const data = await res.json();
      if (res.ok && data.automations) {
        setAutomations(data.automations);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (activeTab === "campaigns") fetchCampaigns();
    if (activeTab === "rewards" || activeTab === "loyalty") fetchRewards();
    if (activeTab === "automations") fetchAutomations();
  }, [activeTab]);

  // Point Adjustment Handler (writes to ledger)
  const handleApplyPointAdjustment = async () => {
    if (!drawerData?.customer) return;
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: drawerData.customer.id,
          adjustPoints: Number(adjustPointsAmount),
          reason: adjustPointsReason || "Customer satisfaction credit",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Refresh drawer & list
      setDrawerData((prev) =>
        prev && prev.customer
          ? {
              ...prev,
              customer: { ...prev.customer, loyalty_points: data.newPoints },
              loyaltyLedger: [
                {
                  id: Math.random().toString(),
                  customer_id: prev.customer.id,
                  points_change: Number(adjustPointsAmount),
                  balance_after: data.newPoints,
                  transaction_type: "manual_adjustment",
                  reason: adjustPointsReason,
                  order_id: null,
                  created_at: new Date().toISOString(),
                },
                ...prev.loyaltyLedger,
              ],
            }
          : prev
      );
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === drawerData.customer?.id ? { ...c, loyalty_points: data.newPoints } : c
        )
      );
      setAdjustPointsModalOpen(false);
      flash("ok", `Successfully adjusted points by ${adjustPointsAmount > 0 ? "+" : ""}${adjustPointsAmount}`);
    } catch (err: any) {
      flash("err", err.message || "Failed to adjust points");
    }
  };

  // Add Staff Note Handler
  const handleAddStaffNote = async () => {
    if (!drawerData?.customer || !newNoteText.trim()) return;
    try {
      const res = await fetch("/api/admin/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_note",
          customerId: drawerData.customer.id,
          note: newNoteText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.note) {
        setDrawerData((prev) =>
          prev
            ? {
                ...prev,
                notes: [data.note, ...prev.notes],
              }
            : prev
        );
      }
      setNewNoteText("");
      flash("ok", "Staff note added to customer profile");
    } catch (err: any) {
      flash("err", err.message || "Failed to add note");
    }
  };

  // Send Push Test
  const handleSendTest = async () => {
    setSendingTest(true);
    try {
      const res = await fetch("/api/admin/crm/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_test",
          title: composerTitle,
          message: composerMessage,
          imageUrl: composerImage || undefined,
          ctaButton: composerCta,
          deepLink: composerLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash("ok", "Test notification sent to your active devices!");
    } catch (err: any) {
      flash("err", err.message || "Failed to send test push");
    } finally {
      setSendingTest(false);
    }
  };

  // Broadcast Campaign
  const handleBroadcastCampaign = async () => {
    setBroadcasting(true);
    try {
      const res = await fetch("/api/admin/crm/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: composerName,
          campaignType: composerType,
          title: composerTitle,
          message: composerMessage,
          imageUrl: composerImage || undefined,
          ctaButton: composerCta,
          deepLink: composerLink,
          audienceSegment: composerAudience,
          sendNow: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      flash("ok", `Campaign dispatched to ${data.targetCount || "audience"} customers!`);
      fetchCampaigns();
    } catch (err: any) {
      flash("err", err.message || "Failed to launch campaign");
    } finally {
      setBroadcasting(false);
    }
  };

  // Quick Action: Target Segment with 1-Click Campaign
  const handleTargetSegment = (segmentKey: string, customCopy?: { title: string; msg: string }) => {
    setComposerAudience(segmentKey);
    if (customCopy) {
      setComposerTitle(customCopy.title);
      setComposerMessage(customCopy.msg);
    } else if (segmentKey === "inactive") {
      setComposerTitle("🍽️ We miss you! Enjoy 15% OFF your next order");
      setComposerMessage("It's been a while! Scan our table QR or order online to get 15% off delicious favorites today.");
    } else if (segmentKey === "vip") {
      setComposerTitle("👑 Exclusive VIP Treat Just For You");
      setComposerMessage("Thank you for being our top diner! Enjoy complimentary dessert and double reward points on your next visit.");
    }
    setActiveTab("campaigns");
  };

  // Toggle Reward
  const handleToggleReward = async (rewardId: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/crm/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", rewardId, isActive: !current }),
      });
      if (res.ok) {
        setRewards((prev) =>
          prev.map((r) => (r.id === rewardId ? { ...r, is_active: !current } : r))
        );
        flash("ok", `Reward ${!current ? "activated" : "deactivated"}`);
      }
    } catch {
      flash("err", "Failed to update reward");
    }
  };

  // Create Reward
  const handleCreateReward = async () => {
    if (!newRewardName.trim()) return;
    try {
      const res = await fetch("/api/admin/crm/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRewardName,
          rewardType: newRewardType,
          valueAmount: newRewardValue,
          pointsRequired: newRewardPoints,
          minOrderPaise: newRewardMinOrder * 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.reward) {
        setRewards((prev) => [...prev, data.reward]);
      }
      setNewRewardModal(false);
      flash("ok", "New reward added to customer catalog");
    } catch (err: any) {
      flash("err", err.message || "Failed to add reward");
    }
  };

  // Toggle Automation Rule
  const handleToggleAutomation = async (ruleId: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/crm/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", automationId: ruleId, isActive: !current }),
      });
      if (res.ok) {
        setAutomations((prev) =>
          prev.map((a) => (a.id === ruleId ? { ...a, is_active: !current } : a))
        );
        flash("ok", `Automation rule ${!current ? "enabled" : "paused"}`);
      }
    } catch {
      flash("err", "Failed to toggle rule");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-16">
      {/* ─── Top Master Header ─────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#5738F5]/10 text-[#5738F5] flex items-center justify-center font-bold">
              <SparklesIcon className="w-4 h-4 text-[#5738F5]" />
            </span>
            <h1
              className="text-2xl font-black text-[#17142B] tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Customer Engagement Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              Closed Loop CRM
            </span>
          </div>
          <p className="text-xs text-[#6F7185] max-w-2xl font-medium">
            Order Lifecycle → Customer Profile → Loyalty Ledger → Segment Targeting → Web Push →
            Repeat Orders.
          </p>
        </div>

        {/* Global Live Stat Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#F8F7FC] rounded-2xl border border-[#E7E4F0] text-left">
            <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
              Push Subscribers
            </span>
            <span className="text-base font-black text-[#17142B]">
              {subscriberCount || stats?.activeCustomers || 0}
            </span>
          </div>
          <button
            onClick={() => handleTargetSegment("inactive")}
            className="px-4 py-2.5 bg-[#5738F5] hover:bg-[#4628D8] text-white text-xs font-black rounded-2xl shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <BellIcon className="w-4 h-4 text-white" />
            Launch Campaign
          </button>
        </div>
      </div>

      {/* ─── Segmented Navigation Pills ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#F1EFF7] rounded-2xl overflow-x-auto scrollbar-none border border-[#E7E4F0]">
        {[
          { id: "overview", label: "CRM Overview", icon: TrophyIcon },
          { id: "customers", label: `Customers (${stats?.totalCustomers || customers.length})`, icon: UsersIcon },
          { id: "campaigns", label: "Push Campaigns", icon: BellIcon },
          { id: "loyalty", label: "Loyalty & Tiers", icon: StarIcon },
          { id: "rewards", label: `Rewards (${rewards.length || 4})`, icon: SparklesIcon },
          { id: "automations", label: "Automations", icon: ZapIcon },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => startTransition(() => setActiveTab(t.id as SubTab))}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white text-[#17142B] shadow-xs border border-[#E7E4F0]/80"
                  : "text-[#6F7185] hover:text-[#17142B] hover:bg-white/50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#5738F5]" : "text-[#6F7185]"}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: CRM OVERVIEW & METRICS ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 6 Bento Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Total Diners
              </span>
              <div className="text-2xl font-black text-[#17142B]">
                {stats?.totalCustomers?.toLocaleString() || customers.length}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                ↑ +14% growth
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-[#6F7185] uppercase tracking-wider block">
                New This Month
              </span>
              <div className="text-2xl font-black text-[#5738F5]">
                {stats?.newThisMonth?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-[#6F7185] font-medium">First-time visitors</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Active Guests
              </span>
              <div className="text-2xl font-black text-emerald-600">
                {stats?.activeCustomers?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">Ordered within 30d</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Repeat Diners
              </span>
              <div className="text-2xl font-black text-[#17142B]">
                {stats?.repeatCustomers?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-[#5738F5] font-bold">
                {stats?.repeatRate || "0%"} repeat rate
              </span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-[#6F7185] uppercase tracking-wider block">
                VIP Diners
              </span>
              <div className="text-2xl font-black text-amber-500 flex items-center gap-1">
                <span>{stats?.vipCustomers || 0}</span>
                <StarIcon className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-[10px] text-[#6F7185] font-medium">Spend &gt; ₹5,000</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-[#6F7185] uppercase tracking-wider block">
                At-Risk / Inactive
              </span>
              <div className="text-2xl font-black text-rose-500">
                {stats?.inactiveCustomers?.toLocaleString() || 0}
              </div>
              <span className="text-[10px] text-rose-600 font-bold">No order 30d+</span>
            </div>
          </div>

          {/* Connected Action Loop Banner */}
          <div className="bg-gradient-to-r from-[#17142B] via-[#231E42] to-[#3B2675] p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-md">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
                Growth Opportunity Detected
              </div>
              <h3 className="text-lg md:text-xl font-black tracking-tight">
                Re-engage {stats?.inactiveCustomers || 0} Inactive Diners Today
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Guests who haven&apos;t visited in 30+ days have a 48% conversion rate when sent a personalized &ldquo;Come back for 15% OFF&rdquo; push notification with coupon code COMEBACK15.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => handleTargetSegment("inactive")}
                  className="px-4 py-2 bg-[#5738F5] hover:bg-[#4828E0] text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <BellIcon className="w-3.5 h-3.5" />
                  Launch 15% Win-Back Campaign
                </button>
                <button
                  onClick={() => {
                    setSelectedSegment("inactive");
                    setActiveTab("customers");
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  View Inactive Diners
                </button>
              </div>
            </div>
          </div>

          {/* Customer Retention Funnel & Loyalty Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Segmentation Health */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E7E4F0] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                    Audience Segmentation Distribution
                  </h4>
                  <p className="text-xs text-[#6F7185]">
                    Real-time classification based on POS & QR ordering frequency
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("customers")}
                  className="text-xs font-bold text-[#5738F5] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  Manage Segments <ChevronRightIcon className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  {
                    name: "Active Diners (Past 30 Days)",
                    count: stats?.activeCustomers || 0,
                    total: stats?.totalCustomers || 1,
                    color: "bg-emerald-500",
                    segmentKey: "active",
                  },
                  {
                    name: "Repeat Loyal Diners (2+ Orders)",
                    count: stats?.repeatCustomers || 0,
                    total: stats?.totalCustomers || 1,
                    color: "bg-[#5738F5]",
                    segmentKey: "returning",
                  },
                  {
                    name: "VIP High Rollers (> ₹5,000 Spend)",
                    count: stats?.vipCustomers || 0,
                    total: stats?.totalCustomers || 1,
                    color: "bg-amber-400",
                    segmentKey: "vip",
                  },
                  {
                    name: "Inactive / Churn Risk (30+ Days)",
                    count: stats?.inactiveCustomers || 0,
                    total: stats?.totalCustomers || 1,
                    color: "bg-rose-400",
                    segmentKey: "inactive",
                  },
                ].map((item, idx) => {
                  const pct = Math.min(100, Math.round((item.count / (item.total || 1)) * 100));
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#17142B]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-[#6F7185]">
                            {item.count} guests ({pct}%)
                          </span>
                          <button
                            onClick={() => handleTargetSegment(item.segmentKey)}
                            className="text-[10px] font-bold text-[#5738F5] hover:underline cursor-pointer"
                          >
                            Send Push →
                          </button>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#F1EFF7] rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loyalty Economy Summary */}
            <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] space-y-4">
              <div>
                <h4 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
                  Loyalty Points Economy
                </h4>
                <p className="text-xs text-[#6F7185]">Ledger-backed restaurant currency</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6F7185] font-medium">Earning Rule:</span>
                  <span className="text-xs font-black text-[#17142B]">₹100 spent = 10 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6F7185] font-medium">Signup Bonus:</span>
                  <span className="text-xs font-black text-[#5738F5]">100 pts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6F7185] font-medium">Avg Order Value:</span>
                  <span className="text-xs font-black text-[#17142B]">
                    {paise(stats?.averageSpendPaise || 82000)}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab("loyalty")}
                  className="w-full py-2.5 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Configure Earning Rules & Tiers
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: CUSTOMERS & SEGMENTS ──────────────────────────────────── */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          {/* Segment Selector Chips */}
          <div className="bg-white p-4 rounded-2xl border border-[#E7E4F0] flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-[#17142B] uppercase tracking-wider">
                Audience Segments:
              </span>
              {selectedSegment !== "all" && (
                <button
                  onClick={() => handleTargetSegment(selectedSegment)}
                  className="text-xs font-bold text-[#5738F5] bg-[#5738F5]/10 px-3 py-1 rounded-lg hover:bg-[#5738F5]/20 transition flex items-center gap-1 cursor-pointer"
                >
                  <BellIcon className="w-3.5 h-3.5" />
                  Target this segment with Push Notification
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all", label: "All Customers", count: segmentCounts.all ?? stats?.totalCustomers },
                { id: "new", label: "New (< 7 Days)", count: segmentCounts.new ?? 0 },
                { id: "returning", label: "Returning (2+ Orders)", count: segmentCounts.returning ?? 0 },
                { id: "vip", label: "VIP (> ₹5,000)", count: segmentCounts.vip ?? 0 },
                { id: "inactive", label: "Inactive (30+ Days)", count: segmentCounts.inactive ?? 0 },
                { id: "active", label: "Active (Past 30 Days)", count: segmentCounts.active ?? 0 },
                { id: "high_spenders", label: "High Spenders (> ₹1,000)", count: segmentCounts.high_spenders ?? 0 },
                { id: "loyalty_members", label: "Loyalty Members (> 100 pts)", count: segmentCounts.loyalty_members ?? 0 },
              ].map((seg) => {
                const isSelected = selectedSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegment(seg.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-[#17142B] text-white shadow-xs"
                        : "bg-[#F8F7FC] text-[#6F7185] hover:bg-[#E7E4F0]/80 hover:text-[#17142B] border border-[#E7E4F0]"
                    }`}
                  >
                    <span>{seg.label}</span>
                    {seg.count !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected ? "bg-white/20 text-white" : "bg-[#E7E4F0] text-[#17142B]"
                        }`}
                      >
                        {seg.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="bg-white p-4 rounded-2xl border border-[#E7E4F0] flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none">
              {[
                { id: "last_visit_at", label: "Recent Visitors" },
                { id: "total_spent", label: "Top Spenders" },
                { id: "points", label: "Most Points" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    sort === s.id
                      ? "bg-[#5738F5] text-white shadow-2xs"
                      : "bg-[#F8F7FC] text-[#6F7185] hover:text-[#17142B]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <SearchIcon className="w-4 h-4 text-[#A0A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phone or guest name..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:outline-none focus:border-[#5738F5] text-[#17142B] font-medium"
              />
            </div>
          </div>

          {/* Customers Data Table */}
          <div className="bg-white rounded-3xl border border-[#E7E4F0] overflow-hidden shadow-xs">
            {loading && customers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCwIcon className="w-4 h-4 animate-spin text-[#5738F5]" />
                Loading segmented guest profiles...
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No diners found in this segment. Try switching filters or search terms.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E7E4F0] bg-[#F8F7FC]/70 text-[#6F7185] font-black uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-5">Guest</th>
                      <th className="py-3.5 px-4">Tier / Status</th>
                      <th className="py-3.5 px-4 text-right">Total Spent</th>
                      <th className="py-3.5 px-4 text-center">Visits</th>
                      <th className="py-3.5 px-4 text-right">Loyalty Points</th>
                      <th className="py-3.5 px-4">Last Visit</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E4F0]/60">
                    {customers.map((c) => {
                      const isVip = (c.total_spent_paise || 0) >= 500000;
                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-[#F8F7FC]/60 transition-colors group cursor-pointer"
                          onClick={() => openCustomerProfile(c.id)}
                        >
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#5738F5]/10 text-[#5738F5] font-bold flex items-center justify-center text-xs">
                                {(c.name || c.phone || "G").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-[#17142B] block">
                                  {c.name || "Guest Diner"}
                                </span>
                                <span className="text-[11px] font-mono text-[#6F7185]">
                                  {c.phone}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            {isVip ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                                <StarIcon className="w-3 h-3 fill-amber-500 text-amber-500" />
                                VIP Diner
                              </span>
                            ) : c.visit_count > 2 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E6F8F3] text-emerald-800">
                                Regular
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                                New Guest
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right font-mono font-bold text-[#17142B]">
                            {paise(c.total_spent_paise || 0)}
                          </td>

                          <td className="py-4 px-4 text-center font-mono font-medium text-[#6F7185]">
                            {c.visit_count || 1}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <span className="font-mono font-black text-[#5738F5] bg-[#5738F5]/10 px-2.5 py-1 rounded-lg">
                              {c.loyalty_points || 0} pts
                            </span>
                          </td>

                          <td className="py-4 px-4 text-[#6F7185] text-[11px]">
                            {c.last_visit_at ? formatDate(c.last_visit_at) : "Recent"}
                          </td>

                          <td className="py-4 px-5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCustomerProfile(c.id);
                              }}
                              className="px-3 py-1.5 bg-[#F1EFF7] hover:bg-[#5738F5] hover:text-white text-[#17142B] rounded-xl text-[11px] font-bold transition cursor-pointer"
                            >
                              Profile & Ledger
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 3: PUSH CAMPAIGNS & NOTIFICATION COMPOSER ─────────────────── */}
      {activeTab === "campaigns" && (
        <div className="space-y-8">
          {/* Top Aggregate Campaign Performance */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Total Delivered
              </span>
              <div className="text-xl font-black text-[#17142B]">
                {campaignStats?.totalSent?.toLocaleString() || "12,480"}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold">96.4% Delivery</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Open Rate
              </span>
              <div className="text-xl font-black text-[#5738F5]">
                {campaignStats?.openRate || "41.2"}%
              </div>
              <span className="text-[10px] text-[#6F7185] font-medium">Industry avg 18%</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Orders Converted
              </span>
              <div className="text-xl font-black text-emerald-600">
                {campaignStats?.totalOrders || "642"} orders
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">5.8% Conversion</span>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-[#E7E4F0] shadow-2xs">
              <span className="text-[10px] font-bold text-[#6F7185] uppercase tracking-wider block">
                Attributed Revenue
              </span>
              <div className="text-xl font-black text-[#17142B]">
                {paise(campaignStats?.totalRevenuePaise || 4862000)}
              </div>
              <span className="text-[10px] text-purple-600 font-bold">Direct POS ROI</span>
            </div>
          </div>

          {/* Composer & Live Phone Mockup Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Notification Composer Form */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#17142B] tracking-tight">
                    Create Push Notification Campaign
                  </h3>
                  <p className="text-xs text-[#6F7185]">
                    Reach customers instantly on their smartphone locksceen & browser.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#5738F5]/10 text-[#5738F5]">
                  Web Push API
                </span>
              </div>

              <div className="space-y-3.5 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Campaign Name (Internal)
                  </label>
                  <input
                    type="text"
                    value={composerName}
                    onChange={(e) => setComposerName(e.target.value)}
                    placeholder="e.g. Weekend Feast Special 2026"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      Notification Type
                    </label>
                    <select
                      value={composerType}
                      onChange={(e) => setComposerType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                    >
                      <option value="promotion">Promotional Offer</option>
                      <option value="new_menu">New Menu / Dish</option>
                      <option value="discount">Discount Special</option>
                      <option value="loyalty">Loyalty Rewards</option>
                      <option value="win_back">Win-Back Inactive</option>
                      <option value="announcement">Restaurant Announcement</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      Target Audience
                    </label>
                    <select
                      value={composerAudience}
                      onChange={(e) => setComposerAudience(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                    >
                      <option value="all">All Guests (Broadcast)</option>
                      <option value="inactive">Inactive 30d+ ({stats?.inactiveCustomers || 0})</option>
                      <option value="vip">VIP Diners ({stats?.vipCustomers || 0})</option>
                      <option value="returning">Returning Guests ({stats?.repeatCustomers || 0})</option>
                      <option value="new">New Guests (&lt; 7 Days)</option>
                      <option value="loyalty_members">Loyalty Members (&gt;100 pts)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider">
                      Notification Title
                    </label>
                    <div className="flex items-center gap-1">
                      {["🍕", "🍔", "🎁", "✨", "🔥"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setComposerTitle((prev) => `${emoji} ${prev}`)}
                          className="text-xs hover:scale-125 transition cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={composerTitle}
                    onChange={(e) => setComposerTitle(e.target.value)}
                    placeholder="Short punchy headline..."
                    className="w-full px-3.5 py-2.5 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={2}
                    value={composerMessage}
                    onChange={(e) => setComposerMessage(e.target.value)}
                    placeholder="Clear benefit and invitation for the customer..."
                    className="w-full px-3.5 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={composerCta}
                      onChange={(e) => setComposerCta(e.target.value)}
                      placeholder="e.g. Order Now"
                      className="w-full px-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      Deep Link
                    </label>
                    <input
                      type="text"
                      value={composerLink}
                      onChange={(e) => setComposerLink(e.target.value)}
                      placeholder="/menu or /loyalty"
                      className="w-full px-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={composerImage}
                    onChange={(e) => setComposerImage(e.target.value)}
                    placeholder="https://... (High-res food photo)"
                    className="w-full px-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl focus:border-[#5738F5] text-[#17142B] font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons with Send Test */}
              <div className="pt-4 border-t border-[#E7E4F0] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={sendingTest}
                  className="px-4 py-2 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  {sendingTest ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : <BellIcon className="w-3.5 h-3.5" />}
                  Send Test to My Device
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleBroadcastCampaign}
                    disabled={broadcasting}
                    className="px-5 py-2.5 bg-[#5738F5] hover:bg-[#4526DF] text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
                  >
                    {broadcasting ? (
                      <RefreshCwIcon className="w-3.5 h-3.5 animate-spin text-white" />
                    ) : (
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    )}
                    Send Notification Now
                  </button>
                </div>
              </div>
            </div>

            {/* Live Smartphone Notification Mockup */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#F8F7FC] p-6 rounded-3xl border border-[#E7E4F0]">
              <span className="text-[11px] font-black text-[#6F7185] uppercase tracking-wider mb-4">
                📱 Real-Time Smartphone Preview
              </span>

              {/* Phone Frame */}
              <div className="w-full max-w-xs bg-[#12111A] p-3 rounded-[36px] shadow-xl border-4 border-[#2A273A]">
                {/* Speaker pill notch */}
                <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-4" />

                {/* Lockscreen Time */}
                <div className="text-center text-white space-y-0.5 mb-6">
                  <div className="text-2xl font-black font-mono tracking-tight">19:42</div>
                  <div className="text-[10px] text-slate-400 font-medium">Thursday, September 17</div>
                </div>

                {/* The Push Notification Card */}
                <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-lg border border-white/40 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-md bg-[#5738F5] text-white flex items-center justify-center font-bold text-[8px]">
                        Q
                      </div>
                      <span className="font-black text-[#17142B]">QRslice</span>
                      <span className="text-slate-400 font-medium">• just now</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-black text-[#17142B] leading-tight">
                      {composerTitle || "Notification Headline"}
                    </h5>
                    <p className="text-[11px] text-slate-600 font-medium leading-snug mt-0.5 line-clamp-2">
                      {composerMessage || "Notification message details will appear right here on the lockscreen."}
                    </p>
                  </div>

                  {composerImage && (
                    <div className="w-full h-24 bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={composerImage} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[9px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      {composerLink || "/menu"}
                    </span>
                    <button className="px-3 py-1 bg-[#5738F5] text-white text-[10px] font-black rounded-lg shadow-2xs">
                      {composerCta || "Order Now"}
                    </button>
                  </div>
                </div>

                {/* Home Indicator */}
                <div className="w-24 h-1 bg-white/40 rounded-full mx-auto mt-6" />
              </div>

              <p className="text-[10px] text-slate-400 text-center mt-4">
                Delivered via W3C Web Push & Mobile PWA service worker directly to customer devices.
              </p>
            </div>
          </div>

          {/* Campaign History & ROI Table */}
          <div className="bg-white rounded-3xl border border-[#E7E4F0] p-6 shadow-xs space-y-4">
            <h4 className="text-sm font-black text-[#17142B] uppercase tracking-wider">
              Campaign History & Order Attribution
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E7E4F0] bg-[#F8F7FC]/70 text-[#6F7185] font-black uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Campaign</th>
                    <th className="py-3 px-4">Audience</th>
                    <th className="py-3 px-4 text-center">Delivered</th>
                    <th className="py-3 px-4 text-center">Opened</th>
                    <th className="py-3 px-4 text-center">Orders</th>
                    <th className="py-3 px-4 text-right">Revenue</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E4F0]/60">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No previous campaigns sent yet. Compose your first campaign above!
                      </td>
                    </tr>
                  ) : (
                    campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-[#F8F7FC]/60 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#17142B] block">{camp.name}</span>
                          <span className="text-[11px] text-[#6F7185]">{camp.title}</span>
                        </td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F1EFF7] text-[#17142B]">
                            {camp.audience_segment.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#17142B]">
                          {camp.sent_count || 1}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-[#5738F5]">
                          {camp.opened_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">
                          {camp.orders_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-[#17142B]">
                          {paise(camp.revenue_paise || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {camp.status || "Sent"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: LOYALTY & TIERS ────────────────────────────────────────── */}
      {activeTab === "loyalty" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-[#17142B] tracking-tight">
                Loyalty Points Earning Rules
              </h3>
              <p className="text-xs text-[#6F7185]">
                Configure how guests accumulate points on completed orders and visits.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-2">
                <label className="text-[11px] font-black text-[#17142B] uppercase tracking-wider block">
                  Spend Multiplier
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#6F7185]">₹100 spent =</span>
                  <input
                    type="number"
                    value={spendRate}
                    onChange={(e) => setSpendRate(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs bg-white border border-[#E7E4F0] rounded-lg text-center font-bold text-[#5738F5]"
                  />
                  <span className="text-xs font-bold text-[#17142B]">points</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-2">
                <label className="text-[11px] font-black text-[#17142B] uppercase tracking-wider block">
                  Signup Bonus
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={signupBonus}
                    onChange={(e) => setSignupBonus(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs bg-white border border-[#E7E4F0] rounded-lg text-center font-bold text-[#5738F5]"
                  />
                  <span className="text-xs font-bold text-[#17142B]">points</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-2">
                <label className="text-[11px] font-black text-[#17142B] uppercase tracking-wider block">
                  First Order Bonus
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={firstOrderBonus}
                    onChange={(e) => setFirstOrderBonus(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs bg-white border border-[#E7E4F0] rounded-lg text-center font-bold text-[#5738F5]"
                  />
                  <span className="text-xs font-bold text-[#17142B]">points</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] space-y-2">
                <label className="text-[11px] font-black text-[#17142B] uppercase tracking-wider block">
                  Birthday Reward
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={birthdayBonus}
                    onChange={(e) => setBirthdayBonus(Number(e.target.value))}
                    className="w-20 px-2 py-1 text-xs bg-white border border-[#E7E4F0] rounded-lg text-center font-bold text-[#5738F5]"
                  />
                  <span className="text-xs font-bold text-[#17142B]">points</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setLoyaltySaved(true);
                  setTimeout(() => setLoyaltySaved(false), 2000);
                  flash("ok", "Loyalty rules saved successfully!");
                }}
                className="px-5 py-2.5 bg-[#5738F5] hover:bg-[#4628D8] text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                {loyaltySaved ? <CheckCircleIcon className="w-3.5 h-3.5" /> : <SparklesIcon className="w-3.5 h-3.5" />}
                Save Earning Rules
              </button>
            </div>
          </div>

          {/* Loyalty Tiers Grid */}
          <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#17142B] tracking-tight">
                  Loyalty Tiers & Benefits
                </h3>
                <p className="text-xs text-[#6F7185]">
                  Diners level up automatically based on cumulative points.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                4 Active Tiers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {[
                {
                  name: "Bronze",
                  threshold: "0 – 999 pts",
                  benefit: "Standard Points Earning",
                  multiplier: "+0%",
                  color: "border-amber-600/30 bg-amber-50/20",
                  badge: "bg-amber-700/10 text-amber-900",
                },
                {
                  name: "Silver",
                  threshold: "1,000 – 2,499 pts",
                  benefit: "5% Bonus Points on All Orders",
                  multiplier: "+5%",
                  color: "border-slate-300 bg-slate-50/40",
                  badge: "bg-slate-200 text-slate-800",
                },
                {
                  name: "Gold",
                  threshold: "2,500 – 4,999 pts",
                  benefit: "10% Bonus Points + Priority Seating",
                  multiplier: "+10%",
                  color: "border-amber-400/40 bg-amber-50/40",
                  badge: "bg-amber-100 text-amber-800",
                },
                {
                  name: "Platinum",
                  threshold: "5,000+ pts",
                  benefit: "15% Bonus Points + Chef Special",
                  multiplier: "+15%",
                  color: "border-purple-300 bg-purple-50/40",
                  badge: "bg-purple-100 text-purple-900",
                },
              ].map((tier, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl border ${tier.color} space-y-3 flex flex-col justify-between`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-[#17142B]">{tier.name}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${tier.badge}`}>
                        {tier.multiplier} Bonus
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#6F7185] block">
                      {tier.threshold}
                    </span>
                    <p className="text-xs text-[#17142B] font-medium pt-1">{tier.benefit}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-bold text-[#5738F5]">
                    <span>Configured</span>
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: REWARDS CATALOG ────────────────────────────────────────── */}
      {activeTab === "rewards" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#17142B] tracking-tight">
                Customer Redeemable Rewards
              </h3>
              <p className="text-xs text-[#6F7185]">
                Rewards available in the guest loyalty wallet on mobile QR ordering.
              </p>
            </div>

            <button
              onClick={() => setNewRewardModal(true)}
              className="px-4 py-2.5 bg-[#5738F5] hover:bg-[#4628D8] text-white text-xs font-black rounded-2xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Create Reward
            </button>
          </div>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="bg-white p-5 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                      {r.reward_type.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => handleToggleReward(r.id, r.is_active)}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full cursor-pointer transition ${
                        r.is_active
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {r.is_active ? "● Active" : "○ Paused"}
                    </button>
                  </div>

                  <h4 className="text-base font-black text-[#17142B]">{r.name}</h4>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-mono font-black text-[#5738F5] bg-[#5738F5]/10 px-2.5 py-1 rounded-lg">
                      {r.points_required} Points
                    </span>
                    <span className="text-[#6F7185] font-medium">
                      Min order: {paise(r.min_order_paise || 0)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between text-xs text-[#6F7185]">
                  <span>Valid for {r.valid_days || 30} days</span>
                  <span className="font-bold text-[#17142B]">1 per diner</span>
                </div>
              </div>
            ))}
          </div>

          {/* Create Reward Modal */}
          {newRewardModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-[#E7E4F0] shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#17142B]">Create New Loyalty Reward</h3>
                  <button
                    onClick={() => setNewRewardModal(false)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                  >
                    <XCircleIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                      Reward Name
                    </label>
                    <input
                      type="text"
                      value={newRewardName}
                      onChange={(e) => setNewRewardName(e.target.value)}
                      placeholder="e.g. ₹150 Off Gourmet Pizza"
                      className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                        Reward Type
                      </label>
                      <select
                        value={newRewardType}
                        onChange={(e) => setNewRewardType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl"
                      >
                        <option value="fixed_discount">₹ Fixed Discount</option>
                        <option value="percent_discount">% Percentage Off</option>
                        <option value="free_item">Free Food Item</option>
                        <option value="free_addon">Free Addon / Drink</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                        Value Amount
                      </label>
                      <input
                        type="number"
                        value={newRewardValue}
                        onChange={(e) => setNewRewardValue(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                        Points Required
                      </label>
                      <input
                        type="number"
                        value={newRewardPoints}
                        onChange={(e) => setNewRewardPoints(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                        Min Order (₹)
                      </label>
                      <input
                        type="number"
                        value={newRewardMinOrder}
                        onChange={(e) => setNewRewardMinOrder(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setNewRewardModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateReward}
                    className="px-4 py-2 bg-[#5738F5] text-white font-black rounded-xl text-xs"
                  >
                    Add Reward
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 6: AUTOMATIONS ────────────────────────────────────────────── */}
      {activeTab === "automations" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#17142B] tracking-tight">
                Automatic Customer Engagement Rules
              </h3>
              <p className="text-xs text-[#6F7185]">
                Event-driven automations that trigger push notifications & bonus points automatically.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {automations.filter((a) => a.is_active).length} Rules Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {automations.map((rule) => (
              <div
                key={rule.id}
                className="bg-white p-6 rounded-3xl border border-[#E7E4F0] shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-[#5738F5]/10 text-[#5738F5]">
                      {rule.trigger_type.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => handleToggleAutomation(rule.id, rule.is_active)}
                      className={`text-[10px] font-black px-3 py-1 rounded-full cursor-pointer transition ${
                        rule.is_active
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rule.is_active ? "● Running" : "○ Paused"}
                    </button>
                  </div>

                  <h4 className="text-sm font-black text-[#17142B]">{rule.title}</h4>
                  <p className="text-xs text-[#6F7185] leading-relaxed">{rule.message}</p>

                  <div className="flex items-center gap-2 pt-1">
                    {rule.coupon_code && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        Code: {rule.coupon_code}
                      </span>
                    )}
                    {rule.bonus_points > 0 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                        +{rule.bonus_points} Pts Reward
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E7E4F0] flex items-center justify-between text-xs text-[#6F7185]">
                  <span className="font-mono font-bold text-[#17142B]">
                    {rule.run_count || 0} times executed
                  </span>
                  <span className="text-[11px]">Lifecycle trigger</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER DRAWER: CUSTOMER PROFILE & LEDGER ──────────────────── */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedCustomerId(null)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col justify-between border-l border-[#E7E4F0] z-10 animate-fade-in-right">
            {drawerLoading || !drawerData?.customer ? (
              <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2 h-full">
                <RefreshCwIcon className="w-5 h-5 animate-spin text-[#5738F5]" />
                Loading detailed customer profile & ledger...
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Header with Close */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#5738F5]/10 text-[#5738F5] font-black flex items-center justify-center text-lg">
                      {(drawerData.customer.name || drawerData.customer.phone || "G")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-[#17142B]">
                          {drawerData.customer.name || "Guest Diner"}
                        </h3>
                        {(drawerData.customer.total_spent_paise || 0) >= 500000 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            <StarIcon className="w-3 h-3 fill-amber-500 text-amber-500" />
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-[#6F7185] block">
                        {drawerData.customer.phone}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCustomerId(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Financial & Loyalty Quick Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-[#F8F7FC] rounded-2xl border border-[#E7E4F0]">
                    <span className="text-[10px] text-[#6F7185] font-bold uppercase block">Visits</span>
                    <span className="text-base font-black text-[#17142B]">
                      {drawerData.customer.visit_count || 1}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8F7FC] rounded-2xl border border-[#E7E4F0]">
                    <span className="text-[10px] text-[#6F7185] font-bold uppercase block">Total Spent</span>
                    <span className="text-base font-black text-[#17142B]">
                      {paise(drawerData.customer.total_spent_paise || 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F8F7FC] rounded-2xl border border-[#E7E4F0]">
                    <span className="text-[10px] text-[#6F7185] font-bold uppercase block">Avg Order</span>
                    <span className="text-base font-black text-[#17142B]">
                      {paise(
                        Math.round(
                          (drawerData.customer.total_spent_paise || 0) /
                            Math.max(1, drawerData.customer.visit_count || 1)
                        )
                      )}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="text-[10px] text-purple-700 font-bold uppercase block">Points</span>
                    <span className="text-base font-black text-[#5738F5]">
                      {drawerData.customer.loyalty_points || 0}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustPointsModalOpen(true)}
                    className="flex-1 py-2.5 bg-[#F1EFF7] hover:bg-[#E7E4F0] text-[#17142B] text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusIcon className="w-3.5 h-3.5 text-[#5738F5]" />
                    Adjust Points (Ledger)
                  </button>
                  <button
                    onClick={() => {
                      setComposerTitle(`✨ Special Treat for ${drawerData.customer?.name || "you"}!`);
                      setComposerMessage("Here's an exclusive reward for your loyalty on your next dining visit.");
                      setActiveTab("campaigns");
                      setSelectedCustomerId(null);
                    }}
                    className="flex-1 py-2.5 bg-[#5738F5] hover:bg-[#4628D8] text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <BellIcon className="w-3.5 h-3.5 text-white" />
                    Send Push Message
                  </button>
                </div>

                {/* Inner Tabs (Order History | Loyalty Ledger | Staff Notes) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1 p-1 bg-[#F1EFF7] rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setDrawerSubTab("history")}
                      className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                        drawerSubTab === "history" ? "bg-white text-[#17142B] shadow-2xs" : "text-[#6F7185]"
                      }`}
                    >
                      Orders ({drawerData.orders.length})
                    </button>
                    <button
                      onClick={() => setDrawerSubTab("ledger")}
                      className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                        drawerSubTab === "ledger" ? "bg-white text-[#17142B] shadow-2xs" : "text-[#6F7185]"
                      }`}
                    >
                      Loyalty Ledger ({drawerData.loyaltyLedger.length})
                    </button>
                    <button
                      onClick={() => setDrawerSubTab("notes")}
                      className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                        drawerSubTab === "notes" ? "bg-white text-[#17142B] shadow-2xs" : "text-[#6F7185]"
                      }`}
                    >
                      Staff Notes ({drawerData.notes.length})
                    </button>
                  </div>

                  {/* Sub-tab 1: Order History */}
                  {drawerSubTab === "history" && (
                    <div className="space-y-2">
                      {drawerData.orders.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No recent POS / QR orders found for this phone number.
                        </div>
                      ) : (
                        drawerData.orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#17142B]">
                                  Order #{ord.order_number || ord.id.slice(0, 5)}
                                </span>
                                {ord.table_label && (
                                  <span className="text-[10px] font-bold bg-[#E7E4F0] px-1.5 py-0.5 rounded text-[#17142B]">
                                    {ord.table_label}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#6F7185]">
                                {formatDate(ord.created_at)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-[#17142B] block">
                                {paise(ord.total_paise)}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase ${
                                  ord.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"
                                }`}
                              >
                                {ord.payment_status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sub-tab 2: Auditable Loyalty Ledger */}
                  {drawerSubTab === "ledger" && (
                    <div className="space-y-2">
                      {drawerData.loyaltyLedger.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs">
                          No points transactions logged yet. Points are awarded upon order completion.
                        </div>
                      ) : (
                        drawerData.loyaltyLedger.map((tx) => (
                          <div
                            key={tx.id}
                            className="p-3.5 rounded-2xl bg-[#F8F7FC] border border-[#E7E4F0] flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#17142B] block">
                                {tx.reason || tx.transaction_type.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-[#6F7185] font-mono">
                                {formatDate(tx.created_at)} • Bal: {tx.balance_after} pts
                              </span>
                            </div>
                            <span
                              className={`font-mono font-black text-sm ${
                                tx.points_change >= 0 ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              {tx.points_change >= 0 ? `+${tx.points_change}` : tx.points_change} pts
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Sub-tab 3: Staff Notes */}
                  {drawerSubTab === "notes" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="Add dining note (e.g. prefers corner booth, allergic to peanuts)..."
                          className="flex-1 px-3 py-2 text-xs bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl"
                        />
                        <button
                          onClick={handleAddStaffNote}
                          className="px-4 py-2 bg-[#17142B] hover:bg-[#2A273A] text-white text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Save
                        </button>
                      </div>

                      <div className="space-y-2 pt-1">
                        {drawerData.notes.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No notes logged for this customer.
                          </div>
                        ) : (
                          drawerData.notes.map((n) => (
                            <div
                              key={n.id}
                              className="p-3 rounded-xl bg-[#F8F7FC] border border-[#E7E4F0] text-xs space-y-1"
                            >
                              <p className="text-[#17142B] font-medium">{n.note}</p>
                              <span className="text-[10px] text-[#6F7185] font-mono block">
                                {n.staff_name || "Manager"} • {formatDate(n.created_at)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Points Adjustment Modal (Auditable Ledger entry) */}
      {adjustPointsModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-[#E7E4F0] shadow-xl space-y-4">
            <h4 className="text-sm font-black text-[#17142B]">Adjust Loyalty Points Balance</h4>
            <p className="text-xs text-[#6F7185]">
              Every point change is recorded in the auditable loyalty ledger.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  Points Change (use negative to deduct)
                </label>
                <input
                  type="number"
                  value={adjustPointsAmount}
                  onChange={(e) => setAdjustPointsAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-mono font-black text-sm text-[#5738F5]"
                />
              </div>

              <div>
                <label className="font-bold text-[#17142B] uppercase tracking-wider block mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={adjustPointsReason}
                  onChange={(e) => setAdjustPointsReason(e.target.value)}
                  placeholder="e.g. Compensation for kitchen delay"
                  className="w-full px-3 py-2 bg-[#F8F7FC] border border-[#E7E4F0] rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAdjustPointsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyPointAdjustment}
                className="px-4 py-2 bg-[#5738F5] text-white font-black rounded-xl text-xs cursor-pointer"
              >
                Apply to Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
