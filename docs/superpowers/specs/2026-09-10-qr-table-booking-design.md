# QR Table Booking — Design Spec (2026-09-10)

## 1. Goal
Make qr-cafe the best QR table-booking system for small Indian cafés:
reserve-ahead + scan-to-claim on one table-truth, plus filler-only copy
cleanup in landing-page voice. No WhatsApp/SMS provider in v1.

## 2. Decisions (user-approved)
- Both flows: advance same-day reservations + walk-in QR claim.
- Free time picker validated against café-settings hours; default hold
  90 min + 15 min cleanup buffer on both sides for overlap checks.
- Auto-match smallest fitting table set; unlimited combine for big parties.
- Walk-in QR claim always wins; overlapping `confirmed` flips to `expired`
  (+ audit row `walkin_override`) or `seated` when code is presented.
- Instant confirm; 30-min grace auto-release; hybrid no-show (auto +
  staff release + customer self-cancel anytime before seating).
- Phone required; 5 bookings/phone/day (+ IP guard); owner + staff manage.
- v1 ticket: new tab movie-ticket card + download-as-JPEG (canvas,
  no backend) containing café, tables, slot, party, 6-char code, QR deep
  link `/bookings/[code]`. No notifications provider.
- Copy: audit-first, filler-only deletions, landing-page voice; money and
  destructive actions keep confirmations.

## 3. Architecture (additive only)
- New table `table_reservations(id, restaurant_id, table_ids uuid[],
  name, phone, party_size, starts_at, ends_at, code char(6), qr_jti,
  status: confirmed/seated/cancelled/expired/no_show, created_at)`.
- Unique `(restaurant_id, code, starts_at::date)`.
- `orders.reservation_id` nullable FK (additive column only).
- RLS: anon insert-only (rate-limited server-side); owners/staff manage
  own café via `qrcafe_auth_restaurant_id()`; super_admin all.
- NEVER rename `cafe_profiles`, `qrcafe_auth_role()`,
  `qrcafe_auth_restaurant_id()` (shared Supabase project).
- Floor map is a read-only view over tables + today's reservations
  (Free/Held/Occupied/Reserved badges); expiry computed on read, lazily
  flipped on next write. No cron, no new table-status columns in v1.
- After any schema change: `NOTIFY pgrst, 'reload schema';` via dashboard.

## 4. Components / data flow
- Public widget on `/c/[slug]`: name/phone/party/free-time → validate
  hours + overlap + seats → rate limit → issue code + ticket tab.
- Ticket page `/bookings/[code]`: card + QR + JPEG download; phone lookup
  for cancel.
- Check-in: table QR → existing `MenuClient`/order flow; overlapping
  reservation linked or expired; audit event written.
- Admin Reservations tab + POS floor badges: confirm/reassign/cancel/
  no-show (owner + staff).
- Copy audit artifact: per-page candidate-removal list; deletions only
  after explicit tick-off.

## 5. Error handling
- Overlap → 409 with next-free suggestion; rate-limit → 429 + retryAfter;
  invalid code/phone → 404/422, never 500 leak.
- Walk-in vs reservation race resolved by (starts_at, created_at)
  ordering; loser gets explicit message, never silent drop.
- Ticket JPEG render failure falls back to printable ticket page.

## 6. Testing
- `npx tsc --noEmit`, `npm run build` clean.
- New vitest probes: overlap incl. buffer, combine fit, rate limit,
  walk-in override, grace expiry.
- Manual on `*.localhost`: book → ticket JPEG → QR check-in → override →
  cancel → floor badges. No Vercel deploy until green.

## 7. Out of scope (v1)
- Advance (>today) booking, per-day hours UI beyond simple open/close,
  SMS/WhatsApp/email providers, web-push, cron releaser, table merges
  beyond seat-sum fit, touching deleted `src/wa/*` or old migrations.
