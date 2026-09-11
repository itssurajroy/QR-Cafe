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
    .from("recipe_items")
    .select(`
      id,
      menu_item_id,
      quantity,
      menu_items (
        id,
        name,
        price_paise
      ),
      ingredients (
        id,
        name,
        unit,
        cost_per_unit
      )
    `)
    .eq("menu_items.restaurant_id", user.restaurantId);

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
  const { menu_item_id, ingredient_id, quantity } = body;

  if (!menu_item_id || !ingredient_id || !quantity) {
    return NextResponse.json(
      { error: "menu_item_id, ingredient_id, and quantity are required" },
      { status: 400 }
    );
  }

  const db = createSupabaseAdmin();

  // Verify menu item belongs to this restaurant
  const { data: menuItem, error: menuError } = await db
    .from("menu_items")
    .select("id")
    .eq("id", menu_item_id)
    .eq("restaurant_id", user.restaurantId)
    .single();

  if (menuError || !menuItem) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  }

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

  // Upsert recipe item
  const { data, error } = await db
    .from("recipe_items")
    .upsert(
      { menu_item_id, ingredient_id, quantity },
      { onConflict: "menu_item_id,ingredient_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
