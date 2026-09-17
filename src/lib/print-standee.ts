// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice — Dedicated Standee & Table Stand Card Printing Engine
 * Generates an isolated printable document rendered via a hidden iframe
 * to guarantee 100% reliable printing across all browsers and thermal/inkjet printers.
 */

export type StandCardTemplate = "standard" | "minimal" | "premium";
export type StandCardSize = "A6" | "A5" | "80mm";

export interface PrintStandCardParams {
  restaurantName: string;
  tableLabel: string;
  qrDataUrl: string;
  directUrl: string;
  seats?: number;
  wifiSsid?: string;
  wifiPassword?: string;
  template?: StandCardTemplate;
  size?: StandCardSize;
}

export interface PrintBulkStandCardsParams {
  restaurantName: string;
  tables: Array<{
    label: string;
    seats?: number;
    qrDataUrl: string;
    directUrl: string;
  }>;
  wifiSsid?: string;
  wifiPassword?: string;
}

/**
 * Print a single table stand card using an isolated invisible iframe.
 */
export function printSingleStandCard({
  restaurantName,
  tableLabel,
  qrDataUrl,
  directUrl,
  seats,
  wifiSsid,
  wifiPassword,
  template = "standard",
  size = "A6",
}: PrintStandCardParams) {
  if (typeof window === "undefined") return;

  const widthMm = size === "A5" ? "140mm" : size === "80mm" ? "76mm" : "105mm";
  const isPremium = template === "premium";
  const isMinimal = template === "minimal";

  const bodyBg = isPremium ? "#0B0F19" : "#FFFFFF";
  const cardBg = isPremium ? "#111827" : "#FFFFFF";
  const textPrimary = isPremium ? "#F8FAFC" : "#17142B";
  const textSecondary = isPremium ? "#94A3B8" : "#6F7185";
  const borderColor = isPremium ? "#F59E0B" : isMinimal ? "#0F172A" : "#17142B";
  const badgeBg = isPremium ? "#F59E0B" : isMinimal ? "#0F172A" : "#17142B";
  const badgeText = isPremium ? "#0F172A" : "#FFFFFF";
  const qrWrapperBg = isPremium ? "#FFFFFF" : "#FFFFFF";
  const stepsBg = isPremium ? "#1E293B" : isMinimal ? "#FFFFFF" : "#F8FAFC";
  const stepsBorder = isPremium ? "#334155" : isMinimal ? "#E2E8F0" : "#E2E8F0";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Table ${tableLabel} QR Stand Card — ${restaurantName}</title>
        <style>
          @page {
            size: auto;
            margin: 6mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: ${bodyBg};
            color: ${textPrimary};
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 6mm;
          }
          .card-container {
            width: ${widthMm};
            max-width: 100%;
            border: 2.5px solid ${borderColor};
            border-radius: ${size === "80mm" ? "16px" : "24px"};
            padding: ${size === "80mm" ? "16px 12px" : size === "A5" ? "32px 24px" : "24px 20px"};
            text-align: center;
            background: ${cardBg};
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .tag {
            display: inline-block;
            background: ${isPremium ? "rgba(245, 158, 11, 0.15)" : isMinimal ? "#F1F5F9" : "#EEEAFE"};
            color: ${isPremium ? "#F59E0B" : isMinimal ? "#334155" : "#5738F5"};
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 10px;
          }
          .restaurant-name {
            font-size: ${size === "A5" ? "24px" : size === "80mm" ? "16px" : "20px"};
            font-weight: 900;
            letter-spacing: -0.5px;
            color: ${textPrimary};
            text-transform: uppercase;
            margin-bottom: 6px;
            word-break: break-word;
          }
          .table-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: ${badgeBg};
            color: ${badgeText};
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: ${size === "80mm" ? "12px" : "15px"};
            font-weight: 900;
            letter-spacing: 1px;
            padding: ${size === "80mm" ? "4px 12px" : "6px 18px"};
            border-radius: 12px;
            margin-bottom: 14px;
          }
          .seats-text {
            font-size: 11px;
            color: ${textSecondary};
            font-weight: 600;
            margin-bottom: 12px;
          }
          .qr-wrapper {
            background: ${qrWrapperBg};
            border: 1.5px solid ${isPremium ? "#F59E0B" : "#E7E4F0"};
            border-radius: 20px;
            padding: 12px;
            display: inline-block;
            margin-bottom: 14px;
          }
          .qr-image {
            width: ${size === "A5" ? "240px" : size === "80mm" ? "160px" : "200px"};
            height: ${size === "A5" ? "240px" : size === "80mm" ? "160px" : "200px"};
            display: block;
            margin: 0 auto;
            border-radius: 12px;
          }
          .cta-headline {
            font-size: ${size === "80mm" ? "11px" : "13px"};
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: ${textPrimary};
            margin-bottom: 4px;
          }
          .cta-subtext {
            font-size: 10px;
            color: ${textSecondary};
            font-weight: 500;
            margin-bottom: 12px;
          }
          .steps-pill {
            background: ${stepsBg};
            border: 1px solid ${stepsBorder};
            border-radius: 12px;
            padding: 6px 10px;
            font-size: 9px;
            font-weight: 800;
            color: ${textSecondary};
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .wifi-box {
            background: ${isPremium ? "#1E293B" : "#FAF9F6"};
            border: 1px dashed ${isPremium ? "#475569" : "#CBD5E1"};
            border-radius: 10px;
            padding: 5px 8px;
            font-size: 9px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            color: ${textSecondary};
            margin-bottom: 10px;
          }
          .footer-strip {
            border-top: 1px solid ${isPremium ? "#1E293B" : "#F1F5F9"};
            padding-top: 8px;
            font-size: 9px;
            color: ${textSecondary};
            font-family: ui-monospace, SFMono-Regular, monospace;
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <div class="tag">${isMinimal ? "SCAN TO ORDER" : "TABLE MENU &amp; PAY"}</div>
          <h1 class="restaurant-name">${escapeHtml(restaurantName)}</h1>
          <div>
            <span class="table-badge">TABLE ${escapeHtml(tableLabel)}</span>
          </div>
          ${seats ? `<div class="seats-text">${seats} SEATS • DINE-IN</div>` : ""}

          <div class="qr-wrapper">
            <img src="${qrDataUrl}" alt="QR for Table ${escapeHtml(tableLabel)}" class="qr-image" />
          </div>

          <div class="cta-headline">Point Phone Camera to Order</div>
          <div class="cta-subtext">No app download required • Instant kitchen order</div>

          ${
            !isMinimal
              ? `
          <div class="steps-pill">
            <span>1. Scan QR</span>
            <span>→</span>
            <span>2. Select Food</span>
            <span>→</span>
            <span>3. Order &amp; Pay</span>
          </div>`
              : ""
          }

          ${
            wifiSsid
              ? `<div class="wifi-box">📶 Wi-Fi: <strong>${escapeHtml(wifiSsid)}</strong>${
                  wifiPassword ? ` | Pass: <strong>${escapeHtml(wifiPassword)}</strong>` : ""
                }</div>`
              : ""
          }

          <div class="footer-strip">
            qrslice.com • ${escapeHtml(directUrl.replace(/^https?:\/\//, ""))}
          </div>
        </div>
      </body>
    </html>
  `;

  renderAndPrintIframe(html);
}

/**
 * Print a multi-table sheet formatted for A4 cardstock paper.
 */
export function printBulkStandCards({
  restaurantName,
  tables,
  wifiSsid,
  wifiPassword,
}: PrintBulkStandCardsParams) {
  if (typeof window === "undefined" || tables.length === 0) return;

  const cardsHtml = tables
    .map(
      (t) => `
      <div class="card">
        <div class="card-header">
          <span class="rest-name">${escapeHtml(restaurantName)}</span>
          <span class="table-title">TABLE ${escapeHtml(t.label)}</span>
        </div>
        <div class="qr-box">
          <img src="${t.qrDataUrl}" alt="QR for Table ${escapeHtml(t.label)}" class="qr-img" />
        </div>
        <div class="instructions">
          <p class="inst-bold">📱 Scan Camera to Order</p>
          <p class="inst-steps">1. Scan • 2. Pick Dishes • 3. Pay at Counter/UPI</p>
        </div>
        ${
          wifiSsid
            ? `<div class="wifi-badge">📶 ${escapeHtml(wifiSsid)}${
                wifiPassword ? ` • ${escapeHtml(wifiPassword)}` : ""
              }</div>`
            : ""
        }
        <div class="card-foot">
          qrslice.com
        </div>
      </div>
    `,
    )
    .join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(restaurantName)} — Table Stand Cards Sheet</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #ffffff;
            color: #17142B;
            padding: 4mm;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
          }
          .card {
            border: 2px dashed #94A3B8;
            border-radius: 18px;
            padding: 16px;
            text-align: center;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .card-header {
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .rest-name {
            display: block;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: #5738F5;
            margin-bottom: 2px;
          }
          .table-title {
            display: inline-block;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 18px;
            font-weight: 900;
            color: #0F172A;
          }
          .qr-box {
            margin: 6px auto;
          }
          .qr-img {
            width: 140px;
            height: 140px;
            display: block;
            margin: 0 auto;
          }
          .instructions {
            margin-top: 8px;
          }
          .inst-bold {
            font-size: 11px;
            font-weight: 800;
            color: #1E293B;
          }
          .inst-steps {
            font-size: 9px;
            color: #64748B;
            margin-top: 2px;
          }
          .wifi-badge {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 4px;
            font-size: 9px;
            font-family: ui-monospace, monospace;
            color: #334155;
            margin-top: 8px;
          }
          .card-foot {
            font-size: 8px;
            color: #94A3B8;
            font-family: ui-monospace, monospace;
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px solid #F1F5F9;
          }
        </style>
      </head>
      <body>
        <div class="grid">
          ${cardsHtml}
        </div>
      </body>
    </html>
  `;

  renderAndPrintIframe(html);
}

/**
 * Creates a sandboxed hidden iframe and launches the native print dialog.
 */
function renderAndPrintIframe(htmlContent: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  iframe.style.visibility = "hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    // Fallback if iframe access fails
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Allow images and fonts to resolve before invoking print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 2500);
    }
  }, 250);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
