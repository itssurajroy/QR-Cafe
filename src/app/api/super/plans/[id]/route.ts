// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const updatePlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/).optional(),
  price_paise: z.number().int().min(100).optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
  features: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  razorpay_plan_id: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updatePlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const db = createSupabaseAdmin();
  const { data: existing } = await db
    .from("subscription_plans")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  if (parsed.data.slug) {
    const { data: slugConflict } = await db
      .from("subscription_plans")
      .select("id")
      .eq("slug", parsed.data.slug)
      .neq("id", id)
      .maybeSingle();

    if (slugConflict) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
    }
  }

  const { data: plan, error } = await db
    .from("subscription_plans")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("audit_events").insert({
    actor_id: superAdmin.userId,
    entity: "subscription_plan",
    entity_id: plan.id,
    action: "update",
    metadata: { changes: parsed.data },
  });

  return NextResponse.json({ plan });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createSupabaseAdmin();

  // Check if plan is referenced by any active subscriptions
  const { data: subscriptions } = await db
    .from("restaurants")
    .select("id")
    .eq("subscription_plan_id", id)
    .limit(1);

  if (subscriptions && subscriptions.length > 0) {
    return NextResponse.json(
      { error: "Cannot delete plan: referenced by active subscriptions" },
      { status: 409 },
    );
  }

  const { data: plan } = await db
    .from("subscription_plans")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  const { error } = await db
    .from("subscription_plans")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("audit_events").insert({
    actor_id: superAdmin.userId,
    entity: "subscription_plan",
    entity_id: id,
    action: "delete",
    metadata: { plan_name: plan?.name },
  });

  return NextResponse.json({ ok: true });
}