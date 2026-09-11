# Design System — QRslice

## Product Context
- **What this is:** QR dine-in ordering, table reservations, live KDS, fast POS billing, and café management for independent restaurants.
- **Who it's for:** Café/restaurant owners and service staff (hospitality operators), 22-45, running 5-30 tables, low IT, high rush pressure. Plus dine-in guests on phones.
- **Space/industry:** Hospitality tech, restaurant POS, QR ordering (peers: Jamezz, Eats365, Gravy, Restrofi, Toast).
- **Project type:** Web app (Next.js) — guest menu (mobile), table booking + movie-style tickets, POS terminal, KDS kitchen, admin/super admin.

## Aesthetic Direction
- **Direction:** Clean/light + utilitarian. Light is the default everywhere a human reads or taps.
- **Decoration level:** intentional — status color, badges, no decorative excess
- **Mood:** Clean, fast, legible under pressure. Bright admin and guest surfaces; one deliberate dark exception (standalone KDS wall display).
- **Reference sites:** Jamezz (QR per table, no app), Eats365 (AI upsell, 3 QR modes), Gravy (POS-integrated, high-traffic)

## Surfaces (which theme where)
| Surface | Theme | Primary accent |
|---|---|---|
| Landing page | Light (slate-50/white) | indigo-600 |
| Guest menu, cart, booking widget, ticket | Light | indigo-600 |
| POS register + billing drawer | Light | indigo-600 |
| POS kitchen queue (KitchenView) | Light | indigo-600 |
| Admin, super-admin, onboarding, inventory, billing | Light | indigo-600 |
| Standalone KDS wall display (`/kds`, KdsClient) | **Dark (exception)** | amber-500 |
| Order status page (`/order/[statusToken]`) | Light (converted; payment-due alert stays red, stars stay amber) | indigo-600 |

- **Rule for new work:** build light. Dark is allowed only for wall-mounted/glare contexts with explicit approval. Never add a theme toggle; the KDS toggle was removed.
- **Amber's role:** semantic/status meaning only — pending, held, warning, stars, loyalty. Never primary CTA on light surfaces.

## Typography
- **Display/Hero:** Outfit 900 — sharp, editorial
- **Body:** Geist 400 — neutral, fast, UI
- **UI/Labels:** Geist 500
- **Data/Tables:** Geist Mono 500 — tabular-nums for prices, order numbers, timers
- **Code:** JetBrains Mono
- **Loading:** Google Fonts via next/font — Outfit, Geist, Geist Mono
- **Scale:** 10:10, 12:12, 14:14, 16:16, 18:18, 24:30, 32:36, 48:48 (tight, utilitarian)

## Color
- **Approach:** light-first — indigo for action, slate for structure, amber for status
- **Primary:** #4f46e5 indigo-600 — CTA, active states, links, prices on light surfaces
- **Primary hover:** #6366f1 indigo-500
- **Neutrals:** slate — 50 #f8fafc bg, white cards, 100/200 borders, 500 muted, 700/900 text
- **Semantic:** success #10b981 emerald, warning #f59e0b amber, error #ef4444 red, info #3b82f6 blue
- **Dark exception palette** (`/kds` only): stone-950 bg, stone-900 surface, amber-500 accents

## Spacing
- **Base unit:** 8px
- **Density:** comfortable — 8/16/24 for marketing, 4/8/12 for POS/KDS dense
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** hybrid — grid-disciplined for POS/KDS (dense, utilitarian), creative-editorial for landing
- **Grid:** 12 columns desktop, 4 mobile, 16px gutter
- **Max content width:** 1152px (max-w-6xl); guest flows max-w-md/xl centered
- **Border radius:** sm:8px md:12px lg:16px xl:24px full:9999px — hierarchy, not bubble uniform
- **Responsive KDS:** wider than 768px renders the 4-column Kanban; narrower hides it for a fixed bottom nav (New/Queue/Cooking/Ready) with a single-column list

## Motion
- **Approach:** intentional — only transitions that aid comprehension, plus voice
- **Easing:** enter ease-out, exit ease-in, move ease-in-out
- **Duration:** micro 50-100ms, short 150-250ms, medium 250-400ms, long 400-700ms

## Interaction Patterns (established, reuse these)
- **Touch targets:** 44px minimum on all POS/KDS/guest controls
- **Optimistic status updates:** move the ticket instantly, fire the write, revert + `toast.error` on failure
- **Feedback:** global ToastProvider (`success/error/info/warning`); exact user-facing strings defined per feature
- **KDS alerting:** audio tone + `navigator.vibrate([200,100,200])` on Rush; screen wake lock while mounted
- **Booking ticket:** movie-ticket card with QR + one-tap JPEG download; short 6-char code as fallback credential
- **No theme toggles.** No dark gradients on light surfaces.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-01 | Initial design system created | Created by /design-consultation based on QRslice hospitality research, luxury dark fast memorable thing |
| 2026-09-10 | Light-first rewrite: indigo primary, slate surfaces app-wide | Dark-on-dark failed legibility on guest phones and daytime counters; amber demoted to status meaning |
| 2026-09-10 | Dark exception scoped to `/kds` wall display only; KDS toggle deleted | Kitchens want glare-proof walls; everywhere else stays light with no toggle |
| 2026-09-10 | `/order/[statusToken]` logged as dark-theme debt | Customer-facing but unconverted; convert before calling migration done |
| 2026-09-10 | Order status page converted to light; debt closed | Stepper/current-step/CTAs indigo; payment-due red alert, stars, loyalty amber kept as status meaning |
