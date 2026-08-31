import type { Table } from "@/types";

interface TablesTabProps {
  tableList: Table[];
  generatingBulk: boolean;
  isAddingTable: boolean;
  newTableLabel: string;
  newTableSeats: number;
  showBulkQr: () => void;
  showQr: (t: Table) => void;
  handleDeleteTable: (id: string) => void;
  setNewTableLabel: (label: string) => void;
  setNewTableSeats: (seats: number) => void;
  handleAddTable: (e: React.FormEvent) => void;
}

export function TablesTab({
  tableList,
  generatingBulk,
  isAddingTable,
  newTableLabel,
  newTableSeats,
  showBulkQr,
  showQr,
  handleDeleteTable,
  setNewTableLabel,
  setNewTableSeats,
  handleAddTable,
}: TablesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white">Table QR Codes</h2>
          <p className="text-xs text-stone-400">Generate, inspect, and print table tent cards</p>
        </div>

        <button
          type="button"
          onClick={showBulkQr}
          disabled={generatingBulk || tableList.length === 0}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer"
        >
          {generatingBulk ? "Generating…" : "Print All Tent Cards 🖨️"}
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tableList.map((t) => (
          <div
            key={t.id}
            className="bg-stone-900 border border-stone-800 rounded-3xl p-5 text-center space-y-3 shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="font-black text-amber-400 font-mono text-xl block">{t.label}</span>
              <span className="text-xs text-stone-400 font-medium">{t.seats} Seats</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => showQr(t)}
                className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs cursor-pointer border border-stone-700"
              >
                View QR Stand
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTable(t.id)}
                className="text-[11px] text-stone-500 hover:text-red-400 font-bold"
              >
                Delete Table
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Table */}
      <form onSubmit={handleAddTable} className="bg-stone-900 border border-stone-800 rounded-3xl p-4 flex gap-3 items-center">
        <input
          type="text"
          placeholder="Table Label (e.g. T07)"
          value={newTableLabel}
          onChange={(e) => setNewTableLabel(e.target.value)}
          className="bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white flex-1 focus:outline-none focus:border-amber-500"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={newTableSeats}
          onChange={(e) => setNewTableSeats(Number(e.target.value))}
          className="w-24 bg-stone-950 border border-stone-800 rounded-xl p-2.5 text-xs text-white text-center"
        />
        <button
          type="submit"
          disabled={isAddingTable || !newTableLabel}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs cursor-pointer"
        >
          + Add Table
        </button>
      </form>
    </div>
  );
}
