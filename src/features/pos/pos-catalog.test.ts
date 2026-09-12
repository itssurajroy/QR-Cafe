import { describe, it, expect } from "vitest";

type Item = { id: string; category_id: string; name: string; description?: string; price_paise: number; is_veg: boolean; available: boolean };

function filterCatalog(items: Item[], selectedCategory: string, searchQuery: string, vegOnly: boolean) {
  return items.filter((i) => {
    const matchesCat = selectedCategory === "all" || i.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = !vegOnly || i.is_veg;
    return i.available && matchesCat && matchesSearch && matchesVeg;
  });
}

describe("pos catalog filter", () => {
  const items: Item[] = [
    { id: "1", category_id: "c1", name: "Paneer Tikka", price_paise: 22000, is_veg: true, available: true },
    { id: "2", category_id: "c1", name: "Chicken Tikka", price_paise: 26000, is_veg: false, available: true },
    { id: "3", category_id: "c2", name: "Cold Coffee", description: "Iced coffee", price_paise: 14000, is_veg: true, available: false },
  ];
  it("hides unavailable items even when search matches", () => {
    expect(filterCatalog(items, "all", "coffee", false)).toEqual([]);
  });
  it("veg filter drops non-veg", () => {
    expect(filterCatalog(items, "all", "", true).map((i) => i.id)).toEqual(["1"]);
  });
  it("category + search combine", () => {
    expect(filterCatalog(items, "c1", "tikka", false).map((i) => i.id)).toEqual(["1", "2"]);
  });
});
