// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("ingredients")
    .select("*")
    .eq("restaurant_id", user.restaurantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId || user.role === "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, unit, cost_per_unit, min_stock, category } = body;

  if (!name || !unit) {
    return NextResponse.json({ error: "Name and unit are required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();

  // Create ingredient
  const { data: ingredient, error: ingredientError } = await db
    .from("ingredients")
    .insert({
      restaurant_id: user.restaurantId,
      name,
      unit,
      cost_per_unit: cost_per_unit || 0,
      min_stock: min_stock || 0,
      category: category || null,
    })
    .select()
    .single();

  if (ingredientError) {
    return NextResponse.json({ error: ingredientError.message }, { status: 500 });
  }

  // Initialize stock levels for both locations
  await db.from("stock_levels").insert([
    { ingredient_id: ingredient.id, location: "kitchen", quantity: 0 },
    { ingredient_id: ingredient.id, location: "storage", quantity: 0 },
  ]);

  return NextResponse.json(ingredient, { status: 201 });
}

