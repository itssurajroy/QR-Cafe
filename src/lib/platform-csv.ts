// Copyright (c) 2026 QRslice. All rights reserved.
export type TenantCsvRow = { id: string; name: string; slug: string; plan: string; tier?: string | null; tax_rate?: number | null; created_at: string; subscription_ends_at?: string | null; trial_ends_at?: string | null };
const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export function tenantsToCsv(rows: TenantCsvRow[]): string {
  const header = "ID,Name,Slug,Plan,Tier,Tax Rate (%),Created At,Subscription Ends";
  const lines = rows.map((c) => [c.id, esc(c.name), c.slug, c.plan, c.tier || "pro", c.tax_rate ?? 5, c.created_at, c.subscription_ends_at || c.trial_ends_at || "N/A"].join(","));
  return [header, ...lines].join("\n");
}
