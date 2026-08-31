/**
 * QR Café — Shared Utility Functions
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

export function getItemImage(name: string, isVeg: boolean): string {
  const lower = name.toLowerCase();
  for (const [key, term] of Object.entries(IMAGE_MAP)) {
    if (lower.includes(key)) {
      const seed = term.replace(/[^a-z0-9]/g, "");
      return `https://picsum.photos/seed/${seed}-${lower.length}/400/300`;
    }
  }
  const fallback = isVeg ? "veg" : "food";
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${fallback}-${hash % 1000}/400/300`;
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

