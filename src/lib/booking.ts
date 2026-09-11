export const BOOKING_BUFFER_MIN = 15;
export const BOOKING_DEFAULT_MIN = 90;
export const BOOKING_GRACE_MIN = 30;
export const BOOKING_MAX_PER_PHONE_PER_DAY = 5;

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function genBookingCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export function overlaps(aS: Date, aE: Date, bS: Date, bE: Date, bufferMin = BOOKING_BUFFER_MIN): boolean {
  const buf = bufferMin * 60000;
  return aS.getTime() < bE.getTime() + buf && bS.getTime() < aE.getTime() + buf;
}

export function pickTables(tables: { id: string; seats: number }[], party: number): string[] | null {
  const sorted = [...tables].sort((x, y) => x.seats - y.seats);
  const single = sorted.find((t) => t.seats >= party);
  if (single) return [single.id];
  const picked: string[] = [];
  let sum = 0;
  for (const t of sorted) {
    picked.push(t.id);
    sum += t.seats;
    if (sum >= party) return picked;
  }
  return null;
}

function hm(d: Date): number {
  // IST wall-clock: open/close hours are stored IST, servers run UTC.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  const [h, m] = parts.split(":").map(Number);
  return h * 60 + m;
}

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function withinHours(starts: Date, ends: Date, open: string, close: string): boolean {
  return hm(starts) >= parseHM(open) && hm(ends) <= parseHM(close) && ends.getTime() > starts.getTime();
}

export function bookingDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function istDayKey(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return parts; // YYYY-MM-DD
}

export function isSameDayIST(a: Date, b: Date): boolean {
  return istDayKey(a) === istDayKey(b);
}

export function istDayStart(now = new Date()): Date {
  const key = istDayKey(now);
  return new Date(`${key}T00:00:00+05:30`);
}

export function isGraceExpired(endsAt: Date, now = new Date(), graceMin = BOOKING_GRACE_MIN): boolean {
  return now.getTime() > endsAt.getTime() + graceMin * 60000;
}

export function suggestNextSlot(
  starts: Date, durationMin: number,
  existing: { starts_at: string; ends_at: string }[],
  stepMin = 30, maxTries = 6, bufferMin = BOOKING_BUFFER_MIN,
): Date | null {
  for (let i = 1; i <= maxTries; i++) {
    const s = new Date(starts.getTime() + i * stepMin * 60000);
    const e = new Date(s.getTime() + durationMin * 60000);
    if (!isSameDayIST(s, starts)) return null;
    const clash = existing.some((r) => overlaps(s, e, new Date(r.starts_at), new Date(r.ends_at), bufferMin));
    if (!clash) return s;
  }
  return null;
}
