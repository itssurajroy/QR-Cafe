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
  const { ingredient_id, location, quantity, type, notes } = body;

  if (!ingredient_id || !location || quantity === undefined || !type) {
    return NextResponse.json(
      { error: "ingredient_id, location, quantity, and type are required" },
      { status: 400 }
    );
  }

  if (!["adjustment", "waste"].includes(type)) {
    return NextResponse.json(
      { error: "Type must be 'adjustment' or 'waste'" },
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

  // Get current stock
  const { data: stock } = await db
    .from("stock_levels")
    .select("quantity")
    .eq("ingredient_id", ingredient_id)
    .eq("location", location)
    .single();

  const newQuantity = (stock?.quantity || 0) + quantity;

  if (newQuantity < 0) {
    return NextResponse.json(
      { error: `Insufficient stock. Current: ${stock?.quantity || 0}, Adjustment: ${quantity}` },
      { status: 400 }
    );
  }

  // Update stock level
  await db
    .from("stock_levels")
    .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq("ingredient_id", ingredient_id)
    .eq("location", location);

  // Record transaction
  await db.from("stock_transactions").insert({
    ingredient_id,
    location,
    type,
    quantity,
    notes: notes || null,
    created_by: user.userId,
  });

  return NextResponse.json({ success: true, new_quantity: newQuantity });
}

