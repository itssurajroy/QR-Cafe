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
    .select(`
      id,
      name,
      unit,
      min_stock,
      cost_per_unit,
      category,
      stock_levels (
        location,
        quantity
      )
    `)
    .eq("restaurant_id", user.restaurantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten stock levels into the ingredient object
  const result = data.map((ingredient) => {
    const kitchenStock = ingredient.stock_levels?.find(
      (s: { location: string }) => s.location === "kitchen"
    );
    const storageStock = ingredient.stock_levels?.find(
      (s: { location: string }) => s.location === "storage"
    );

    return {
      ...ingredient,
      kitchen_quantity: kitchenStock?.quantity || 0,
      storage_quantity: storageStock?.quantity || 0,
      total_quantity:
        (kitchenStock?.quantity || 0) + (storageStock?.quantity || 0),
      is_low:
        (kitchenStock?.quantity || 0) + (storageStock?.quantity || 0) <=
        (ingredient.min_stock || 0),
      stock_levels: undefined,
    };
  });

  return NextResponse.json(result);
}
