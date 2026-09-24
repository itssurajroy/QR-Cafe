// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { buildWhatsAppReceiptVars } from "@/lib/whatsapp-templates";
import { toWhatsAppJid } from "@/lib/whatsapp-bill-text";

const sendSchema = z
  .object({
    order_id: z.string().uuid().optional(),
    phone: z.string().min(1).max(20),
    message_type: z.enum(["bill_receipt", "test", "keyword_reply", "manual_reply"]).default("bill_receipt"),
    variables: z.record(z.string(), z.unknown()).optional(),
    media_url: z.string().url().optional(),
    media_type: z.enum(["image", "document", "video", "audio"]).optional(),
    caption: z.string().max(1024).optional(),
    buttons: z
      .array(z.object({ id: z.string().min(1).max(20), title: z.string().min(1).max(20) }))
      .max(3)
      .optional(),
  })
  .refine((d) => !d.media_url || !!d.media_type, { message: "media_type required", path: ["media_type"] })
  .refine((d) => !d.media_url || d.media_url.startsWith("https://"), { message: "https only", path: ["media_url"] });

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (auth.role !== "owner" && auth.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden: Only restaurant owners can send WhatsApp messages" }, { status: 403 });
  }

  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;

  try {
    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
    }

    const { order_id, phone, message_type, variables, media_url, media_type, caption, buttons } = parsed.data;

    const [settingsResult, accountsResult] = await Promise.all([
      db.from("whatsapp_settings").select("*").eq("tenant_id", restaurantId).maybeSingle(),
      db.from("whatsapp_accounts").select("*").eq("tenant_id", restaurantId).maybeSingle(),
    ]);

    const { data: waSettings, error: settingsError } = settingsResult;
    const { data: waAccounts, error: accountsError } = accountsResult;

    if (settingsError || accountsError || !waSettings || !waAccounts) {
      return NextResponse.json({ error: "WhatsApp not configured for this restaurant" }, { status: 400 });
    }

    if (!waSettings.enabled) {
      return NextResponse.json({ error: "WhatsApp is not enabled for this restaurant" }, { status: 400 });
    }

    const jid = toWhatsAppJid(phone);
    if (!jid) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const { BaileysSessionStore } = await import("@/integrations/whatsapp/baileys/session-store");
    const linked = await new BaileysSessionStore().hasSession(restaurantId);
    if (!linked) {
      return NextResponse.json(
        { error: "WhatsApp not linked. Link WhatsApp number in Settings first." },
        { status: 400 },
      );
    }

    let order: {
      id: string;
      order_number: string;
      table_label?: string | null;
      total_paise: number;
      payment_method?: string | null;
      payment_status?: string | null;
      status_token?: string | null;
    } | null = null;

    if (order_id) {
      const { data: fetchedOrder, error: orderError } = await db
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .eq("restaurant_id", restaurantId)
        .maybeSingle();

      if (orderError || !fetchedOrder) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      order = fetchedOrder;
    }

    const messageType = order ? message_type : "test";
    const templateName = messageType;
    const templateLanguage = "en";

    let finalVars: Record<string, unknown> = { ...(variables || {}) };

    if (order) {
      const { data: restaurant } = await db
        .from("restaurants")
        .select("name, gstin")
        .eq("id", restaurantId)
        .maybeSingle();

      const receiptUrl = `https://www.qrslice.com/receipt/${order.status_token}`;
      const defaultVars = buildWhatsAppReceiptVars({
        restaurantName: restaurant?.name || "Your Café",
        restaurantGstin: restaurant?.gstin,
        orderNumber: order.order_number,
        tableLabel: order.table_label,
        totalPaise: order.total_paise,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        receiptUrl,
      });

      finalVars = { ...defaultVars, ...finalVars };
    }

    if (order_id) {
      const { data: existingMsg, error: existingError } = await db
        .from("whatsapp_messages")
        .select("id, status")
        .eq("tenant_id", restaurantId)
        .eq("order_id", order_id)
        .eq("message_type", messageType)
        .maybeSingle();

      if (existingError) {
        console.error("[WhatsApp Send] Failed to check existing message:", existingError);
        return NextResponse.json({ error: "Failed to check existing message" }, { status: 500 });
      }

      if (existingMsg) {
        return NextResponse.json({ messageId: existingMsg.id, status: existingMsg.status, idempotent: true });
      }
    }

    const { data: outboundMsg, error: logError } = await db
      .from("whatsapp_messages")
      .insert({
        tenant_id: restaurantId,
        order_id: order_id ?? null,
        message_type: messageType,
        recipient_phone: phone,
        template_name: templateName,
        template_language: templateLanguage,
        template_variables: finalVars,
        status: "pending",
        media_url: media_url ?? null,
        media_type: media_type ?? null,
        caption: caption ?? null,
        buttons: buttons ?? null,
        inbound_id: (variables as Record<string, unknown> | undefined)?.inbound_id
          ? String((variables as Record<string, unknown>).inbound_id)
          : null,
      })
      .select("id")
      .single();

    if (logError) {
      console.error("[WhatsApp Send] Failed to queue message:", logError);
      return NextResponse.json({ error: "Failed to queue message" }, { status: 500 });
    }

    await db.from("whatsapp_message_events").insert({
      tenant_id: restaurantId,
      message_id: outboundMsg.id,
      event_type: "created",
      payload: { trigger: "manual_send", message_type: messageType },
    });

    return NextResponse.json({ messageId: outboundMsg.id, status: "pending" });
  } catch (err: any) {
    console.error("[WhatsApp Send] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
