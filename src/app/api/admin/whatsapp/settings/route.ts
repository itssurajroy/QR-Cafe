// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { DEFAULT_WA_TEMPLATE } from "@/lib/whatsapp-templates";

const updateSettingsSchema = z
  .object({
    enabled: z.boolean().optional(),
    message_template: z.string().max(2000).optional(),
    include_review_cta: z.boolean().optional(),
    include_gstin_line: z.boolean().optional(),
    thank_you_line: z.string().max(500).optional(),
    restaurant_id: z.string().uuid().optional(),
  })
  .strict();

function getDefaults(restaurantId: string) {
  return {
    enabled: true,
    message_template: DEFAULT_WA_TEMPLATE,
    include_review_cta: true,
    include_gstin_line: true,
    thank_you_line: "Thank you for dining with us!",
    tenant_id: restaurantId,
  };
}

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

  // Fetch from both tables in parallel
  const [settingsResult, accountsResult] = await Promise.all([
    db
      .from("whatsapp_settings")
      .select("*")
      .eq("tenant_id", restaurantId)
      .maybeSingle(),
    db
      .from("whatsapp_accounts")
      .select("*")
      .eq("tenant_id", restaurantId)
      .maybeSingle(),
  ]);

  const { data: settings, error: settingsError } = settingsResult;
  const { data: accounts, error: accountsError } = accountsResult;

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }
  if (accountsError) {
    return NextResponse.json({ error: accountsError.message }, { status: 500 });
  }

  // If both exist, merge and return
  if (settings && accounts) {
    return NextResponse.json({ ...settings, ...accounts });
  }

  // If one exists but not the other, return merged with defaults
  if (settings || accounts) {
    const defaults = getDefaults(restaurantId);
    return NextResponse.json({
      ...defaults,
      ...(settings || {}),
      ...(accounts || {}),
    });
  }

  // Neither exists - return defaults (client handles seeding via PATCH or we could auto-seed)
  return NextResponse.json(getDefaults(restaurantId));
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Owners or Super Admins can modify tenant WhatsApp settings
  if (user.role !== "owner" && user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden: Only restaurant owners can configure WhatsApp settings" },
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

  const { enabled, message_template, include_review_cta, include_gstin_line, thank_you_line, restaurant_id: targetRestId } =
    parsed.data;

  const restaurantId =
    user.role === "super_admin" && targetRestId
      ? targetRestId
      : user.restaurantId;

  const db = createSupabaseAdmin();

  const settingsUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (enabled !== undefined) settingsUpdates.enabled = enabled;
  if (message_template !== undefined) settingsUpdates.message_template = message_template;
  if (include_review_cta !== undefined) settingsUpdates.include_review_cta = include_review_cta;
  if (include_gstin_line !== undefined) settingsUpdates.include_gstin_line = include_gstin_line;
  if (thank_you_line !== undefined) settingsUpdates.thank_you_line = thank_you_line;

  if (Object.keys(settingsUpdates).length === 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: updatedSettings, error: settingsError } = await db
    .from("whatsapp_settings")
    .upsert({ tenant_id: restaurantId, ...settingsUpdates }, { onConflict: "tenant_id" })
    .select()
    .single();

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, settings: updatedSettings });
}