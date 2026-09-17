// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice — High-Resolution Table Standee & QR Print Engine
 * Generates print-ready HTML rendered via an isolated iframe to guarantee
 * crisp vector graphics, precise mm dimensions, and zero margins across
 * all desktop, thermal, and cardstock printers.
 */

export type StandCardTemplate =
  | "violet"
  | "gold"
  | "minimal"
  | "emerald"
  | "terracotta"
  | "tent"
  | "sticker"
  // Legacy aliases
  | "standard"
  | "premium";

export type StandCardSize = "A6" | "A5" | "80mm" | "square";

export interface PrintStandCardParams {
  restaurantName: string;
  tableLabel: string;
  qrDataUrl: string;
  directUrl: string;
  seats?: number;
  zone?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  template?: StandCardTemplate;
  size?: StandCardSize;
  headline?: string;
  subtext?: string;
  showSteps?: boolean;
  showWifi?: boolean;
  showReviewPrompt?: boolean;
  showPaymentBadges?: boolean;
  showCutGuides?: boolean;
  showSeats?: boolean;
}

export interface PrintBulkStandCardsParams {
  restaurantName: string;
  tables: Array<{
    label: string;
    seats?: number;
    qrDataUrl: string;
    directUrl: string;
    zone?: string;
  }>;
  wifiSsid?: string;
  wifiPassword?: string;
  template?: StandCardTemplate;
  size?: StandCardSize;
  headline?: string;
  subtext?: string;
  showSteps?: boolean;
  showWifi?: boolean;
  showReviewPrompt?: boolean;
  showPaymentBadges?: boolean;
}

interface ThemePalette {
  bodyBg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  badgeBg: string;
  badgeText: string;
  pillBg: string;
  pillText: string;
  isDark: boolean;
}

