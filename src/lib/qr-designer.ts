// Copyright (c) 2026 QRslice. All rights reserved.
import QRCode from "qrcode";

export type QrStyleTheme = "violet" | "gold" | "emerald" | "sunset" | "obsidian";
export type QrCenterIcon = "utensils" | "coffee" | "sparkles" | "qrslice" | "none";
export type QrDotShape = "dots" | "rounded" | "classy";

export interface BeautifulQrOptions {
  text: string;
  size?: number;
  theme?: QrStyleTheme;
  centerIcon?: QrCenterIcon;
  dotShape?: QrDotShape;
  showViewfinder?: boolean;
}

export interface ThemeColors {
  name: string;
  bg: string;
  dotStart: string;
  dotEnd: string;
  eyeOuter: string;
  eyeInner: string;
  badgeBg: string;
  badgeIcon: string;
  accent: string;
  textColor: string;
}

export const QR_THEMES: Record<QrStyleTheme, ThemeColors> = {
  violet: {
    name: "Electric Violet",
    bg: "#FFFFFF",
    dotStart: "#5738F5",
    dotEnd: "#7C3AED",
    eyeOuter: "#4328D9",
    eyeInner: "#5738F5",
    badgeBg: "#5738F5",
    badgeIcon: "#FFFFFF",
    accent: "#5738F5",
    textColor: "#17142B",
  },
  gold: {
    name: "Obsidian & Champagne",
    bg: "#0F172A",
    dotStart: "#F59E0B",
    dotEnd: "#D97706",
    eyeOuter: "#FBBF24",
    eyeInner: "#F59E0B",
    badgeBg: "#F59E0B",
    badgeIcon: "#0F172A",
    accent: "#F59E0B",
    textColor: "#F8FAFC",
  },
  emerald: {
    name: "Bistro Emerald",
    bg: "#FFFFFF",
    dotStart: "#059669",
    dotEnd: "#10B981",
    eyeOuter: "#047857",
    eyeInner: "#059669",
    badgeBg: "#059669",
    badgeIcon: "#FFFFFF",
    accent: "#059669",
    textColor: "#064E3B",
  },
  sunset: {
    name: "Sunset Coral",
    bg: "#FFFFFF",
    dotStart: "#E11D48",
    dotEnd: "#F97316",
    eyeOuter: "#BE123C",
    eyeInner: "#E11D48",
    badgeBg: "#E11D48",
    badgeIcon: "#FFFFFF",
    accent: "#E11D48",
    textColor: "#881337",
  },
  obsidian: {
    name: "Minimal Noir",
    bg: "#FFFFFF",
    dotStart: "#18181B",
    dotEnd: "#27272A",
    eyeOuter: "#09090B",
    eyeInner: "#18181B",
    badgeBg: "#18181B",
    badgeIcon: "#FFFFFF",
    accent: "#18181B",
    textColor: "#09090B",
  },
};

/**
 * Returns SVG path data for center emblems
 */
function getCenterIconSvg(icon: QrCenterIcon, cx: number, cy: number, iconSize: number): string {
  const half = iconSize / 2;
  const s = iconSize / 24; // scale from 24x24 standard viewBox

  if (icon === "coffee") {
    return `
      <g transform="translate(${cx - half}, ${cy - half}) scale(${s})" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </g>
    `;
  }

  if (icon === "sparkles") {
    return `
      <g transform="translate(${cx - half}, ${cy - half}) scale(${s})" fill="currentColor">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
      </g>
    `;
  }

  if (icon === "qrslice") {
    return `
      <g transform="translate(${cx - half}, ${cy - half}) scale(${s})" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="m14 14 5 5" />
        <path d="M12 7v5l3 2" />
      </g>
    `;
  }

  // default: utensils
  return `
    <g transform="translate(${cx - half}, ${cy - half}) scale(${s})" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      <path d="M6 2v20" />
      <path d="M4 2v6a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2" />
    </g>
  `;
}

/**
 * Checks if a row/col coordinate belongs to one of the 3 corner position finder patterns
 */
