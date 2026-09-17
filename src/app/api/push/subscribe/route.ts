// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_ENDPOINT_LEN = 2000;
const MAX_KEY_LEN = 500;

const pushSubscriptionSchema = z.object({
  endpoint: z.string().min(1).max(MAX_ENDPOINT_LEN).startsWith("https://"),
  keys: z.object({
    p256dh: z.string().min(1).max(MAX_KEY_LEN),
    auth: z.string().min(1).max(MAX_KEY_LEN),
  }),
});

const pushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1).max(MAX_ENDPOINT_LEN).startsWith("https://"),
});

/** POST: upsert the current device's push subscription for the caller's restaurant. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const db = createSupabaseAdmin();
  const { error } = await db.from("push_subscriptions").upsert(
    {
      restaurant_id: user.restaurantId,
      endpoint: parsed.data.endpoint,
      keys: parsed.data.keys,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

/** DELETE: remove a push subscription by endpoint, scoped to the caller's restaurant. */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushUnsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const db = createSupabaseAdmin();
  const { error } = await db
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", parsed.data.endpoint)
    .eq("restaurant_id", user.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
