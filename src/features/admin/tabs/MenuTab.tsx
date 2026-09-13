// Copyright (c) 2026 QRslice. All rights reserved.
import { paise } from "@/lib/utils";
import type { Category, MenuItem as Item } from "@/types";

interface MenuTabProps {
  itemList: Item[];
  categoryList: Category[];
  selectedItems: Set<string>;
  showBulkBar: boolean;
  draggedItemId: string | null;
  setShowBulkMenuModal: (show: boolean) => void;
  setShowCatModal: (show: boolean) => void;
  setShowItemModal: (show: boolean) => void;
  selectAllItems: () => void;
  clearSelection: () => void;
  bulkToggleAvailability: (available: boolean) => void;
  bulkDelete: () => void;
  handleDeleteCategory: (id: string) => void;
  handleDragStart: (id: string) => void;
  handleDragEnd: () => void;
  handleDragOver: (e: React.DragEvent, id: string) => void;
  toggleSelectItem: (id: string) => void;
  handleToggleAvailable: (id: string, available: boolean) => void;
  handleDeleteItem: (id: string) => void;
}

export function MenuTab({
  itemList,
  categoryList,
  selectedItems,
  showBulkBar,
  draggedItemId,
  setShowBulkMenuModal,
  setShowCatModal,
  setShowItemModal,
  selectAllItems,
  clearSelection,
  bulkToggleAvailability,
  bulkDelete,
  handleDeleteCategory,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  toggleSelectItem,
  handleToggleAvailable,
  handleDeleteItem,
}: MenuTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Menu Catalog</h2>
          <p className="text-xs text-slate-500">
            {itemList.length} items across {categoryList.length} categories
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkMenuModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <span>📥 Bulk Import CSV / Text</span>
          </button>
          <button
            onClick={() => setShowCatModal(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
          >
            + Category
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            + Add Dish
          </button>
          <button
            onClick={selectAllItems}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
          >
            ☐ Select All
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {showBulkBar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-slide-in-bottom">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-600">{selectedItems.size} selected</span>
            <div className="w-px h-4 bg-slate-200"></div>
            <button type="button" onClick={() => bulkToggleAvailability(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer">Enable</button>
            <button type="button" onClick={() => bulkToggleAvailability(false)} className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer">Disable</button>
            <button type="button" onClick={bulkDelete} className="text-xs font-bold text-red-500 hover:text-red-600 cursor-pointer">🗑️ Delete</button>
            <button type="button" onClick={clearSelection} className="text-xs text-slate-400 hover:text-slate-900 cursor-pointer">× Clear</button>
          </div>
        </div>
      )}

      {/* Categorized Dishes */}
      <div className="space-y-6">
        {categoryList.map((cat) => {
          const catItems = itemList.filter((i) => i.category_id === cat.id);
          return (
            <div key={cat.id} className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-indigo-600 uppercase tracking-wider">{cat.name}</h3>
                  <span className="text-xs font-mono text-slate-400">({catItems.length} items)</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-slate-400 hover:text-red-500 text-xs font-bold"
                >
                  Delete Category
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, item.id)}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-grab active:cursor-grabbing ${
                      selectedItems.has(item.id)
                        ? "bg-indigo-50 border-indigo-300"
                        : item.available
                        ? "bg-slate-50 border-slate-200 hover:border-slate-300"
                        : "bg-slate-100 border-slate-200 opacity-60"
                    } ${draggedItemId === item.id ? "dragging" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                        </div>
                        <span className="font-mono text-indigo-600 font-bold text-xs block mt-1">
                          {paise(item.price_paise)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(item.id, item.available)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          item.available
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-slate-100 border-slate-200 text-slate-400"
                        }`}
                      >
                        {item.available ? "In Stock" : "Sold Out"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 text-xs font-bold px-1.5"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

