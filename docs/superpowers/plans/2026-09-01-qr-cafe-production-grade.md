# QR Café — Light Premium Production-Grade Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship entire app as warm, friendly light-premium production grade — landing + guest menu light cream/honey, POS/KDS stay dark for kitchen, with fixed table-QR normalization, hamburger nav, real-photo imagery, rich subtle motion, and hospitality copy.

**Architecture:** CSS-variable-driven light theme in `globals.css` + upgraded `src/components/ui/*` primes as single seam. Landing and guest menu consume tokens via Tailwind; POS/KDS remain dark but share toast/empty-state polish. Table QR flow deepened in `src/lib/tenant.ts` with normalize + `resolveTableByLabel`.

**Tech Stack:** Next.js 16.3.3, Tailwind 4, Recharts, qrcode, Supabase SSR, Outfit + Geist fonts

## Global Constraints

- Light premium palette: cream #FFFBF5 / #FFF7ED base, stone-800 text, muted honey #D97706 accent (not vibrant #F59E0B), stone-200 borders, emerald/rose for success/error
- Warm & friendly personality — hospitality first, ROI second, curated 3 testimonials, single ₹799 plan
- Entire app scope but POS/KDS stay dark for kitchen glare (hybrid)
- 60-sec wizard onboarding, hamburger drawer mobile, English only for launch, warm helpful empty states
- Production fixes: table label normalization (T01/01/T1 → 1), hero demo link /T1, branded 80mm receipt header, gentle offline banner, clean meta/OG, in-admin Help tab
- No hard Lighthouse bar — balanced, keep rich motion (counters, carousel, toasts, fade-in-up)

---

### Task 1: Light Premium Design Tokens

**Files:**
- Modify: `src/app/globals.css:1-200`
- Modify: `src/app/layout.tsx:15-45`

**Interfaces:**
- Consumes: existing :root vars
- Produces: --background #FFFBF5, --foreground #1c1917, --accent #D97706, --accent-rgb 217,119,6, .light glass utilities

- [ ] **Step 1: Write failing visual check**
```bash
grep -q "#FFFBF5" src/app/globals.css || echo "FAIL: light bg missing"
```

- [ ] **Step 2: Run check to verify fail**
Run: `grep -q "#FFFBF5" src/app/globals.css && echo PASS || echo FAIL`
Expected: FAIL

- [ ] **Step 3: Implement tokens**
```css
:root { --background:#FFFBF5; --foreground:#1c1917; --accent:#D97706; --accent-rgb:217,119,6; }
body{ background:var(--background); color:var(--foreground); }
.glass { background: rgba(255,255,255,0.75); backdrop-filter: blur(12px); border:1px solid rgba(0,0,0,0.06); }
.glass-card { background:#fff; border:1px solid #e7e5e4; box-shadow: 0 8px 32px rgba(0,0,0,0.06); }
::selection{ background:#D97706; color:#fff; }
::-webkit-scrollbar-track{ background:#f5f5f4; }
::-webkit-scrollbar-thumb{ background:#a8a29e; }
::-webkit-scrollbar-thumb:hover{ background:#D97706; }
```
Update `layout.tsx` metadata themeColor to #FFFBF5, viewport same.

