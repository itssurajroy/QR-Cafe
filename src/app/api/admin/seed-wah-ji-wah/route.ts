import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const CATEGORIES = [
  { name: "Chef's Picks", sort_order: 1 },
  { name: "Starters", sort_order: 2 },
  { name: "Indian Mains", sort_order: 3 },
  { name: "Biryani & Rice", sort_order: 4 },
  { name: "Pizza & Breads", sort_order: 5 },
  { name: "Beverages", sort_order: 6 },
  { name: "Desserts", sort_order: 7 },
];

const ITEMS = [
  // Chef's Picks
  { cat: "Chef's Picks", name: "Butter Chicken", desc: "Tandoori chicken in rich tomato-butter gravy", price: 34000, is_veg: false, img: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80" },
  { cat: "Chef's Picks", name: "Paneer Tikka", desc: "Smoky tandoori cottage cheese cubes with mint chutney", price: 24000, is_veg: true, img: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80" },
  { cat: "Chef's Picks", name: "Chicken Biryani", desc: "Dum-style basmati, spiced chicken, served aromatic", price: 29000, is_veg: false, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80" },
  
  // Starters
  { cat: "Starters", name: "Veg Momos", desc: "Steamed dumplings with spicy chili dip", price: 12000, is_veg: true, img: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=800&q=80" },
  { cat: "Starters", name: "Chicken Shawarma", desc: "Classic lebanese wrap with garlic mayo", price: 16000, is_veg: false, img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80" },
  { cat: "Starters", name: "Peri Peri Fries", desc: "Crispy fries tossed in spicy peri peri mix", price: 11000, is_veg: true, img: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=800&q=80" },
  
  // Indian Mains
  { cat: "Indian Mains", name: "Dal Makhani", desc: "Slow cooked black lentils with fresh cream", price: 22000, is_veg: true, img: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80" },
  { cat: "Indian Mains", name: "Chole Bhature", desc: "Spicy chickpea curry with two fluffy bhaturas", price: 18000, is_veg: true, img: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80" },
  
  // Biryani & Rice
  { cat: "Biryani & Rice", name: "Veg Biryani", desc: "Aromatic basmati with seasonal vegetables", price: 22000, is_veg: true, img: "https://images.unsplash.com/photo-1589302168068-964664d93cb0?auto=format&fit=crop&w=800&q=80" },
  
  // Pizza & Breads
  { cat: "Pizza & Breads", name: "Butter Naan", desc: "Soft tandoori bread brushed with butter", price: 4000, is_veg: true, img: "" },
  { cat: "Pizza & Breads", name: "Garlic Naan", desc: "Tandoori bread topped with fresh garlic and cilantro", price: 5500, is_veg: true, img: "" },
  { cat: "Pizza & Breads", name: "Margherita Pizza", desc: "Classic cheese and tomato thin crust pizza", price: 24000, is_veg: true, img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80" },
  
  // Beverages
  { cat: "Beverages", name: "Masala Chai", desc: "Authentic spiced Indian milk tea", price: 4000, is_veg: true, img: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=800&q=80" },
  { cat: "Beverages", name: "Cold Coffee", desc: "Thick, creamy and chilled sweet coffee", price: 14000, is_veg: true, img: "https://images.unsplash.com/photo-1461023058943-0708e52c8030?auto=format&fit=crop&w=800&q=80" },
  { cat: "Beverages", name: "Fresh Lime Soda", desc: "Refreshing sweet & salt lime soda", price: 9000, is_veg: true, img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80" },
  
  // Desserts
  { cat: "Desserts", name: "Gulab Jamun (2 pcs)", desc: "Warm milk dumplings in sugar syrup", price: 9000, is_veg: true, img: "" },
];

export async function GET(req: NextRequest) {
  const admin = createSupabaseAdmin();
  const slug = req.nextUrl.searchParams.get("slug") || "table-and-grain";
  
  // Find target restaurant (table-and-grain or wah-ji-wah fallback)
  let { data: rest } = await admin.from("restaurants").select("id, name").eq("slug", slug).maybeSingle();
  if (!rest && slug !== "wah-ji-wah") {
    const fallback = await admin.from("restaurants").select("id, name").eq("slug", "wah-ji-wah").maybeSingle();
    rest = fallback.data;
  }
  
  if (!rest) {
    return NextResponse.json({ error: `Restaurant '${slug}' not found` }, { status: 404 });
  }

  const rId = rest.id;

  // Wipe existing menu
  await admin.from("menu_items").delete().eq("restaurant_id", rId);
  await admin.from("menu_categories").delete().eq("restaurant_id", rId);

  // Insert categories
  const catMap = new Map();
  for (const c of CATEGORIES) {
    const { data: newCat } = await admin.from("menu_categories").insert({
      restaurant_id: rId,
      name: c.name,
      sort_order: c.sort_order
    }).select().single();
    if (newCat) {
      catMap.set(c.name, newCat.id);
    }
  }

  // Insert items
  let sortOrder = 1;
  for (const item of ITEMS) {
    const catId = catMap.get(item.cat);
    if (!catId) continue;

    await admin.from("menu_items").insert({
      restaurant_id: rId,
      category_id: catId,
      name: item.name,
      description: item.desc,
      price_paise: item.price,
      is_veg: item.is_veg,
      image_url: item.img || null,
      sort_order: sortOrder++,
      available: true
    });
  }

  return NextResponse.json({ success: true, message: "Wah Ji Wah menu seeded successfully." });
}
