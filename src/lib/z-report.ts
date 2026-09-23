// Copyright (c) 2026 QRslice. All rights reserved.

/**
 * Z-report (end-of-day register reconciliation) helpers.
 *
 * A1: totals are bucketed from the `payments` table (tender truth), never from
 * orders.payment_method (which is only the counter/online channel).
 * B7: day boundaries are computed in the tenant's timezone (restaurants.timezone),
 * not UTC — an IST café's "today" starts at 18:30 UTC the previous day.
 */

const DEFAULT_TZ = "Asia/Kolkata";

function safeTimezone(tz: string | null | undefined): string {
  const raw = String(tz || "").trim();
  if (!raw) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: raw });
    return raw;
  } catch {
    return DEFAULT_TZ;
  }
}

/** Offset (ms) such that localWallClock = utc + offset, for a zone at `date`. */
function getTimezoneOffsetMs(tz: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - date.getTime();
}

/** Calendar date (YYYY-MM-DD) of `date` as seen in `tz`. */
function ymdInZone(tz: string, date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function ymdAddDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** UTC instant of local midnight for calendar day `ymd` in `tz` (handles DST via iterative offset). */
function localMidnightInstant(tz: string, ymd: string): Date {
  let guess = Date.parse(`${ymd}T00:00:00.000Z`);
  for (let i = 0; i < 3; i++) {
    const off = getTimezoneOffsetMs(tz, new Date(guess));
    const corrected = Date.parse(`${ymd}T00:00:00.000Z`) - off;
    if (corrected === guess) break;
    guess = corrected;
  }
  return new Date(guess);
}

export interface DayRange {
  /** Inclusive start (ISO-8601 UTC). */
  start: string;
  /** Exclusive end (ISO-8601 UTC) — start of the next local calendar day. */
  end: string;
  /** Local calendar day YYYY-MM-DD in the tenant timezone. */
  day: string;
  timezone: string;
}

/**
 * Half-open [start, end) range covering the local calendar day containing
 * `reference`, in `timezone` (B7).
 */
export function dayRange(
  timezone: string | null | undefined,
  reference: Date = new Date(),
): DayRange {
  const tz = safeTimezone(timezone);
  const day = ymdInZone(tz, reference);
  const start = localMidnightInstant(tz, day);
  const end = localMidnightInstant(tz, ymdAddDays(day, 1));
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    day,
    timezone: tz,
  };
}

export interface PaymentLike {
  provider: string;
  amount_paise: number;
  status?: string | null;
}

export interface PaymentBuckets {
  cash_paise: number;
  upi_paise: number;
  card_paise: number;
  other_paise: number;
  total_paise: number;
  count: number;
}

const CASH_PROVIDERS = new Set(["cash", "cash_pos"]);
const UPI_PROVIDERS = new Set(["upi", "upi_qr", "upi_intent"]);
const CARD_PROVIDERS = new Set(["card", "card_pos", "credit_card", "debit_card"]);

/**
 * Buckets settled payments by tender (A1). Only rows with status success
 * (or missing status treated as success for legacy rows) count.
 */
export function bucketPayments(payments: PaymentLike[]): PaymentBuckets {
  const buckets: PaymentBuckets = {
    cash_paise: 0,
    upi_paise: 0,
    card_paise: 0,
    other_paise: 0,
    total_paise: 0,
    count: 0,
  };

  for (const p of payments) {
    if (p.status && p.status !== "success") continue;
    const amount = Number.isFinite(p.amount_paise) ? Math.round(p.amount_paise) : 0;
    if (amount <= 0) continue;
    const provider = String(p.provider || "").toLowerCase();
    if (CASH_PROVIDERS.has(provider)) buckets.cash_paise += amount;
    else if (UPI_PROVIDERS.has(provider)) buckets.upi_paise += amount;
    else if (CARD_PROVIDERS.has(provider)) buckets.card_paise += amount;
    else buckets.other_paise += amount;
    buckets.total_paise += amount;
    buckets.count += 1;
  }

  return buckets;
}