- [ ] **Step 4: Verify pass**
Run: `grep -q "#FFFBF5" src/app/globals.css && echo PASS`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: light premium tokens honey #D97706 cream #FFFBF5"
```

### Task 2: Fix Table QR Normalization + Demo Link

**Files:**
- Modify: `src/lib/tenant.ts:92-115` (already patched, add test)
- Modify: `src/app/page.tsx:214` (hero demo link)
- Test: `src/tests/tenant.test.ts`

**Interfaces:**
- Consumes: normalizeTableLabel, resolveTableByLabel
- Produces: getTenantBySlugAndTableLabel handles T01/01/T1/1, hero link /T1

- [ ] **Step 1: Write failing test**
```ts
// src/tests/tenant.test.ts
import { resolveTableByLabel } from "@/lib/tenant";
describe("resolveTableByLabel", () => {
  const tables = [{label:"T1"},{label:"T2"}] as any;
  it("resolves 01 -> T1", () => expect(resolveTableByLabel(tables,"01")?.label).toBe("T1"));
  it("resolves T01 -> T1", () => expect(resolveTableByLabel(tables,"T01")?.label).toBe("T1"));
  it("resolves t1 -> T1", () => expect(resolveTableByLabel(tables,"t1")?.label).toBe("T1"));
});
```

- [ ] **Step 2: Run test to verify**
Run: `npm run test -- src/tests/tenant.test.ts 2>&1 | tail -20`
Expected: FAIL before fix, PASS after (tenant.ts already patched)

- [ ] **Step 3: Fix hero link**
```tsx
// src/app/page.tsx line 214
href="/c/curry-leaf/t/T1" // was /01
```

- [ ] **Step 4: Run tests pass**
Run: `npx vitest run src/tests/tenant.test.ts`
Expected: 3 PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/tenant.ts src/app/page.tsx src/tests/tenant.test.ts
git commit -m "fix: table QR normalization T01/01/T1 + demo link"
```

### Task 3: UI Primitives Light Variants

**Files:**
- Modify: `src/components/ui/Button.tsx:15-35`
- Modify: `src/components/ui/Card.tsx:10-25`
- Modify: `src/components/ui/Modal.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Badge.tsx`

**Interfaces:**
- Consumes: BASE, VARIANTS tokens
- Produces: Button primary honey, ghost white, Card white, Modal cream, Input cream

- [ ] **Step 1: Write visual regression check**
```bash
grep -q "from-amber-500" src/components/ui/Button.tsx && echo "old amber found"
```

- [ ] **Step 2: Implement light variants**
```ts
// Button VARIANTS light
primary: "bg-[#D97706] hover:bg-[#B45309] text-white shadow-md",
ghost: "bg-white hover:bg-stone-50 text-stone-700 border border-stone-200",
outline: "bg-transparent hover:bg-stone-50 text-stone-600 border border-stone-300",
// Card
default: "bg-white border border-stone-200 shadow-sm",
elevated: "bg-white border border-stone-200 shadow-xl",
```

- [ ] **Step 3: Verify build**
Run: `npm run build 2>&1 | tail -10`
Expected: build success

- [ ] **Step 4: Commit**
```bash
git add src/components/ui/
git commit -m "feat: ui primitives light premium honey"
```

### Task 4: Landing Page Light Premium + Hamburger

**Files:**
- Modify: `src/app/page.tsx:115-770`
- Modify: `src/components/GlobalFlowBar.tsx` if needed

**Interfaces:**
- Consumes: light tokens, Button/Card
- Produces: cream landing, honey CTA, hamburger drawer, hospitality copy

- [ ] **Step 1: Snapshot before**
Run: `curl -s http://localhost:3000 | grep -q "bg-stone-950" && echo dark-found`

- [ ] **Step 2: Rewrite sections**
- Header: bg-white/80 backdrop-blur, stone-800 text, honey CTA, hamburger <768px with drawer (Features/How/ROI/Pricing/FAQ)
- Hero: cream bg, honey gradient text muted, CTAs honey primary + white secondary, counters cream cards
- Bento: cream→white gradient cards stone-200 border, honey icon pills muted
- Simulator: white card stone-200, tabs stone-100/honey active
- ROI: cream card honey accent
- Testimonials: white cards
- Pricing: honey price #D97706, emerald checks
- FAQ: white/stone-50
- Footer: stone-50

- [ ] **Step 3: Verify visual**
Run: `npm run dev &` then `curl -s http://localhost:3000 | grep -q "FFFBF5\|bg-white" && echo PASS`