function isFinderPattern(row: number, col: number, n: number): boolean {
  // Top-left (with 1-cell quiet border)
  if (row <= 7 && col <= 7) return true;
  // Top-right
  if (row <= 7 && col >= n - 8) return true;
  // Bottom-left
  if (row >= n - 8 && col <= 7) return true;
  return false;
}

/**
 * Generates an ultra high-definition, beautifully styled vector SVG QR code.
 */
export function generateBeautifulQrSvg(options: BeautifulQrOptions): string {
  const {
    text,
    size = 400,
    theme = "violet",
    centerIcon = "utensils",
    dotShape = "dots",
    showViewfinder = true,
  } = options;

  if (!text) return "";

  // Create QR matrix using Error Correction Level H (supports center occlusion)
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;

  const colors = QR_THEMES[theme] || QR_THEMES.violet;
  const marginCells = 3.5;
  const totalCells = n + marginCells * 2;
  const cellSize = size / totalCells;

  // Center exclusion zone for center badge (6x6 modules)
  const midCell = (n - 1) / 2;
  const excludeRadiusCells = centerIcon !== "none" ? 3.2 : 0;

  const dotsSvg: string[] = [];

  // 1. Draw Data Modules
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (isFinderPattern(r, c, n)) continue;

      // Skip center area if center icon is enabled
      if (centerIcon !== "none") {
        const distFromCenter = Math.hypot(r - midCell, c - midCell);
        if (distFromCenter < excludeRadiusCells) continue;
      }

      const isDark = Boolean(qr.modules.get(r, c));
      if (!isDark) continue;

      const x = (c + marginCells) * cellSize;
      const y = (r + marginCells) * cellSize;

      if (dotShape === "dots") {
        const radius = cellSize * 0.44;
        dotsSvg.push(
          `<circle cx="${(x + cellSize / 2).toFixed(2)}" cy="${(y + cellSize / 2).toFixed(2)}" r="${radius.toFixed(2)}" fill="url(#qr-gradient)" />`
        );
      } else if (dotShape === "rounded") {
        const pad = cellSize * 0.08;
        const rectSize = cellSize - pad * 2;
        const rx = cellSize * 0.35;
        dotsSvg.push(
          `<rect x="${(x + pad).toFixed(2)}" y="${(y + pad).toFixed(2)}" width="${rectSize.toFixed(2)}" height="${rectSize.toFixed(2)}" rx="${rx.toFixed(2)}" fill="url(#qr-gradient)" />`
        );
      } else {
        // classy / squircle
        const pad = cellSize * 0.05;
        const rectSize = cellSize - pad * 2;
        const rx = cellSize * 0.2;
        dotsSvg.push(
          `<rect x="${(x + pad).toFixed(2)}" y="${(y + pad).toFixed(2)}" width="${rectSize.toFixed(2)}" height="${rectSize.toFixed(2)}" rx="${rx.toFixed(2)}" fill="url(#qr-gradient)" />`
        );
      }
    }
  }

  // 2. Draw Sleek Modern Corner Finder Eyes
  const finderPositions = [
    { r: 0, c: 0 }, // Top-Left
    { r: 0, c: n - 7 }, // Top-Right
    { r: n - 7, c: 0 }, // Bottom-Left
  ];

  const finderSvg: string[] = [];
  for (const pos of finderPositions) {
    const ox = (pos.c + marginCells) * cellSize;
    const oy = (pos.r + marginCells) * cellSize;

    // Outer rounded 7x7 frame
    const outerSize = 7 * cellSize;
    const outerRx = 1.8 * cellSize;
    finderSvg.push(
      `<rect x="${ox.toFixed(2)}" y="${oy.toFixed(2)}" width="${outerSize.toFixed(2)}" height="${outerSize.toFixed(2)}" rx="${outerRx.toFixed(2)}" fill="${colors.eyeOuter}" />`
    );

    // Inner cutout (5x5)
    const cutOffset = 1 * cellSize;
    const cutSize = 5 * cellSize;
    const cutRx = 1.2 * cellSize;
    finderSvg.push(
      `<rect x="${(ox + cutOffset).toFixed(2)}" y="${(oy + cutOffset).toFixed(2)}" width="${cutSize.toFixed(2)}" height="${cutSize.toFixed(2)}" rx="${cutRx.toFixed(2)}" fill="${colors.bg}" />`
    );

    // Center eye dot (3x3)
    const dotOffset = 2 * cellSize;
    const dotSize = 3 * cellSize;
    const dotRx = 0.9 * cellSize;
    finderSvg.push(
      `<rect x="${(ox + dotOffset).toFixed(2)}" y="${(oy + dotOffset).toFixed(2)}" width="${dotSize.toFixed(2)}" height="${dotSize.toFixed(2)}" rx="${dotRx.toFixed(2)}" fill="${colors.eyeInner}" />`
    );
  }

  // 3. Center Emblem Badge
  let centerBadgeSvg = "";
  if (centerIcon !== "none") {
    const centerPx = size / 2;
    const badgeRadius = 3.3 * cellSize;
    const innerRadius = badgeRadius - 3.5;
    const iconSize = badgeRadius * 1.15;

    centerBadgeSvg = `
      <!-- Center Emblem Backdrop Shadow & Rings -->
      <circle cx="${centerPx.toFixed(2)}" cy="${centerPx.toFixed(2)}" r="${(badgeRadius + 2).toFixed(2)}" fill="${colors.bg}" filter="url(#qr-shadow)" />
      <circle cx="${centerPx.toFixed(2)}" cy="${centerPx.toFixed(2)}" r="${innerRadius.toFixed(2)}" fill="${colors.badgeBg}" />
      <g color="${colors.badgeIcon}">
        ${getCenterIconSvg(centerIcon, centerPx, centerPx, iconSize)}
      </g>
    `;
  }

  // 4. Viewfinder Camera Bracket Accents
  let viewfinderSvg = "";
  if (showViewfinder) {
    const pad = 10;
    const arm = 22;
    const strokeW = 2.5;
    const cColor = colors.accent;
    viewfinderSvg = `
      <g stroke="${cColor}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
        <!-- Top Left -->
        <path d="M ${pad + arm} ${pad} H ${pad + 6} A 6 6 0 0 0 ${pad} ${pad + 6} V ${pad + arm}" />
        <!-- Top Right -->
        <path d="M ${size - pad - arm} ${pad} H ${size - pad - 6} A 6 6 0 0 1 ${size - pad} ${pad + 6} V ${pad + arm}" />
        <!-- Bottom Left -->
        <path d="M ${pad} ${size - pad - arm} V ${size - pad - 6} A 6 6 0 0 0 ${pad + 6} ${size - pad} H ${pad + arm}" />
        <!-- Bottom Right -->
        <path d="M ${size - pad} ${size - pad - arm} V ${size - pad - 6} A 6 6 0 0 1 ${size - pad - 6} ${size - pad} H ${size - pad - arm}" />
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="geometricPrecision">
      <defs>
        <linearGradient id="qr-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.dotStart}" />
          <stop offset="100%" stop-color="${colors.dotEnd}" />
        </linearGradient>
        <filter id="qr-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(0,0,0,0.2)" />
        </filter>
      </defs>

      <!-- Background Card -->
      <rect width="${size}" height="${size}" rx="24" fill="${colors.bg}" />

      <!-- Viewfinder Accents -->
      ${viewfinderSvg}

      <!-- Finder Eyes -->
      ${finderSvg.join("\n")}

      <!-- Data Dots -->
      ${dotsSvg.join("\n")}

      <!-- Center Logo / Emblem -->
      ${centerBadgeSvg}
    </svg>
  `.trim();
}

/**
 * Returns a Data URL for the beautiful SVG QR code that can be used directly in `<img src="...">`
 */
export function generateBeautifulQrDataUrl(options: BeautifulQrOptions): string {
  const svg = generateBeautifulQrSvg(options);
  if (!svg) return "";
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Rasterizes an SVG string to a high-resolution PNG data URL via HTML Canvas
 */
export async function svgToPngDataUrl(svgString: string, width = 800, height = 800): Promise<string> {
  if (typeof window === "undefined") return "";
  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return resolve("");
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };

    img.src = url;
  });
}
