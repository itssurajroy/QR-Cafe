// Copyright (c) 2026 QRslice. All rights reserved.
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockOrder = {
  id: "order-uuid",
  order_number: "1042",
  restaurant_id: "restaurant-uuid",
  table_id: "table-uuid",
  table_label: "T-4",
  qr_token: "qr-token",
  subtotal_paise: 40000,
  total_paise: 42000,
  tax_paise: 2000,
  payment_status: "paid",
  payment_method: "upi",
  status: "served",
  customer_name: "John Doe",
  customer_phone: "9876543210",
  notes: "No onions",
  status_token: "status-token",
  created_at: "2026-09-18T12:00:00Z",
  updated_at: "2026-09-18T12:30:00Z",
};

const mockOrderItems = [
  {
    id: "item-1",
    order_id: "order-uuid",
    menu_item_id: "menu-1",
    item_name: "Paneer Butter Masala",
    unit_price_paise: 25000,
    quantity: 1,
    line_total_paise: 25000,
    notes: "Less spicy",
    spice_level: "mild",
    size_variant: null,
  },
  {
    id: "item-2",
    order_id: "order-uuid",
    menu_item_id: "menu-2",
    item_name: "Garlic Naan",
    unit_price_paise: 8000,
    quantity: 2,
    line_total_paise: 16000,
    notes: null,
    spice_level: null,
    size_variant: null,
  },
];

const mockRestaurant = {
  id: "restaurant-uuid",
  name: "Curry Leaf",
  slug: "curry-leaf",
  currency: "INR",
  logo_url: null,
  accent_color: null,
  tagline: null,
  google_review_url: null,
  address: "123 Main Street, Bangalore",
  phone: "9876543210",
  gstin: "29AAAAA0000A1Z5",
  tax_rate: 5,
  plan: "active",
  tier: "pro",
  trial_ends_at: null,
  subscription_ends_at: null,
  billing_status: null,
  upi_id: null,
  upi_qr_url: null,
  created_at: "2026-01-01T00:00:00Z",
};

// Mock chainable query builder
const mockMaybeSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn(() => ({ eq: mockEq, maybeSingle: mockMaybeSingle }));

// For order_items query which returns array
const mockOrderItemsSelect = vi.fn();
const mockOrderItemsEq = vi.fn(() => ({ eq: mockOrderItemsEq, then: (resolve: (value: { data: typeof mockOrderItems; error: null }) => void) => resolve({ data: mockOrderItems, error: null }) }));

