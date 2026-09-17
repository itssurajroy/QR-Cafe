// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { jsPDF } from "jspdf";
import type { Table } from "@/types";
import {
  printSingleStandCard,
  printBulkStandCards,
  type StandCardTemplate,
  type StandCardSize,
} from "@/lib/print-standee";
import {
  generateBeautifulQrSvg,
  generateBeautifulQrDataUrl,
  svgToPngDataUrl,
  QR_THEMES,
  type QrStyleTheme,
  type QrCenterIcon,
  type QrDotShape,
} from "@/lib/qr-designer";
import {
  PrinterIcon,
  CheckIcon,
  SparklesIcon,
  CoffeeIcon,
  UtensilsIcon,
  QrCodeIcon,
} from "@/components/Icons";

interface PrintStandCardModalProps {
  restaurantName: string;
  tableLabel: string;
  qrDataUrl: string;
  directUrl: string;
  seats?: number;
  wifiSsid?: string;
  wifiPassword?: string;
  onClose: () => void;
  allTables?: Table[];
  restaurantSlug?: string;
  initialMode?: "single" | "bulk";
}

const TEMPLATES: Array<{
  id: StandCardTemplate;
  themeId: QrStyleTheme;
  label: string;
  desc: string;
  badgeBg: string;
  textColor: string;
}> = [
  {
    id: "violet",
    themeId: "violet",
    label: "Electric Violet",
    desc: "QRslice Signature",
    badgeBg: "#5738F5",
    textColor: "#17142B",
  },
  {
    id: "gold",
    themeId: "gold",
    label: "Obsidian & Gold",
    desc: "Luxury Lounge & Bar",
    badgeBg: "#F59E0B",
    textColor: "#F8FAFC",
  },
  {
    id: "minimal",
    themeId: "obsidian",
    label: "Scandi Minimal",
    desc: "Clean B&W / Ink Saver",
    badgeBg: "#0F172A",
    textColor: "#0F172A",
  },
  {
    id: "emerald",
    themeId: "emerald",
    label: "Bistro Emerald",
    desc: "Botanical Trattoria",
    badgeBg: "#059669",
    textColor: "#064E3B",
  },
  {
    id: "terracotta",
    themeId: "terracotta",
    label: "Warm Terracotta",
    desc: "Artisan Coffee & Craft",
    badgeBg: "#EA580C",
    textColor: "#431407",
  },
  {
    id: "tent",
    themeId: "violet",
    label: "Foldable Tent",
    desc: "Dual-Faced Stand",
    badgeBg: "#5738F5",
    textColor: "#17142B",
  },
];

const PAPER_SIZES: Array<{
  id: StandCardSize;
  label: string;
  dims: string;
  recommendedFor: string;
}> = [
  { id: "A6", label: "A6 Acrylic", dims: "105 × 148 mm", recommendedFor: "Standard Acrylic Stand" },
  { id: "A5", label: "A5 Cardstock", dims: "148 × 210 mm", recommendedFor: "Prominent Table Standee" },
  { id: "80mm", label: "80mm Tent", dims: "80 × 120 mm", recommendedFor: "Fold-in-Half Paper Stand" },
  { id: "square", label: "Square Sticker", dims: "90 × 90 mm", recommendedFor: "Table Edge / Coaster" },
];

const CENTER_ICONS: Array<{ id: QrCenterIcon; label: string; icon: string }> = [
  { id: "utensils", label: "Dining", icon: "🍴" },
  { id: "coffee", label: "Café", icon: "☕" },
  { id: "cocktail", label: "Bar", icon: "🍸" },
  { id: "pizza", label: "Pizza", icon: "🍕" },
  { id: "burger", label: "Burger", icon: "🍔" },
  { id: "leaf", label: "Vegan", icon: "🌿" },
  { id: "fire", label: "Grill", icon: "🔥" },
  { id: "sparkles", label: "Gourmet", icon: "✨" },
  { id: "none", label: "None", icon: "▫️" },
];

