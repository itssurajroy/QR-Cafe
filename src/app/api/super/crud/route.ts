import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";
import { getTierLimits } from "@/lib/tenant";

async function verifySuperAdmin(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (sessionUser && sessionUser.role === "super_admin") {
    return { ok: true, userId: sessionUser.userId };
  }

  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!bearer) return { ok: false };

  const admin = createSupabaseAdmin();
  const { data: { user } } = await admin.auth.getUser(bearer);
  if (!user) return { ok: false };

  const { data: profile } = await admin
    .from("cafe_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") return { ok: false };
  return { ok: true, userId: user.id };
}

export async function POST(req: NextRequest) {
  const auth = await verifySuperAdmin(req);
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, ...data } = body;
  const admin = createSupabaseAdmin();

  // --- CAFES ---
  if (action === "create_cafe") {
    const { data: cafe, error } = await admin
      .from("restaurants")
      .insert({
        name: String(data.name).trim(),
        slug: String(data.slug).toLowerCase().replace(/\s+/g, "-").trim(),
        currency: String(data.currency || "INR").trim(),
        timezone: String(data.timezone || "Asia/Kolkata").trim(),
        logo_url: data.logo_url || null,
        address: data.address ? String(data.address).trim() : null,
        gstin: data.gstin ? String(data.gstin).trim().toUpperCase() : null,
        phone: data.phone ? String(data.phone).trim() : null,
        tax_rate: data.tax_rate !== undefined && data.tax_rate !== "" ? Number(data.tax_rate) : 5,
        tagline: data.tagline ? String(data.tagline).trim() : null,
        accent_color: data.accent_color || "#f59e0b",
        plan: data.plan || "trial",
        tier: data.tier || "pro",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, cafe });
  }

  if (action === "update_cafe") {
    const { id, ...updates } = data;
    const { error } = await admin
      .from("restaurants")
      .update({
        name: updates.name ? String(updates.name).trim() : undefined,
        slug: updates.slug ? String(updates.slug).toLowerCase().replace(/\s+/g, "-").trim() : undefined,
        currency: updates.currency ? String(updates.currency).trim() : undefined,
        timezone: updates.timezone ? String(updates.timezone).trim() : undefined,
        logo_url: updates.logo_url !== undefined ? (updates.logo_url || null) : undefined,
        tagline: updates.tagline !== undefined ? (String(updates.tagline || "").trim() || null) : undefined,
        accent_color: updates.accent_color !== undefined ? String(updates.accent_color || "#f59e0b") : undefined,
        address: updates.address !== undefined ? String(updates.address || "").trim() || null : undefined,
        gstin: updates.gstin !== undefined ? String(updates.gstin || "").trim().toUpperCase() || null : undefined,
        phone: updates.phone !== undefined ? String(updates.phone || "").trim() || null : undefined,
        tax_rate: updates.tax_rate !== undefined && updates.tax_rate !== "" ? Number(updates.tax_rate) : undefined,
        plan: updates.plan !== undefined ? updates.plan : undefined,
        tier: updates.tier !== undefined ? updates.tier : undefined,
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "set_plan") {
    const { id, plan, tier } = data;
    const updates: Record<string, unknown> = {};
    if (plan) updates.plan = plan;
    if (tier) updates.tier = tier;
    if (plan === "active") updates.subscription_ends_at = new Date(Date.now() + 30 * 864e5).toISOString();

    const { error } = await admin.from("restaurants").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "extend_trial") {
    const { id, days } = data;
    const { data: r, error: re } = await admin.from("restaurants").select("trial_ends_at").eq("id", id).maybeSingle();
    if (re) return NextResponse.json({ error: re.message }, { status: 500 });
    const base = r?.trial_ends_at && new Date(r.trial_ends_at).getTime() > Date.now()
      ? new Date(r.trial_ends_at).getTime()
      : Date.now();
    const next = new Date(base + Number(days || 7) * 864e5).toISOString();
    const { error } = await admin.from("restaurants").update({ trial_ends_at: next, plan: "trial" }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_events").insert({ restaurant_id: id, entity: "tenant", entity_id: id, action: "super_extend_trial", metadata: { days, until: next } });
    return NextResponse.json({ ok: true, trial_ends_at: next });
  }

  if (action === "mark_paid") {
    const { id } = data;
    const { error } = await admin.from("restaurants").update({ plan: "active", billing_status: "paid", subscription_ends_at: new Date(Date.now() + 365 * 864e5).toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_events").insert({ restaurant_id: id, entity: "tenant", entity_id: id, action: "super_mark_paid" });
    return NextResponse.json({ ok: true });
  }

  if (action === "add_refund_note") {
    const { id, note } = data;
    const { data: r, error: re } = await admin.from("restaurants").select("admin_notes").eq("id", id).maybeSingle();
    if (re) return NextResponse.json({ error: re.message }, { status: 500 });
    const merged = [...(r?.admin_notes ? [r.admin_notes] : []), `[${new Date().toISOString()}] ${String(note).slice(0, 500)}`].join("\n");
    const { error } = await admin.from("restaurants").update({ admin_notes: merged }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_events").insert({ restaurant_id: id, entity: "tenant", entity_id: id, action: "super_refund_note", metadata: { note } });
    return NextResponse.json({ ok: true });
  }

  if (action === "update_config") {
    const { key, value } = data;
    const { error } = await admin.from("platform_config").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete_cafe") {
    const { id } = data;
    const { error } = await admin.from("restaurants").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- MENU CATEGORIES ---
  if (action === "get_menu") {
    const { cafeId } = data;
    const [{ data: cats }, { data: items }] = await Promise.all([
      admin.from("menu_categories").select("*").eq("restaurant_id", cafeId).order("sort_order"),
      admin.from("menu_items").select("*").eq("restaurant_id", cafeId).order("name"),
    ]);
    return NextResponse.json({ ok: true, categories: cats || [], items: items || [] });
  }

  if (action === "create_category") {
    const { cafeId, name, sort_order } = data;
    const { data: cat, error } = await admin
      .from("menu_categories")
      .insert({
        restaurant_id: cafeId,
        name: String(name).trim(),
        sort_order: Number(sort_order || 0),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, category: cat });
  }

  if (action === "delete_category") {
    const { id } = data;
    const { error } = await admin.from("menu_categories").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- MENU ITEMS ---
  if (action === "create_item") {
    const { cafeId, name, category_id, price_paise, description, is_veg, available, hsn } = data;

    // Check basic tier item cap
    const { data: r } = await admin.from("restaurants").select("tier").eq("id", cafeId).single();
    const lim = getTierLimits((r?.tier as any) || "pro");
    if (lim.maxItems !== null) {
      const { count } = await admin
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", cafeId);
      if ((count ?? 0) >= lim.maxItems) {
        return NextResponse.json(
          { error: `Basic plan limit: maximum ${lim.maxItems} menu items. Upgrade to Pro for unlimited dishes.` },
          { status: 403 },
        );
      }
    }

    const { data: item, error } = await admin
      .from("menu_items")
      .insert({
        restaurant_id: cafeId,
        category_id,
        name: String(name).trim(),
        price_paise: Number(price_paise || 0),
        description: String(description || "").trim(),
        is_veg: Boolean(is_veg),
        available: typeof available === "boolean" ? available : true,
        hsn: hsn ? String(hsn).trim().toUpperCase() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, item });
  }

  if (action === "update_item") {
    const { id, cafeId, ...rest } = data;
    const clean: Record<string, unknown> = {};
    if (rest.name !== undefined) clean.name = String(rest.name).trim();
    if (rest.category_id !== undefined) clean.category_id = rest.category_id;
    if (rest.price_paise !== undefined) clean.price_paise = Number(rest.price_paise);
    if (rest.description !== undefined) clean.description = String(rest.description || "").trim();
    if (rest.is_veg !== undefined) clean.is_veg = Boolean(rest.is_veg);
    if (rest.available !== undefined) clean.available = Boolean(rest.available);
    if (rest.hsn !== undefined) clean.hsn = rest.hsn ? String(rest.hsn).trim().toUpperCase() : null;
    const { error } = await admin.from("menu_items").update(clean).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete_item") {
    const { id } = data;
    const { error } = await admin.from("menu_items").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // --- TABLES ---
  if (action === "get_tables") {
    const { cafeId } = data;
    const { data: tables, error } = await admin
      .from("restaurant_tables")
      .select("*")
      .eq("restaurant_id", cafeId)
      .order("label");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tables: tables || [] });
  }

  if (action === "create_table") {
    const { cafeId, label, seats } = data;

    // Check basic tier table cap (10 tables)
    const { data: r } = await admin.from("restaurants").select("tier").eq("id", cafeId).single();
    const lim = getTierLimits((r?.tier as any) || "pro");
    if (lim.maxTables !== null) {
      const { count } = await admin
        .from("restaurant_tables")
        .select("*", { count: "exact", head: true })
        .eq("restaurant_id", cafeId);
      if ((count ?? 0) >= lim.maxTables) {
        return NextResponse.json(
          { error: `Basic plan limit: maximum ${lim.maxTables} tables. Upgrade to Pro for unlimited tables.` },
          { status: 403 },
        );
      }
    }

    const { data: table, error } = await admin
      .from("restaurant_tables")
      .insert({
        restaurant_id: cafeId,
        label: String(label).trim(),
        seats: Number(seats || 4),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, table });
  }

  if (action === "delete_table") {
    const { id } = data;
    const { error } = await admin.from("restaurant_tables").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
