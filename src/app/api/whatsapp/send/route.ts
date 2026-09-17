// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { buildWhatsAppReceiptVars, renderWhatsAppMessage } from "@/lib/whatsapp-templates";

const sendSchema = z.object({
  order_id: z.string().uuid(),
  phone: z.string().min(10).max(20),
  template_name: z.string().default("bill_receipt"),
  template_language: z.string().default("en"),
  variables: z.record(z.string(), z.unknown()).optional(),
});

const META_API_BASE = "https://graph.facebook.com/v19.0";

async function sendWhatsAppMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  templateName: string,
  templateLanguage: string,
  variables: Record<string, unknown>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number for WhatsApp (remove + and any non-digits)
    const cleanPhone = to.replace(/\D/g, "");
    
    const body = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage },
        components: [
          {
            type: "body",
            parameters: Object.entries(variables || {}).map(([key, value]) => ({
              type: "text",
              text: String(value),
            })),
          },
        ],
      },
    };

    const response = await fetch(`${META_API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp Send] Meta API error:", data);
      return { success: false, error: data.error?.message || "WhatsApp API error" };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err: any) {
    console.error("[WhatsApp Send] Network error:", err);
    return { success: false, error: err.message || "Network error" };
  }
}

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owners and super_admins can send WhatsApp messages
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

    // Get WhatsApp settings for this restaurant
    const { data: waSettings, error: settingsError } = await db
      .from("restaurant_whatsapp_settings")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (settingsError || !waSettings) {
      return NextResponse.json({ error: "WhatsApp settings not configured" }, { status: 400 });
    }

    if (!waSettings.enabled) {
      return NextResponse.json({ error: "WhatsApp is not enabled for this restaurant" }, { status: 400 });
    }

    if (!waSettings.phone_number_id || !waSettings.access_token) {
      return NextResponse.json({ error: "WhatsApp Cloud API credentials not configured" }, { status: 400 });
    }

    // Get order details for rendering variables
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get restaurant info
    const { data: restaurant } = await db
      .from("restaurants")
      .select("name, gstin")
      .eq("id", restaurantId)
      .maybeSingle();

    // Build variables for template
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

    // Merge with any custom variables provided
    const finalVars = { ...defaultVars, ...(parsed.data.variables || {}) };

    // Create outbound message log entry
    const { data: outboundMsg, error: logError } = await db
      .from("whatsapp_outbound_messages")
      .insert({
        restaurant_id: restaurantId,
        order_id: order_id,
        phone,
        template_name,
        template_language: template_language,
        template_variables: finalVars,
        status: "pending",
      })
      .select()
      .single();

    if (logError) {
      console.error("[WhatsApp Send] Failed to log outbound message:", logError);
    }

    // Send the WhatsApp message
    const result = await sendWhatsAppMessage(
      waSettings.phone_number_id,
      waSettings.access_token,
      phone,
      template_name,
      template_language,
      finalVars
    );

    // Update outbound message log with result
    if (logError) {
      // If logging failed, we can't update, but we should still return the result
    } else {
      await db
        .from("whatsapp_outbound_messages")
        .update({
          status: result.success ? "sent" : "failed",
          meta_message_id: result.messageId,
          error_message: result.error,
          sent_at: result.success ? new Date().toISOString() : null,
          meta_response: result.success ? { message_id: result.messageId } : { error: result.error },
        })
        .eq("id", outboundMsg.id);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send WhatsApp message" }, { status: 500 });
    }

    // Log the send event for analytics
    await db.from("whatsapp_bill_events").insert({
      order_id,
      restaurant_id: restaurantId,
      tenant_id: restaurantId,
      event_type: "sent",
      phone,
      meta: { template_name, template_language, meta_message_id: result.messageId },
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err: any) {
    console.error("[WhatsApp Send] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}