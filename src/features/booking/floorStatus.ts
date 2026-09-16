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

/* ═══════════════════════════════════════════════════════════════════════════
   DETAILED VISUAL FLOOR GRID STATE MODEL
   Explicitly captures: Seated, Food Cooking, and Who Needs the Bill
   ═══════════════════════════════════════════════════════════════════════════ */

export type TableOperationalState =
  | "available"
  | "seated"
  | "cooking"
  | "served"
  | "needs_bill"
  | "paid"
  | "reserved";

export interface DetailedTableStatus {
  state: TableOperationalState;
  label: string;
  badgeText: string;
  orderCount: number;
  activeOrders: any[];
  totalPaise: number;
  latestOrderTime: string | null;
  elapsedMinutes: number;
  itemsSummary: string[];
  customerName: string | null;
  customerPhone: string | null;
  hasBillRequest: boolean;
  reservation?: any | null;
}

export function calculateDetailedTableStatus(
  table: { id: string; label: string; seats?: number },
  orders: any[],
  reservations: FloorReservation[] = [],
  billRequestedTableIds: Set<string> | string[] = new Set(),
  now: Date = new Date(),
): DetailedTableStatus {
  const billReqSet =
    billRequestedTableIds instanceof Set
      ? billRequestedTableIds
      : new Set(billRequestedTableIds);

  const hasBillRequest = billReqSet.has(table.id) || billReqSet.has(table.label);

  // Active orders for this table (not cancelled, not completed)
  const activeOrders = orders.filter((o) => {
    const matchesTable = o.table_id === table.id || o.table_label === table.label;
    const isCompleted = o.status === "completed" || o.status === "cancelled";
    return matchesTable && !isCompleted;
  });

  const nowMs = now.getTime();

  if (activeOrders.length === 0) {
    // Check reservations
    const covering = reservations.find(
      (r) =>
        r.table_ids.includes(table.id) &&
        new Date(r.starts_at).getTime() <= nowMs &&
        nowMs < new Date(r.ends_at).getTime(),
    );
    if (covering) {
      const s = new Date(covering.starts_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const covAny = covering as any;
      return {
        state: "reserved",
        label: "Booked",
        badgeText: covAny.code ? `Booked ${s} (${covAny.code})` : `Booked ${s}`,
        orderCount: 0,
        activeOrders: [],
        totalPaise: 0,
        latestOrderTime: null,
        elapsedMinutes: 0,
        itemsSummary: [],
        customerName: covAny.name || null,
        customerPhone: covAny.phone || null,
        hasBillRequest: false,
        reservation: covAny,
      };
    }

    const upcoming = reservations
      .filter((r) => r.table_ids.includes(table.id) && new Date(r.starts_at).getTime() > nowMs)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0];

    if (upcoming && new Date(upcoming.starts_at).getTime() - nowMs <= 60 * 60000) {
      const s = new Date(upcoming.starts_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const upAny = upcoming as any;
      return {
        state: "reserved",
        label: "Reserved",
        badgeText: upAny.code ? `Reserved ${s} (${upAny.code})` : `Reserved ${s}`,
        orderCount: 0,
        activeOrders: [],
        totalPaise: 0,
        latestOrderTime: null,
        elapsedMinutes: 0,
        itemsSummary: [],
        customerName: upAny.name || null,
        customerPhone: upAny.phone || null,
        hasBillRequest: false,
        reservation: upAny,
      };
    }

    return {
      state: "available",
      label: "Available",
      badgeText: "Available",
      orderCount: 0,
      activeOrders: [],
      totalPaise: 0,
      latestOrderTime: null,
      elapsedMinutes: 0,
      itemsSummary: [],
      customerName: null,
      customerPhone: null,
      hasBillRequest: false,
    };
  }

  // Aggregate values
  const totalPaise = activeOrders.reduce((sum, o) => sum + (o.total_paise || 0), 0);
  const earliestCreatedAt = activeOrders.reduce((earliest, o) => {
    const t = new Date(o.created_at || nowMs).getTime();
    return t < earliest ? t : earliest;
  }, nowMs);

  const elapsedMinutes = Math.max(0, Math.floor((nowMs - earliestCreatedAt) / 60000));

  // Extract customer name & phone from most recent order
  const latestOrder = activeOrders[0];
  const customerName = latestOrder?.customer_name || null;
  const customerPhone = latestOrder?.customer_phone || null;

  // Extract items summary
  const itemsSummary: string[] = [];
  activeOrders.forEach((o) => {
    const its = o.items || o.order_items || [];
    its.forEach((it: any) => {
      const name = it.item_name || it.item?.name || "Dish";
      const q = it.quantity || 1;
      itemsSummary.push(`${q}× ${name}`);
    });
  });

  // State determination:
  // 1. If explicit bill request, or any order is served/ready but unpaid -> needs_bill
  const hasUnpaid = activeOrders.some((o) => o.payment_status === "unpaid");
  const hasServedOrReady = activeOrders.some(
    (o) => o.status === "served" || o.status === "ready",
  );

  if (hasBillRequest || (hasServedOrReady && hasUnpaid)) {
    return {
      state: "needs_bill",
      label: "Needs Bill",
      badgeText: "Bill Pending",
      orderCount: activeOrders.length,
      activeOrders,
      totalPaise,
      latestOrderTime: latestOrder?.created_at || null,
      elapsedMinutes,
      itemsSummary,
      customerName,
      customerPhone,
      hasBillRequest,
    };
  }

  // 2. If any order is currently cooking / in preparation -> cooking
  const isCooking = activeOrders.some(
    (o) => (o.status || "").toLowerCase() === "preparing",
  );
  if (isCooking) {
    return {
      state: "cooking",
      label: "Cooking",
      badgeText: `Cooking (${elapsedMinutes}m)`,
      orderCount: activeOrders.length,
      activeOrders,
      totalPaise,
      latestOrderTime: latestOrder?.created_at || null,
      elapsedMinutes,
      itemsSummary,
      customerName,
      customerPhone,
      hasBillRequest: false,
    };
  }

  // 3. If any order is placed/pending -> seated & ordering
  const isPlaced = activeOrders.some((o) => {
    const s = (o.status || "").toLowerCase();
    return s === "placed" || s === "pending" || s === "new";
  });
  if (isPlaced) {
    return {
      state: "seated",
      label: "Seated",
      badgeText: `Seated (${elapsedMinutes}m)`,
      orderCount: activeOrders.length,
      activeOrders,
      totalPaise,
      latestOrderTime: latestOrder?.created_at || null,
      elapsedMinutes,
      itemsSummary,
      customerName,
      customerPhone,
      hasBillRequest: false,
    };
  }

  // 4. If all orders are paid -> paid
  const allPaid = activeOrders.every((o) => o.payment_status === "paid");
  if (allPaid) {
    return {
      state: "paid",
      label: "Paid",
      badgeText: "Paid (Clearing)",
      orderCount: activeOrders.length,
      activeOrders,
      totalPaise,
      latestOrderTime: latestOrder?.created_at || null,
      elapsedMinutes,
      itemsSummary,
      customerName,
      customerPhone,
      hasBillRequest: false,
    };
  }

  return {
    state: "served",
    label: "Served",
    badgeText: "Dining",
    orderCount: activeOrders.length,
    activeOrders,
    totalPaise,
    latestOrderTime: latestOrder?.created_at || null,
    elapsedMinutes,
    itemsSummary,
    customerName,
    customerPhone,
    hasBillRequest: false,
  };
}
