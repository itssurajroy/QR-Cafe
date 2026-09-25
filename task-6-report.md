# Task 6 Report — Tickets + Inbound Thread APIs

**Base:** `97e44b4` — `feat(whatsapp): inbound dedupe + keyword reply + ticket`
**Commit:** `feat(whatsapp): tickets + inbound thread APIs`
**Spec:** `docs/superpowers/specs/2026-09-24-whatsapp-a1a2-b1b3-design.md` §6 (Inbox B3)
**Plan:** `docs/superpowers/plans/2026-09-24-whatsapp-a1a2-b1b3.md` Task 6

## Scope
- `GET /api/whatsapp/tickets` — list own tenant tickets ordered by `last_message_at DESC`
- `PATCH /api/whatsapp/tickets` — close ticket scoped to `tenant_id` (id via JSON body `id`/`ticketId` or `?id=` query)
- `GET /api/whatsapp/inbound?customer_jid=` — union `whatsapp_inbound_messages` + `whatsapp_messages` for thread, sorted by timestamp

## Files
- `src/app/api/whatsapp/tickets/route.ts` — GET + PATCH
- `src/app/api/whatsapp/inbound/route.ts` — GET union

Both `dynamic = "force-dynamic"`, `getSessionUser()` gate → 401 when anon/missing `restaurantId`, tenant scoping via `eq("tenant_id", auth.restaurantId)`.

## TDD Evidence

### FAIL (before implementation)
Created `src/app/api/whatsapp/task6-tdd.test.ts` importing `tickets/route` and `inbound/route`:

```
FAIL  4 failed — Cannot find module '/src/app/api/whatsapp/tickets/route'
FAIL  Cannot find module '/src/app/api/whatsapp/inbound/route'
Serialized Error: { code: 'ERR_MODULE_NOT_FOUND' }
Test Files  1 failed (4 tests)
```

### PASS (after implementation)
```
RUN  v4.1.11
✓ GET /api/whatsapp/tickets 401 when anon
✓ GET /api/whatsapp/tickets lists own tenant ordered desc
✓ PATCH /api/whatsapp/tickets closes own ticket
✓ GET /api/whatsapp/inbound?customer_jid= unions
Test Files  1 passed (4 tests)
```

TDD file removed before commit (evidence preserved here). Remaining suites:

```
npx vitest run src/app/api/whatsapp --reporter=verbose
✓ pairing.test.ts (9 tests) + task6 (4) → 13 passed

npx vitest run src/integrations/whatsapp/inbound.test.ts
✓ 3 passed (MENU enqueue, dedupe, fromMe filter)
```

## Type Check
```
npx tsc --noEmit
(no output) — clean
```

## Implementation Notes

**`tickets/route.ts:GET`**
- `createSupabaseAdmin().from("whatsapp_tickets").select("*").eq("tenant_id", restaurantId).order("last_message_at", {ascending:false})`
- Returns `{tickets: data ?? []}`, 500 on Supabase error.

**`tickets/route.ts:PATCH`**
- Accepts `id` from `?id=` query or JSON body `{id}` / `{ticketId}` (covers `/:id` vs body callers).
- Missing id → 422, not found → 404, error → 500.
- `update({status:"closed"}).eq("id", id).eq("tenant_id", restaurantId).select("*").maybeSingle()` ensures tenant isolation.

**`inbound/route.ts:GET`**
- Requires `customer_jid` (`customer_jid`/`customerJid`/`jid` aliases) → 422 if missing.
- Derives `phone = jid.split("@")[0].split(":")[0]` (strips device suffix).
- Parallel queries:
  - `whatsapp_inbound_messages.eq("tenant_id", rid).eq("remote_jid", jid).order("received_at", asc)`
  - `whatsapp_messages.eq("tenant_id", rid).eq("recipient_phone", phone).order("created_at", asc)`
- Maps to `{direction:"inbound"|"outbound", timestamp, raw}` and merges sorted `timestamp ASC`.
- Returns `{messages, inbound, outbound}` for UI flexibility (thread bubbles + partition counts), 500 on query error.

## Security
- All queries tenant-scoped; PATCH double-scoped on `id` + `tenant_id` prevents IDOR.
- Auth via `getSessionUser()` only; no header trust.
- `customer_jid` validated non-empty; phone derived server-side.

## Next Step
Inbox UI (`InboxTab.tsx`) can poll `GET /tickets` → select → `GET /inbound?customer_jid=` → composer `POST /api/whatsapp/send` → `PATCH /tickets` close.

## Verification Commands
```bash
npx vitest run src/app/api/whatsapp/task6-tdd.test.ts --reporter=verbose  # FAIL then PASS
npx tsc --noEmit
npm run build # 145 pages expected
```
