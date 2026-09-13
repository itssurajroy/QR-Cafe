// Copyright (c) 2026 QRslice. All rights reserved.
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const menuItemId = searchParams.get("menu_item_id");

  if (!menuItemId) {
    return NextResponse.json({ error: "menu_item_id is required" }, { status: 400 });
  }

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("recipe_instructions")
    .select("*")
    .eq("menu_item_id", menuItemId)
    .order("step_number");

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
  const { menu_item_id, steps } = body;

  if (!menu_item_id || !steps || !Array.isArray(steps)) {
    return NextResponse.json(
      { error: "menu_item_id and steps array are required" },
      { status: 400 }
    );
  }

  const db = createSupabaseAdmin();

  // Verify menu item belongs to this restaurant
  const { data: menuItem } = await db
    .from("menu_items")
    .select("id")
    .eq("id", menu_item_id)
    .eq("restaurant_id", user.restaurantId)
    .single();

  if (!menuItem) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  }

  // Delete existing instructions
  await db.from("recipe_instructions").delete().eq("menu_item_id", menu_item_id);

  // Insert new instructions
  const rows = steps.map((instruction: string, index: number) => ({
    menu_item_id,
    step_number: index + 1,
    instruction,
  }));

  const { data, error } = await db
    .from("recipe_instructions")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

