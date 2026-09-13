// Copyright (c) 2026 QRslice. All rights reserved.

export type AuditEntry = {
  actor_id: string | null;
  restaurant_id: string | null;
  entity: string;
  entity_id: string;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(db: any, entry: AuditEntry): Promise<void> {
  const { error } = await db.from("audit_events").insert({
    actor_id: entry.actor_id,
    restaurant_id: entry.restaurant_id,
    entity: entry.entity,
    entity_id: entry.entity_id,
    action: entry.action,
    metadata: entry.metadata ?? {},
  });
  if (error) console.error("[audit] insert failed:", error.message);
}