export function PrintStandCardModal({
  restaurantName,
  tableLabel: initialTableLabel,
  qrDataUrl: initialQrDataUrl,
  directUrl: initialDirectUrl,
  seats: initialSeats = 4,
  wifiSsid: initialWifiSsid = "Guest_WiFi",
  wifiPassword: initialWifiPassword = "welcome123",
  onClose,
  allTables = [],
  restaurantSlug = "cafe",
  initialMode = "single",
}: PrintStandCardModalProps) {
  // Mode: Single table or Batch all tables
  const [mode, setMode] = useState<"single" | "bulk">(
    initialMode === "bulk" && allTables.length > 0 ? "bulk" : "single"
  );

  // Active table in single mode
  const [activeTableLabel, setActiveTableLabel] = useState(initialTableLabel);

  // Current active table object
  const currentTable = useMemo(() => {
    return (
      allTables.find((t) => t.label === activeTableLabel) || {
        id: "active",
        restaurant_id: "",
        label: activeTableLabel,
        seats: initialSeats,
        qr_token: "",
        active: true,
      }
    );
  }, [allTables, activeTableLabel, initialSeats]);

  // Target Table Direct URL
  const origin = typeof window !== "undefined" ? window.location.origin : "https://qrslice.com";
  const activeDirectUrl = useMemo(() => {
    if (activeTableLabel === initialTableLabel && initialDirectUrl) {
      return initialDirectUrl;
    }
    return currentTable.qr_token
      ? `${origin}/t/${currentTable.qr_token}`
      : `${origin}/c/${restaurantSlug}/t/${encodeURIComponent(currentTable.label)}`;
  }, [activeTableLabel, initialTableLabel, initialDirectUrl, currentTable, origin, restaurantSlug]);

  // Design & QR styling options
  const [template, setTemplate] = useState<StandCardTemplate>("violet");
  const [size, setSize] = useState<StandCardSize>("A6");
  const [centerIcon, setCenterIcon] = useState<QrCenterIcon>("utensils");
  const [dotShape, setDotShape] = useState<QrDotShape>("dots");

  // Content Customization
  const [headline, setHeadline] = useState("POINT CAMERA TO ORDER");
  const [subtext, setSubtext] = useState("No app download required • Instant kitchen order");
  const [wifiSsid, setWifiSsid] = useState(initialWifiSsid);
  const [wifiPassword, setWifiPassword] = useState(initialWifiPassword);

  // Toggles
  const [showSteps, setShowSteps] = useState(true);
  const [showWifi, setShowWifi] = useState(true);
  const [showSeats, setShowSeats] = useState(true);
  const [showReviewPrompt, setShowReviewPrompt] = useState(true);
  const [showPaymentBadges, setShowPaymentBadges] = useState(true);
  const [showCutGuides, setShowCutGuides] = useState(true);

  // Preview options
  const [tentPreviewFace, setTentPreviewFace] = useState<"front" | "folded">("front");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Active theme mapping
  const selectedThemeConfig = useMemo(() => {
    const found = TEMPLATES.find((t) => t.id === template);
    const themeKey = found ? found.themeId : "violet";
    return QR_THEMES[themeKey] || QR_THEMES.violet;
  }, [template]);

  // Live Beautiful QR Data URL for the active table
  const activeQrSvg = useMemo(() => {
    return generateBeautifulQrSvg({
      text: activeDirectUrl,
      size: 600,
      theme: selectedThemeConfig === QR_THEMES.gold ? "gold" : (template as QrStyleTheme) || "violet",
      centerIcon,
      dotShape,
      showViewfinder: true,
    });
  }, [activeDirectUrl, selectedThemeConfig, template, centerIcon, dotShape]);

  const activeQrDataUrl = useMemo(() => {
    if (!activeQrSvg) return initialQrDataUrl;
    return `data:image/svg+xml;utf8,${encodeURIComponent(activeQrSvg)}`;
  }, [activeQrSvg, initialQrDataUrl]);

  // Filtered active tables for bulk mode
  const activeTableList = useMemo(() => {
    return allTables.length > 0
      ? allTables.filter((t) => t.active !== false)
      : [
          {
            id: "1",
            restaurant_id: "",
            label: activeTableLabel,
            seats: currentTable.seats || 4,
            qr_token: "",
            active: true,
          } as Table,
        ];
  }, [allTables, activeTableLabel, currentTable]);

  // Handle direct print
  const handlePrint = () => {
    if (mode === "bulk") {
      printBulkStandCards({
        restaurantName,
        tables: activeTableList.map((t) => {
          const tableUrl = t.qr_token
            ? `${origin}/t/${t.qr_token}`
            : `${origin}/c/${restaurantSlug}/t/${encodeURIComponent(t.label)}`;
          return {
            label: t.label,
            seats: t.seats,
            qrDataUrl: generateBeautifulQrDataUrl({
              text: tableUrl,
              size: 400,
              theme: template === "gold" ? "gold" : (template as QrStyleTheme) || "violet",
              centerIcon,
              dotShape,
            }),
            directUrl: tableUrl,
          };
        }),
        wifiSsid: showWifi ? wifiSsid : undefined,
        wifiPassword: showWifi ? wifiPassword : undefined,
        template,
        size,
        headline,
        subtext,
        showSteps,
        showWifi,
        showReviewPrompt,
        showPaymentBadges,
      });
    } else {
      printSingleStandCard({
        restaurantName,
        tableLabel: activeTableLabel,
        qrDataUrl: activeQrDataUrl,
        directUrl: activeDirectUrl,
        seats: currentTable.seats,
        wifiSsid: showWifi ? wifiSsid : undefined,
        wifiPassword: showWifi ? wifiPassword : undefined,
        template,
        size,
        headline,
        subtext,
        showSteps,
        showWifi,
        showReviewPrompt,
        showPaymentBadges,
        showCutGuides,
        showSeats,
      });
    }
  };

  // Download High-Resolution Vector PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      const isA5 = size === "A5";
      const isSquare = size === "square";

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: isA5 ? "a5" : isSquare ? [90, 90] : "a6",
      });

      const tablesToRender = mode === "bulk" ? activeTableList : [currentTable];

      for (let i = 0; i < tablesToRender.length; i++) {
        const tbl = tablesToRender[i];
        if (i > 0) doc.addPage();

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const centerX = pageWidth / 2;

        const isGold = template === "gold";
        const isMinimal = template === "minimal";
        const isEmerald = template === "emerald";
        const isTerracotta = template === "terracotta";

        // Background fill
        if (isGold) {
          doc.setFillColor(11, 15, 25);
        } else if (isEmerald) {
          doc.setFillColor(248, 250, 248);
        } else if (isTerracotta) {
          doc.setFillColor(255, 253, 249);
        } else {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(0, 0, pageWidth, pageHeight, "F");

        // Outer Frame Border
        const margin = 6;
        if (isGold) {
          doc.setDrawColor(245, 158, 11);
        } else if (isEmerald) {
          doc.setDrawColor(5, 150, 105);
        } else if (isTerracotta) {
          doc.setDrawColor(234, 88, 12);
        } else if (isMinimal) {
          doc.setDrawColor(15, 23, 42);
        } else {
          doc.setDrawColor(87, 56, 245);
        }
        doc.setLineWidth(1.2);
        doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 5, 5, "S");

        let cursorY = margin + 10;

        // Top Tag
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        if (isGold) doc.setTextColor(245, 158, 11);
        else if (isEmerald) doc.setTextColor(5, 150, 105);
        else if (isTerracotta) doc.setTextColor(234, 88, 12);
        else if (isMinimal) doc.setTextColor(71, 85, 105);
        else doc.setTextColor(87, 56, 245);
        doc.text("TABLE MENU & PAY", centerX, cursorY, { align: "center" });

        cursorY += 7;

        // Restaurant Name
        doc.setFontSize(isA5 ? 18 : 13);
        if (isGold) doc.setTextColor(248, 250, 252);
        else if (isEmerald) doc.setTextColor(6, 78, 59);
        else if (isTerracotta) doc.setTextColor(67, 20, 7);
        else doc.setTextColor(23, 20, 43);
        doc.text(restaurantName.toUpperCase(), centerX, cursorY, { align: "center" });

        cursorY += 7;

        // TABLE Badge
        const badgeW = isA5 ? 40 : 32;
        if (isGold) doc.setFillColor(245, 158, 11);
        else if (isEmerald) doc.setFillColor(5, 150, 105);
        else if (isTerracotta) doc.setFillColor(234, 88, 12);
        else if (isMinimal) doc.setFillColor(15, 23, 42);
        else doc.setFillColor(87, 56, 245);

        doc.roundedRect(centerX - badgeW / 2, cursorY, badgeW, 7.5, 3, 3, "F");
        doc.setTextColor(isGold ? 15 : 255, isGold ? 23 : 255, isGold ? 42 : 255);
        doc.setFontSize(isA5 ? 10 : 8.5);
        doc.text(`TABLE ${tbl.label}`, centerX, cursorY + 5.2, { align: "center" });

        cursorY += 12;

        // QR Code Image
        const qrDim = isA5 ? 65 : isSquare ? 45 : 48;
        const tableUrl = tbl.qr_token
          ? `${origin}/t/${tbl.qr_token}`
          : `${origin}/c/${restaurantSlug}/t/${encodeURIComponent(tbl.label)}`;

        const itemSvg = generateBeautifulQrSvg({
          text: tableUrl,
          size: 500,
          theme: template === "gold" ? "gold" : (template as QrStyleTheme) || "violet",
          centerIcon,
          dotShape,
        });

        const pngData = await svgToPngDataUrl(itemSvg, 800, 800);
        if (pngData) {
          doc.addImage(pngData, "PNG", centerX - qrDim / 2, cursorY, qrDim, qrDim);
        }

        cursorY += qrDim + 7;

        // Headline
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isA5 ? 11 : 8.5);
        if (isGold) doc.setTextColor(248, 250, 252);
        else doc.setTextColor(23, 20, 43);
        doc.text(headline, centerX, cursorY, { align: "center" });

        cursorY += 4.5;

        // Subtext
        doc.setFont("helvetica", "normal");
        doc.setFontSize(isA5 ? 8 : 6.5);
        doc.setTextColor(isGold ? 148 : 111, isGold ? 163 : 113, isGold ? 184 : 133);
        doc.text(subtext, centerX, cursorY, { align: "center" });

        cursorY += 6;

        // Steps
        if (showSteps && !isSquare) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(isGold ? 203 : 87, isGold ? 213 : 56, isGold ? 225 : 245);
          doc.text("1. Scan QR   →   2. Pick Dishes   →   3. Instant Pay", centerX, cursorY, { align: "center" });
          cursorY += 5.5;
        }

        // WiFi
        if (showWifi && wifiSsid) {
          doc.setFontSize(6.5);
          doc.setTextColor(isGold ? 148 : 71, isGold ? 163 : 85, isGold ? 184 : 105);
          doc.text(`WiFi: ${wifiSsid}${wifiPassword ? ` | Pass: ${wifiPassword}` : ""}`, centerX, cursorY, { align: "center" });
          cursorY += 5.5;
        }

        // Footer
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        doc.text(`qrslice.com • Table ${tbl.label}`, centerX, pageHeight - margin - 3, { align: "center" });
      }

      doc.save(
        mode === "bulk"
          ? `${restaurantName.replace(/\s+/g, "_")}_All_Tables_StandCards.pdf`
          : `${restaurantName.replace(/\s+/g, "_")}_Table_${activeTableLabel}_StandCard.pdf`
      );
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Download High-Res 300 DPI PNG
  const handleDownloadPng = async () => {
    try {
      setIsExporting(true);
      const pngUrl = await svgToPngDataUrl(activeQrSvg, 1800, 1800);
      if (!pngUrl) return;
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `${restaurantName.replace(/\s+/g, "_")}_Table_${activeTableLabel}_QR_300DPI.png`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  // Download Lossless Vector SVG
  const handleDownloadSvg = () => {
    if (!activeQrSvg) return;
    const blob = new Blob([activeQrSvg], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${restaurantName.replace(/\s+/g, "_")}_Table_${activeTableLabel}_QR_Vector.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const isGold = template === "gold";
  const isMinimal = template === "minimal";
  const isEmerald = template === "emerald";
  const isTerracotta = template === "terracotta";
  const isTent = template === "tent";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP BAR: TITLE + MODE SELECTOR + CLOSE */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEEAFE] flex items-center justify-center text-[#5738F5]">
              <QrCodeIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#5738F5]">
                TABLE STAND CARD &amp; QR STUDIO
              </span>
              <h2 className="text-lg font-black text-[#17142B] tracking-tight flex items-center gap-2">
                <span>{restaurantName}</span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-200/80 text-slate-700 font-mono text-xs font-black">
                  Table {activeTableLabel}
                </span>
              </h2>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            {allTables.length > 0 && (
              <div className="p-1 bg-white rounded-2xl border border-slate-200 flex items-center text-xs font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setMode("single")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    mode === "single"
                      ? "bg-[#5738F5] text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Single Card
                </button>
                <button
                  type="button"
                  onClick={() => setMode("bulk")}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    mode === "bulk"
                      ? "bg-[#5738F5] text-white shadow-xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>All Tables</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      mode === "bulk" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {activeTableList.length}
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs cursor-pointer shadow-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* MAIN BODY: SPLIT VIEW (CONTROLS LEFT, LIVE PREVIEW RIGHT) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
          {/* LEFT COLUMN: CUSTOMIZATION CONTROLS */}
          <div className="w-full lg:w-7/12 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-6 overflow-y-auto">
            {/* Table Selector (in single mode when allTables provided) */}
            {mode === "single" && allTables.length > 1 && (
              <div className="p-3 bg-[#EEEAFE]/40 rounded-2xl border border-[#5738F5]/20 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#17142B]">Switch Table:</span>
                <select
                  value={activeTableLabel}
                  onChange={(e) => setActiveTableLabel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 font-mono font-bold text-xs text-[#17142B] focus:outline-none focus:border-[#5738F5] cursor-pointer"
                >
                  {allTables.map((t) => (
                    <option key={t.id} value={t.label}>
                      Table {t.label} ({t.seats || 4} seats)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SECTION 1: TEMPLATE PALETTES */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                  1. Visual Style &amp; Theme
                </label>
                <span className="text-[10px] font-bold text-[#5738F5]">6 Handcrafted Themes</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATES.map((t) => {
                  const isSelected = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTemplate(t.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? "border-[#5738F5] bg-[#EEEAFE]/40 shadow-xs ring-2 ring-[#5738F5]/20 font-black"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: t.badgeBg }}
                        />
                        <div className="text-xs font-black text-[#17142B] truncate">{t.label}</div>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: CARDSTOCK PAPER SIZE */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                2. Cardstock Paper Size
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PAPER_SIZES.map((s) => {
                  const isSelected = size === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSize(s.id)}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#5738F5] bg-[#EEEAFE]/40 shadow-xs ring-2 ring-[#5738F5]/20 font-black"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="text-xs font-extrabold text-[#17142B]">{s.label}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{s.dims}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: QR STYLING (CENTER EMBLEM & DOTS) */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                3. QR Center Emblem &amp; Pattern
              </label>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {CENTER_ICONS.map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setCenterIcon(ic.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        centerIcon === ic.id
                          ? "border-[#5738F5] bg-[#5738F5] text-white shadow-xs font-black"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>{ic.icon}</span>
                      <span>{ic.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500">Dot Matrix:</span>
                  {(["dots", "rounded", "classy"] as QrDotShape[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDotShape(d)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        dotShape === d
                          ? "bg-slate-900 text-white font-black"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 4: CARD HEADLINE & SUBTEXT */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                4. Custom Headlines &amp; Call-to-Action
              </label>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "POINT CAMERA TO ORDER",
                    "SCAN FOR DIGITAL MENU & PAY",
                    "CONTACTLESS TABLE SERVICE",
                    "ORDER & PAY FROM YOUR PHONE",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHeadline(preset)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        headline === preset
                          ? "bg-[#5738F5] text-white font-black"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Card Headline"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#17142B] font-bold focus:outline-none focus:border-[#5738F5] focus:bg-white"
                />

                <input
                  type="text"
                  value={subtext}
                  onChange={(e) => setSubtext(e.target.value)}
                  placeholder="Subtext"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-none focus:border-[#5738F5] focus:bg-white"
                />
              </div>
            </div>

            {/* SECTION 5: WI-FI & FEATURE TOGGLES */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                5. Badges &amp; Print Features
              </label>

              {/* WiFi Inputs */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17142B] flex items-center gap-1.5">
                    <span>📶</span>
                    <span>Display Guest Wi-Fi Credentials</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showWifi}
                    onChange={(e) => setShowWifi(e.target.checked)}
                    className="w-4 h-4 accent-[#5738F5] rounded cursor-pointer"
                  />
                </div>

                {showWifi && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="WiFi Network Name (SSID)"
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#17142B] font-mono focus:outline-none focus:border-[#5738F5]"
                    />
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="WiFi Password"
                      className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-[#17142B] font-mono focus:outline-none focus:border-[#5738F5]"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSteps}
                    onChange={(e) => setShowSteps(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#5738F5] rounded"
                  />
                  <span className="font-bold text-slate-700">3-Step Order Guide</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSeats}
                    onChange={(e) => setShowSeats(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#5738F5] rounded"
                  />
                  <span className="font-bold text-slate-700">Guest Seats Badge</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReviewPrompt}
                    onChange={(e) => setShowReviewPrompt(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#5738F5] rounded"
                  />
                  <span className="font-bold text-slate-700">5★ Review Prompt</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPaymentBadges}
                    onChange={(e) => setShowPaymentBadges(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#5738F5] rounded"
                  />
                  <span className="font-bold text-slate-700">Payment Badges (UPI)</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE INTERACTIVE PREVIEW */}
          <div className="w-full lg:w-5/12 p-6 bg-slate-100/80 flex flex-col justify-between items-center space-y-4">
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                LIVE PRINT PREVIEW ({size})
              </span>

              {isTent && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTentPreviewFace("front")}
                    className={`px-2 py-0.5 rounded-lg ${
                      tentPreviewFace === "front" ? "bg-[#5738F5] text-white" : "text-slate-600"
                    }`}
                  >
                    Front Face
                  </button>
                  <button
                    type="button"
                    onClick={() => setTentPreviewFace("folded")}
                    className={`px-2 py-0.5 rounded-lg ${
                      tentPreviewFace === "folded" ? "bg-[#5738F5] text-white" : "text-slate-600"
                    }`}
                  >
                    Foldable Flat Sheet
                  </button>
                </div>
              )}
            </div>

            {/* LIVE CARD DISPLAY */}
            <div className="my-auto py-2 flex items-center justify-center w-full">
              {isTent && tentPreviewFace === "folded" ? (
                /* Foldable Sheet Preview */
                <div
                  className={`w-[260px] rounded-3xl p-4 border-2 text-center space-y-3 shadow-xl ${
                    isGold
                      ? "bg-[#0B0F19] text-white border-amber-500"
                      : "bg-white text-[#17142B] border-[#5738F5]"
                  }`}
                >
                  <div className="text-[8px] font-mono opacity-50">TOP FACE (ROTATED)</div>
                  <div className="scale-75 origin-center opacity-60">
                    <div className="text-xs font-black uppercase">{restaurantName}</div>
                    <div className="text-[9px] font-mono">TABLE {activeTableLabel}</div>
                    <div className="bg-white p-1.5 rounded-xl inline-block my-1">
                      <Image
                        src={activeQrDataUrl}
                        alt="QR"
                        width={80}
                        height={80}
                        unoptimized
                        className="w-20 h-20"
                      />
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-[#5738F5] py-1 text-[8px] font-black text-[#5738F5] tracking-widest">
                    ✂ - - - FOLD HERE - - - ✂
                  </div>

                  <div className="scale-90 origin-center">
                    <div className="text-xs font-black uppercase">{restaurantName}</div>
                    <div className="text-[9px] font-mono">TABLE {activeTableLabel}</div>
                    <div className="bg-white p-1.5 rounded-xl inline-block my-1 shadow-xs">
                      <Image
                        src={activeQrDataUrl}
                        alt="QR"
                        width={90}
                        height={90}
                        unoptimized
                        className="w-24 h-24"
                      />
                    </div>
                    <div className="text-[9px] font-black uppercase">{headline}</div>
                  </div>
                </div>
              ) : (
                /* Single Card Preview */
                <div
                  className={`w-[260px] sm:w-[280px] rounded-3xl p-5 border-2 text-center space-y-3 shadow-2xl transition-all ${
                    isGold
                      ? "bg-[#0B0F19] text-white border-amber-500 shadow-amber-500/10"
                      : isEmerald
                      ? "bg-[#F8FAF8] text-[#064E3B] border-[#059669] shadow-emerald-500/10"
                      : isTerracotta
                      ? "bg-[#FFFDF9] text-[#431407] border-[#C2410C] shadow-orange-500/10"
                      : isMinimal
                      ? "bg-white text-[#0F172A] border-[#0F172A] shadow-slate-300"
                      : "bg-white text-[#17142B] border-[#5738F5] shadow-violet-500/15"
                  }`}
                >
                  <div
                    className={`inline-block text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                      isGold
                        ? "bg-amber-500/20 text-amber-300"
                        : isEmerald
                        ? "bg-emerald-100 text-emerald-800"
                        : isTerracotta
                        ? "bg-orange-100 text-orange-900"
                        : isMinimal
                        ? "bg-slate-100 text-slate-700"
                        : "bg-[#EEEAFE] text-[#5738F5]"
                    }`}
                  >
                    TABLE MENU &amp; PAY
                  </div>

                  <div className="text-sm font-black uppercase tracking-tight truncate">
                    {restaurantName}
                  </div>

                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={`inline-block font-mono font-black text-xs px-3 py-1 rounded-xl tracking-wider ${
                        isGold
                          ? "bg-amber-400 text-slate-900"
                          : isEmerald
                          ? "bg-[#059669] text-white"
                          : isTerracotta
                          ? "bg-[#EA580C] text-white"
                          : isMinimal
                          ? "bg-slate-900 text-white"
                          : "bg-[#5738F5] text-white"
                      }`}
                    >
                      TABLE {activeTableLabel}
                    </span>
                    {showSeats && (
                      <span className="text-[10px] font-bold opacity-70 px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/10">
                        {currentTable.seats || 4} Seats
                      </span>
                    )}
                  </div>

                  {/* QR Box */}
                  <div className="bg-white p-2 rounded-2xl inline-block border border-slate-200 shadow-inner">
                    <Image
                      src={activeQrDataUrl}
                      alt={`QR Table ${activeTableLabel}`}
                      width={160}
                      height={160}
                      unoptimized
                      className="w-36 h-36 mx-auto rounded-lg"
                    />
                  </div>

                  <div className="text-[10px] font-black uppercase tracking-wide truncate">
                    {headline}
                  </div>

                  <div className="text-[8.5px] opacity-70 truncate">{subtext}</div>

                  {/* Step Guide */}
                  {showSteps && size !== "square" && (
                    <div
                      className={`text-[8px] font-bold py-1 px-2 rounded-lg flex items-center justify-around ${
                        isGold
                          ? "bg-slate-800 text-slate-300"
                          : isEmerald
                          ? "bg-emerald-50 text-emerald-800"
                          : isTerracotta
                          ? "bg-orange-50 text-orange-900"
                          : isMinimal
                          ? "bg-slate-50 text-slate-600"
                          : "bg-[#EEEAFE]/60 text-[#5738F5]"
                      }`}
                    >
                      <span>1. Scan</span>
                      <span>→</span>
                      <span>2. Select</span>
                      <span>→</span>
                      <span>3. Pay</span>
                    </div>
                  )}

                  {/* WiFi */}
                  {showWifi && wifiSsid && (
                    <div
                      className={`text-[8px] font-mono py-1 px-2 rounded-lg truncate ${
                        isGold ? "bg-slate-800/80 text-amber-300" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      📶 WiFi: <strong>{wifiSsid}</strong>
                    </div>
                  )}

                  <div className="text-[7.5px] font-mono opacity-50 pt-1 border-t border-slate-200/50">
                    qrslice.com • Table {activeTableLabel}
                  </div>
                </div>
              )}
            </div>

            {/* DIRECT URL STRIP */}
            <div className="w-full bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Target Table URL
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(activeDirectUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="text-[10px] font-bold text-[#5738F5] hover:underline cursor-pointer"
                >
                  {copiedLink ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
              <p className="font-mono text-[10px] text-slate-700 truncate">{activeDirectUrl}</p>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION TOOLBAR */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25 transition-all cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>
                {mode === "bulk"
                  ? `Print All ${activeTableList.length} Stand Cards`
                  : `Print Table ${activeTableLabel} Stand Card`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 text-center whitespace-nowrap"
            >
              {isExporting ? "Generating PDF…" : "Download Vector PDF"}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              300 DPI PNG
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer"
            >
              Vector SVG
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
