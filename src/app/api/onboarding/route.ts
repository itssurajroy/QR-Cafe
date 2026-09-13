// Copyright (c) 2026 QRslice. All rights reserved.
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const onboardingSchema = z.object({
  cafeName: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
  logoUrl: z.string().optional(),
  accentColor: z.string().optional(),
  tagline: z.string().max(120).optional(),
  gstin: z.string().max(20).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  googleReviewUrl: z.string().url("Please enter a valid Google review URL").optional().or(z.literal("")),
  taxRate: z.number().min(0).max(100).optional(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  tableCount: z.number().int().min(1).max(50).default(6),
  preset: z.enum(["coffee", "bistro", "fastfood", "custom"]).default("coffee"),
});

const PRESETS = {
  coffee: {
    categories: [
      {
        name: "Artisanal Coffee & Espresso",
        sort: 1,
        items: [
          { name: "Espresso Shot", price: 14000, desc: "Rich double shot of arabica blend", veg: true },
          { name: "Cappuccino", price: 18000, desc: "Fresh espresso with silky steamed milk and foam", veg: true },
          { name: "Vanilla Cold Brew", price: 21000, desc: "Steeped for 18 hours with Madagascar vanilla", veg: true },
          { name: "Caramel Macchiato", price: 23000, desc: "Layered espresso with salted caramel drizzle", veg: true },
        ],
      },
      {
        name: "Fresh Bakes & Bites",
        sort: 2,
        items: [
          { name: "Butter Croissant", price: 15000, desc: "Flaky golden French pastry", veg: true },
          { name: "Avocado Sourdough Toast", price: 26000, desc: "Smashed avocado, cherry tomatoes on toasted sourdough", veg: true },
          { name: "Blueberry Cheesecake", price: 24000, desc: "Classic New York style with berry compote", veg: true },
        ],
      },
    ],
  },
  bistro: {
    categories: [
      {
        name: "Starters & Salads",
        sort: 1,
        items: [
          { name: "Bruschetta Pomodoro", price: 19000, desc: "Toasted baguette with heirloom tomatoes and basil", veg: true },
          { name: "Crispy Calamari", price: 29000, desc: "Lightly battered squid with garlic aioli", veg: false },
        ],
      },
      {
        name: "Handcrafted Pastas & Mains",
        sort: 2,
        items: [
          { name: "Truffle Mushroom Fettuccine", price: 34000, desc: "Creamy wild mushroom ragu with shaved parmesan", veg: true },
          { name: "Grilled Herb Chicken", price: 38000, desc: "Sous-vide chicken breast with roasted rosemary potatoes", veg: false },
        ],
      },
    ],
  },
  fastfood: {
    categories: [
      {
        name: "Gourmet Burgers",
        sort: 1,
        items: [
          { name: "Classic Cheeseburger", price: 22000, desc: "Double patty, aged cheddar, pickles and house sauce", veg: false },
          { name: "Crispy Paneer Burger", price: 19000, desc: "Spiced paneer patty with mint mayo and coleslaw", veg: true },
        ],
      },
      {
        name: "Loaded Fries & Shakes",
        sort: 2,
        items: [
          { name: "Peri-Peri Cheesy Fries", price: 14000, desc: "Crispy fries dusted with peri-peri and melted cheese", veg: true },
          { name: "Thick Belgian Chocolate Shake", price: 18000, desc: "Rich double chocolate shake with whipped cream", veg: true },
        ],
      },
    ],
  },
  custom: {
    categories: [
      {
        name: "General Menu",
        sort: 1,
        items: [
          { name: "Signature Dish", price: 20000, desc: "Chef special specialty item", veg: true },
        ],
      },
    ],
  },
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const admin = createSupabaseAdmin();

  // 1. Check if slug already exists
  const { data: existingSlug } = await admin
    .from("restaurants")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();

  if (existingSlug) {
    return NextResponse.json(
      { error: `Café URL slug "/${input.slug}" is already taken. Please choose another.` },
      { status: 409 },
    );
  }

  // 2. Create the Restaurant Tenant (single plan + 14-day full-access trial)
  const { data: restaurant, error: restErr } = await admin
    .from("restaurants")
    .insert({
      name: input.cafeName,
      slug: input.slug,
      currency: input.currency,
      timezone: input.timezone,
      logo_url: input.logoUrl || null,
      accent_color: input.accentColor || "#f59e0b",
      tagline: input.tagline ? input.tagline.trim() : null,
      gstin: input.gstin ? input.gstin.trim().toUpperCase() : null,
      address: input.address ? input.address.trim() : null,
      phone: input.phone ? input.phone.trim() : null,
      google_review_url: input.googleReviewUrl ? input.googleReviewUrl.trim() : null,
      tax_rate: input.taxRate !== undefined ? input.taxRate : 5,
      plan: "trial",
      tier: "pro",
      trial_starts_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (restErr || !restaurant) {
    return NextResponse.json(
      { error: restErr?.message || "Failed to create restaurant tenant" },
      { status: 500 },
    );
  }

  // 3. Create or Link Owner Account
  const { data: existingUser } = await admin.auth.admin.listUsers();
  let user = existingUser?.users?.find((u) => u.email === input.ownerEmail.toLowerCase().trim());

  if (!user) {
    const { data: newUser, error: userErr } = await admin.auth.admin.createUser({
      email: input.ownerEmail.toLowerCase().trim(),
      password: input.ownerPassword,
      email_confirm: true,
    });
    if (userErr || !newUser?.user) {
      // rollback restaurant
      await admin.from("restaurants").delete().eq("id", restaurant.id);
      return NextResponse.json(
        { error: userErr?.message || "Failed to create owner account" },
        { status: 500 },
      );
    }
    user = newUser.user;
  } else {
    // update password if user exists
    await admin.auth.admin.updateUserById(user.id, {
      password: input.ownerPassword,
      email_confirm: true,
    });
  }

  // 4. Create cafe_profiles record
  const { error: profErr } = await admin.from("cafe_profiles").upsert({
    id: user.id,
    restaurant_id: restaurant.id,
    role: "owner",
    display_name: input.ownerName,
    active: true,
  });

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  // 5. Generate Initial Tables
  const tableInserts = [];
  for (let t = 1; t <= input.tableCount; t++) {
    tableInserts.push({
      restaurant_id: restaurant.id,
      label: `T${t < 10 ? "0" + t : t}`,
      seats: t % 2 === 0 ? 4 : 2,
    });
  }
  await admin.from("restaurant_tables").insert(tableInserts);

  // 6. Populate Starter Menu Preset
  const presetData = PRESETS[input.preset] || PRESETS.coffee;
  for (const cat of presetData.categories) {
    const { data: createdCat } = await admin
      .from("menu_categories")
      .insert({
        restaurant_id: restaurant.id,
        name: cat.name,
        sort_order: cat.sort,
      })
      .select()
      .single();

    if (createdCat) {
      const itemRows = cat.items.map((it) => ({
        restaurant_id: restaurant.id,
        category_id: createdCat.id,
        name: it.name,
        description: it.desc,
        price_paise: it.price,
        is_veg: it.veg,
        available: true,
      }));
      await admin.from("menu_items").insert(itemRows);
    }
  }

  // 7. Record Audit event
  await admin.from("audit_events").insert({
    restaurant_id: restaurant.id,
    actor_id: user.id,
    entity: "tenant",
    entity_id: restaurant.id,
    action: "self_onboarding",
    metadata: {
      cafe: input.cafeName,
      slug: input.slug,
      tables: input.tableCount,
      preset: input.preset,
    },
  });

  return NextResponse.json({
    ok: true,
    restaurant_id: restaurant.id,
    slug: restaurant.slug,
    owner_email: input.ownerEmail,
    message: "Café tenant provisioned successfully with starter menu and QR tables!",
  });
}

