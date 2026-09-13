// Copyright (c) 2026 QRslice. All rights reserved.
export type FloorState = "free" | "held" | "occupied" | "reserved";

export type FloorReservation = {
  table_ids: string[];
  starts_at: string;
  ends_at: string;
};

export function tableFloorState(
  tableId: string,
  now: Date,
  reservations: FloorReservation[],
  occupiedIds: Set<string> | string[],
): { state: FloorState; detail: string | null } {
  const occupied = occupiedIds instanceof Set ? occupiedIds.has(tableId) : occupiedIds.includes(tableId);
  if (occupied) return { state: "occupied", detail: "Active order" };
  const t = now.getTime();
  const covering = reservations.find(
    (r) => r.table_ids.includes(tableId) && new Date(r.starts_at).getTime() <= t && t < new Date(r.ends_at).getTime(),
  );
  if (covering) {
    const s = new Date(covering.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return { state: "held", detail: `Booked ${s}` };
  }
  const upcoming = reservations
    .filter((r) => r.table_ids.includes(tableId) && new Date(r.starts_at).getTime() > t)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];
  if (upcoming && new Date(upcoming.starts_at).getTime() - t <= 60 * 60000) {
    const s = new Date(upcoming.starts_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return { state: "reserved", detail: `Reserved ${s}` };
  }
  return { state: "free", detail: null };
}

