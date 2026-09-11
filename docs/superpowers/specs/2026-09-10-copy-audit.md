# Copy audit — 2026-09-10 (Plan 3, Task 4)

Grep-driven candidate list only. **Nothing was deleted.** Filler-only rule: CUT only for
placeholder / duplicated / internal-jargon strings; every instruction, confirmation, price,
or error string is KEEP.

## Audit table

| Page | file:line | String | Verdict (KEEP/CUT) | Reason |
|------|-----------|--------|--------------------|--------|
| Admin dashboard | `src/components/AdminClient.tsx:619` | `Café Launch Checklist` | KEEP | needed instruction (onboarding checklist heading) |
| Admin dashboard | `src/components/AdminClient.tsx:646` | `Test Guest Menu ↗` | KEEP | needed instruction (link to preview guest menu) |
| Guest menu | `src/features/menu/MenuItemCard.tsx:39` (logic comment `:29`) | `Chef's Pick` | KEEP | needed merchandising label, landing-page voice |
| Guest menu | `src/features/menu/MenuClient.tsx:311` | `Customers also ordered` | KEEP | needed upsell section heading |
| Guest menu (i18n) | `src/features/menu/MenuClient.tsx:32` | `payAtCounter: "Pay at Counter"` | KEEP | needed payment confirmation (single source string) |
| Cart drawer | `src/features/menu/MenuCartDrawer.tsx:171` | `Pay at Counter` | KEEP | needed payment confirmation (renders the shared string above, not duplicated copy) |
| Order tracking | `src/app/order/[statusToken]/page.tsx:262` | `Live Kitchen Sync` | KEEP | needed live-status confirmation |
| Public café menu | `src/components/PublicCafeClient.tsx:51` (comment `:41`) | `⇄ Switch Table ({selectedTableLabel})` | KEEP | needed instruction (table switching action) |
| Super console | `src/components/SuperClient.tsx:1080` | `All-in-One Plan (₹)` | CUT | internal-jargon: conflicts with public Basic/Pro tier names |
| Super console | `src/components/SuperClient.tsx:563,565` | `Free Trials` / `7-day trial mode` | KEEP | needed status info (trial dashboard labels) |
| Super console | `src/components/SuperClient.tsx:784` | `Free Trial` (status option) | KEEP | needed status label |
| Super console | `src/components/SuperClient.tsx:880` | `Add 7 Free Trial Days` (title attr) | KEEP | needed action confirmation |
| Super console | `src/components/SuperClient.tsx:1044` | `Default Free Trial Duration` | KEEP | needed config label |
| Super console | `src/app/super/page.tsx:159` | `Free Trial` (stat) | KEEP | needed status label |
| Onboarding | `src/app/onboarding/page.tsx:392` | `7-Day Free Trial` | KEEP | needed trial confirmation |
| Onboarding | `src/app/onboarding/page.tsx:398,401` | `Basic Plan` / `₹699/mo` | KEEP | needed pricing |
| Super console | `src/components/SuperClient.tsx:1569` | `₹699/mo` | KEEP | needed pricing display |
| Landing hero | `src/components/landing/Hero.tsx:9` | `Starts at only ₹699` | KEEP | needed pricing |
| Landing FAQ | `src/components/landing/FAQ.tsx:19` | `Two plans: Basic (₹699/mo)… Pro (₹999/mo)…` | KEEP | needed pricing |
| Landing CTA | `src/components/landing/CTA.tsx:14` | `⚡ Quick Setup • No App Required` | KEEP | landing-page voice (eyebrow badge) |
| Landing CTA | `src/components/landing/CTA.tsx:17-21` | `Ready to Serve More Customers Without Hiring Extra Staff?` | KEEP | landing-page voice (headline) |
| Landing CTA | `src/components/landing/CTA.tsx:25` | `Join hundreds of Indian cafes using QR Café… starting at just ₹699/mo.` | KEEP | landing-page voice + needed pricing |
| Landing CTA | `src/components/landing/CTA.tsx:33` | `Start Free Setup Now` | KEEP | needed instruction (primary CTA, distinct) |
| Landing CTA | `src/components/landing/CTA.tsx:40` | `Book a Live Demo` | KEEP | needed instruction (secondary CTA, distinct) |
| Landing CTA | `src/components/landing/CTA.tsx:46` | `✓ Starting at ₹699/mo` | CUT | duplicated: same-section price restatement of line 25 |
| Landing CTA | `src/components/landing/CTA.tsx:49,52` | `30-Minute Live Onboarding` / `Cancel Anytime` | KEEP | needed trust confirmations |
| Landing navbar | `src/components/landing/Navbar.tsx:99,180` | `Get Started` (desktop + mobile) | KEEP | needed instruction (shared CTA across breakpoints, not duplicated copy) |
| Landing hero | `src/components/landing/Hero.tsx:131` | `Get Started in 30 Minutes` | KEEP | needed instruction (distinct hero CTA) |
| Landing hero | `src/components/landing/Hero.tsx:138` | `Watch Live Demo` | KEEP | needed instruction (distinct secondary CTA) |
| Landing footer | `src/components/landing/Footer.tsx:51` | `Get Started` | KEEP | needed instruction (standard cross-page nav CTA) |
| Landing pricing | `src/components/landing/Pricing.tsx:8` | `Start with Basic` | KEEP | needed instruction (distinct tier CTA) |
| Landing pricing | `src/components/landing/Pricing.tsx:24` | `Go Pro` | KEEP | needed instruction (distinct tier CTA) |
| Admin nav | `src/features/admin/AdminTopNav.tsx:27` | `AI SOON` badge on Analytics | CUT | placeholder/internal-jargon badge on unshipped feature |
| Code comment | `src/lib/inventory.ts:99` | `TODO: Send low stock alert…` | CUT | placeholder dev comment, not user-facing |
| Code comment | `src/app/api/feedback/route.ts:51` | `TODO: Send low rating alert…` | CUT | placeholder dev comment, not user-facing |
| Code comment | `src/app/api/orders/[id]/route.ts:152` | `TODO: Send status notification…` | CUT | placeholder dev comment, not user-facing |
| Code comment | `src/app/api/orders/[id]/route.ts:156` | `TODO: Send delay notification…` | CUT | placeholder dev comment, not user-facing |
| Config fallback | `src/lib/razorpay.ts:3` | `rzp_test_placeholder` | KEEP | needed functional mock fallback, not user-facing filler |
| Config fallback | `src/lib/razorpay.ts:4` | `secret_placeholder` | KEEP | needed functional mock fallback, not user-facing filler |
| Config fallback | `src/lib/razorpay.ts:51` | `whsec_placeholder` | KEEP | needed functional mock fallback, not user-facing filler |

