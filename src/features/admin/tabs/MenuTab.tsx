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
          <h2 className="text-lg font-extrabold text-stone-900">Menu Catalog</h2>
          <p className="text-xs text-stone-500">
            {itemList.length} items across {categoryList.length} categories
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowBulkMenuModal(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-stone-900 text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <span>📥 Bulk Import CSV / Text</span>
          </button>
          <button
            onClick={() => setShowCatModal(true)}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 cursor-pointer"
          >
            + Category
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 cursor-pointer"
          >
            + Add Dish
          </button>
          <button
            onClick={selectAllItems}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl border border-stone-700 cursor-pointer"
          >
            ☐ Select All
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {showBulkBar && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 animate-slide-in-bottom">
          <div className="bg-white border border-amber-500/40 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <span className="text-xs font-bold text-amber-400">{selectedItems.size} selected</span>
            <div className="w-px h-4 bg-stone-700"></div>
            <button type="button" onClick={() => bulkToggleAvailability(true)} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer">Enable</button>
            <button type="button" onClick={() => bulkToggleAvailability(false)} className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer">Disable</button>
            <button type="button" onClick={bulkDelete} className="text-xs font-bold text-red-400 hover:text-red-300 cursor-pointer">🗑️ Delete</button>
            <button type="button" onClick={clearSelection} className="text-xs text-stone-500 hover:text-stone-900 cursor-pointer">× Clear</button>
          </div>
        </div>
      )}

      {/* Categorized Dishes */}
      <div className="space-y-6">
        {categoryList.map((cat) => {
          const catItems = itemList.filter((i) => i.category_id === cat.id);
          return (
            <div key={cat.id} className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-stone-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-amber-400 uppercase tracking-wider">{cat.name}</h3>
                  <span className="text-[10px] font-mono text-stone-500">({catItems.length} items)</span>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-stone-500 hover:text-red-400 text-xs font-bold"
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
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors cursor-grab active:cursor-grabbing ${
                      selectedItems.has(item.id)
                        ? "bg-amber-950/20 border-amber-500/50"
                        : item.available
                        ? "bg-white border-stone-200 hover:border-stone-700"
                        : "bg-white/40 border-stone-900 opacity-60"
                    } ${draggedItemId === item.id ? "dragging" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Checkbox for bulk select */}
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? "bg-emerald-500" : "bg-red-500"}`}></span>
                          <h4 className="font-bold text-xs text-stone-900">{item.name}</h4>
                        </div>
                        <span className="font-mono text-amber-400 font-bold text-xs block mt-1">
                          {paise(item.price_paise)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(item.id, item.available)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                          item.available
                            ? "bg-emerald-950 border-emerald-800 text-emerald-400"
                            : "bg-white border-stone-200 text-stone-500"
                        }`}
                      >
                        {item.available ? "In Stock" : "Sold Out"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-stone-600 hover:text-red-400 text-xs font-bold px-1.5"
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
