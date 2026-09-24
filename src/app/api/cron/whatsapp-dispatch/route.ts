// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { BaileysConnectionManager } from "@/integrations/whatsapp/baileys/connection-manager";
import { BaileysSessionStore } from "@/integrations/whatsapp/baileys/session-store";
import { buildBillReceiptText, toWhatsAppJid } from "@/lib/whatsapp-bill-text";

const MAX_ATTEMPTS = 3;
/** A `sending` row older than this is presumed orphaned (crash between claim and terminal update). */
const SENDING_STALE_MS = 5 * 60_000;

export const dynamic = "force-dynamic";

type DueRow = {
  id: string;
  tenant_id: string;
  order_id: string | null;
  message_type: string;
  recipient_phone: string;
  template_variables: Record<string, unknown> | null;
  retry_count: number | null;
  max_retries: number | null;
  media_url: string | null;
  media_type: string | null;
  caption: string | null;
  buttons: { id: string; title: string }[] | null;
};

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const now = new Date().toISOString();

  // Reclaim rows orphaned in `sending` by a crashed run. Claim sets `updated_at`,
  // so a row still `sending` with an old `updated_at` was never terminally updated.
  const staleBefore = new Date(Date.now() - SENDING_STALE_MS).toISOString();
  const { error: reclaimError } = await db
    .from("whatsapp_messages")
    .update({
      status: "pending",
      error_message: "reclaimed stale sending",
      updated_at: new Date().toISOString(),
    })
    .eq("status", "sending")
    .lt("updated_at", staleBefore);
  if (reclaimError) {
    console.error("whatsapp-dispatch: stale sending reclaim failed:", reclaimError.message);
  }

  const { data: due, error } = await db
    .from("whatsapp_messages")
    .select(
      "id, tenant_id, order_id, message_type, recipient_phone, template_variables, retry_count, max_retries, media_url, media_type, caption, buttons",
    )
    .eq("status", "pending")
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let claimed = 0;
  let sent = 0;
  let deferred = 0;
  let failed = 0;
  const manager = new BaileysConnectionManager();
  const sessions = new BaileysSessionStore();

  for (const row of (due ?? []) as DueRow[]) {
    const { data: claimedRow } = await db
      .from("whatsapp_messages")
      .update({ status: "sending", updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (!claimedRow) continue;
    claimed++;

    let sendSucceeded = false;
    let providerId: string | null = null;
    try {
      const { data: settings } = await db
        .from("whatsapp_settings")
        .select("enabled")
        .eq("tenant_id", row.tenant_id)
        .maybeSingle();
      if (!settings?.enabled) {
        await db
          .from("whatsapp_messages")
          .update({
            status: "failed",
            error_message: "WhatsApp disabled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        deferred++;
        continue;
      }
      if (!(await sessions.hasSession(row.tenant_id))) {
        await db
          .from("whatsapp_messages")
          .update({
            status: "failed",
            error_message: "not linked",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        deferred++;
        continue;
      }

      const jid = toWhatsAppJid(row.recipient_phone);
      if (!jid) throw new Error("Invalid recipient phone");

      let text: string;
      if (row.order_id && row.message_type === "bill_receipt") {
        const { data: order } = await db
          .from("orders")
          .select(
            "id, order_number, table_label, total_paise, payment_status, payment_method, status_token, order_items(item_name, quantity, line_total_paise)",
          )
          .eq("id", row.order_id)
          .eq("restaurant_id", row.tenant_id)
          .maybeSingle();
        const { data: restaurant } = await db
          .from("restaurants")
          .select("name, gstin")
          .eq("id", row.tenant_id)
          .maybeSingle();
        if (!order) throw new Error("Order not found");
        const items =
          (
            order as unknown as {
              order_items?: { item_name: string; quantity: number; line_total_paise: number }[];
            }
          ).order_items?.map((i) => ({
            name: i.item_name,
            quantity: i.quantity,
            pricePaise: i.line_total_paise,
          })) ?? [];
        text = buildBillReceiptText({
          restaurantName: (restaurant as { name?: string } | null)?.name || "QRslice",
          restaurantGstin: (restaurant as { gstin?: string } | null)?.gstin,
          orderNumber: order.order_number,
          tableLabel: order.table_label,
          items,
          totalPaise: order.total_paise,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          receiptUrl: `https://www.qrslice.com/receipt/${order.status_token}`,
        });
      } else {
        text = String(row.template_variables?.text ?? "QRslice test message ✓");
      }

      await manager.connect(row.tenant_id, { autoReconnect: false });
      await manager.waitForOpen(row.tenant_id, 25_000);
      const socket = manager.getSocket(row.tenant_id);
      if (!socket) throw new Error("Socket unavailable");
      let payload: any;
      if (row.media_url && row.media_type === "image") {
        payload = { image: { url: row.media_url }, caption: row.caption || text };
      } else if (row.media_url && row.media_type === "document") {
        payload = {
          document: { url: row.media_url },
          mimetype: "application/pdf",
          fileName: "Invoice.pdf",
          caption: row.caption || text,
        };
      } else if (row.buttons && Array.isArray(row.buttons) && row.buttons.length > 0) {
        payload = {
          text,
          buttons: (row.buttons as { id: string; title: string }[]).map((b) => ({
            buttonId: b.id,
            buttonText: { displayText: b.title },
            type: 1,
          })),
        };
      } else {
        payload = { text };
      }
      const result = await socket.sendMessage(jid, payload);
      providerId = result?.key?.id ?? null;
      sendSucceeded = true;
      await manager.release(row.tenant_id);

      await db
        .from("whatsapp_messages")
        .update({
          status: "sent",
          provider_message_id: providerId,
          sent_at: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .throwOnError();

      const { error: eventError } = await db.from("whatsapp_message_events").insert({
        tenant_id: row.tenant_id,
        message_id: row.id,
        event_type: "sent",
        payload: { providerMessageId: providerId },
      });
      if (eventError) {
        console.error(
          `whatsapp-dispatch: sent event insert failed for ${row.id}: ${eventError.message}`,
        );
      }
      const { error: seenError } = await db
        .from("whatsapp_accounts")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("tenant_id", row.tenant_id);
      if (seenError) {
        console.error(
          `whatsapp-dispatch: last_seen_at update failed for ${row.id}: ${seenError.message}`,
        );
      }
      sent++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "send failed";
      await manager.release(row.tenant_id).catch(() => {});

      if (sendSucceeded) {
        // The message already left the device — never requeue (that would
        // duplicate-send). Best-effort mark `sent`; if this write is the one
        // failing, leave the row as-is (`sending`) rather than retry-send it.
        // Counted as `sent`: the message did leave, regardless of bookkeeping.
        try {
          await db
            .from("whatsapp_messages")
            .update({
              status: "sent",
              provider_message_id: providerId,
              sent_at: new Date().toISOString(),
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", row.id)
            .throwOnError();
        } catch {
          /* leave status untouched — invariant is never re-send */
        }
        console.error(
          `whatsapp-dispatch: post-send bookkeeping failed for ${row.id}: ${message}`,
        );
        sent++;
        continue;
      }

      const retry = (row.retry_count ?? 0) + 1;
      const giveUp = retry >= (row.max_retries ?? MAX_ATTEMPTS);
      const backoffMs = Math.min(2 ** retry * 30_000, 15 * 60_000);
      const patch: Record<string, unknown> = {
        status: giveUp ? "failed" : "pending",
        retry_count: retry,
        error_message: message,
        updated_at: new Date().toISOString(),
      };
      if (!giveUp) {
        patch.scheduled_at = new Date(Date.now() + backoffMs).toISOString();
      }
      await db.from("whatsapp_messages").update(patch).eq("id", row.id);
      failed++;
    }
  }

  return NextResponse.json({ claimed, sent, deferred, failed });
}
