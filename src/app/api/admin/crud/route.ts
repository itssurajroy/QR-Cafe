import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !user.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const { type, ...data } = body;
  const admin = createSupabaseAdmin();

  if (type === "toggle_item" || type === "toggle_item_availability") {
    const { itemId, available } = data;
    const { error } = await admin
      .from("menu_items")
      .update({ available: Boolean(available) })
      .eq("id", itemId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "update_settings") {
    const { name, currency, taxRate, address, phone } = data;
    const updates: Record<string, any> = {};

    if (name !== undefined) updates.name = String(name).trim();
    if (currency !== undefined) updates.currency = currency || "INR";
    if (taxRate !== undefined) updates.tax_rate = Number(taxRate);
    if (address !== undefined) updates.address = String(address).trim() || null;
    if (phone !== undefined) updates.phone = String(phone).trim() || null;

    const { error } = await admin
      .from("restaurants")
      .update(updates)
      .eq("id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "update_branding") {
    const { logoUrl, tagline, accentColor, googleReviewUrl } = data;
    const { error } = await admin
      .from("restaurants")
      .update({
        logo_url: logoUrl !== undefined ? (logoUrl || null) : undefined,
        tagline: tagline !== undefined ? (String(tagline || "").trim() || null) : undefined,
        google_review_url: googleReviewUrl !== undefined ? (String(googleReviewUrl || "").trim() || null) : undefined,
        accent_color: accentColor || "#f59e0b",
      })
      .eq("id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "create_item") {
    const { name, categoryId, pricePaise, description, isVeg } = data;
    const { data: item, error } = await admin
      .from("menu_items")
      .insert({
        restaurant_id: user.restaurantId,
        category_id: categoryId,
        name: String(name).trim(),
        price_paise: Math.max(0, Math.round(Number(pricePaise))),
        description: String(description || "").trim(),
        is_veg: Boolean(isVeg),
        available: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, item });
  }

  if (type === "delete_item") {
    const { itemId } = data;
    const { error } = await admin
      .from("menu_items")
      .delete()
      .eq("id", itemId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "create_category") {
    const { name, sortOrder } = data;
    const { data: category, error } = await admin
      .from("menu_categories")
      .insert({
        restaurant_id: user.restaurantId,
        name: String(name).trim(),
        sort_order: Number(sortOrder || 0),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, category });
  }

  if (type === "delete_category") {
    const { categoryId } = data;
    const { error } = await admin
      .from("menu_categories")
      .delete()
      .eq("id", categoryId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "create_table") {
    const { label, seats } = data;
    const { data: table, error } = await admin
      .from("restaurant_tables")
      .insert({
        restaurant_id: user.restaurantId,
        label: String(label).trim(),
        seats: Math.max(1, Math.min(50, Number(seats || 4))),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, table });
  }

  if (type === "delete_table") {
    const { tableId } = data;
    const { error } = await admin
      .from("restaurant_tables")
      .delete()
      .eq("id", tableId)
      .eq("restaurant_id", user.restaurantId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (type === "bulk_import_items") {
    const { items: rawItems } = data;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "No items provided for import" }, { status: 400 });
    }

    // Ensure all categories exist or map them
    const { data: existingCats } = await admin
      .from("menu_categories")
      .select("id, name")
      .eq("restaurant_id", user.restaurantId);

    const catMap = new Map<string, string>();
    (existingCats || []).forEach((c) => catMap.set(c.name.toLowerCase(), c.id));

    const defaultCatId = existingCats?.[0]?.id;
    if (!defaultCatId) {
      // Create a default category if none exists
      const { data: newCat } = await admin
        .from("menu_categories")
        .insert({ restaurant_id: user.restaurantId, name: "General Menu", sort_order: 1 })
        .select("id")
        .single();
      if (newCat) catMap.set("general menu", newCat.id);
    }

    const rowsToInsert = rawItems.map((item: any) => {
      const categoryName = (item.category || "General Menu").trim().toLowerCase();
      let catId = catMap.get(categoryName) || defaultCatId;
      const pricePaise = Math.max(0, Math.round(Number(item.price || 0) * 100));

      return {
        restaurant_id: user.restaurantId,
        category_id: catId,
        name: String(item.name || "").trim(),
        price_paise: pricePaise,
        description: String(item.description || "").trim(),
        is_veg: Boolean(item.isVeg ?? true),
        available: true,
      };
    }).filter((r) => r.name.length > 0);

    const { data: inserted, error } = await admin
      .from("menu_items")
      .insert(rowsToInsert)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, count: inserted?.length || 0, items: inserted });
  }

  return NextResponse.json({ error: "Unknown operation type" }, { status: 400 });
}
