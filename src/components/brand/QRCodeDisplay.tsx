// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QrSliceLogo } from "./QrSliceLogo";

interface QRCodeDisplayProps {
  url: string;
  restaurantName?: string;
  tableLabel?: string;
  seats?: number;
  showSignage?: boolean;
  onPrint?: () => void;
  className?: string;
}

export function QRCodeDisplay({
  url,
  restaurantName = "QrSlice",
  tableLabel = "01",
  seats = 4,
  showSignage = false,
  onPrint,
  className = "",
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: "#17142B",
        light: "#FFFFFF",
      },
    })
      .then(setDataUrl)
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [url]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `table-${tableLabel}-qr.png`;
    a.click();
  };

  if (!showSignage) {
    return (
      <div className={`flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-[#E7E4F0] ${className}`}>
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Table ${tableLabel} QR Code`}
            className="w-48 h-48 rounded-xl shadow-sm border border-slate-100"
          />
        ) : (
          <div className="w-48 h-48 rounded-xl bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-400">
            Generating QR…
          </div>
        )}
        <div className="text-center">
          <div className="font-mono font-black text-sm text-[#17142B]">
            TABLE {tableLabel.padStart(2, "0")}
          </div>
          <div className="text-xs text-[#6F7185] mt-0.5">{seats} Seats</div>
        </div>
        <div className="flex items-center gap-2 w-full pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-2 px-3 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Download
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

  // Printable Table Standee Signage Template
  return (
    <div
      className={`print-container bg-white text-[#17142B] border-2 border-[#17142B] rounded-3xl p-8 max-w-sm mx-auto text-center shadow-xl space-y-6 ${className}`}
    >
      {/* Restaurant Header */}
      <div className="border-b border-[#E7E4F0] pb-4">
        <div className="text-xs font-black uppercase tracking-widest text-[#5738F5] mb-1">
          WELCOME TO
        </div>
        <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          {restaurantName}
        </h2>
        <div
          className="inline-block mt-2 px-3 py-1 rounded-full bg-[#17142B] text-white font-mono font-bold text-xs uppercase tracking-widest"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          TABLE {tableLabel.padStart(2, "0")}
        </div>
      </div>

      {/* Main QR Area */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#17142B]">
          SCAN TO ORDER
        </div>
        <div className="p-3 bg-white border border-[#E7E4F0] rounded-2xl inline-block shadow-inner">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`Scan to order table ${tableLabel}`}
              className="w-52 h-52 mx-auto"
            />
          ) : (
            <div className="w-52 h-52 bg-slate-100 flex items-center justify-center font-mono text-xs">
              Loading QR…
            </div>
          )}
        </div>
        <p className="text-xs text-[#6F7185] font-semibold">
          Scan with your phone camera or QR scanner
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEEAFE] text-[#5738F5] text-[11px] font-extrabold">
          <span>⚡</span>
          <span>No app required · Order & pay in seconds</span>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="pt-4 border-t border-[#E7E4F0] flex items-center justify-center gap-2">
        <span className="text-[11px] text-[#6F7185] font-medium">Powered by</span>
        <QrSliceLogo size="sm" />
      </div>

      {/* Screen-only Print Controls */}
      <div className="no-print pt-2 flex gap-2">
        <button
          type="button"
          onClick={() => (onPrint ? onPrint() : window.print())}
          className="flex-1 py-2.5 rounded-xl bg-[#5738F5] hover:bg-[#4328D9] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Print Signage 🖨️
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#17142B] font-bold text-xs transition-all cursor-pointer"
        >
          Download PNG
        </button>
      </div>
    </div>
  );
}