- [ ] **Step 4: Commit**
```bash
git add src/app/page.tsx
git commit -m "feat: landing light premium warm + hamburger"
```

### Task 5: Guest Menu Light Premium (Speed First)

**Files:**
- Modify: `src/features/menu/MenuClient.tsx`
- Modify: `src/features/menu/MenuItemCard.tsx`
- Modify: `src/features/menu/MenuHeader.tsx`
- Modify: `src/features/menu/MenuCartDrawer.tsx`

**Interfaces:**
- Consumes: light tokens, Button
- Produces: cream menu, white cards, sticky glass-white header, English only, fast cart

- [ ] **Step 1: Implement**
- Bg cream, cards white border stone-200, veg emerald/red pills, ADD honey button, sticky header glass-white, search/filter stone-100, cart drawer white with honey checkout, remove Hindi toggle prop

- [ ] **Step 2: Verify**
Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**
```bash
git add src/features/menu/
git commit -m "feat: guest menu light premium speed-first"
```

### Task 6: POS/KDS Stay Dark Polish + QR Tent Branded

**Files:**
- Modify: `src/components/AdminClient.tsx:519-538` (QR generation)
- Modify: `src/components/PosClient.tsx` (toast colors)
- Modify: `src/components/KdsClient.tsx` (urgency colors)

**Interfaces:**
- Produces: dark POS/KDS with honey toasts, branded tent card

- [ ] **Step 1: Tent card polish**
```tsx
// QRCode.toDataURL width 800, margin 2, dark #1c1917 light #fff
// Tent card: white card, honey top border 4px #D97706, Outfit heading, stone-700 body, footer Powered by QR Café
```

- [ ] **Step 2: Toasts honey/emerald/rose**
```ts
flash ok -> bg-emerald-50 border-emerald-200 text-emerald-700
flash err -> bg-rose-50 border-rose-200 text-rose-700
info -> bg-amber-50 border-amber-200 honey
```

- [ ] **Step 3: Commit**
```bash
git add src/components/AdminClient.tsx src/components/PosClient.tsx
git commit -m "feat: QR tent branded honey + dark POS polish"
```

### Task 7: Onboarding + Admin Light Airy

**Files:**
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/AdminClient.tsx` (tabs, empty states, forms)
- Modify: `src/features/admin/tabs/*`

**Interfaces:**
- Produces: cream onboarding wizard, light admin sidebar stone-50 white cards, warm empty states, honey focus rings

- [ ] **Step 1: Implement**
- Onboarding: cream bg, white card, honey primary, step dots honey, inputs cream stone-200 honey focus
- Admin: sidebar stone-50, cards white, inputs cream honey focus, empty states warm illustration + CTA, checklist cream

- [ ] **Step 2: Verify**
Run: `npm run build 2>&1 | tail -5`
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add src/app/onboarding/page.tsx src/components/AdminClient.tsx src/features/admin/
git commit -m "feat: onboarding + admin light airy warm"
```

### Task 8: Polish Pass — Offline, Receipt, SEO

**Files:**
- Modify: `src/hooks/useOfflineStatus.ts` (gentle banner)
- Modify: `src/features/pos/ZReportModal.tsx` (branded header)
- Modify: `src/app/layout.tsx` (meta OG)
- Modify: `src/components/ToastProvider.tsx`

**Interfaces:**
- Produces: gentle amber banner, 80mm receipt honey header, OG meta clean, toast honey

- [ ] **Step 1: Offline banner**
```tsx
<div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs text-center py-2">Offline — orders queued, will sync when back</div>
```

- [ ] **Step 2: Receipt header**
80mm still, add logo + honey 2px top rule, Outfit heading

- [ ] **Step 3: Verify**
Run: `npx eslint . 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**
```bash
git add src/hooks/useOfflineStatus.ts src/features/pos/ZReportModal.tsx src/app/layout.tsx
git commit -m "feat: offline banner + branded receipt + SEO"
```

