// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ingredient_id, from_location, to_location, quantity } = body;

  if (!ingredient_id || !from_location || !to_location || !quantity) {
    return NextResponse.json(
      { error: "ingredient_id, from_location, to_location, and quantity are required" },
      { status: 400 }
    );
  }

  if (from_location === to_location) {
    return NextResponse.json(
      { error: "Source and destination locations must be different" },
      { status: 400 }
    );
  }

  const db = createSupabaseAdmin();

  // Verify ingredient belongs to this restaurant
  const { data: ingredient, error: ingredientError } = await db
    .from("ingredients")
    .select("id")
    .eq("id", ingredient_id)
    .eq("restaurant_id", user.restaurantId)
    .single();

  if (ingredientError || !ingredient) {
    return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
  }

  // Check source stock
  const { data: sourceStock } = await db
    .from("stock_levels")
    .select("quantity")
    .eq("ingredient_id", ingredient_id)
    .eq("location", from_location)
    .single();

  if (!sourceStock || sourceStock.quantity < quantity) {
    return NextResponse.json(
      { error: `Insufficient stock in ${from_location}. Available: ${sourceStock?.quantity || 0}` },
      { status: 400 }
    );
  }

  // Deduct from source
  await db
    .from("stock_levels")
    .update({ quantity: sourceStock.quantity - quantity, updated_at: new Date().toISOString() })
    .eq("ingredient_id", ingredient_id)
    .eq("location", from_location);

  // Add to destination
  const { data: destStock } = await db
    .from("stock_levels")
    .select("quantity")
    .eq("ingredient_id", ingredient_id)
    .eq("location", to_location)
    .single();

  await db
    .from("stock_levels")
    .update({ quantity: (destStock?.quantity || 0) + quantity, updated_at: new Date().toISOString() })
    .eq("ingredient_id", ingredient_id)
    .eq("location", to_location);

  // Record transactions
  await db.from("stock_transactions").insert([
    {
      ingredient_id,
      location: from_location,
      type: "transfer_out",
      quantity: -quantity,
      reference: `Transfer to ${to_location}`,
      created_by: user.userId,
    },
    {
      ingredient_id,
      location: to_location,
      type: "transfer_in",
      quantity: quantity,
      reference: `Transfer from ${from_location}`,
      created_by: user.userId,
    },
  ]);

  return NextResponse.json({ success: true });
}

