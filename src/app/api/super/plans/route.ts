// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  price_paise: z.number().int().min(100),
  billing_cycle: z.enum(["monthly", "yearly"]),
  features: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
  razorpay_plan_id: z.string().optional(),
});

const updatePlanSchema = createPlanSchema.partial();

export async function GET() {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createSupabaseAdmin();
  const { data: plans, error } = await db
    .from("subscription_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
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

  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const db = createSupabaseAdmin();
  const { data: plan, error } = await db
    .from("subscription_plans")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("audit_events").insert({
    actor_id: superAdmin.userId,
    entity: "subscription_plan",
    entity_id: plan.id,
    action: "create",
    metadata: { plan: plan.name },
  });

  return NextResponse.json({ plan }, { status: 201 });
}