Negative sweep: `FIXME|XXX|HACK(|lorem|Lorem|dummy|foobar` → zero hits in `src/`.

## Tick-off checklist (user approval required before any deletion plan)

- [ ] `All-in-One Plan (₹)` — `src/components/SuperClient.tsx:1080` (rename to match Basic/Pro tiers)
- [ ] `✓ Starting at ₹699/mo` badge — `src/components/landing/CTA.tsx:46` (duplicates line 25)
- [ ] `AI SOON` badge — `src/features/admin/AdminTopNav.tsx:27` (remove or replace when Analytics ships)
- [ ] `TODO` — `src/lib/inventory.ts:99`
- [ ] `TODO` — `src/app/api/feedback/route.ts:51`
- [ ] `TODO` — `src/app/api/orders/[id]/route.ts:152`
- [ ] `TODO` — `src/app/api/orders/[id]/route.ts:156`

## Verification (5 random rows re-grepped, all match)

1. `AI SOON` re-grep in `src/features/admin/AdminTopNav.tsx` → hit at line 27. MATCH.
2. `Customers also ordered` re-grep in `src/features/menu/MenuClient.tsx` → hit at line 311. MATCH.
3. `7-Day Free Trial` re-grep in `src/app/onboarding/page.tsx` → hit at line 392. MATCH.
4. `TODO` re-grep in `src/app/api/orders/[id]/route.ts` → hits at lines 152, 156. MATCH.
5. `Starting at ₹699/mo` re-grep in `src/components/landing/CTA.tsx` → hit at line 46. MATCH.

Result: 5/5 file:line confirmations match. No source files edited.
