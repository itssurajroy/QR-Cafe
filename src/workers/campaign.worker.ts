// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export interface EnqueueResult {
  enqueued: number;
  skipped: number;
  details: Array<{ tenantId: string; automationId: string; reason: string }>;
}

/**
 * Enqueues due win-back campaign messages into the whatsapp_messages outbox.
 *
 * Workflow:
 *  1. Fetch crm_automations where trigger_type='win_back_30d' AND is_active=true
 *  2. For each automation (tenant):
 *     a. restaurant_customers where last_visit_at <= 30d ago (and not null) → candidate list
 *     b. whatsapp_opt_ins where tenant_id=tenant, status='confirmed', opt_in_type IN ('marketing','both') → phone set
 *     c. audience = candidates whose phone is in the opt-in set
 *     d. dedup: whatsapp_messages where tenant_id=tenant, template_name='win_back', created_at >= 30d ago, recipient_phone IN (audience phones) → recently-messaged set
 *     e. insert pending rows into whatsapp_messages for remaining audience phones:
 *          { tenant_id, order_id: null, message_type: 'marketing',
 *            recipient_phone, template_name: 'win_back', template_language: 'en',
 *            template_variables: { title, message, coupon_code, bonus_points }, status: 'pending' }
 *  3. Return { enqueued, skipped } with per-tenant details
 *
 * Idempotency: the 30-day cooldown dedup (step d) ensures re-running the cron does
 * not double-send to customers recently messaged. UNIQUE(order_id, message_type) does
 * not help for orderless marketing rows (NULL order_id are distinct in Postgres).
 *
 * Delivery is handled by the Task 7 BullMQ worker; this worker ONLY enqueues into the
 * outbox. A separate serverless delivery sweep (deferred to Phase 4/ops) would bridge
 * pending rows to actual Baileys sends on Vercel.
 */
export async function enqueueDueWinBackCampaigns(db: ReturnType<typeof createSupabaseAdmin>): Promise<EnqueueResult> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const details: Array<{ tenantId: string; automationId: string; reason: string }> = [];
  let totalEnqueued = 0;
  let totalSkipped = 0;

  // 1. Fetch win-back automations that are active
  const { data: automations, error: autoErr } = await db
    .from("crm_automations")
    .select("id, restaurant_id, title, message, coupon_code, bonus_points")
    .eq("trigger_type", "win_back_30d")
    .eq("is_active", true);

  if (autoErr) {
    console.error("[Campaign Worker] Failed to fetch win-back automations:", autoErr);
    return { enqueued: 0, skipped: 0, details: [{ tenantId: "", automationId: "", reason: autoErr.message }] };
  }

  if (!automations || automations.length === 0) {
    return { enqueued: 0, skipped: 0, details: [] };
  }

  for (const auto of automations) {
    const { id, restaurant_id: tenantId, title, message, coupon_code, bonus_points } = auto;

    // 2a. Candidates: customers inactive 30d+ (last_visit_at <= 30d ago)
    const { data: customers, error: custErr } = await db
      .from("restaurant_customers")
      .select("id, phone, last_visit_at")
      .eq("restaurant_id", tenantId)
      .gte("last_visit_at", thirtyDaysAgoISO);

    if (custErr) {
      details.push({ tenantId, automationId: id, reason: `DB error fetching customers: ${custErr.message}` });
      totalSkipped += 0;
      continue;
    }

    const candidateList = customers || [];

    // 2b. Opt-in phones: confirmed marketing or both
    const { data: optIns, error: optInErr } = await db
      .from("whatsapp_opt_ins")
      .select("phone, opt_in_type")
      .eq("tenant_id", tenantId)
      .eq("status", "confirmed")
      .in("opt_in_type", ["marketing", "both"]);

    if (optInErr) {
      details.push({ tenantId, automationId: id, reason: `DB error fetching opt-ins: ${optInErr.message}` });
      totalSkipped += 0;
      continue;
    }

    const optInMap = new Map<string, string>();
    for (const o of optIns || []) {
      optInMap.set(o.phone, o.opt_in_type || "marketing");
    }

    // 2c. Audience = candidates whose phone is in opt-in set
    const audience = candidateList.filter((c: any) => c.phone && optInMap.has(c.phone));

    if (audience.length === 0) {
      details.push({ tenantId, automationId: id, reason: "No opted-in inactive customers" });
      totalSkipped += 0;
      continue;
    }

    // 2d. Dedup: recently-messaged phones (within 30d, template_name='win_back')
    const audiencePhones = audience.map((c: any) => c.phone);
    const { data: recentMsg, error: dedupErr } = await db
      .from("whatsapp_messages")
      .select("recipient_phone")
      .eq("tenant_id", tenantId)
      .eq("template_name", "win_back")
      .gte("created_at", thirtyDaysAgoISO)
      .in("recipient_phone", audiencePhones);

    if (dedupErr) {
      details.push({ tenantId, automationId: id, reason: `DB error dedup: ${dedupErr.message}` });
      totalSkipped += 0;
      continue;
    }

    const recentlyMessagedSet = new Set((recentMsg || []).map((m: any) => m.recipient_phone));

    const eligible = audience.filter((c: any) => !recentlyMessagedSet.has(c.phone));

    if (eligible.length === 0) {
      details.push({ tenantId, automationId: id, reason: "All audience phones recently messaged (30d cooldown)" });
      totalSkipped += eligible.length;
      continue;
    }

    // 2e. Insert pending rows for eligible phones
    const insertValues = eligible.map((c: any) => ({
      tenant_id: tenantId,
      order_id: null as string | null,
      message_type: "marketing",
      recipient_phone: c.phone,
      template_name: "win_back",
      template_language: "en",
      template_variables: JSON.stringify({ title, message, coupon_code, bonus_points }),
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertErr } = await db.from("whatsapp_messages").insert(insertValues);

    if (insertErr) {
      details.push({ tenantId, automationId: id, reason: `DB error inserting messages: ${insertErr.message}` });
      totalSkipped += eligible.length;
      continue;
    }

    const enqueuedCount = eligible.length;
    totalEnqueued += enqueuedCount;
    totalSkipped += (audience.length - enqueuedCount); // non-opted-in + dedup hits
    details.push({ tenantId, automationId: id, reason: `${enqueuedCount} messages enqueued, ${audience.length - enqueuedCount} skipped` });
  }

  return { enqueued: totalEnqueued, skipped: totalSkipped, details };
}