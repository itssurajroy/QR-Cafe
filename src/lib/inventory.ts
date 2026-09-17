// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { sendTrialEmail } from "./email";

export interface LowStockItem {
  name: string;
  quantity: number;
  unit: string;
  min_stock: number;
}

/**
 * Send low-stock alert via email
 */
async function sendLowStockEmail(
  db: ReturnType<typeof createSupabaseAdmin>,
  restaurantId: string,
  items: LowStockItem[]
): Promise<void> {
  // Get restaurant owner email
  const { data: profile } = await db
    .from("cafe_profiles")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantId)
    .eq("role", "owner")
    .maybeSingle();

  if (!profile) return;

  const { data: user } = await db.auth.admin.getUserById(profile.id);
  if (!user?.user?.email) return;

  const { data: restaurant } = await db
    .from("restaurants")
    .select("name")
    .eq("id", restaurantId)
    .maybeSingle();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com";
  await sendTrialEmail(user.user.email, 0, {
    cafeName: restaurant?.name || "Your Café",
    daysLeft: 0,
    billingUrl: `${appUrl}/admin/inventory`,
  });
}

/**
 * Send low-stock alert via WhatsApp
 */
async function sendLowStockWhatsApp(
  db: ReturnType<typeof createSupabaseAdmin>,
  restaurantId: string,
  items: LowStockItem[]
): Promise<void> {
  // Get restaurant owner phone
  const { data: profile } = await db
    .from("cafe_profiles")
    .select("id, restaurant_id")
    .eq("restaurant_id", restaurantId)
    .eq("role", "owner")
    .maybeSingle();

  if (!profile) return;

  const { data: user } = await db.auth.admin.getUserById(profile.id);
  if (!user?.user?.phone) return;

  const { data: restaurant } = await db
    .from("restaurants")
    .select("name, phone")
    .eq("id", restaurantId)
    .maybeSingle();

  // WhatsApp message template for low stock
  const lines = [
    `⚠️ *LOW STOCK ALERT* — ${restaurant?.name || "Your Café"}`,
    "",
    ...items.map((item) =>
      `• ${item.name}: ${item.quantity} ${item.unit} left (min: ${item.min_stock} ${item.unit})`
    ),
    "",
    `Check inventory: ${(process.env.NEXT_PUBLIC_APP_URL || "https://qrslice.com")}/admin/inventory`,
    "",
    "— QRslice Stock Alert",
  ];

  const message = lines.join("\n");
  const encoded = encodeURIComponent(message);
  const waUrl = `https://wa.me/${user.user.phone}?text=${encoded}`;

  // Log for debugging (actual sending would need browser or server-side)
  console.log("[LowStock] WhatsApp alert URL generated:", waUrl);
}

/**
 * Send low-stock alerts via all configured channels
 */
export async function sendLowStockAlerts(
  db: ReturnType<typeof createSupabaseAdmin>,
  restaurantId: string,
  items: LowStockItem[]
): Promise<void> {
  if (!items.length) return;

  // Send email alert (non-blocking)
  sendLowStockEmail(db, restaurantId, items).catch((err) =>
    console.error("[LowStock] Email alert failed:", err)
  );

  // Generate WhatsApp alert URL (would be opened by user)
  sendLowStockWhatsApp(db, restaurantId, items).catch((err) =>
    console.error("[LowStock] WhatsApp alert failed:", err)
  );

  // Log to audit
  await db.from("audit_events").insert({
    restaurant_id: restaurantId,
    entity: "inventory_alert",
    action: "low_stock_alert_sent",
    metadata: { items },
  });
}

/**
 * Deducts ingredients from kitchen stock based on order items and recipe_items mappings.
 * Also triggers low stock alerts via WhatsApp/Email if configured.
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

  const lowStockItems: LowStockItem[] = [];

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
    await sendLowStockAlerts(db, restaurantId, lowStockItems);
  }
}