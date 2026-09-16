// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_WA_TEMPLATE } from "@/lib/whatsapp-templates";

const updateSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  message_template: z.string().min(10).optional(),
  include_review_cta: z.boolean().optional(),
  include_gstin_line: z.boolean().optional(),
  thank_you_line: z.string().optional(),
  restaurant_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedRestaurantId = searchParams.get("restaurant_id");

  const restaurantId =
    user.role === "super_admin" && requestedRestaurantId
      ? requestedRestaurantId
      : user.restaurantId;

  const db = createSupabaseAdmin();

  // 1. Fetch existing settings
  const { data: existing, error } = await db
    .from("restaurant_whatsapp_settings")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json(existing);
  }

  // 2. Auto-seed default settings if missing so client never deals with null
  const defaultRow = {
    restaurant_id: restaurantId,
    enabled: true,
    message_template: DEFAULT_WA_TEMPLATE,
    include_review_cta: true,
    include_gstin_line: true,
    thank_you_line: "Thank you for dining with us!",
  };

  const { data: created, error: insertErr } = await db
    .from("restaurant_whatsapp_settings")
    .insert(defaultRow)
    .select()
    .single();

  if (insertErr) {
    // If concurrent insert occurred or write failed, return memory default
    return NextResponse.json(defaultRow);
  }

  return NextResponse.json(created);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Owners or Super Admins can modify tenant WhatsApp messaging settings
  if (user.role !== "owner" && user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only restaurant owners can configure WhatsApp bill settings" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const {
    enabled,
    message_template,
    include_review_cta,
    include_gstin_line,
    thank_you_line,
    restaurant_id: targetRestId,
  } = parsed.data;

  const restaurantId =
    user.role === "super_admin" && targetRestId
      ? targetRestId
      : user.restaurantId;

  const db = createSupabaseAdmin();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (enabled !== undefined) updates.enabled = enabled;
  if (message_template !== undefined) updates.message_template = message_template;
  if (include_review_cta !== undefined) updates.include_review_cta = include_review_cta;
  if (include_gstin_line !== undefined) updates.include_gstin_line = include_gstin_line;
  if (thank_you_line !== undefined) updates.thank_you_line = thank_you_line;

  const { data, error } = await db
    .from("restaurant_whatsapp_settings")
    .upsert({
      restaurant_id: restaurantId,
      ...updates,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: data });
}
