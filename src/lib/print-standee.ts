// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice — Dedicated Standee & Table Stand Card Printing Engine
 * Generates an isolated printable document rendered via a hidden iframe
 * to guarantee 100% reliable printing across all browsers and thermal/inkjet printers.
 */

export interface PrintStandCardParams {
  restaurantName: string;
  tableLabel: string;
  qrDataUrl: string;
  directUrl: string;
  seats?: number;
  wifiSsid?: string;
  wifiPassword?: string;
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
}: PrintStandCardParams) {
  if (typeof window === "undefined") return;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Table ${tableLabel} QR Stand Card — ${restaurantName}</title>
        <style>
          @page {
            size: auto;
            margin: 10mm;
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
            background: #ffffff;
            color: #17142B;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 10mm;
          }
          .card-container {
            width: 105mm;
            max-width: 100%;
            border: 2.5px solid #17142B;
            border-radius: 24px;
            padding: 24px 20px;
            text-align: center;
            background: #ffffff;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .tag {
            display: inline-block;
            background: #EEEAFE;
            color: #5738F5;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 12px;
          }
          .restaurant-name {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #17142B;
            text-transform: uppercase;
            margin-bottom: 6px;
            word-break: break-word;
          }
          .table-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #17142B;
            color: #ffffff;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 1px;
            padding: 6px 16px;
            border-radius: 12px;
            margin-bottom: 16px;
          }
          .seats-text {
            font-size: 11px;
            color: #6F7185;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .qr-wrapper {
            background: #ffffff;
            border: 1.5px solid #E7E4F0;
            border-radius: 20px;
            padding: 12px;
            display: inline-block;
            margin-bottom: 16px;
          }
          .qr-image {
            width: 200px;
            height: 200px;
            display: block;
            margin: 0 auto;
            border-radius: 12px;
          }
          .cta-headline {
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #17142B;
            margin-bottom: 4px;
          }
          .cta-subtext {
            font-size: 10px;
            color: #6F7185;
            font-weight: 500;
            margin-bottom: 14px;
          }
          .steps-pill {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            padding: 8px 12px;
            font-size: 9px;
            font-weight: 800;
            color: #475569;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          .wifi-box {
            background: #FAF9F6;
            border: 1px dashed #CBD5E1;
            border-radius: 12px;
            padding: 6px 10px;
            font-size: 9px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            color: #334155;
            margin-bottom: 10px;
          }
          .footer-strip {
            border-top: 1px solid #F1F5F9;
            padding-top: 8px;
            font-size: 9px;
            color: #94A3B8;
            font-family: ui-monospace, SFMono-Regular, monospace;
          }
        </style>
      </head>
      <body>
        <div class="card-container">
          <div class="tag">TABLE MENU &amp; PAY</div>
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

          <div class="steps-pill">
            <span>1. Scan QR</span>
            <span>→</span>
            <span>2. Select Food</span>
            <span>→</span>
            <span>3. Order &amp; Pay</span>
          </div>

          ${
            wifiSsid
              ? `<div class="wifi-box">📶 Wi-Fi: <strong>${escapeHtml(wifiSsid)}</strong>${
                  wifiPassword ? ` | Pass: <strong>${escapeHtml(wifiPassword)}</strong>` : ""
                }</div>`
              : ""
          }

          <div class="footer-strip">
            Powered by QRslice • ${escapeHtml(directUrl.replace(/^https?:\/\//, ""))}
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
