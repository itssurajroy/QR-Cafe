// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

import { useState } from "react";
import { MenuClient } from "@/features/menu/MenuClient";
import type { Category, MenuItem as Item } from "@/types";

type Table = { id: string; label: string; qr_token: string };

export default function CafeMenuClient({
  restaurantName,
  categories,
  items,
  tables,
}: {
  restaurantName: string;
  categories: Category[];
  items: Item[];
  tables: Table[];
}) {
  const [table, setTable] = useState<Table | null>(null);

  if (!table) {
    return (
      <main className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 text-2xl font-black shadow-lg shadow-amber-500/20 mb-4">
          ☕
        </div>
        <h1 className="text-2xl font-extrabold text-white text-center">
          {restaurantName}
        </h1>
        <p className="text-stone-400 text-sm mt-1 mb-8 text-center">
          Select your table to view the menu and order
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => setTable(t)}
              className="bg-stone-900 border border-stone-800 hover:border-amber-500 rounded-2xl p-5 text-center transition-all active:scale-95"
            >
              <div className="text-lg font-bold text-amber-400">Table {t.label}</div>
              <div className="text-xs text-stone-500 mt-1">Tap to start</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  return (
    <MenuClient
      qrToken={table.qr_token}
      tableLabel={table.label}
      restaurantName={restaurantName}
      categories={categories}
      items={items}
    />
  );
}