function getPalette(template: StandCardTemplate): ThemePalette {
  if (template === "gold" || template === "premium") {
    return {
      bodyBg: "#050811",
      cardBg: "#0B0F19",
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      accent: "#F59E0B",
      border: "#F59E0B",
      badgeBg: "#F59E0B",
      badgeText: "#0F172A",
      pillBg: "#1E293B",
      pillText: "#FBBF24",
      isDark: true,
    };
  }

  if (template === "minimal") {
    return {
      bodyBg: "#FFFFFF",
      cardBg: "#FFFFFF",
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      accent: "#0F172A",
      border: "#0F172A",
      badgeBg: "#0F172A",
      badgeText: "#FFFFFF",
      pillBg: "#F1F5F9",
      pillText: "#1E293B",
      isDark: false,
    };
  }

  if (template === "emerald") {
    return {
      bodyBg: "#FFFFFF",
      cardBg: "#F8FAF8",
      textPrimary: "#064E3B",
      textSecondary: "#047857",
      accent: "#059669",
      border: "#059669",
      badgeBg: "#059669",
      badgeText: "#FFFFFF",
      pillBg: "#ECFDF5",
      pillText: "#065F46",
      isDark: false,
    };
  }

  if (template === "terracotta") {
    return {
      bodyBg: "#FFFFFF",
      cardBg: "#FFFDF9",
      textPrimary: "#431407",
      textSecondary: "#7C2D12",
      accent: "#EA580C",
      border: "#C2410C",
      badgeBg: "#EA580C",
      badgeText: "#FFFFFF",
      pillBg: "#FFEDD5",
      pillText: "#9A3412",
      isDark: false,
    };
  }

  // Default: violet ("standard") or tent/sticker
  return {
    bodyBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    textPrimary: "#17142B",
    textSecondary: "#6F7185",
    accent: "#5738F5",
    border: "#5738F5",
    badgeBg: "#5738F5",
    badgeText: "#FFFFFF",
    pillBg: "#EEEAFE",
    pillText: "#5738F5",
    isDark: false,
  };
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
  zone,
  wifiSsid,
  wifiPassword,
  template = "violet",
  size = "A6",
  headline = "POINT CAMERA TO ORDER",
  subtext = "No app download required • Instant kitchen order",
  showSteps = true,
  showWifi = true,
  showReviewPrompt = true,
  showPaymentBadges = true,
  showCutGuides = true,
  showSeats = true,
}: PrintStandCardParams) {
  if (typeof window === "undefined") return;

  const pal = getPalette(template);
  const isTent = template === "tent";
  const isSticker = template === "sticker" || size === "square";

  // Dimensions
  const widthMm = size === "A5" ? "148mm" : size === "80mm" ? "80mm" : size === "square" ? "90mm" : "105mm";
  const qrPx = size === "A5" ? "240px" : size === "80mm" ? "150px" : size === "square" ? "160px" : "190px";

  const cleanShortUrl = directUrl.replace(/^https?:\/\//, "");

  let contentHtml = "";

  if (isTent) {
    // DUAL-FACED FOLDABLE TABLE TENT
    contentHtml = `
      <div class="tent-container">
        <!-- TOP FACE (INVERTED FOR FOLDING) -->
        <div class="tent-face inverted">
          <div class="tag">SCAN TO ORDER &amp; PAY</div>
          <h2 class="rest-name">${escapeHtml(restaurantName)}</h2>
          <div class="table-badge-wrap">
            <span class="table-badge">TABLE ${escapeHtml(tableLabel)}</span>
          </div>
          <div class="qr-frame">
            <img src="${qrDataUrl}" alt="QR" class="qr-img" />
          </div>
          <div class="cta-head">POINT CAMERA TO ORDER</div>
          <div class="cta-sub">No app needed • Instant kitchen order</div>
          ${
            showWifi && wifiSsid
              ? `<div class="wifi-pill">📶 WiFi: <strong>${escapeHtml(wifiSsid)}</strong>${
                  wifiPassword ? ` • Pass: <strong>${escapeHtml(wifiPassword)}</strong>` : ""
                }</div>`
              : ""
          }
        </div>

        <!-- FOLD CREASE LINE -->
        <div class="fold-divider">
          <span class="fold-line"></span>
          <span class="fold-text">✂ - - - - FOLD HERE (CREASE &amp; STAND UPRIGHT ON TABLE) - - - - ✂</span>
          <span class="fold-line"></span>
        </div>

        <!-- BOTTOM FACE (FRONT FACING) -->
        <div class="tent-face">
          <div class="tag">SCAN TO ORDER &amp; PAY</div>
          <h2 class="rest-name">${escapeHtml(restaurantName)}</h2>
          <div class="table-badge-wrap">
            <span class="table-badge">TABLE ${escapeHtml(tableLabel)}</span>
            ${showSeats && seats ? `<span class="seat-badge">${seats} SEATS</span>` : ""}
          </div>
          <div class="qr-frame">
            <img src="${qrDataUrl}" alt="QR" class="qr-img" />
          </div>
          <div class="cta-head">${escapeHtml(headline)}</div>
          <div class="cta-sub">${escapeHtml(subtext)}</div>

          ${
            showSteps
              ? `
            <div class="steps-row">
              <span>1. Scan QR</span>
              <span>→</span>
              <span>2. Pick Dishes</span>
              <span>→</span>
              <span>3. Pay at Counter/UPI</span>
            </div>`
              : ""
          }

          ${
            showWifi && wifiSsid
              ? `<div class="wifi-pill">📶 WiFi: <strong>${escapeHtml(wifiSsid)}</strong>${
                  wifiPassword ? ` • Pass: <strong>${escapeHtml(wifiPassword)}</strong>` : ""
                }</div>`
              : ""
          }

          <div class="footer-note">qrslice.com • ${escapeHtml(cleanShortUrl)}</div>
        </div>
      </div>
    `;
  } else {
    // STANDARD SINGLE CARD OR STICKER
    contentHtml = `
      <div class="card-wrap ${isSticker ? "sticker-mode" : ""}">
        ${
          showCutGuides
            ? `
          <div class="crop-mark top-left"></div>
          <div class="crop-mark top-right"></div>
          <div class="crop-mark btm-left"></div>
          <div class="crop-mark btm-right"></div>`
            : ""
        }

        <div class="card-box">
          <div class="top-tag">TABLE MENU &amp; PAY</div>
          <h1 class="rest-name">${escapeHtml(restaurantName)}</h1>

          <div class="table-badge-wrap">
            <span class="table-badge">TABLE ${escapeHtml(tableLabel)}</span>
            ${showSeats && seats ? `<span class="seat-badge">${seats} SEATS</span>` : ""}
            ${zone ? `<span class="zone-badge">${escapeHtml(zone.toUpperCase())}</span>` : ""}
          </div>

          <div class="qr-frame">
            <img src="${qrDataUrl}" alt="QR Code for Table ${escapeHtml(tableLabel)}" class="qr-img" />
          </div>

          <div class="cta-head">${escapeHtml(headline)}</div>
          <div class="cta-sub">${escapeHtml(subtext)}</div>

          ${
            showSteps && !isSticker
              ? `
            <div class="steps-row">
              <div class="step-item"><span>1</span> Scan QR</div>
              <span class="step-arrow">→</span>
              <div class="step-item"><span>2</span> Select Food</div>
              <span class="step-arrow">→</span>
              <div class="step-item"><span>3</span> Instant Pay</div>
            </div>`
              : ""
          }

          ${
            showWifi && wifiSsid
              ? `
            <div class="wifi-pill">
              📶 Wi-Fi: <strong>${escapeHtml(wifiSsid)}</strong>
              ${wifiPassword ? `&nbsp;|&nbsp;Password: <strong>${escapeHtml(wifiPassword)}</strong>` : ""}
            </div>`
              : ""
          }

          ${
            showReviewPrompt && !isSticker
              ? `
            <div class="review-box">
              ⭐️⭐️⭐️⭐️⭐️ <span>Enjoying your food? Leave us a 5-star review!</span>
            </div>`
              : ""
          }

          ${
            showPaymentBadges && !isSticker
              ? `
            <div class="pay-strip">
              <span>UPI</span> • <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>Cards / Cash</span>
            </div>`
              : ""
          }

          <div class="footer-note">
            <span>Powered by qrslice.com</span>
            <span class="footer-url">${escapeHtml(cleanShortUrl)}</span>
          </div>
        </div>
      </div>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>Table ${escapeHtml(tableLabel)} Stand Card — ${escapeHtml(restaurantName)}</title>
        <style>
          @page {
            size: auto;
            margin: 4mm;
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
            background: ${pal.bodyBg};
            color: ${pal.textPrimary};
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 4mm;
          }

          /* SINGLE CARD CONTAINER */
          .card-wrap {
            position: relative;
            width: ${widthMm};
            max-width: 100%;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .card-box {
            background: ${pal.cardBg};
            border: 2.5px solid ${pal.border};
            border-radius: ${size === "80mm" ? "16px" : size === "square" ? "16px" : "24px"};
            padding: ${size === "80mm" ? "14px 10px" : size === "A5" ? "28px 22px" : "20px 16px"};
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          }

          .top-tag {
            display: inline-block;
            background: ${pal.pillBg};
            color: ${pal.pillText};
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            padding: 3px 10px;
            border-radius: 9999px;
            margin-bottom: 8px;
          }

          .rest-name {
            font-size: ${size === "A5" ? "24px" : size === "80mm" ? "15px" : "18px"};
            font-weight: 900;
            letter-spacing: -0.3px;
            color: ${pal.textPrimary};
            text-transform: uppercase;
            margin-bottom: 6px;
            line-height: 1.15;
            word-break: break-word;
          }

          .table-badge-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-bottom: 12px;
          }

          .table-badge {
            background: ${pal.badgeBg};
            color: ${pal.badgeText};
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
            font-size: ${size === "80mm" ? "12px" : "14px"};
            font-weight: 900;
            letter-spacing: 1px;
            padding: 4px 14px;
            border-radius: 10px;
          }

          .seat-badge, .zone-badge {
            background: ${pal.pillBg};
            color: ${pal.pillText};
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 8px;
          }

          .qr-frame {
            background: #FFFFFF;
            border: 1.5px solid ${pal.border};
            border-radius: 16px;
            padding: 10px;
            display: inline-block;
            margin-bottom: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          }

          .qr-img {
            width: ${qrPx};
            height: ${qrPx};
            display: block;
            margin: 0 auto;
            border-radius: 8px;
          }

          .cta-head {
            font-size: ${size === "80mm" ? "11px" : "13px"};
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: ${pal.textPrimary};
            margin-bottom: 3px;
          }

          .cta-sub {
            font-size: 9.5px;
            color: ${pal.textSecondary};
            font-weight: 500;
            margin-bottom: 10px;
          }

          .steps-row {
            background: ${pal.pillBg};
            border: 1px solid ${pal.isDark ? "#334155" : "#E2E8F0"};
            border-radius: 10px;
            padding: 5px 8px;
            font-size: 8.5px;
            font-weight: 800;
            color: ${pal.textPrimary};
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-bottom: 8px;
          }
          .step-item span {
            display: inline-block;
            background: ${pal.accent};
            color: #FFFFFF;
            width: 14px;
            height: 14px;
            line-height: 14px;
            border-radius: 50%;
            text-align: center;
            font-size: 8px;
            font-weight: 900;
            margin-right: 3px;
          }
          .step-arrow {
            color: ${pal.textSecondary};
            font-weight: 900;
          }

          .wifi-pill {
            background: ${pal.isDark ? "#1E293B" : "#FAF9F6"};
            border: 1px dashed ${pal.isDark ? "#475569" : "#CBD5E1"};
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 8.5px;
            font-family: ui-monospace, monospace;
            color: ${pal.textSecondary};
            margin-bottom: 8px;
          }

          .review-box {
            font-size: 8px;
            font-weight: 700;
            color: ${pal.textSecondary};
            margin-bottom: 6px;
          }

          .pay-strip {
            font-size: 7.5px;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: ${pal.textSecondary};
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .footer-note {
            border-top: 1px solid ${pal.isDark ? "#1E293B" : "#F1F5F9"};
            padding-top: 6px;
            font-size: 8px;
            color: ${pal.textSecondary};
            font-family: ui-monospace, monospace;
            display: flex;
            justify-content: space-between;
          }

          /* TENT MODE STYLES */
          .tent-container {
            width: 135mm;
            max-width: 100%;
            background: ${pal.cardBg};
            border: 2px solid ${pal.border};
            border-radius: 20px;
            padding: 16px;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .tent-face {
            padding: 12px 6px;
            text-align: center;
          }
          .tent-face.inverted {
            transform: rotate(180deg);
          }
          .fold-divider {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 0;
            margin: 6px 0;
          }
          .fold-line {
            flex: 1;
            height: 1px;
            border-bottom: 1.5px dashed ${pal.accent};
          }
          .fold-text {
            font-size: 8px;
            font-weight: 900;
            letter-spacing: 1px;
            color: ${pal.accent};
            white-space: nowrap;
          }

          /* CROP MARKS */
          .crop-mark {
            position: absolute;
            width: 8mm;
            height: 8mm;
          }
          .crop-mark.top-left {
            top: -3mm; left: -3mm;
            border-top: 1px solid #CBD5E1;
            border-left: 1px solid #CBD5E1;
          }
          .crop-mark.top-right {
            top: -3mm; right: -3mm;
            border-top: 1px solid #CBD5E1;
            border-right: 1px solid #CBD5E1;
          }
          .crop-mark.btm-left {
            bottom: -3mm; left: -3mm;
            border-bottom: 1px solid #CBD5E1;
            border-left: 1px solid #CBD5E1;
          }
          .crop-mark.btm-right {
            bottom: -3mm; right: -3mm;
            border-bottom: 1px solid #CBD5E1;
            border-right: 1px solid #CBD5E1;
          }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `;

  renderAndPrintIframe(html);
}

/**
 * Print a multi-table sheet formatted for A4 cardstock paper (Batch print all tables).
 */
export function printBulkStandCards({
  restaurantName,
  tables,
  wifiSsid,
  wifiPassword,
  template = "violet",
  size = "A6",
  headline = "POINT CAMERA TO ORDER",
  subtext = "Instant kitchen order • No app download required",
  showSteps = true,
  showWifi = true,
  showReviewPrompt = true,
  showPaymentBadges = true,
}: PrintBulkStandCardsParams) {
  if (typeof window === "undefined" || tables.length === 0) return;

  const pal = getPalette(template);
  const isA5 = size === "A5";

  // Grid setup: 2 per A4 sheet for A5, 4 per A4 sheet for A6/80mm
  const cols = isA5 ? 1 : 2;
  const qrDim = isA5 ? "160px" : "120px";

  const cardsHtml = tables
    .map(
      (t) => `
      <div class="batch-card">
        <div class="batch-header">
          <span class="batch-rest">${escapeHtml(restaurantName)}</span>
          <span class="batch-table">TABLE ${escapeHtml(t.label)}</span>
          ${t.seats ? `<span class="batch-seats">${t.seats} SEATS</span>` : ""}
        </div>

        <div class="batch-qr-wrap">
          <img src="${t.qrDataUrl}" alt="QR Table ${escapeHtml(t.label)}" class="batch-qr" />
        </div>

        <div class="batch-cta">${escapeHtml(headline)}</div>
        <div class="batch-sub">${escapeHtml(subtext)}</div>

        ${
          showSteps
            ? `
          <div class="batch-steps">
            <span>1. Scan QR</span> • <span>2. Select Food</span> • <span>3. Instant Pay</span>
          </div>`
            : ""
        }

        ${
          showWifi && wifiSsid
            ? `<div class="batch-wifi">📶 WiFi: <strong>${escapeHtml(wifiSsid)}</strong>${
                wifiPassword ? ` • <strong>${escapeHtml(wifiPassword)}</strong>` : ""
              }</div>`
            : ""
        }

        ${
          showPaymentBadges
            ? `<div class="batch-pay">UPI • GPay • PhonePe • Cards • Cash</div>`
            : ""
        }

        <div class="batch-foot">
          qrslice.com • Table ${escapeHtml(t.label)}
        </div>
      </div>
    `
    )
    .join("\n");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(restaurantName)} — Table Stand Cards Sheet (${tables.length} Tables)</title>
        <style>
          @page {
            size: A4 portrait;
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #FFFFFF;
            color: ${pal.textPrimary};
            padding: 4mm;
          }
          .batch-grid {
            display: grid;
            grid-template-columns: repeat(${cols}, 1fr);
            gap: 6mm;
          }
          .batch-card {
            border: 2px dashed ${pal.accent};
            border-radius: 16px;
            padding: 12px;
            text-align: center;
            background: ${pal.cardBg};
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .batch-header {
            border-bottom: 1px solid ${pal.isDark ? "#334155" : "#E2E8F0"};
            padding-bottom: 6px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .batch-rest {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1px;
            text-transform: uppercase;
            color: ${pal.accent};
          }
          .batch-table {
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 15px;
            font-weight: 900;
            color: ${pal.textPrimary};
          }
          .batch-seats {
            font-size: 9px;
            font-weight: 800;
            color: ${pal.textSecondary};
          }
          .batch-qr-wrap {
            margin: 4px auto;
            background: #FFFFFF;
            padding: 6px;
            border-radius: 12px;
            display: inline-block;
            border: 1px solid #E2E8F0;
          }
          .batch-qr {
            width: ${qrDim};
            height: ${qrDim};
            display: block;
            margin: 0 auto;
          }
          .batch-cta {
            font-size: 10.5px;
            font-weight: 900;
            text-transform: uppercase;
            color: ${pal.textPrimary};
            margin-top: 4px;
          }
          .batch-sub {
            font-size: 8.5px;
            color: ${pal.textSecondary};
            margin-top: 1px;
          }
          .batch-steps {
            font-size: 8px;
            font-weight: 800;
            color: ${pal.accent};
            margin-top: 6px;
            background: ${pal.pillBg};
            padding: 3px 6px;
            border-radius: 6px;
          }
          .batch-wifi {
            font-size: 8px;
            font-family: ui-monospace, monospace;
            color: ${pal.textSecondary};
            margin-top: 5px;
          }
          .batch-pay {
            font-size: 7.5px;
            font-weight: 800;
            color: ${pal.textSecondary};
            margin-top: 4px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .batch-foot {
            font-size: 7.5px;
            color: #94A3B8;
            font-family: ui-monospace, monospace;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px solid #F1F5F9;
          }
        </style>
      </head>
      <body>
        <div class="batch-grid">
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
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

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
      }, 3000);
    }
  }, 300);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
