// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

// GET: Fetch splits for an order
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("order_id");

  if (!orderId) {
    return NextResponse.json({ error: "order_id is required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("split_bills")
    .select(`
      id,
      order_id,
      split_number,
      total_paise,
      payment_status,
      payment_method,
      paid_at,
      split_bill_items (
        id,
        quantity,
        line_total_paise,
        order_items (
          id,
          item_name,
          unit_price_paise
        )
      )
    `)
    .eq("order_id", orderId)
    .order("split_number");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Create splits for an order
// mode: "by_item" | "by_seat" | "by_percentage"
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { order_id, mode, splits } = body;

  if (!order_id || !mode || !splits) {
    return NextResponse.json({ error: "order_id, mode, and splits are required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  // Verify order exists and get items
  const { data: orderItems, error: orderError } = await db
    .from("order_items")
    .select("id, item_name, unit_price_paise, quantity, line_total_paise")
    .eq("order_id", order_id);

  if (orderError || !orderItems || orderItems.length === 0) {
    return NextResponse.json({ error: "Order not found or has no items" }, { status: 404 });
  }

  // Delete existing splits for this order
  await db.from("split_bill_items").delete().in("split_bill_id",
    (await db.from("split_bills").select("id").eq("order_id", order_id)).data?.map(s => s.id) || []
  );
  await db.from("split_bills").delete().eq("order_id", order_id);

  const results = [];

  if (mode === "by_item") {
    // Each split gets specific items
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const splitTotal = split.items.reduce((sum: number, item: any) => {
        const orderItem = orderItems.find(oi => oi.id === item.order_item_id);
        return sum + (orderItem ? orderItem.unit_price_paise * item.quantity : 0);
      }, 0);

      const { data: splitBill } = await db
        .from("split_bills")
        .insert({ order_id, split_number: i + 1, total_paise: splitTotal })
        .select()
        .single();

      if (splitBill) {
        const itemRows = split.items.map((item: any) => {
          const orderItem = orderItems.find(oi => oi.id === item.order_item_id);
          return {
            split_bill_id: splitBill.id,
            order_item_id: item.order_item_id,
            quantity: item.quantity,
            line_total_paise: orderItem ? orderItem.unit_price_paise * item.quantity : 0,
          };
        });
        await db.from("split_bill_items").insert(itemRows);
        results.push(splitBill);
      }
    }
  } else if (mode === "by_seat") {
    // Split evenly by number of seats
    const totalPaise = orderItems.reduce((sum, item) => sum + item.line_total_paise, 0);
    const numSplits = splits.length;
    const perSplit = Math.floor(totalPaise / numSplits);
    const remainder = totalPaise - perSplit * numSplits;

    for (let i = 0; i < numSplits; i++) {
      const splitTotal = i === 0 ? perSplit + remainder : perSplit;
      const { data: splitBill } = await db
        .from("split_bills")
        .insert({ order_id, split_number: i + 1, total_paise: splitTotal })
        .select()
        .single();

      if (splitBill) {
        // Distribute items proportionally
        let remaining = splitTotal;
        const itemRows = [];
        for (const oi of orderItems) {
          const itemShare = Math.min(oi.line_total_paise, remaining);
          if (itemShare > 0) {
            itemRows.push({
              split_bill_id: splitBill.id,
              order_item_id: oi.id,
              quantity: oi.quantity,
              line_total_paise: itemShare,
            });
            remaining -= itemShare;
          }
        }
        if (itemRows.length > 0) {
          await db.from("split_bill_items").insert(itemRows);
        }
        results.push(splitBill);
      }
    }
  } else if (mode === "by_percentage") {
    // Split by percentage
    const totalPaise = orderItems.reduce((sum, item) => sum + item.line_total_paise, 0);

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const splitTotal = Math.round(totalPaise * (split.percentage / 100));

      const { data: splitBill } = await db
        .from("split_bills")
        .insert({ order_id, split_number: i + 1, total_paise: splitTotal })
        .select()
        .single();

      if (splitBill) {
        let remaining = splitTotal;
        const itemRows = [];
        for (const oi of orderItems) {
          const itemShare = Math.min(oi.line_total_paise, remaining);
          if (itemShare > 0) {
            itemRows.push({
              split_bill_id: splitBill.id,
              order_item_id: oi.id,
              quantity: oi.quantity,
              line_total_paise: itemShare,
            });
            remaining -= itemShare;
          }
        }
        if (itemRows.length > 0) {
          await db.from("split_bill_items").insert(itemRows);
        }
        results.push(splitBill);
      }
    }
  }

  return NextResponse.json(results, { status: 201 });
}

