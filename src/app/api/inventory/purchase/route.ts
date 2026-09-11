import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { ingredient_id, location, quantity, supplier, cost } = body;

  if (!ingredient_id || !location || !quantity) {
    return NextResponse.json(
      { error: "ingredient_id, location, and quantity are required" },
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
    type: "purchase",
    quantity,
    reference: supplier || null,
    notes: cost ? `Cost: ₹${cost}` : null,
    created_by: user.userId,
  });

  return NextResponse.json({ success: true, new_quantity: newQuantity });
}
