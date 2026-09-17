// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { jsPDF } from "jspdf";
import {
  printSingleStandCard,
  type StandCardTemplate,
  type StandCardSize,
} from "@/lib/print-standee";
import { PrinterIcon, CheckIcon } from "@/components/Icons";

interface PrintStandCardModalProps {
  restaurantName: string;
  tableLabel: string;
  qrDataUrl: string;
  directUrl: string;
  seats?: number;
  wifiSsid?: string;
  wifiPassword?: string;
  onClose: () => void;
}

export function PrintStandCardModal({
  restaurantName,
  tableLabel,
  qrDataUrl,
  directUrl,
  seats,
  wifiSsid,
  wifiPassword,
  onClose,
}: PrintStandCardModalProps) {
  const [template, setTemplate] = useState<StandCardTemplate>("standard");
  const [size, setSize] = useState<StandCardSize>("A6");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Handle direct iframe printing
  const handlePrint = () => {
    printSingleStandCard({
      restaurantName,
      tableLabel,
      qrDataUrl,
      directUrl,
      seats,
      wifiSsid,
      wifiPassword,
      template,
      size,
    });
  };

  // Download PDF matching the selected template & size
  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const isA5 = size === "A5";
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: isA5 ? "a5" : "a6",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const centerX = pageWidth / 2;

      const isPremium = template === "premium";
      const isMinimal = template === "minimal";

      // Background
      if (isPremium) {
        doc.setFillColor(11, 15, 25);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
      }

      // Outer Card Border
      const margin = 8;
      doc.setDrawColor(isPremium ? 245 : 15, isPremium ? 158 : 23, isPremium ? 11 : 42);
      doc.setLineWidth(1.2);
      doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 6, 6, "S");

      let cursorY = margin + 12;

      // Tag
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(isPremium ? 245 : isMinimal ? 100 : 87, isPremium ? 158 : isMinimal ? 116 : 56, isPremium ? 11 : isMinimal ? 139 : 245);
      doc.text(isMinimal ? "SCAN TO ORDER" : "TABLE MENU & PAY", centerX, cursorY, { align: "center" });

      cursorY += 8;

      // Restaurant Name
      doc.setFontSize(isA5 ? 20 : 14);
      doc.setTextColor(isPremium ? 248 : 23, isPremium ? 250 : 20, isPremium ? 252 : 43);
      doc.text(restaurantName.toUpperCase(), centerX, cursorY, { align: "center" });

      cursorY += 8;

      // TABLE Badge
      doc.setFillColor(isPremium ? 245 : 23, isPremium ? 158 : 20, isPremium ? 11 : 43);
      const badgeW = isA5 ? 42 : 32;
      doc.roundedRect(centerX - badgeW / 2, cursorY, badgeW, 8, 4, 4, "F");
      doc.setTextColor(isPremium ? 15 : 255, isPremium ? 23 : 255, isPremium ? 42 : 255);
      doc.setFontSize(isA5 ? 12 : 9);
      doc.text(`TABLE ${tableLabel}`, centerX, cursorY + 5.5, { align: "center" });

      cursorY += 14;

      // QR Code Image
      const qrDim = isA5 ? 70 : 48;
      try {
        doc.addImage(qrDataUrl, "PNG", centerX - qrDim / 2, cursorY, qrDim, qrDim);
      } catch {
        // fallback if data url is svg
      }

      cursorY += qrDim + 8;

      // CTA text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(isA5 ? 12 : 9);
      doc.setTextColor(isPremium ? 248 : 23, isPremium ? 250 : 20, isPremium ? 252 : 43);
      doc.text("POINT PHONE CAMERA TO ORDER", centerX, cursorY, { align: "center" });

      cursorY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(isA5 ? 9 : 7);
      doc.setTextColor(isPremium ? 148 : 111, isPremium ? 163 : 113, isPremium ? 184 : 133);
      doc.text("No app download required • Instant kitchen order", centerX, cursorY, { align: "center" });

      cursorY += 8;

      if (!isMinimal) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(isPremium ? 203 : 100, isPremium ? 213 : 116, isPremium ? 225 : 139);
        doc.text("1. Scan QR   →   2. Select Food   →   3. Order & Pay", centerX, cursorY, { align: "center" });
        cursorY += 6;
      }

      if (wifiSsid) {
        doc.setFontSize(6.5);
        doc.setTextColor(isPremium ? 148 : 71, isPremium ? 163 : 85, isPremium ? 184 : 105);
        doc.text(`WiFi: ${wifiSsid}${wifiPassword ? ` | Pass: ${wifiPassword}` : ""}`, centerX, cursorY, { align: "center" });
        cursorY += 6;
      }

      // Footer
      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text(`qrslice.com • Table ${tableLabel}`, centerX, pageHeight - margin - 3, { align: "center" });

      doc.save(`${restaurantName.replace(/\s+/g, "_")}_Table_${tableLabel}_StandCard.pdf`);
    } catch {
      // ignore
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isPremium = template === "premium";
  const isMinimal = template === "minimal";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT COLUMN: CONTROLS & OPTIONS */}
        <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5738F5]">
                  PRINT STAND CARD
                </span>
                <h3 className="text-xl font-black text-[#17142B]">Table {tableLabel}</h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-black">
                {seats ? `${seats} Seats` : "Dine-In"}
              </span>
            </div>

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Select Template Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "standard", label: "Standard", desc: "Classic Purple" },
                  { id: "minimal", label: "Minimal", desc: "Clean B&W" },
                  { id: "premium", label: "Premium", desc: "Luxury Dark" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as StandCardTemplate)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      template === t.id
                        ? "border-[#5738F5] bg-[#EEEAFE]/40 shadow-xs ring-2 ring-[#5738F5]/20 font-black"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-[#17142B]">{t.label}</div>
                    <div className="text-[10px] text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Paper Size Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Cardstock Paper Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "A6", label: "A6", desc: "105 × 148 mm" },
                  { id: "A5", label: "A5", desc: "148 × 210 mm" },
                  { id: "80mm", label: "80mm", desc: "Tabletop Tent" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSize(s.id as StandCardSize)}
                    className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                      size === s.id
                        ? "border-[#5738F5] bg-[#EEEAFE]/40 shadow-xs ring-2 ring-[#5738F5]/20 font-black"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="text-xs font-extrabold text-[#17142B]">{s.label}</div>
                    <div className="text-[9px] text-slate-500 font-mono">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Permanent Stable Table URL */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Target Table URL
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(directUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="text-[10px] font-bold text-[#5738F5] hover:underline cursor-pointer"
                >
                  {copiedLink ? "Copied! ✓" : "Copy Link"}
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-700 truncate">{directUrl}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handlePrint}
              className="w-full py-3 px-4 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-violet-500/25 transition-all cursor-pointer"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>Print Stand Card Now</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                {isGeneratingPdf ? "Building PDF…" : "Download PDF"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE WYSIWYG PREVIEW */}
        <div className="w-full md:w-1/2 p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[380px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
            LIVE PRINT PREVIEW ({size})
          </span>

          <div
            className={`w-[240px] rounded-3xl p-5 border-2 text-center space-y-3 shadow-xl transition-all ${
              isPremium
                ? "bg-[#111827] text-white border-amber-500 shadow-amber-500/10"
                : isMinimal
                ? "bg-white text-[#17142B] border-slate-900 shadow-slate-300"
                : "bg-white text-[#17142B] border-[#17142B] shadow-slate-300"
            }`}
          >
            <div
              className={`inline-block text-[9px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full ${
                isPremium
                  ? "bg-amber-500/20 text-amber-300"
                  : isMinimal
                  ? "bg-slate-100 text-slate-700"
                  : "bg-[#EEEAFE] text-[#5738F5]"
              }`}
            >
              {isMinimal ? "SCAN TO ORDER" : "TABLE MENU & PAY"}
            </div>

            <div className="text-sm font-black uppercase tracking-tight truncate">
              {restaurantName}
            </div>

            <div>
              <span
                className={`inline-block font-mono font-black text-xs px-3 py-1 rounded-xl tracking-wider ${
                  isPremium
                    ? "bg-amber-400 text-slate-900"
                    : "bg-[#17142B] text-white"
                }`}
              >
                TABLE {tableLabel}
              </span>
            </div>

            <div className="bg-white p-2 rounded-2xl inline-block border border-slate-200 shadow-inner">
              <Image
                src={qrDataUrl}
                alt={`QR Table ${tableLabel}`}
                width={140}
                height={140}
                unoptimized
                className="w-32 h-32 mx-auto rounded-lg"
              />
            </div>

            <div className="text-[10px] font-black uppercase tracking-wide">
              Point Phone Camera to Order
            </div>

            {!isMinimal && (
              <div
                className={`text-[8px] font-bold py-1 px-2 rounded-lg flex items-center justify-around ${
                  isPremium ? "bg-slate-800 text-slate-300" : "bg-slate-50 text-slate-600"
                }`}
              >
                <span>1. Scan</span>
                <span>→</span>
                <span>2. Select</span>
                <span>→</span>
                <span>3. Pay</span>
              </div>
            )}

            <div className="text-[8px] font-mono opacity-50">
              qrslice.com • Table {tableLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
