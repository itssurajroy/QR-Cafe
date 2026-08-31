"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";
import { DashboardTab } from "@/features/admin/tabs/DashboardTab";
import { SettingsTab } from "@/features/admin/tabs/SettingsTab";
import { MenuTab } from "@/features/admin/tabs/MenuTab";
import { TablesTab } from "@/features/admin/tabs/TablesTab";
import { ReportSummary, FloorIntelligence } from "@/features/admin/tabs/AnalyticsTab";
import { BrandingTab } from "@/features/admin/tabs/BrandingTab";
import { AdminTopNav } from "@/features/admin/AdminTopNav";
import type { Category, MenuItem as Item, Table } from "@/types";
type Report = { orders: number; paid: number; revenue: number; avg: number };

function paise(n: number) {
  return `₹${(n / 100).toLocaleString("en-IN")}`;
}

export default function AdminClient({
  restaurantId,
  restaurant,
  categories,
  items,
  tables,
  report,
}: {
  restaurantId: string;
  restaurant?: any;
  categories: Category[];
  items: Item[];
  tables: Table[];
  report: Report;
}) {
  const [tab, setTab] = useState<"dashboard" | "menu" | "tables" | "report" | "analytics" | "branding" | "settings" | "help">("dashboard");
  const [categoryList, setCategoryList] = useState<Category[]>(categories);
  const [itemList, setItemList] = useState<Item[]>(items);
  const [tableList, setTableList] = useState<Table[]>(tables);

  const [settingsCafeName, setSettingsCafeName] = useState(restaurant?.name || "");
  const [settingsTaxRate, setSettingsTaxRate] = useState(restaurant?.tax_rate || 5);
  const [settingsUpiId, setSettingsUpiId] = useState(restaurant?.upi_id || "");
  const [settingsUpiQrUrl, setSettingsUpiQrUrl] = useState(restaurant?.upi_qr_url || "");
  const [settingsGstNumber, setSettingsGstNumber] = useState(restaurant?.gst_number || "");
  const [settingsPhone, setSettingsPhone] = useState(restaurant?.phone || "");
  const [settingsAddress, setSettingsAddress] = useState(restaurant?.address || "");
  const [savingSettings, setSavingSettings] = useState(false);

  // Modal / Form States
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCatId, setNewItemCatId] = useState(categories[0]?.id || "");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemVeg, setNewItemVeg] = useState(true);

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [newTableLabel, setNewTableLabel] = useState("");
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [isAddingTable, setIsAddingTable] = useState(false);

  // Branding Form State (Pro tier)
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(restaurant?.logo_url || "");
  const [brandingTagline, setBrandingTagline] = useState(restaurant?.tagline || "");
  const [brandingGoogleReviewUrl, setBrandingGoogleReviewUrl] = useState(restaurant?.google_review_url || "");
  const [brandingAccentColor, setBrandingAccentColor] = useState(restaurant?.accent_color || "#f59e0b");
  const [savingBranding, setSavingBranding] = useState(false);

  // Bulk Menu Import State
  const [showBulkMenuModal, setShowBulkMenuModal] = useState(false);
  const [bulkMenuText, setBulkMenuText] = useState("");
  const [parsedBulkItems, setParsedBulkItems] = useState<any[]>([]);
  const [isImportingMenu, setIsImportingMenu] = useState(false);

  // Tent Standee Config
  const [wifiSsid, setWifiSsid] = useState(restaurant?.wifi_ssid || "Cafe_Guest_5G");
  const [wifiPassword, setWifiPassword] = useState(restaurant?.wifi_password || "welcome123");

  // QR Modal States
  const [qrModal, setQrModal] = useState<{
    label: string;
    url: string;
    directUrl: string;
    seats: number;
  } | null>(null);

  const [bulkQrModal, setBulkQrModal] = useState(false);
  const [bulkQrList, setBulkQrList] = useState<
    { label: string; url: string; directUrl: string; seats: number }[]
  >([]);
  const [generatingBulk, setGeneratingBulk] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Live Revenue Ticker
  const [liveRevenue, setLiveRevenue] = useState<number>(report.revenue);
  const [liveOrders, setLiveOrders] = useState<number>(report.orders);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Bulk Menu Operations
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkPriceChange, setBulkPriceChange] = useState("");
  const [showBulkBar, setShowBulkBar] = useState(false);

  // Drag-and-drop sort
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Checklist dismissal
  const [dismissChecklist, setDismissChecklist] = useState(false);

  // Toast/Flash Alert
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const flash = (kind: "ok" | "err", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const plan = restaurant?.plan || "trial";
  const tier = restaurant?.tier || "pro";
  const trialEnds = restaurant?.trial_ends_at ? new Date(restaurant.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (864e5))) : 0;
  const isTrial = plan === "trial";
  const isSuspended = plan === "suspended" || (isTrial && daysLeft === 0);

  // Live ticker: refresh revenue + order feed every 30 seconds
  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const d = await res.json();
          if (d.today) {
            setLiveRevenue(d.today.revenue ?? report.revenue);
            setLiveOrders(d.today.orders ?? report.orders);
          }
          if (d.recentOrders) setRecentOrders(d.recentOrders.slice(0, 10));
        }
      } catch { /* network fail, keep last value */ }
    }
    fetchLive();
    const ticker = setInterval(fetchLive, 30000);
    return () => clearInterval(ticker);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "analytics" && !analytics) {
      loadAnalytics();
    }
  }, [tab, analytics]);

  // Bulk selection helpers
  function toggleSelectItem(id: string) {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      setShowBulkBar(next.size > 0);
      return next;
    });
  }

  function selectAllItems() {
    const all = new Set(itemList.map(i => i.id));
    setSelectedItems(all);
    setShowBulkBar(true);
  }

  function clearSelection() {
    setSelectedItems(new Set());
    setShowBulkBar(false);
  }

  async function bulkToggleAvailability(available: boolean) {
    const ids = Array.from(selectedItems);
    try {
      await Promise.all(ids.map(id => fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "toggle_item_availability", itemId: id, available }),
      })));
      setItemList(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, available } : i));
      flash("ok", `${ids.length} items ${available ? "enabled" : "disabled"}`);
      clearSelection();
    } catch {
      flash("err", "Bulk update failed");
    }
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedItems.size} items? This cannot be undone.`)) return;
    const ids = Array.from(selectedItems);
    try {
      await Promise.all(ids.map(id => fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_item", itemId: id }),
      })));
      setItemList(prev => prev.filter(i => !selectedItems.has(i.id)));
      flash("ok", `${ids.length} items deleted`);
      clearSelection();
    } catch {
      flash("err", "Bulk delete failed");
    }
  }

  // Drag-and-drop sort handlers
  function handleDragStart(id: string) { setDraggedItemId(id); }
  function handleDragEnd() { setDraggedItemId(null); }
  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetId) return;
    setItemList(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(i => i.id === draggedItemId);
      const toIdx = arr.findIndex(i => i.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  }

  async function loadAnalytics() {
    setLoadingAnalytics(true);
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch {
      flash("err", "Failed to fetch analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function handleToggleAvailable(id: string, current: boolean) {
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "toggle_item_availability",
          itemId: id,
          available: !current,
        }),
      });
      if (!res.ok) return flash("err", "Failed to update item availability");
      setItemList((prev) =>
        prev.map((i) => (i.id === id ? { ...i, available: !current } : i)),
      );
      flash("ok", `Item marked ${!current ? "in stock" : "sold out"}`);
    } catch {
      flash("err", "Error updating availability");
    }
  }

  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(priceNum) || priceNum <= 0) {
      return flash("err", "Please provide a valid item name and price");
    }

    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_item",
          categoryId: newItemCatId,
          name: newItemName.trim(),
          pricePaise: Math.round(priceNum * 100),
          description: newItemDesc.trim(),
          isVeg: newItemVeg,
        }),
      });
      const data = await res.json();
      if (!res.ok) return flash("err", data.error || "Failed to create dish");
      setItemList((prev) => [...prev, data.item]);
      setNewItemName("");
      setNewItemPrice("");
      setNewItemDesc("");
      setShowItemModal(false);
      flash("ok", "Menu item added successfully!");
    } catch {
      flash("err", "Error adding item");
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_item", itemId }),
      });
      if (!res.ok) return flash("err", "Failed to delete item");
      setItemList((prev) => prev.filter((i) => i.id !== itemId));
      flash("ok", "Item deleted");
    } catch {
      flash("err", "Error deleting item");
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_category",
          name: newCatName.trim(),
          sortOrder: categoryList.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) return flash("err", data.error || "Failed to create category");
      setCategoryList((prev) => [...prev, data.category]);
      setNewCatName("");
      setShowCatModal(false);
      flash("ok", "Category created!");
    } catch {
      flash("err", "Error creating category");
    }
  }

  // Parse raw text or CSV content for bulk menu import
  function handleBulkParse(rawText: string) {
    setBulkMenuText(rawText);
    const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
    const items: any[] = [];

    lines.forEach((line) => {
      // Split by comma, tab, or pipe
      const parts = line.split(/[,|\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const price = parseFloat(parts[1].replace(/[^0-9.]/g, "")) || 0;
        const category = parts[2] || "General Menu";
        const isVeg = parts[3] ? !parts[3].toLowerCase().includes("non") : true;
        const description = parts[4] || "";

        if (name && price > 0) {
          items.push({ name, price, category, isVeg, description });
        }
      }
    });

    setParsedBulkItems(items);
  }

  async function handleBulkImportSubmit() {
    if (parsedBulkItems.length === 0) {
      return flash("err", "No valid items to import. Please check format.");
    }

    setIsImportingMenu(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bulk_import_items",
          items: parsedBulkItems,
        }),
      });
      const data = await res.json();
      setIsImportingMenu(false);
      if (!res.ok) return flash("err", data.error || "Failed to bulk import dishes");

      if (data.items) {
        setItemList((prev) => [...prev, ...data.items]);
      }
      setShowBulkMenuModal(false);
      setBulkMenuText("");
      setParsedBulkItems([]);
      flash("ok", `🎉 Successfully imported ${data.count || parsedBulkItems.length} dishes!`);
    } catch {
      setIsImportingMenu(false);
      flash("err", "Network error during bulk import");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!confirm("Are you sure? This will delete the category and all items inside it.")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_category", categoryId }),
      });
      if (!res.ok) return flash("err", "Failed to delete category");
      setCategoryList((prev) => prev.filter((c) => c.id !== categoryId));
      setItemList((prev) => prev.filter((i) => i.category_id !== categoryId));
      flash("ok", "Category deleted");
    } catch {
      flash("err", "Error deleting category");
    }
  }

  async function handleAddTable(e: React.FormEvent) {
    e.preventDefault();
    if (!newTableLabel.trim()) return;
    setIsAddingTable(true);

    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "create_table",
          label: newTableLabel.trim(),
          seats: newTableSeats,
        }),
      });
      const data = await res.json();
      setIsAddingTable(false);
      if (!res.ok) return flash("err", data.error || "Failed to add table");

      setTableList((prev) => [...prev, data.table]);
      setNewTableLabel("");
      flash("ok", `Table ${data.table.label} created!`);
    } catch {
      setIsAddingTable(false);
      flash("err", "Error adding table");
    }
  }

  async function handleDeleteTable(tableId: string) {
    if (!confirm("Delete this table?")) return;
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_table", tableId }),
      });
      if (!res.ok) return flash("err", "Failed to delete table");
      setTableList((prev) => prev.filter((t) => t.id !== tableId));
      flash("ok", "Table removed");
    } catch {
      flash("err", "Error deleting table");
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_branding",
          logoUrl: brandingLogoUrl.trim() || null,
          tagline: brandingTagline.trim() || null,
          googleReviewUrl: brandingGoogleReviewUrl.trim() || null,
          accentColor: brandingAccentColor,
        }),
      });
      if (res.ok) {
        flash("ok", "Branding preferences saved!");
      } else {
        flash("err", "Failed to save branding");
      }
    } catch {
      flash("err", "Error saving branding settings");
    } finally {
      setSavingBranding(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    try {
      // Store local counter preferences in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(`cafe_upi_${restaurant.id}`, settingsUpiId.trim());
        localStorage.setItem(`cafe_wifi_ssid_${restaurant.id}`, wifiSsid.trim());
        localStorage.setItem(`cafe_wifi_pass_${restaurant.id}`, wifiPassword.trim());
      }

      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "update_settings",
          name: settingsCafeName.trim(),
          taxRate: Number(settingsTaxRate),
          phone: settingsPhone.trim(),
          address: settingsAddress.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        return flash("err", d.error || "Failed to update café settings");
      }

      flash("ok", "Café configuration, UPI & tax settings updated successfully!");
    } catch {
      flash("err", "Network error saving settings");
    } finally {
      setSavingSettings(false);
    }
  }

  async function generateQrDataUrl(tableOrToken: Table | string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://qr-cafe-blond.vercel.app";
    let url = "";
    if (typeof tableOrToken === "string") {
      url = `${origin}/t/${tableOrToken}`;
    } else {
      const slug = restaurant?.slug || "cafe";
      url = `${origin}/c/${slug}/t/${encodeURIComponent(tableOrToken.label)}`;
    }
    const dataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      errorCorrectionLevel: "H",
      color: {
        dark: "#1c1917",
        light: "#ffffff",
      },
    });
    return { dataUrl, url };
  }

  async function showQr(t: Table) {
    const { dataUrl, url } = await generateQrDataUrl(t);
    setQrModal({ label: t.label, url: dataUrl, directUrl: url, seats: t.seats });
  }

  async function showBulkQr() {
    setGeneratingBulk(true);
    const list = [];
    for (const t of tableList) {
      const { dataUrl, url } = await generateQrDataUrl(t);
      list.push({ label: t.label, url: dataUrl, directUrl: url, seats: t.seats });
    }
    setBulkQrList(list);
    setGeneratingBulk(false);
    setBulkQrModal(true);
  }

  return (
    <main className="min-h-screen bg-[#FFFBF5] text-stone-800 selection:bg-[#D97706] selection:text-white flex flex-col">
      {/* SaaS Subscription Top Bar Banner */}
      <div
        className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-md no-print ${
          isSuspended
            ? "bg-red-950/90 border-b border-red-800 text-red-300"
            : isTrial
            ? "bg-gradient-to-r from-amber-500/20 via-stone-900 to-amber-500/20 border-b border-amber-500/30 text-amber-300"
            : "bg-emerald-950/80 border-b border-emerald-800 text-emerald-300"
        }`}
      >
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span>{isSuspended ? "🚫" : isTrial ? "⏳" : "✓"}</span>
            <span>
              {isSuspended
                ? "Subscription expired — ordering is paused for your customers."
                : isTrial
                ? `Free Trial (${tier.toUpperCase()} Tier): ${daysLeft} days left.`
                : `Active Plan: ${tier.toUpperCase()} Subscriber`}
            </span>
          </div>

          <Link
            href="/admin/billing"
            className={`px-3 py-1 rounded-xl font-black text-[11px] transition-all cursor-pointer ${
              isSuspended
                ? "bg-red-600 hover:bg-red-500 text-stone-900"
                : isTrial
                ? "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm"
                : "bg-emerald-800 hover:bg-emerald-700 text-stone-900"
            }`}
          >
            {isSuspended ? "Renew Now &rarr;" : isTrial ? "Subscribe (₹799/mo) &rarr;" : "Manage Billing &rarr;"}
          </Link>
        </div>
      </div>

      <header className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-md no-print">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl shadow-md shadow-amber-500/20">
              📊
            </div>
            <div>
              <h1 className="font-extrabold text-stone-900 text-base" style={{ fontFamily: "var(--font-heading)" }}>{restaurant?.name || "Café Admin"}</h1>
              <p className="text-[11px] text-stone-500">Operations &amp; Setup Hub</p>
            </div>
          </div>

          {/* Live Revenue Ticker */}
          <div className="hidden md:flex items-center gap-4 bg-white border border-stone-200 rounded-xl px-3 py-2">
            <div className="text-center">
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Today's Revenue</p>
              <p className="text-sm font-black text-amber-400 font-mono">₹{(liveRevenue / 100).toLocaleString("en-IN")}</p>
            </div>
            <div className="w-px h-6 bg-stone-100"></div>
            <div className="text-center">
              <p className="text-[10px] text-stone-500 uppercase tracking-wider">Orders</p>
              <p className="text-sm font-black text-emerald-400 font-mono">{liveOrders}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>

          <AdminTopNav tab={tab} setTab={setTab} />
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6 no-print flex-1 w-full">
        {/* Onboarding Starter Checklist (Dismissible) */}
        {!dismissChecklist && (
          <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-xl space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <h3 className="font-black text-xs text-stone-900">Café Launch Checklist</h3>
              </div>
              <button
                type="button"
                onClick={() => setDismissChecklist(true)}
                className="text-[11px] text-stone-500 hover:text-stone-600 font-bold"
              >
                Dismiss ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
                <span className={itemList.length > 0 ? "text-emerald-400 font-bold" : "text-stone-600"}>
                  {itemList.length > 0 ? "✓" : "○"}
                </span>
                <span className="text-stone-600">Add Menu Dishes ({itemList.length})</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
                <span className={tableList.length > 0 ? "text-emerald-400 font-bold" : "text-stone-600"}>
                  {tableList.length > 0 ? "✓" : "○"}
                </span>
                <span className="text-stone-600">Generate Tables & QRs ({tableList.length})</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-stone-200">
                <span className="text-amber-400 font-bold">★</span>
                <Link href={restaurant?.slug ? `/c/${restaurant.slug}` : "/"} className="text-amber-400 hover:underline">
                  Test Guest Menu ↗
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Flash Message */}
        {msg && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-lg animate-in fade-in duration-200 ${
              msg.kind === "ok"
                ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                : "bg-red-950/80 border-red-800 text-red-300"
            }`}
          >
            <span>{msg.kind === "ok" ? "✓" : "⚠️"}</span>
            <span>{msg.text}</span>
          </div>
        )}

        {/* TAB 0: LIVE DASHBOARD */}
        {tab === "dashboard" && (
          <DashboardTab
            liveRevenue={liveRevenue}
            liveOrders={liveOrders}
            itemList={itemList}
            tableList={tableList}
            recentOrders={recentOrders}
            setTab={setTab}
            restaurant={restaurant}
          />
        )}

        {/* TAB 1: MENU & CATEGORY MANAGEMENT */}
        {tab === "menu" && (
          <div className="animate-fade-in-up">
            <MenuTab
              itemList={itemList}
              categoryList={categoryList}
              selectedItems={selectedItems}
              showBulkBar={showBulkBar}
              draggedItemId={draggedItemId}
              setShowBulkMenuModal={setShowBulkMenuModal}
              setShowCatModal={setShowCatModal}
              setShowItemModal={setShowItemModal}
              selectAllItems={selectAllItems}
              clearSelection={clearSelection}
              bulkToggleAvailability={bulkToggleAvailability}
              bulkDelete={bulkDelete}
              handleDeleteCategory={handleDeleteCategory}
              handleDragStart={handleDragStart}
              handleDragEnd={handleDragEnd}
              handleDragOver={handleDragOver}
              toggleSelectItem={toggleSelectItem}
              handleToggleAvailable={handleToggleAvailable}
              handleDeleteItem={handleDeleteItem}
            />
          </div>
        )}

        {/* TAB 2: TABLES & QR CODE GENERATOR */}
        {tab === "tables" && (
          <div className="animate-fade-in-up">
            <TablesTab
              tableList={tableList}
              generatingBulk={generatingBulk}
              isAddingTable={isAddingTable}
              newTableLabel={newTableLabel}
              newTableSeats={newTableSeats}
              showBulkQr={showBulkQr}
              showQr={showQr}
              handleDeleteTable={handleDeleteTable}
              setNewTableLabel={setNewTableLabel}
              setNewTableSeats={setNewTableSeats}
              handleAddTable={handleAddTable}
            />
          </div>
        )}

        {/* TAB 3: REPORT SUMMARY */}
        {tab === "report" && (
          <div className="animate-fade-in-up">
            <ReportSummary report={report} />
          </div>
        )}

        {/* TAB 4: ADVANCED FLOOR INTELLIGENCE & ANALYTICS */}
        {tab === "analytics" && (
          <div className="animate-fade-in-up">
            <FloorIntelligence
              loadingAnalytics={loadingAnalytics}
              analytics={analytics}
              loadAnalytics={loadAnalytics}
            />
          </div>
        )}

        {/* TAB 5: CUSTOM BRANDING (PRO ONLY) */}
        {tab === "branding" && (
          <div className="animate-fade-in-up">
            <BrandingTab
              brandingLogoUrl={brandingLogoUrl}
              brandingTagline={brandingTagline}
              brandingGoogleReviewUrl={brandingGoogleReviewUrl}
              brandingAccentColor={brandingAccentColor}
              savingBranding={savingBranding}
              setBrandingLogoUrl={setBrandingLogoUrl}
              setBrandingTagline={setBrandingTagline}
              setBrandingGoogleReviewUrl={setBrandingGoogleReviewUrl}
              setBrandingAccentColor={setBrandingAccentColor}
              handleSaveBranding={handleSaveBranding}
            />
          </div>
        )}

        {/* TAB 6: OWNER GOVERNANCE & DIAGNOSTIC MANUAL */}
        {tab === "help" && (
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl max-w-4xl">
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-stone-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-stone-900">🏛️ Owner Governance &amp; Operating Manual</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Subscription controls, multi-tenant governance, Google Review setup &amp; hardware diagnostics
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-stone-950">
                Operational Runbook
              </span>
            </div>

            {/* 1. INTERACTIVE 1-CLICK SYSTEM DIAGNOSTICS */}
            <div className="p-5 rounded-3xl bg-white border border-amber-500/30 space-y-4 shadow-inner">
              <div>
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🛠️ Live Floor &amp; Hardware Self-Diagnostics</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Test your browser audio, WhatsApp URL encoding, and tax calculations before operating live.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Test 1: Voice Synthesizer */}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && "speechSynthesis" in window) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance("Table 01 needs Water!");
                      u.rate = 1.05;
                      window.speechSynthesis.speak(u);
                      flash("ok", "🔊 Voice Synth Test Triggered: 'Table 01 needs Water!'");
                    } else {
                      flash("err", "Web Speech API not supported on this browser.");
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">🔊</span>
                  <div className="text-xs font-bold text-stone-900">Test Voice Call Bell</div>
                  <div className="text-[10px] text-stone-500 font-mono">Speak: Table 01 Call</div>
                </button>

                {/* Test 2: WhatsApp Link Test */}
                <button
                  type="button"
                  onClick={() => {
                    const sampleMsg = `🧾 *TEST RECEIPT: ${restaurant?.name || "QR Café"}*\n` +
                      `Bill: #POS-TEST | Date: ${new Date().toLocaleDateString("en-IN")}\n` +
                      `• Hazelnut Cold Brew x1 = ₹220.00\n` +
                      `• Truffle Pizza x1 = ₹380.00\n` +
                      `---------------------------------\n` +
                      `Subtotal: ₹600.00\n` +
                      `GST (5%): ₹30.00\n` +
                      `*TOTAL: ₹630.00* (PAID IN CASH)\n` +
                      `---------------------------------\n` +
                      `Thank you for dining with us! 🙏`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(sampleMsg)}`, "_blank");
                    flash("ok", "💬 WhatsApp Test Receipt Dispatched!");
                  }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">💬</span>
                  <div className="text-xs font-bold text-emerald-400">Test WhatsApp Bill</div>
                  <div className="text-[10px] text-stone-500 font-mono">Launch pre-formatted text</div>
                </button>

                {/* Test 3: GST Tax Calculation */}
                <button
                  type="button"
                  onClick={() => {
                    const billAmt = 1000;
                    const taxRate = restaurant?.tax_rate || 5;
                    const taxable = Math.round((billAmt * 100) / (100 + taxRate));
                    const gstTotal = billAmt - taxable;
                    const cgst = (gstTotal / 2).toFixed(2);
                    const sgst = (gstTotal / 2).toFixed(2);
                    flash("ok", `🧮 GST Test (₹1,000 Bill): Taxable=₹${taxable}, CGST (${taxRate / 2}%)=₹${cgst}, SGST (${taxRate / 2}%)=₹${sgst}`);
                  }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">🧮</span>
                  <div className="text-xs font-bold text-amber-400">Verify GST Math</div>
                  <div className="text-[10px] text-stone-500 font-mono">Compute 2.5% CGST/SGST</div>
                </button>

                {/* Test 4: Realtime WebSocket Ping */}
                <button
                  type="button"
                  onClick={async () => {
                    const start = Date.now();
                    try {
                      const res = await fetch("/api/analytics", { cache: "no-store" });
                      const lat = Date.now() - start;
                      if (res.ok) {
                        flash("ok", `⚡ Postgres Serverless Latency: ${lat}ms (Optimal)`);
                      } else {
                        flash("err", "Server check failed");
                      }
                    } catch {
                      flash("err", "Server unreachable");
                    }
                  }}
                  className="p-3.5 rounded-2xl bg-white hover:bg-stone-100 border border-stone-200 text-left space-y-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-xl block group-hover:scale-110 transition-transform">⚡</span>
                  <div className="text-xs font-bold text-stone-200">Ping Server Latency</div>
                  <div className="text-[10px] text-stone-500 font-mono">Verify Edge connection</div>
                </button>
              </div>
            </div>

            {/* 2. GOVERNANCE MODULE A: SUBSCRIPTIONS & BILLING */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  A
                </span>
                <h3 className="text-sm font-extrabold text-stone-900">Subscription &amp; SaaS Billing Governance</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 text-stone-600 leading-relaxed">
                <p>
                  QR Café operates on a unified flat plan at <strong>₹799/month</strong> with unlimited tables, dishes, KDS screens, and cash POS registers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <span className="text-stone-500 block">Subscription Status:</span>
                    <span className="text-emerald-400 font-bold uppercase">{plan}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200">
                    <span className="text-stone-500 block">Trial Expiry / Renewal:</span>
                    <span className="text-amber-400 font-bold">{trialEnds ? trialEnds.toLocaleDateString("en-IN") : "Active"}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/admin/billing"
                    className="inline-block px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md cursor-pointer"
                  >
                    Manage Razorpay Subscription &rarr;
                  </Link>
                </div>
              </div>
            </div>

            {/* 3. GOVERNANCE MODULE B: MULTI-TENANT FLOOR DEPLOYMENT */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <h3 className="text-sm font-extrabold text-stone-900">Floor Deployment &amp; Table QR Stands</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 text-stone-600 leading-relaxed">
                <p>
                  Each table has a permanent human-readable URL (e.g. <code>/c/{restaurant?.slug || "cafe"}/t/01</code>). In the <strong>Tables Tab</strong>, you can add tables and click <strong>&quot;Print All Tent Cards 🖨️&quot;</strong> to generate ready-to-fold acrylic table inserts.
                </p>
                <ul className="space-y-1 text-stone-500 list-disc pl-4 pt-1">
                  <li>Table QR stands never expire and work with any standard smartphone camera.</li>
                  <li>Chefs hear spoken announcements immediately on the Kitchen KDS (`/kds`).</li>
                  <li>Cashiers can view all open tables simultaneously on the Cloud POS (`/pos`).</li>
                </ul>
              </div>
            </div>

            {/* 4. GOVERNANCE MODULE C: GOOGLE BUSINESS REVIEW AUTOMATION */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                  C
                </span>
                <h3 className="text-sm font-extrabold text-stone-900">Google Business 5★ Review Capture Setup</h3>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2 text-stone-600 leading-relaxed">
                <p>
                  To maximize your restaurant&apos;s local Google Maps ranking, set your Google Place Review URL in the <strong>Branding Tab</strong>.
                </p>
                <div className="p-3 rounded-xl bg-white border border-stone-200 font-mono text-[11px] text-amber-400">
                  Current Review URL: {restaurant?.google_review_url || "Not configured yet (Add in Branding tab)"}
                </div>
                <p className="text-stone-500">
                  Whenever a guest rates their meal 4★ or 5★ on the live order tracker, or receives a WhatsApp bill, they are 1-click routed directly to leave a 5-star Google review.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS & CAFE GOVERNANCE */}
        {tab === "settings" && (
          <div className="animate-fade-in-up">
            <SettingsTab
              restaurant={restaurant}
              settingsCafeName={settingsCafeName}
              setSettingsCafeName={setSettingsCafeName}
              settingsTaxRate={settingsTaxRate}
              setSettingsTaxRate={setSettingsTaxRate}
              settingsUpiId={settingsUpiId}
              setSettingsUpiId={setSettingsUpiId}
              settingsUpiQrUrl={settingsUpiQrUrl}
              setSettingsUpiQrUrl={setSettingsUpiQrUrl}
              settingsPhone={settingsPhone}
              setSettingsPhone={setSettingsPhone}
              settingsAddress={settingsAddress}
              setSettingsAddress={setSettingsAddress}
              flash={flash}
            />
          </div>
        )}
      </div>

      {/* SINGLE QR STAND MODAL */}
      {qrModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setQrModal(null)}
        >
            <div
            className="bg-white border border-stone-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center border-t-4 border-t-[#D97706]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-2">
              <h3 className="text-sm font-black text-stone-900" style={{fontFamily:"var(--font-heading)"}}>Table {qrModal.label} — Scan to Order</h3>
              <button onClick={() => setQrModal(null)} className="text-stone-500 hover:text-stone-900 text-xs">
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
              <img src={qrModal.url} alt={`QR for Table ${qrModal.label}`} className="w-56 h-56 mx-auto" />
            </div>

            <p className="text-[11px] text-stone-500">
              Scan with any mobile camera to launch digital ordering for Table {qrModal.label}
            </p>

            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs cursor-pointer shadow-md"
            >
              Print Stand Card 🖨️
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowItemModal(false)}
        >
          <div
            className="bg-white border border-stone-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-stone-900">Add Menu Dish</h3>
              <button onClick={() => setShowItemModal(false)} className="text-stone-500 hover:text-stone-900 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Dish Name</label>
                <input
                  className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-100 w-full focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Hazelnut Iced Latte"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input
                    className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-100 w-full focus:outline-none focus:border-amber-500"
                    placeholder="e.g. 240"
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-100 w-full focus:outline-none focus:border-amber-500"
                    value={newItemCatId}
                    onChange={(e) => setNewItemCatId(e.target.value)}
                  >
                    {categoryList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Description (Optional)</label>
                <input
                  className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-100 w-full focus:outline-none focus:border-amber-500"
                  placeholder="Freshly brewed espresso with toasted hazelnut syrup"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-600 font-semibold cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newItemVeg}
                  onChange={(e) => setNewItemVeg(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>🌱 Vegetarian Item</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-700 text-stone-600 font-bold text-xs cursor-pointer border border-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowCatModal(false)}
        >
          <div
            className="bg-white border border-stone-200 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="text-base font-black text-stone-900">Create New Category</h3>
              <button onClick={() => setShowCatModal(false)} className="text-stone-500 hover:text-stone-900 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">Category Name</label>
                <input
                  className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-100 w-full focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Artisanal Breads & Toasts"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-700 text-stone-600 font-bold text-xs cursor-pointer border border-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK MENU CSV / TEXT IMPORT MODAL */}
      {showBulkMenuModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowBulkMenuModal(false)}
        >
          <div
            className="bg-white border border-stone-200 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">📥 Bulk Import Menu Dishes</h3>
                <p className="text-[11px] text-stone-500">
                  Paste raw spreadsheet text or CSV (Format: <code>Dish Name, Price, Category, Veg/Non-Veg, Description</code>)
                </p>
              </div>
              <button onClick={() => setShowBulkMenuModal(false)} className="text-stone-500 hover:text-stone-900 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Sample Preset Shortcut */}
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  Raw CSV / Spreadsheet Text
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const sample = 
`Hazelnut Cold Brew, 220, Beverages, Veg, Slow steeped cold brew with toasted hazelnut
Caramel Macchiato, 240, Beverages, Veg, Fresh espresso with steamed milk & vanilla
Artisan Truffle Pizza, 380, Mains, Veg, Wood-fired sourdough crust with truffle oil
Pesto Genovese Pasta, 320, Mains, Veg, Fresh basil pesto with pine nuts & parmesan
Avocado Sourdough Toast, 240, Breakfast, Veg, Smashed hass avocado on artisan sourdough
Double Chocolate Brownie, 180, Desserts, Veg, Warm fudgy chocolate brownie with ganache`;
                    handleBulkParse(sample);
                  }}
                  className="text-[10px] text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  ⚡ Load 6 Sample Dishes
                </button>
              </div>

              <textarea
                rows={5}
                value={bulkMenuText}
                onChange={(e) => handleBulkParse(e.target.value)}
                placeholder="Hazelnut Cold Brew, 220, Coffee, Veg, Espresso and milk&#10;Truffle Pizza, 380, Food, Veg, Crispy sourdough pizza"
                className="w-full bg-white border border-stone-200 rounded-2xl p-3 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
              ></textarea>

              {/* Live Parsed Preview Table */}
              {parsedBulkItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    ✓ Validated {parsedBulkItems.length} Dishes Ready to Import:
                  </span>
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-stone-200 bg-white/80 p-2 space-y-1">
                    {parsedBulkItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded-lg hover:bg-white border-b border-stone-200/40">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-emerald-400" : "bg-red-400"}`}></span>
                          <span className="font-bold text-stone-900">{item.name}</span>
                          <span className="text-[10px] text-stone-500 font-mono">({item.category})</span>
                        </div>
                        <span className="text-amber-400 font-mono font-bold">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowBulkMenuModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-700 text-stone-600 font-bold text-xs cursor-pointer border border-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImportingMenu || parsedBulkItems.length === 0}
                onClick={handleBulkImportSubmit}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-900 font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
              >
                {isImportingMenu ? "Importing Dishes…" : `Import ${parsedBulkItems.length} Dishes →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* READY-TO-FOLD 80mm TABLE TENT STANDS (BULK PRINT MODAL) */}
      {bulkQrModal && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setBulkQrModal(false)}
        >
          <div
            className="bg-white border border-stone-200 rounded-3xl p-6 max-w-4xl w-full space-y-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-stone-200 pb-3 no-print">
              <div>
                <h3 className="text-base font-black text-stone-900">🖨️ Ready-to-Fold 80mm Table Tent Cards</h3>
                <p className="text-xs text-stone-500">
                  Formatted for standard A4 cardstock or 80mm tabletop acrylic stands
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md cursor-pointer"
                >
                  Print All Stand Cards 🖨️
                </button>
                <button onClick={() => setBulkQrModal(false)} className="text-stone-500 hover:text-stone-900 text-xs px-2">
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Tent Stand Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {bulkQrList.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-white text-stone-950 rounded-3xl p-5 border-2 border-dashed border-stone-300 text-center space-y-3 shadow-lg flex flex-col justify-between"
                >
                  <div className="border-b border-stone-200 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">
                      {restaurant?.name || "QR Café"}
                    </span>
                    <h4 className="text-2xl font-black tracking-tight text-stone-900 mt-0.5">
                      TABLE {t.label}
                    </h4>
                  </div>

                  <div className="p-2 bg-stone-50 rounded-2xl inline-block border border-stone-200 shadow-inner">
                    <img src={t.url} alt={`QR for Table ${t.label}`} className="w-44 h-44 mx-auto" />
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-700">
                    <p className="font-extrabold text-stone-900">📱 Scan with Camera to Order</p>
                    <p className="text-[10px] text-stone-500">1. Scan QR • 2. Select Food • 3. Pay Cash at Counter</p>
                  </div>

                  {/* WiFi Badge */}
                  <div className="p-2 rounded-xl bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-800">
                    📶 WiFi: <strong>{wifiSsid}</strong> | Pass: <strong>{wifiPassword}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
