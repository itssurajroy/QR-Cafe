// Copyright (c) 2026 QRslice. All rights reserved.
"use client";

export type ExportRow = {
  name: string;
  slug: string;
  owner_email: string | null;
  plan: string;
  trial_ends_at: string | null;
  created_at: string | null;
};

function csvCell(v: string | null | undefined): string {
  const s = v ?? "";
  return `"${s.replace(/"/g, '""')}"`;
}

export default function TenantsExportButton({ rows }: { rows: ExportRow[] }) {
  function onExport() {
    const header = ["name", "slug", "owner_email", "plan", "trial_ends_at", "created_at"];
    const lines = [
      header.join(","),
      ...rows.map((r) =>
        [
          csvCell(r.name),
          csvCell(r.slug),
          csvCell(r.owner_email),
          csvCell(r.plan),
          csvCell(r.trial_ends_at),
          csvCell(r.created_at),
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tenants.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={onExport}
      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
    >
      Export CSV
    </button>
  );
}

