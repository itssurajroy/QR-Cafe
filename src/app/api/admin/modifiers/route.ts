// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;
  
  // Fetch modifier groups from platform_config or dedicated table
  const { data: config } = await db
    .from("platform_config")
    .select("key, value")
    .eq("restaurant_id", restaurantId)
    .eq("key", "modifier_groups");
  
  if (config?.[0]?.value) {
    return NextResponse.json({ ok: true, groups: config[0].value });
  }
  
  // Return defaults if not configured
  const defaultGroups = [
    {
      id: "mod-size",
      name: "Portion Size",
      required: true,
      multi_select: false,
      options: [
        { id: "opt-reg", name: "Regular", price_adjustment_paise: 0 },
        { id: "opt-large", name: "Large", price_adjustment_paise: 6000 },
        { id: "opt-jumbo", name: "Jumbo / Family Pack", price_adjustment_paise: 12000 },
      ],
    },
    {
      id: "mod-spice",
      name: "Spice Level",
      required: true,
      multi_select: false,
      options: [
        { id: "opt-mild", name: "Mild", price_adjustment_paise: 0 },
        { id: "opt-med", name: "Medium", price_adjustment_paise: 0 },
        { id: "opt-hot", name: "Spicy / Desi Hot", price_adjustment_paise: 0 },
      ],
    },
    {
      id: "mod-extras",
      name: "Add-ons & Extras",
      required: false,
      multi_select: true,
      options: [
        { id: "opt-cheese", name: "Extra Mozzarella Cheese", price_adjustment_paise: 4000 },
        { id: "opt-gravy", name: "Extra Makhani Gravy", price_adjustment_paise: 5000 },
        { id: "opt-dip", name: "Garlic Mint Mayo Dip", price_adjustment_paise: 2500 },
      ],
    },
    {
      id: "mod-milk",
      name: "Milk / Base Option",
      required: false,
      multi_select: false,
      options: [
        { id: "opt-dairy", name: "Full Cream Milk", price_adjustment_paise: 0 },
        { id: "opt-oat", name: "Oat Milk (Dairy-Free)", price_adjustment_paise: 3500 },
        { id: "opt-almond", name: "Almond Milk", price_adjustment_paise: 4000 },
      ],
    },
  ];
  
  return NextResponse.json({ ok: true, groups: defaultGroups });
}

export async function POST(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;
  
  try {
    const body = await req.json();
    const { groups } = body;
    
    if (!Array.isArray(groups)) {
      return NextResponse.json({ error: "groups array required" }, { status: 400 });
    }
    
    await db
      .from("platform_config")
      .upsert({ 
        key: "modifier_groups", 
        value: groups, 
        restaurant_id: restaurantId, 
        updated_at: new Date().toISOString() 
      }, { onConflict: "key,restaurant_id" });
    
    return NextResponse.json({ ok: true, groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save modifiers" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;
  
  try {
    const body = await req.json();
    const { groupId, group } = body;
    
    // Fetch current groups
    const { data: config } = await db
      .from("platform_config")
      .select("value")
      .eq("restaurant_id", restaurantId)
      .eq("key", "modifier_groups")
      .single();
    
    const currentGroups = config?.value ?? [];
    const updatedGroups = currentGroups.map((g: any) => g.id === groupId ? { ...g, ...group } : g);
    
    await db
      .from("platform_config")
      .upsert({ 
        key: "modifier_groups", 
        value: updatedGroups, 
        restaurant_id: restaurantId, 
        updated_at: new Date().toISOString() 
      }, { onConflict: "key,restaurant_id" });
    
    return NextResponse.json({ ok: true, groups: updatedGroups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update modifier" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getSessionUser();
  if (!auth || auth.role === "super_admin" || !auth.restaurantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const db = createSupabaseAdmin();
  const restaurantId = auth.restaurantId;
  
  try {
    const groupId = new URL(req.url).searchParams.get("groupId");
    if (!groupId) return NextResponse.json({ error: "groupId required" }, { status: 400 });
    
    const { data: config } = await db
      .from("platform_config")
      .select("value")
      .eq("restaurant_id", restaurantId)
      .eq("key", "modifier_groups")
      .single();
    
    const currentGroups = config?.value ?? [];
    const updatedGroups = currentGroups.filter((g: any) => g.id !== groupId);
    
    await db
      .from("platform_config")
      .upsert({ 
        key: "modifier_groups", 
        value: updatedGroups, 
        restaurant_id: restaurantId, 
        updated_at: new Date().toISOString() 
      }, { onConflict: "key,restaurant_id" });
    
    return NextResponse.json({ ok: true, groups: updatedGroups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete modifier" }, { status: 500 });
  }
}