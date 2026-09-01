# Design System — QR Café

## Product Context
- **What this is:** QR dine-in ordering, live voice KDS, fast cash POS, and café management for independent restaurants.
- **Who it's for:** Café/restaurant owners and service staff (hospitality operators), 22-45, running 5-30 tables, low IT, high rush pressure.
- **Space/industry:** Hospitality tech, restaurant POS, QR ordering (peers: Jamezz, Eats365, Gravy, Restrofi, Toast).
- **Project type:** Web app (Next.js) — guest menu (mobile), POS terminal, KDS kitchen, admin/super admin.

## Aesthetic Direction
- **Direction:** Luxury/Refined + Industrial/Utilitarian
- **Decoration level:** intentional — subtle grid grain, heatmap urgency, voice, no purple blobs or decorative excess
- **Mood:** Dark, precise, precious, fast. Expensive OS for cafés, not a pastel marketplace. Memorable thing: luxury dark fast.
- **Reference sites:** Jamezz (QR per table, no app), Eats365 (AI upsell, 3 QR modes), Gravy (POS-integrated, high-traffic)

## Typography
- **Display/Hero:** Outfit 900 — sharp, editorial, luxury
- **Body:** Geist 400 — neutral, fast, UI
- **UI/Labels:** Geist 500
- **Data/Tables:** Geist Mono 500 — tabular-nums for prices, order numbers, timers
- **Code:** JetBrains Mono
- **Loading:** Google Fonts CDN — Outfit, Geist, Geist Mono via next/font
- **Scale:** 10:10, 12:12, 14:14, 16:16, 18:18, 24:30, 32:36, 48:48 (tight, utilitarian)

## Color
- **Approach:** restrained — amber as meaning, rest is stone
- **Primary:** #f59e0b amber — CTA, active table, paid status, revenue
- **Secondary:** #fbbf24 amber light — hover, ping
- **Neutrals:** stone warm grays 950 #0c0a09 bg, 900 #1c1917 surface, 800 #292524 surface2, 700 #44403c border, 400 #a8a29e muted, 100 #f5f5f4 text
- **Semantic:** success #10b981 emerald, warning #f59e0b amber, error #ef4444 red, info #38bdf8
- **Dark mode:** Native dark — reduce saturation 10% for surfaces, keep amber pure

## Spacing
- **Base unit:** 8px
- **Density:** comfortable — 8/16/24 for marketing, 4/8/12 for POS/KDS dense
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** hybrid — grid-disciplined for POS/KDS (dense, utilitarian), creative-editorial for landing (asymmetric, overlap)
- **Grid:** 12 columns desktop, 4 mobile, 16px gutter
- **Max content width:** 1152px (max-w-6xl)
- **Border radius:** sm:8px md:12px lg:16px xl:24px full:9999px — hierarchy, not bubble uniform

## Motion
- **Approach:** intentional — only transitions that aid comprehension, plus voice
- **Easing:** enter ease-out, exit ease-in, move ease-in-out
- **Duration:** micro 50-100ms, short 150-250ms, medium 250-400ms, long 400-700ms

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-01 | Initial design system created | Created by /design-consultation based on QR Café hospitality research, luxury dark fast memorable thing |
