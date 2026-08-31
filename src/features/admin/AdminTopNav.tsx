interface AdminTopNavProps {
  tab: "dashboard" | "menu" | "tables" | "report" | "analytics" | "branding" | "settings" | "help";
  setTab: (tab: any) => void;
}

export function AdminTopNav({ tab, setTab }: AdminTopNavProps) {
  const tabs = ["dashboard", "menu", "tables", "report", "analytics", "branding", "settings", "help"] as const;

  return (
    <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            tab === t
              ? "bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20"
              : "text-stone-400 hover:text-stone-200"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
