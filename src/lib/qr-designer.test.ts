// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, it, expect } from "vitest";
import { generateBeautifulQrSvg, generateBeautifulQrDataUrl, QR_THEMES } from "./qr-designer";

describe("qr-designer", () => {
  it("generates a valid SVG string with rounded dots and finder eyes", () => {
    const svg = generateBeautifulQrSvg({
      text: "https://qrslice.app/t/sample-token",
      size: 400,
      theme: "violet",
      centerIcon: "utensils",
      dotShape: "dots",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("qr-gradient");
    expect(svg).toContain("circle cx=");
    expect(svg).toContain("rect");
  });

  it("supports all themes and center icons", () => {
    const themes = Object.keys(QR_THEMES) as (keyof typeof QR_THEMES)[];
    for (const theme of themes) {
      const svg = generateBeautifulQrSvg({
        text: "https://qrslice.app/c/cafe",
        theme,
        centerIcon: "coffee",
        dotShape: "rounded",
      });
      expect(svg).toContain("<svg");
    }
  });

  it("generates a data URL for direct image rendering", () => {
    const dataUrl = generateBeautifulQrDataUrl({
      text: "https://qrslice.app/t/test-123",
      theme: "emerald",
    });

    expect(dataUrl).toMatch(/^data:image\/svg\+xml;utf8,/);
  });
});
