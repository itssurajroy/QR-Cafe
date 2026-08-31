function normalizeTableLabel(label: string): string {
  return decodeURIComponent(label).trim().toUpperCase().replace(/^T0*/, "").replace(/^0+/, "") || "0";
}
export function resolveTableByLabel(tables: { label: string }[], rawLabel: string) {
  const want = normalizeTableLabel(rawLabel);
  return (
    tables.find((t) => normalizeTableLabel(t.label) === want) ||
    tables.find((t) => t.label.toLowerCase() === decodeURIComponent(rawLabel).trim().toLowerCase()) ||
    null
  );
}
