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
  const { name, instructions, yield_quantity, yield_unit } = body;

  const db = createSupabaseAdmin();
  const { data, error } = await db
    .from("gravy_recipes")
    .update({
      ...(name && { name }),
      ...(instructions !== undefined && { instructions }),
      ...(yield_quantity !== undefined && { yield_quantity }),
      ...(yield_unit && { yield_unit }),
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

  const { error } = await db
    .from("gravy_recipes")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", user.restaurantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
