import { describe, it, expect } from "vitest";

export function buildSettleBody(input: {
  tableId: string | null; orderType: string; cart: Array<{ item: { id: string }; quantity: number; notes?: string }>;
  discountPaise: number; paymentMethod: string; status: "paid" | "unpaid"; splitCash: string; splitUpi: string; split: boolean;
}) {
  if (input.cart.length === 0) throw new Error("Cart cannot be empty");
  return {
    table_id: input.tableId,
    order_type: input.orderType,
    customer_name: "Walk-in Guest",
    customer_phone: "",
    items: input.cart.map((c) => ({ id: c.item.id, quantity: c.quantity, notes: c.notes || "" })),
    discount_paise: input.discountPaise || 0,
    payment_method: input.paymentMethod || "cash",
    payment_status: input.status,
    split_cash_paise: input.split && input.splitCash ? Math.round(Number(input.splitCash) * 100) : 0,
    split_upi_paise: input.split && input.splitUpi ? Math.round(Number(input.splitUpi) * 100) : 0,
  };
}

describe("settle payload", () => {
  it("rejects empty cart", () => {
    expect(() => buildSettleBody({ tableId: null, orderType: "dine_in", cart: [], discountPaise: 0, paymentMethod: "cash", status: "paid", splitCash: "", splitUpi: "", split: false })).toThrow("Cart cannot be empty");
  });
  it("unpaid KOT keeps payment_status unpaid", () => {
    const b = buildSettleBody({ tableId: "t1", orderType: "dine_in", cart: [{ item: { id: "i1" }, quantity: 2 }], discountPaise: 0, paymentMethod: "cash", status: "unpaid", splitCash: "", splitUpi: "", split: false });
    expect(b.payment_status).toBe("unpaid");
    expect(b.items).toEqual([{ id: "i1", quantity: 2, notes: "" }]);
  });
  it("split tender converts rupees to paise", () => {
    const b = buildSettleBody({ tableId: "t1", orderType: "dine_in", cart: [{ item: { id: "i1" }, quantity: 1 }], discountPaise: 0, paymentMethod: "mixed", status: "paid", splitCash: "100", splitUpi: "530", split: true });
    expect(b.split_cash_paise).toBe(10000);
    expect(b.split_upi_paise).toBe(53000);
  });
});
