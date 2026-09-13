// Copyright (c) 2026 QRslice. All rights reserved.
/**
 * QRslice — Shared Utility Functions
 * All pure helper functions used across the app.
 * Previously duplicated inline in MenuClient, PosClient, AdminClient, etc.
 */

// ─── Currency ─────────────────────────────────────────────────────────────────

/** Format paise (integer) as ₹ string with Indian locale */
export function paise(n: number): string {
  return `₹${(Math.max(0, n) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Alias for paise() — matches legacy formatPaise usage */
export const formatPaise = paise;

/** Format a rupees number as ₹ string */
export function formatRupees(rupees: number): string {
  return `₹${Math.max(0, rupees).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/** Convert paise integer to rupees float */
export function paiseToRupees(n: number): number {
  return n / 100;
}

/** Convert rupees float to paise integer */
export function rupeesToPaise(r: number): number {
  return Math.round((r + Number.EPSILON) * 100);
}

// ─── Tax ──────────────────────────────────────────────────────────────────────

/** Calculate tax amount in paise given subtotal paise and rate percent */
export function calculateTax(subtotalPaise: number, taxRatePercent: number): number {
  if (!taxRatePercent || taxRatePercent <= 0) return 0;
  return Math.round((subtotalPaise * taxRatePercent) / 100);
}

/** Calculate grand total paise including tax */
export function calculateTotal(subtotalPaise: number, taxRatePercent: number): number {
  return subtotalPaise + calculateTax(subtotalPaise, taxRatePercent);
}

// ─── Date & Time ──────────────────────────────────────────────────────────────

/** Format an ISO date string to Indian locale date */
export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format an ISO date string to Indian time (12-hour) */
export function formatTime(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format an ISO date/time string — alias for legacy formatDateTime usage */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/** Format elapsed seconds as "Xm Ys" */
export function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs < 10 ? "0" + secs : secs}s`;
}

/** Format countdown seconds as "MM:SS" */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Order Status Helpers ─────────────────────────────────────────────────────

export function isOrderPaid(status: string): boolean {
  return status === "paid";
}

export function isOrderServed(status: string): boolean {
  return status === "served";
}

export function isOrderActive(status: string): boolean {
  return ["pending", "confirmed", "preparing", "ready"].includes(status);
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Order Placed",
    confirmed: "Accepted",
    preparing: "Cooking",
    ready: "Ready to Serve",
    served: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };
  return labels[status] ?? status;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "text-stone-400",
    confirmed: "text-blue-400",
    preparing: "text-amber-400",
    ready: "text-emerald-400",
    served: "text-emerald-500",
    cancelled: "text-red-400",
    rejected: "text-red-500",
  };
  return colors[status] ?? "text-stone-400";
}

// ─── Kitchen Urgency ──────────────────────────────────────────────────────────

/** Get Tailwind color classes for order urgency based on elapsed minutes */
export function getUrgencyColor(minutesElapsed: number): string {
  if (minutesElapsed < 8) return "text-emerald-400 bg-emerald-950/60 border-emerald-800";
  if (minutesElapsed < 15) return "text-amber-400 bg-amber-950/60 border-amber-800";
  return "text-red-400 bg-red-950/60 border-red-800 animate-pulse";
}

// ─── Menu / Image Helpers ─────────────────────────────────────────────────────

const IMAGE_MAP: Record<string, string> = {
  coffee: "coffee",
  latte: "coffee",
  cappuccino: "coffee",
  espresso: "coffee",
  mocha: "coffee",
  chai: "tea",
  tea: "herbal-tea",
  burger: "hamburger",
  sandwich: "sandwich",
  wrap: "wrap",
  pizza: "pizza",
  pasta: "pasta",
  noodle: "noodles",
  biryani: "biryani",
  rice: "rice",
  salad: "salad",
  shake: "milkshake",
  smoothie: "smoothie",
  juice: "juice",
  cake: "cake",
  dessert: "dessert",
  ice: "ice-cream",
  waffle: "waffle",
  pancake: "pancake",
  fries: "french-fries",
  tikka: "chicken-tikka",
  paneer: "paneer",
  dosa: "dosa",
  idli: "idli",
};

const GOURMET_PHOTO_MAP: Record<string, string> = {
  "paneer tikka": "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80",
  "paneer wrap": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80",
  paneer: "https://images.unsplash.com/photo-1567184109411-b28f27024316?w=800&auto=format&fit=crop&q=80",
  "butter chicken": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800&auto=format&fit=crop&q=80",
  "chicken biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  "veg biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  biryani: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80",
  "chole bhature": "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
  chole: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80",
  "dal makhani": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
  dal: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80",
  "masala dosa": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80",
  dosa: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80",
  "pav bhaji": "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&auto=format&fit=crop&q=80",
  "veg momo": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
  "chicken momo": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
  momos: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
  momo: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80",
  "margherita pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
  "chicken burger": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
  "veg burger": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&auto=format&fit=crop&q=80",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
  "chicken shawarma": "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80",
  shawarma: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80",
  wrap: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&auto=format&fit=crop&q=80",
  "masala fries": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80",
  fries: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80",
  "chicken popcorn": "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80",
  popcorn: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80",
  "garlic bread": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&auto=format&fit=crop&q=80",
  bread: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=800&auto=format&fit=crop&q=80",
  coffee: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
  cappuccino: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
  latte: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
  chai: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
  tea: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
  shake: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80",
  smoothie: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop&q=80",
  juice: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&auto=format&fit=crop&q=80",
  pasta: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop&q=80",
  dessert: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&auto=format&fit=crop&q=80",
};

export function getItemImage(name: string, isVeg: boolean): string {
  const lower = name.toLowerCase().trim();
  for (const [key, url] of Object.entries(GOURMET_PHOTO_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }
  return isVeg
    ? "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80"
    : "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80";
}

// ─── Category Emoji ───────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  coffee: "☕", tea: "🍵", drinks: "🧃", beverages: "🥤",
  juices: "🍹", smoothie: "🥤", shakes: "🥛",
  pizza: "🍕", burger: "🍔", sandwich: "🥪", wraps: "🌯",
  pasta: "🍝", noodles: "🍜", rice: "🍛", biryani: "🫕",
  starters: "🍢", appetizers: "🥗", salads: "🥗",
  mains: "🍽️", main: "🍽️", meals: "🍽️",
  desserts: "🍰", sweets: "🍮", ice: "🍨",
  snacks: "🥨", fries: "🍟", breads: "🫓", soups: "🍲",
  default: "🍴",
};

/** Map a category name to an emoji */
export function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return CATEGORY_EMOJI.default;
}

// ─── Prep Time Estimation ─────────────────────────────────────────────────────

/** Estimate preparation time from item name */
export function getPrepTime(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("biryani") || lower.includes("thali")) return "20 min";
  if (lower.includes("pizza") || lower.includes("pasta") || lower.includes("noodle")) return "15 min";
  if (lower.includes("tikka") || lower.includes("kebab") || lower.includes("grill")) return "18 min";
  if (lower.includes("burger") || lower.includes("sandwich") || lower.includes("wrap")) return "10 min";
  if (lower.includes("coffee") || lower.includes("tea") || lower.includes("chai") || lower.includes("cappuccino") || lower.includes("latte") || lower.includes("espresso") || lower.includes("mocha")) return "5 min";
  if (lower.includes("shake") || lower.includes("smoothie") || lower.includes("juice")) return "5 min";
  return "10 min";
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

/** Derive a cosmetic star rating (4.1–4.9) from an item's ID hash */
export function getStarRating(id: string): number {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return parseFloat((4.1 + (hash % 9) * 0.1).toFixed(1));
}

// ─── String Utilities ─────────────────────────────────────────────────────────

/** Truncate a string to maxLen with ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

/** Convert a restaurant name to a URL-safe slug */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ─── WhatsApp Formatting Helpers ──────────────────────────────────────────────

/** Normalize an Indian/international phone number for WhatsApp API & wa.me URLs */
export function normalizeWaPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    digits = `91${digits}`;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
}

/** Build a valid WhatsApp wa.me link with encoded text message */
export function getWaLink(phone: string, message: string): string {
  const normalized = phone ? normalizeWaPhone(phone) : "";
  const encodedText = encodeURIComponent(message);
  if (normalized) {
    return `https://wa.me/${normalized}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



