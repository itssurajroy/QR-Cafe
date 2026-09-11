import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.restaurantId || user.role === "staff") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, unit, cost_per_unit, min_stock, category } = body;

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("ingredients")
    .update({
      ...(name && { name }),
      ...(unit && { unit }),
      ...(cost_per_unit !== undefined && { cost_per_unit }),
      ...(min_stock !== undefined && { min_stock }),
      ...(category !== undefined && { category }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user?.restaurantId || user.role !== "owner") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = createSupabaseAdmin();

  // Delete ingredient (cascades to stock_levels, stock_transactions, recipe_items)
  const { error } = await db
    .from("ingredients")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
