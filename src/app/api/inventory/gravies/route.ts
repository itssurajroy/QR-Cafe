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
    .from("gravy_recipes")
    .select(`
      id,
      name,
      instructions,
      yield_quantity,
      yield_unit,
      cost_per_yield,
      gravy_ingredients (
        id,
        quantity,
        ingredients (
          id,
          name,
          unit,
          cost_per_unit
        )
      )
    `)
    .eq("restaurant_id", user.restaurantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate cost per gravy
  const result = data.map((gravy) => {
    const totalCost = (gravy.gravy_ingredients || []).reduce(
      (sum: number, gi: any) => {
        const ingredientCost = gi.ingredients?.cost_per_unit || 0;
        return sum + ingredientCost * gi.quantity;
      },
      0
    );
    return {
      ...gravy,
      total_cost: totalCost,
      cost_per_yield: gravy.yield_quantity > 0 ? totalCost / gravy.yield_quantity : 0,
    };
  });

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId || user.role === "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, instructions, yield_quantity, yield_unit } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("gravy_recipes")
    .insert({
      restaurant_id: user.restaurantId,
      name,
      instructions: instructions || null,
      yield_quantity: yield_quantity || 1,
      yield_unit: yield_unit || "portion",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