const mockFrom = vi.fn((table) => {
  if (table === "order_items") {
    return {
      select: mockOrderItemsSelect,
    };
  }
  return {
    select: mockSelect,
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

import { InvoiceService } from "@/lib/invoice.service";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

describe("InvoiceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockOrderItemsSelect.mockReturnValue({ eq: mockOrderItemsEq });
  });

  it("generates invoice with pdfBuffer and invoiceData", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");

    expect(invoice.pdfBuffer).toBeInstanceOf(Buffer);
    expect(invoice.pdfBuffer.length).toBeGreaterThan(0);
    expect(invoice.invoiceData).toBeDefined();
    expect(invoice.invoiceData.order.total_paise).toBeGreaterThan(0);
    expect(invoice.invoiceData.items.length).toBeGreaterThan(0);
  });

  it("includes restaurant info in invoiceData", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");

    expect(invoice.invoiceData.restaurant).toBeDefined();
    expect(invoice.invoiceData.restaurant.name).toBe("Curry Leaf");
    expect(invoice.invoiceData.restaurant.gstin).toBe("29AAAAA0000A1Z5");
    expect(invoice.invoiceData.restaurant.address).toBe("123 Main Street, Bangalore");
  });

  it("includes order details in invoiceData", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");

    expect(invoice.invoiceData.order).toBeDefined();
    expect(invoice.invoiceData.order.order_number).toBe("1042");
    expect(invoice.invoiceData.order.table_label).toBe("T-4");
    expect(invoice.invoiceData.order.total_paise).toBe(42000);
    expect(invoice.invoiceData.order.payment_method).toBe("upi");
    expect(invoice.invoiceData.order.payment_status).toBe("paid");
  });

  it("includes items with quantities and prices in invoiceData", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");

    expect(invoice.invoiceData.items).toBeDefined();
    expect(invoice.invoiceData.items.length).toBeGreaterThan(0);
    expect(invoice.invoiceData.items[0]).toHaveProperty("item_name");
    expect(invoice.invoiceData.items[0]).toHaveProperty("quantity");
    expect(invoice.invoiceData.items[0]).toHaveProperty("unit_price_paise");
    expect(invoice.invoiceData.items[0]).toHaveProperty("line_total_paise");
  });

  it("computes a numerically correct exclusive-tax breakdown", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");
    const { tax, order } = invoice.invoiceData;

    // Fixture: subtotal 40000 (net base), discount 0, rate 5.
    // Exclusive model: taxable = subtotal - discount; tax = round(taxable * rate / 100).
    expect(tax.tax_rate).toBe(5);
    expect(tax.taxable_value_paise).toBe(40000);
    expect(tax.total_tax_paise).toBe(2000);
    expect(tax.cgst_paise).toBe(1000);
    expect(tax.sgst_paise).toBe(1000);
    expect(tax.cgst_paise + tax.sgst_paise).toBe(tax.total_tax_paise);
    // Breakdown reconciles to Grand Total.
    expect(tax.taxable_value_paise + tax.total_tax_paise).toBe(order.total_paise);
    expect(order.total_paise).toBe(42000);
  });

  it("applies order discount to the taxable base", async () => {
    const discountedOrder = { ...mockOrder, discount_paise: 5000, total_paise: 36750 };
    mockMaybeSingle
      .mockResolvedValueOnce({ data: discountedOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");
    const { tax, order } = invoice.invoiceData;

    // taxable = 40000 - 5000 = 35000; tax = round(35000 * 5 / 100) = 1750.
    expect(order.discount_paise).toBe(5000);
    expect(tax.taxable_value_paise).toBe(35000);
    expect(tax.total_tax_paise).toBe(1750);
    expect(tax.cgst_paise + tax.sgst_paise).toBe(tax.total_tax_paise);
    expect(tax.taxable_value_paise + tax.total_tax_paise).toBe(order.total_paise);
  });

  it("generates a valid PDF buffer starting with %PDF magic bytes", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    const invoice = await InvoiceService.generateInvoice("order-uuid");

    expect(invoice.pdfBuffer).toBeInstanceOf(Buffer);
    expect(invoice.pdfBuffer.length).toBeGreaterThan(0);
    expect(invoice.pdfBuffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
  });

  it("throws error when order not found", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: null, error: null }); // order not found

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query

    await expect(InvoiceService.generateInvoice("non-existent-order")).rejects.toThrow("Order not found");
  });

  it("throws error when restaurant not found", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: null, error: null }); // restaurant missing

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query

    await expect(InvoiceService.generateInvoice("order-uuid")).rejects.toThrow("Restaurant not found");
  });

  it("throws error when order items fetch fails", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }); // order

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockOrderItemsEq.mockReturnValueOnce({
      eq: mockOrderItemsEq,
      then: (resolve: (value: { data: typeof mockOrderItems; error: null }) => void) =>
        resolve({ data: null, error: { message: "db down" } } as unknown as {
          data: typeof mockOrderItems;
          error: null;
        }),
    });

    await expect(InvoiceService.generateInvoice("order-uuid")).rejects.toThrow("Failed to fetch order items");
  });

  it("generates a valid PDF when the order has no items", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: mockOrder, error: null }) // order
      .mockResolvedValueOnce({ data: mockRestaurant, error: null }); // restaurant

    mockSelect.mockReturnValueOnce({ eq: mockEq }); // order query
    mockSelect.mockReturnValueOnce({ eq: mockEq }); // restaurant query
    mockOrderItemsEq.mockReturnValueOnce({
      eq: mockOrderItemsEq,
      then: (resolve: (value: { data: typeof mockOrderItems; error: null }) => void) =>
        resolve({ data: [], error: null }),
    });

    const invoice = await InvoiceService.generateInvoice("order-uuid");

    expect(invoice.invoiceData.items).toHaveLength(0);
    expect(invoice.pdfBuffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
    // Totals still reconcile (subtotal falls back to the order row).
    expect(
      invoice.invoiceData.tax.taxable_value_paise + invoice.invoiceData.tax.total_tax_paise,
    ).toBe(invoice.invoiceData.order.total_paise);
  });
});