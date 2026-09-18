// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { buildWhatsAppReceiptVars } from "@/lib/whatsapp-templates";
import { baileysClient } from "@/integrations/whatsapp/baileys/client";
import type { WhatsAppTemplate, TemplateComponent, TemplateParameter } from "@/integrations/whatsapp/whatsapp.types";

const sendSchema = z.object({
  order_id: z.string().uuid(),
  phone: z.string().min(10).max(20),
  template_name: z.string().default("bill_receipt"),
  template_language: z.string().default("en"),
  variables: z.record(z.string(), z.unknown()).optional(),
});

function buildTemplateFromVars(templateName: string, templateLanguage: string, vars: Record<string, unknown>): WhatsAppTemplate {
  const components: TemplateComponent[] = [
    {
      type: "body",
      parameters: Object.entries(vars).map(([_, value]) => ({
        type: "text",
        text: String(value),
      })) as TemplateParameter[],
    },
  ];

  return {
    name: templateName,
    language: templateLanguage,
    components,
  };
}

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

    const { order_id, phone, template_name, template_language, variables } = parsed.data;

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

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

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

    const finalVars = { ...defaultVars, ...(parsed.data.variables || {}) };

    const template = buildTemplateFromVars(template_name, template_language, finalVars);

    const { data: existingMsg, error: existingError } = await db
      .from("whatsapp_messages")
      .select("id, status")
      .eq("tenant_id", restaurantId)
      .eq("order_id", order_id)
      .eq("message_type", "bill_receipt")
      .maybeSingle();

    if (existingError) {
      console.error("[WhatsApp Send] Failed to check existing message:", existingError);
      return NextResponse.json({ error: "Failed to check existing message" }, { status: 500 });
    }

    if (existingMsg) {
      return NextResponse.json({ messageId: existingMsg.id, status: existingMsg.status, idempotent: true });
    }

    const { data: outboundMsg, error: logError } = await db
      .from("whatsapp_messages")
      .insert({
        tenant_id: restaurantId,
        order_id: order_id,
        message_type: "bill_receipt",
        recipient_phone: phone,
        template_name,
        template_language,
        template_variables: finalVars,
        status: "pending",
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
      payload: { trigger: "manual_send", template_name, template_language },
    });

    return NextResponse.json({ messageId: outboundMsg.id, status: "pending" });
  } catch (err: any) {
    console.error("[WhatsApp Send] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}