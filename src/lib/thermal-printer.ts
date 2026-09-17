// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * ESC/POS command generator for thermal receipt printers.
 * Supports 58mm (384 dots) and 80mm (576 dots) paper widths.
 */

export type PaperWidth = "58mm" | "80mm";

export interface PrinterConfig {
  paperWidth: PaperWidth;
  encoding: "utf-8" | "cp437";
  autoCut: boolean;
  charset: string;
}

const DEFAULT_CONFIG: PrinterConfig = {
  paperWidth: "80mm",
  encoding: "utf-8",
  autoCut: true,
  charset: "UTF-8",
};

const DOTS_PER_LINE = {
  "58mm": 384,
  "80mm": 576,
};

const CHAR_WIDTH = {
  "58mm": { normal: 12, double: 24 },
  "80mm": { normal: 12, double: 24 },
};

const MAX_CHARS = {
  "58mm": { normal: 32, double: 16 },
  "80mm": { normal: 48, double: 24 },
};

export class ESCPOS {
  private commands: number[] = [];
  private config: PrinterConfig;

  constructor(config: Partial<PrinterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private add(cmd: number | number[]): this {
    this.commands.push(...(Array.isArray(cmd) ? cmd : [cmd]));
    return this;
  }

  init(): this {
    // ESC @ - Initialize printer
    return this.add([0x1b, 0x40]);
  }

  /**
   * Text formatting
   */
  setAlign(align: "left" | "center" | "right"): this {
    const codes = { left: 0x00, center: 0x01, right: 0x02 };
    return this.add([0x1b, 0x61, codes[align]]);
  }

  setBold(enabled: boolean): this {
    return this.add([0x1b, 0x45, enabled ? 0x01 : 0x00]);
  }

  setUnderline(enabled: boolean): this {
    return this.add([0x1b, 0x2d, enabled ? 0x01 : 0x00]);
  }

  setDoubleWidth(enabled: boolean): this {
    return this.add([0x1b, 0x21, enabled ? 0x20 : 0x00]);
  }

  setDoubleHeight(enabled: boolean): this {
    return this.add([0x1b, 0x21, enabled ? 0x10 : 0x00]);
  }

  setFontSize(width: number, height: number): this {
    // GS ! n - Set character size (width 0-7, height 0-7)
    return this.add([0x1d, 0x21, (height << 4) | width]);
  }

  setLineSpacing(spacing: number): this {
    return this.add([0x1b, 0x33, spacing]);
  }

  /**
   * Text output
   */
  text(str: string): this {
    const encoder = new TextEncoder();
    this.add(Array.from(encoder.encode(str)));
    return this;
  }

  line(str: string = ""): this {
    this.text(str);
    this.feed(1);
    return this;
  }

  feed(lines: number = 1): this {
    return this.add([0x1b, 0x64, lines]);
  }

  /**
   * Barcode / QR Code
   */
  qrCode(data: string, size: number = 3): this {
    // GS ( k - QR Code
    const encoder = new TextEncoder();
    const payload = encoder.encode(data);
    const len = payload.length + 3;

    this.add([
      0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00 // QR Code model 2
    ]);
    this.add([
      0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size // Set size
    ]);
    this.add([
      0x1d, 0x28, 0x6b, (len & 0xff), (len >> 8) & 0xff, 0x31, 0x50, 0x30
    ]);
    this.add(Array.from(payload));
    this.add([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]); // Print
    return this;
  }

  barcode(data: string, type: "ean13" | "code128" | "code39" = "code128"): this {
    const encoder = new TextEncoder();
    const payload = encoder.encode(data);
    const types = { ean13: 0x02, code128: 0x49, code39: 0x04 };

    this.add([0x1d, 0x48, 0x64]); // HRI below, height 100
    this.add([0x1d, 0x6b, types[type], payload.length]);
    this.add(Array.from(payload));
    return this;
  }

  /**
   * Cutting
   */
  cut(partial: boolean = false): this {
    return this.add([0x1d, 0x56, partial ? 0x01 : 0x00]);
  }

  /**
   * Cash drawer kick
   */
  kickDrawer(pin: 0 | 1 = 0): this {
    return this.add([0x1b, 0x70, pin, 0x19, 0x19]);
  }

  /**
   * Beep
   */
  beep(times: number = 1, duration: number = 50): this {
    return this.add([0x1b, 0x42, times, duration]);
  }

  /**
   * Image printing (raster)
   */
  image(imageData: Uint8Array, width: number): this {
    // GS v 0 - Raster bit image
    const height = Math.ceil(imageData.length / (width / 8));
    const w1 = (width / 8) & 0xff;
    const w2 = ((width / 8) >> 8) & 0xff;
    const h1 = height & 0xff;
    const h2 = (height >> 8) & 0xff;

    this.add([0x1d, 0x76, 0x30, 0x00, w1, w2, h1, h2]);
    this.add(Array.from(imageData));
    return this;
  }

  /**
   * Build final command buffer
   */
  build(): Uint8Array {
    return new Uint8Array(this.commands);
  }

  /**
   * Convert to base64 for Web Bluetooth write
   */
  toBase64(): string {
    return btoa(String.fromCharCode(...this.commands));
  }
}

/**
 * KOT (Kitchen Order Ticket) generator
 */
export interface KOTItem {
  name: string;
  qty: number;
  modifiers?: string[];
  notes?: string;
}

export interface KOTData {
  orderNumber: string;
  tableLabel: string;
  orderType: "dine_in" | "takeaway" | "delivery";
  items: KOTItem[];
  timestamp: Date;
  rush?: boolean;
}

export function generateKOT(data: KOTData, config: Partial<PrinterConfig> = {}): ESCPOS {
  const escpos = new ESCPOS(config);
  const maxChars = MAX_CHARS[config.paperWidth || "80mm"].normal;

  escpos
    .init()
    .setLineSpacing(24);

  // Header
  if (data.rush) {
    escpos.setAlign("center").setBold(true).setDoubleWidth(true).setDoubleHeight(true);
    escpos.line("🔥 RUSH ORDER 🔥");
    escpos.setDoubleWidth(false).setDoubleHeight(false);
  }

  escpos.setAlign("center").setBold(true);
  escpos.line("KITCHEN ORDER TICKET");
  escpos.setBold(false);

  // Order info
  escpos.setAlign("left");
  escpos.line(`Order: ${data.orderNumber}`);
  escpos.line(`Table: ${data.tableLabel}`);
  escpos.line(`Type: ${data.orderType.toUpperCase()}`);
  escpos.line(`Time: ${data.timestamp.toLocaleTimeString("en-IN", { hour12: false })}`);
  escpos.line("-".repeat(maxChars));

  // Items
  for (const item of data.items) {
    escpos.setBold(true);
    escpos.line(`${item.qty}x ${truncate(item.name, maxChars)}`);
    escpos.setBold(false);

    if (item.modifiers && item.modifiers.length) {
      for (const mod of item.modifiers) {
        escpos.line(`  + ${mod}`);
      }
    }

    if (item.notes) {
      escpos.line(`  Note: ${item.notes}`);
    }
    escpos.line("-".repeat(maxChars));
  }

  escpos.feed(2);

  if (config.autoCut) escpos.cut();

  return escpos;
}

/**
 * Bill/Receipt generator
 */
export interface BillData {
  orderNumber: string;
  tableLabel: string;
  items: { name: string; qty: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  timestamp: Date;
  restaurantName: string;
  gstin?: string;
  address?: string;
  phone?: string;
}

export function generateBill(data: BillData, config: Partial<PrinterConfig> = {}): ESCPOS {
  const escpos = new ESCPOS(config);
  const maxChars = MAX_CHARS[config.paperWidth || "80mm"].normal;
  const formatCurrency = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

  escpos
    .init()
    .setLineSpacing(24)
    .setAlign("center");

  // Restaurant header
  escpos.setBold(true).setDoubleWidth(true).line(data.restaurantName);
  escpos.setDoubleWidth(false).setBold(false);

  if (data.address) escpos.line(truncate(data.address, maxChars));
  if (data.phone) escpos.line(`Tel: ${data.phone}`);
  if (data.gstin) escpos.line(`GSTIN: ${data.gstin}`);

  escpos.line("=".repeat(maxChars));

  // Order info
  escpos.setAlign("left");
  escpos.line(`Order: ${data.orderNumber}`);
  escpos.line(`Table: ${data.tableLabel}`);
  escpos.line(`Date: ${data.timestamp.toLocaleDateString("en-IN")} ${data.timestamp.toLocaleTimeString("en-IN", { hour12: false })}`);
  escpos.line("-".repeat(maxChars));

  // Items header
  escpos.line("Item".padEnd(maxChars - 10) + "Qty".padStart(4) + "Total".padStart(6));
  escpos.line("-".repeat(maxChars));

  // Items
  for (const item of data.items) {
    const nameLine = truncate(item.name, maxChars - 10);
    const qtyStr = `${item.qty}`.padStart(4);
    const totalStr = formatCurrency(item.total).padStart(6);
    escpos.line(`${nameLine}${qtyStr}${totalStr}`);
  }

  escpos.line("-".repeat(maxChars));

  // Totals
  const rightAlign = (label: string, value: string) =>
    label.padEnd(maxChars - value.length) + value;

  escpos.line(rightAlign("Subtotal:", formatCurrency(data.subtotal)));
  if (data.discount > 0) escpos.line(rightAlign("Discount:", `-${formatCurrency(data.discount)}`));
  if (data.tax > 0) escpos.line(rightAlign("Tax:", formatCurrency(data.tax)));
  escpos.line("=".repeat(maxChars));
  escpos.setBold(true).line(rightAlign("TOTAL:", formatCurrency(data.total))).setBold(false);
  escpos.line("=".repeat(maxChars));

  // Payment
  escpos.line(`Paid via: ${data.paymentMethod.toUpperCase()}`);
  escpos.feed(2);

  // Footer
  escpos.setAlign("center");
  escpos.line("Thank you for visiting!");
  escpos.line("Please visit again");

  if (config.autoCut) escpos.cut();

  return escpos;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

/**
 * Test print generator
 */
export function generateTestPrint(config: Partial<PrinterConfig> = {}): ESCPOS {
  const escpos = new ESCPOS(config);
  const maxChars = MAX_CHARS[config.paperWidth || "80mm"].normal;

  escpos
    .init()
    .setAlign("center")
    .setBold(true)
    .line("QRSlice Test Print")
    .setBold(false)
    .line("-".repeat(maxChars))
    .setAlign("left")
    .line("Printer: OK")
    .line("Connection: Web Bluetooth")
    .line("Protocol: ESC/POS")
    .line(`Paper: ${config.paperWidth || "80mm"}`)
    .line("Encoding: UTF-8")
    .line("-".repeat(maxChars))
    .setAlign("center")
    .qrCode("https://qrslice.com", 4)
    .feed(2)
    .cut();

  return escpos;
}