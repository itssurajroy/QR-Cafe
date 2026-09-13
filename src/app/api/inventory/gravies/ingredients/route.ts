// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId || user.role === "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { gravy_recipe_id, ingredient_id, quantity } = body;

  if (!gravy_recipe_id || !ingredient_id || !quantity) {
    return NextResponse.json(
      { error: "gravy_recipe_id, ingredient_id, and quantity are required" },
      { status: 400 }
    );
  }

  const db = createSupabaseAdmin();

  // Verify gravy belongs to this restaurant
  const { data: gravy } = await db
    .from("gravy_recipes")
    .select("id")
    .eq("id", gravy_recipe_id)
    .eq("restaurant_id", user.restaurantId)
    .single();

  if (!gravy) {
    return NextResponse.json({ error: "Gravy recipe not found" }, { status: 404 });
  }

  // Verify ingredient belongs to this restaurant
  const { data: ingredient } = await db
    .from("ingredients")
    .select("id")
    .eq("id", ingredient_id)
    .eq("restaurant_id", user.restaurantId)
    .single();

  if (!ingredient) {
    return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
  }

  const { data, error } = await db
    .from("gravy_ingredients")
    .upsert(
      { gravy_recipe_id, ingredient_id, quantity },
      { onConflict: "gravy_recipe_id,ingredient_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId || user.role === "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const { error } = await db.from("gravy_ingredients").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

