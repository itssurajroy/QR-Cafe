import type { Table } from "@/types";

interface TablesTabProps {
  tableList: Table[];
  isAddingTable: boolean;
  newTableLabel: string;
  newTableSeats: number;
  showQr: (t: Table) => void;
  handleDeleteTable: (id: string) => void;
  setNewTableLabel: (label: string) => void;
  setNewTableSeats: (seats: number) => void;
  handleAddTable: (e: React.FormEvent) => void;
}

export function TablesTab({
  tableList,
  isAddingTable,
  newTableLabel,
  newTableSeats,
  showQr,
  handleDeleteTable,
  setNewTableLabel,
  setNewTableSeats,
  handleAddTable,
}: TablesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">Table QR Codes</h2>
        <p className="text-xs text-slate-500">Each table gets a unique QR code for customers to scan and order</p>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tableList.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-slate-200 rounded-3xl p-5 text-center space-y-3 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="font-black text-indigo-600 font-mono text-xl block">{t.label}</span>
              <span className="text-xs text-slate-500 font-medium">{t.seats} Seats</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => showQr(t)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer border border-slate-200"
              >
                View QR Stand
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTable(t.id)}
                className="text-xs text-slate-400 hover:text-red-500 font-bold"
              >
                Delete Table
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Table */}
      <form onSubmit={handleAddTable} className="bg-white border border-slate-200 rounded-3xl p-4 flex gap-3 items-center shadow-sm">
        <input
          type="text"
          placeholder="Table Label (e.g. T07)"
          value={newTableLabel}
          onChange={(e) => setNewTableLabel(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 flex-1 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          min={1}
          max={20}
          value={newTableSeats}
          onChange={(e) => setNewTableSeats(Number(e.target.value))}
          className="w-24 bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 text-center"
        />
        <button
          type="submit"
          disabled={isAddingTable || !newTableLabel}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer"
        >
          + Add Table
        </button>
      </form>
    </div>
  );
}
