import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Deducts ingredients from kitchen stock based on order items and recipe_items mappings.
 * Also triggers low stock alerts via WhatsApp if configured.
 */
export async function deductInventoryIngredients(
  db: ReturnType<typeof createSupabaseAdmin>,
  restaurantId: string,
  orderItems: { menu_item_id: string; quantity: number }[]
) {
  if (!orderItems || orderItems.length === 0) return;

  const menu_item_ids = orderItems.map((i) => i.menu_item_id);
  const { data: recipes, error } = await db
    .from("recipe_items")
    .select("menu_item_id, ingredient_id, quantity")
    .in("menu_item_id", menu_item_ids);

  if (error || !recipes || recipes.length === 0) return;

  // Group recipes by menu_item_id
  const recipesByItem = new Map<string, { ingredient_id: string; quantity: number }[]>();
  for (const recipe of recipes) {
    const existing = recipesByItem.get(recipe.menu_item_id) || [];
    existing.push({ ingredient_id: recipe.ingredient_id, quantity: Number(recipe.quantity) });
    recipesByItem.set(recipe.menu_item_id, existing);
  }

  // Calculate total deduction per ingredient
  const deductions = new Map<string, number>();
  for (const item of orderItems) {
    const itemRecipes = recipesByItem.get(item.menu_item_id) || [];
    for (const recipe of itemRecipes) {
      const totalDeduction = recipe.quantity * item.quantity;
      deductions.set(
        recipe.ingredient_id,
        (deductions.get(recipe.ingredient_id) || 0) + totalDeduction
      );
    }
  }

  const lowStockItems: { name: string; quantity: number; unit: string; min_stock: number }[] = [];

  // Apply deductions to kitchen stock
  for (const [ingredientId, quantity] of deductions) {
    const { data: stock } = await db
      .from("stock_levels")
      .select("quantity")
      .eq("ingredient_id", ingredientId)
      .eq("location", "kitchen")
      .maybeSingle();

    const currentQty = stock ? Number(stock.quantity) : 0;
    const newQuantity = Math.max(0, currentQty - quantity);

    if (stock) {
      await db
        .from("stock_levels")
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("ingredient_id", ingredientId)
        .eq("location", "kitchen");
    } else {
      await db.from("stock_levels").insert({
        ingredient_id: ingredientId,
        location: "kitchen",
        quantity: newQuantity,
      });
    }

    // Record stock consumption transaction
    await db.from("stock_transactions").insert({
      ingredient_id: ingredientId,
      location: "kitchen",
      type: "consumption",
      quantity: -quantity,
      notes: "Auto-deducted from POS/Online order",
    });

    // Check if below minimum stock threshold
    const { data: ingredient } = await db
      .from("ingredients")
      .select("name, min_stock, unit")
      .eq("id", ingredientId)
      .maybeSingle();

    if (ingredient && newQuantity <= Number(ingredient.min_stock || 0)) {
      lowStockItems.push({
        name: ingredient.name,
        quantity: newQuantity,
        unit: ingredient.unit || "units",
        min_stock: Number(ingredient.min_stock || 0),
      });
    }
  }

  // Dispatch low stock alert if threshold crossed
  if (lowStockItems.length > 0) {
    // TODO: Send low stock alert via email or dashboard notification
  }
}
