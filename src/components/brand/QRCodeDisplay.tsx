// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { jsPDF } from "jspdf";
import { QrSliceLogo } from "./QrSliceLogo";
import {
  generateBeautifulQrSvg,
  generateBeautifulQrDataUrl,
  svgToPngDataUrl,
  QR_THEMES,
  type QrStyleTheme,
  type QrCenterIcon,
  type QrDotShape,
} from "@/lib/qr-designer";
import { printSingleStandCard } from "@/lib/print-standee";

interface QRCodeDisplayProps {
  url: string;
  restaurantName?: string;
  tableLabel?: string;
  seats?: number;
  showSignage?: boolean;
  onPrint?: () => void;
  className?: string;
  defaultTheme?: QrStyleTheme;
}

export function QRCodeDisplay({
  url,
  restaurantName = "QRslice",
  tableLabel = "01",
  seats = 4,
  showSignage = false,
  onPrint,
  className = "",
  defaultTheme = "violet",
}: QRCodeDisplayProps) {
  const [theme, setTheme] = useState<QrStyleTheme>(defaultTheme);
  const [centerIcon, setCenterIcon] = useState<QrCenterIcon>("utensils");
  const [dotShape, setDotShape] = useState<QrDotShape>("dots");
  const [standeeStyle, setStandeeStyle] = useState<"card" | "tent" | "badge">("card");
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  // Generate SVG string
  const svgString = useMemo(() => {
    if (!url) return "";
    return generateBeautifulQrSvg({
      text: url,
      size: 500,
      theme,
      centerIcon,
      dotShape,
      showViewfinder: true,
    });
  }, [url, theme, centerIcon, dotShape]);

  // Data URL for direct <img> display
  const dataUrl = useMemo(() => {
    if (!svgString) return "";
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  }, [svgString]);

  const activeColors = QR_THEMES[theme] || QR_THEMES.violet;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDownloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${restaurantName.replace(/\s+/g, "_")}_Table_${tableLabel}_QR.svg`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleDownloadPNG = async () => {
    if (!svgString) return;
    setIsGeneratingPng(true);
    const pngUrl = await svgToPngDataUrl(svgString, 1200, 1200);
    setIsGeneratingPng(false);
    if (!pngUrl) return;
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `${restaurantName.replace(/\s+/g, "_")}_Table_${tableLabel}_QR_1200px.png`;
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!svgString) return;
    setIsGeneratingPng(true);
    const pngUrl = await svgToPngDataUrl(svgString, 1000, 1000);
    setIsGeneratingPng(false);
    if (!pngUrl) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;
    let cursorY = 32;

    // Card Outer Border
    doc.setDrawColor(30, 27, 75);
    doc.setLineWidth(1.5);
    doc.roundedRect(24, 20, pageWidth - 48, 252, 10, 10, "S");

    // "WELCOME TO"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(87, 56, 245);
    doc.text("WELCOME TO", centerX, cursorY, { align: "center" });

    cursorY += 12;

    // Restaurant Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(23, 20, 43);
    doc.text(restaurantName.toUpperCase(), centerX, cursorY, { align: "center" });

    cursorY += 16;

    // TABLE Badge
    doc.setFillColor(23, 20, 43);
    doc.roundedRect(centerX - 32, cursorY, 64, 12, 6, 6, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`TABLE ${tableLabel.padStart(2, "0")}`, centerX, cursorY + 8.5, { align: "center" });

    cursorY += 28;

    // SCAN TO ORDER
    doc.setTextColor(23, 20, 43);
    doc.setFontSize(16);
    doc.text("SCAN CAMERA TO ORDER & PAY", centerX, cursorY, { align: "center" });

    cursorY += 10;

    // Beautiful High-Res QR Code Image
    const qrSize = 110;
    doc.addImage(pngUrl, "PNG", centerX - qrSize / 2, cursorY, qrSize, qrSize);

    cursorY += qrSize + 16;

    // Steps
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(87, 56, 245);
    doc.text("1. Scan QR Code   •   2. Browse Menu   •   3. Order & Pay", centerX, cursorY, { align: "center" });

    cursorY += 10;

    // Instructions
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(111, 113, 133);
    doc.text("Works with any mobile camera  •  No app download needed", centerX, cursorY, { align: "center" });

    cursorY += 18;

    // Powered By
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 165);
    doc.text("POWERED BY QRSLICE", centerX, cursorY, { align: "center" });

    // Save PDF
    doc.save(`${restaurantName.replace(/\s+/g, "_")}_Table_${tableLabel}_Standee.pdf`);
  };

  // Compact Preview Mode (used in small card views)
  if (!showSignage) {
    return (
      <div className={`flex flex-col items-center gap-3 p-5 bg-white rounded-3xl border border-[#E7E4F0] shadow-xs ${className}`}>
        <div className="relative p-2 bg-slate-50 border border-slate-100 rounded-2xl shadow-inner">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`Table ${tableLabel} QR Code`}
              className="w-48 h-48 rounded-xl shadow-xs transition-transform hover:scale-[1.02]"
            />
          ) : (
            <div className="w-48 h-48 rounded-xl bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-400">
              Generating QR…
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="font-mono font-black text-base text-[#17142B]">
            TABLE {tableLabel.padStart(2, "0")}
          </div>
          <div className="text-xs text-[#6F7185] font-semibold mt-0.5">{seats} Seats Capacity</div>
        </div>

        <div className="flex items-center gap-2 w-full pt-1">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPng}
            className="flex-1 py-2 px-3 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isGeneratingPng ? "Preparing…" : "PDF Standee"}
          </button>
          <button
            type="button"
            onClick={copyUrl}
            className="py-2 px-3 rounded-xl bg-[#EEEAFE] hover:bg-purple-100 text-[#5738F5] text-xs font-bold transition-all cursor-pointer"
          >
            {copySuccess ? "Copied! ✓" : "Copy Link"}
          </button>
        </div>
      </div>
    );
  }

  // Full Designer Signage Studio Template
  return (
    <div className={`space-y-6 max-w-xl mx-auto ${className}`}>
      {/* Studio Styling Controls (no-print) */}
      <div className="no-print bg-slate-50 p-4 rounded-3xl border border-slate-200/80 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-[#17142B] flex items-center gap-1.5">
            <span>✨ Custom Designer Palette</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Click to change theme</span>
        </div>

        {/* Theme Pills */}
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(QR_THEMES) as QrStyleTheme[]).map((tKey) => {
            const tColor = QR_THEMES[tKey];
            const isSelected = theme === tKey;
            return (
              <button
                key={tKey}
                type="button"
                onClick={() => setTheme(tKey)}
                className={`p-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? "border-[#5738F5] bg-white shadow-sm ring-2 ring-[#5738F5]/20 font-black"
                    : "border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shadow-xs border border-white"
                  style={{ background: `linear-gradient(135deg, ${tColor.dotStart}, ${tColor.dotEnd})` }}
                />
                <span className="text-[10px] truncate max-w-full font-bold">{tColor.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Center Emblem & Dot Shape Toggles */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Center Emblem
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: "utensils", label: "Dining" },
                { id: "coffee", label: "Coffee" },
                { id: "sparkles", label: "Sparkle" },
                { id: "none", label: "Plain" },
              ].map((ic) => (
                <button
                  key={ic.id}
                  type="button"
                  onClick={() => setCenterIcon(ic.id as QrCenterIcon)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                    centerIcon === ic.id
                      ? "bg-[#5738F5] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {ic.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Module Style
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: "dots", label: "Dots" },
                { id: "rounded", label: "Squircle" },
                { id: "classy", label: "Clean" },
              ].map((ds) => (
                <button
                  key={ds.id}
                  type="button"
                  onClick={() => setDotShape(ds.id as QrDotShape)}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                    dotShape === ds.id
                      ? "bg-[#5738F5] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {ds.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Standee Showcase Preview Container */}
      <div
        className={`print-container standee-print rounded-3xl p-8 max-w-sm mx-auto text-center shadow-xl space-y-6 transition-all duration-300 relative border-2 ${
          theme === "gold"
            ? "bg-[#0F172A] text-white border-amber-500/40 shadow-amber-500/10"
            : "bg-white text-[#17142B] border-slate-200 shadow-slate-200/50"
        }`}
      >
        {/* Subtle decorative top badge */}
        <div className="flex justify-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              theme === "gold"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-[#EEEAFE] text-[#5738F5]"
            }`}
          >
            <span>TABLE MENU & PAY</span>
          </div>
        </div>

        {/* Restaurant Header */}
        <div className="space-y-1 border-b border-slate-100 pb-4">
          <h2
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {restaurantName}
          </h2>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span
              className={`px-3 py-1 rounded-xl font-mono font-black text-xs uppercase tracking-wider ${
                theme === "gold"
                  ? "bg-amber-400 text-slate-900"
                  : "bg-[#17142B] text-white"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            >
              TABLE {tableLabel.padStart(2, "0")}
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">{seats} Seats</span>
          </div>
        </div>

        {/* Main High-Res Vector QR Code */}
        <div className="space-y-3">
          <div className="relative p-3 rounded-3xl inline-block transition-transform hover:scale-[1.01]">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt={`Table ${tableLabel} QR Code`}
                className="w-56 h-56 mx-auto rounded-2xl drop-shadow-md"
              />
            ) : (
              <div className="w-56 h-56 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-400">
                Rendering vector…
              </div>
            )}
          </div>

          <div className="space-y-1">
            <p
              className={`text-xs font-extrabold uppercase tracking-wider ${
                theme === "gold" ? "text-amber-400" : "text-[#17142B]"
              }`}
            >
              Point Phone Camera to Order
            </p>
            <p className="text-[11px] text-slate-400 font-medium">
              No app download required • Pay with UPI or Card
            </p>
          </div>
        </div>

        {/* 3 Step Ordering Pill */}
        <div
          className={`py-2 px-3 rounded-2xl flex items-center justify-around text-[10px] font-bold ${
            theme === "gold"
              ? "bg-slate-800 text-slate-300 border border-slate-700"
              : "bg-slate-50 text-slate-600 border border-slate-100"
          }`}
        >
          <span>1. Scan</span>
          <span>→</span>
          <span>2. Select</span>
          <span>→</span>
          <span>3. Enjoy</span>
        </div>

        {/* Footer Branding */}
        <div className="pt-2 flex items-center justify-center gap-1.5 opacity-70">
          <span className="text-[10px] text-slate-400 font-medium">Digital Table by</span>
          <QrSliceLogo size="sm" />
        </div>
      </div>

      {/* Action Download & Print Bar (no-print) */}
      <div className="no-print grid grid-cols-3 gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => {
            if (onPrint) {
              onPrint();
            } else {
              printSingleStandCard({
                restaurantName,
                tableLabel,
                qrDataUrl: dataUrl,
                directUrl: url,
                seats,
              });
            }
          }}
          className="py-2.5 px-3 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs shadow-md shadow-violet-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>Print Standee 🖨️</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPng}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span>{isGeneratingPng ? "Building…" : "Download PDF"}</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPNG}
          disabled={isGeneratingPng}
          className="py-2.5 px-3 rounded-xl bg-[#EEEAFE] hover:bg-purple-100 text-[#5738F5] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <span>HD PNG (1200px)</span>
        </button>
      </div>

      {/* Copy link bar */}
      <div className="no-print flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 text-xs">
        <span className="font-mono text-slate-500 truncate max-w-[280px]">{url}</span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownloadSVG}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
          >
            SVG Vector
          </button>
          <button
            type="button"
            onClick={copyUrl}
            className="px-2.5 py-1 rounded-lg bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-[11px] cursor-pointer"
          >
            {copySuccess ? "Copied! ✓" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
