import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createSupabaseAdmin();

  // Get all ingredients with stock levels
  const { data: ingredients, error } = await db
    .from("ingredients")
    .select(`
      id,
      name,
      unit,
      min_stock,
      category,
      stock_levels (
        location,
        quantity
      )
    `)
    .eq("restaurant_id", user.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter for low stock items
  const lowStockItems = ingredients
    .map((ingredient) => {
      const kitchenStock = ingredient.stock_levels?.find(
        (s: { location: string }) => s.location === "kitchen"
      );
      const storageStock = ingredient.stock_levels?.find(
        (s: { location: string }) => s.location === "storage"
      );
      const totalQuantity =
        (kitchenStock?.quantity || 0) + (storageStock?.quantity || 0);

      return {
        id: ingredient.id,
        name: ingredient.name,
        unit: ingredient.unit,
        category: ingredient.category,
        kitchen_quantity: kitchenStock?.quantity || 0,
        storage_quantity: storageStock?.quantity || 0,
        total_quantity: totalQuantity,
        min_stock: ingredient.min_stock || 0,
        is_low: totalQuantity <= (ingredient.min_stock || 0),
        deficit:
          totalQuantity <= (ingredient.min_stock || 0)
            ? (ingredient.min_stock || 0) - totalQuantity
            : 0,
      };
    })
    .filter((item) => item.is_low)
    .sort((a, b) => b.deficit - a.deficit);

  return NextResponse.json({
    total_ingredients: ingredients.length,
    low_stock_count: lowStockItems.length,
    items: lowStockItems,
  });
}
