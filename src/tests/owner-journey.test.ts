// Copyright (c) 2026 QRslice. All rights reserved.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { calculateAuthoritativePricing } from "@/lib/pricing";
import { InvoiceService } from "@/lib/invoice.service";
import { canAccessTab, normalizeRole } from "@/lib/role-permissions";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { processCustomerLoyalty, redeemCustomerPoints, reverseCustomerLoyalty } from "@/lib/crm";

describe("Owner Acceptance & Full Operational Journey Test", () => {
  const admin = createSupabaseAdmin();
  let testRestaurantId: string;
  let testTableId: string;
  let testQrToken: string;
  let testMenuItemId: string;
  let createdOrderId: string;
  const testPhone = "+919876543210";

  beforeAll(async () => {
    // 1. Resolve Curry Leaf test restaurant
    const { data: rest } = await admin
      .from("restaurants")
      .select("id, name, slug")
      .eq("slug", "curry-leaf")
      .maybeSingle();

    if (rest) {
      testRestaurantId = rest.id;
    } else {
      const { data: newRest } = await admin
        .from("restaurants")
        .insert({
          name: "Curry Leaf Test",
          slug: "curry-leaf-test",
          plan: "active",
          tax_rate: 5,
        })
        .select("id")
        .single();
      testRestaurantId = newRest!.id;
    }

    // 2. Resolve or create table
    const { data: table } = await admin
      .from("restaurant_tables")
      .select("id, qr_token")
      .eq("restaurant_id", testRestaurantId)
      .limit(1)
      .maybeSingle();

    if (table) {
      testTableId = table.id;
      testQrToken = table.qr_token;
    } else {
      const { data: newTable } = await admin
        .from("restaurant_tables")
        .insert({
          restaurant_id: testRestaurantId,
          label: "T-1",
          seats: 4,
          active: true,
        })
        .select("id, qr_token")
        .single();
      testTableId = newTable!.id;
      testQrToken = newTable!.qr_token;
    }

    // 3. Resolve or create menu item
    const { data: item } = await admin
      .from("menu_items")
      .select("id")
      .eq("restaurant_id", testRestaurantId)
      .limit(1)
      .maybeSingle();

    if (item) {
      testMenuItemId = item.id;
    } else {
      const { data: newItem } = await admin
        .from("menu_items")
        .insert({
          restaurant_id: testRestaurantId,
          name: "Paneer Butter Masala",
          price_paise: 20000,
          available: true,
          is_veg: true,
        })
        .select("id")
        .single();
      testMenuItemId = newItem!.id;
    }
  });

  it("1. Security: Owner cannot access Super Admin functionality and staff cannot access Owner tabs", () => {
    // Role permissions matrix validation
    expect(canAccessTab("owner", "dashboard")).toBe(true);
    expect(canAccessTab("owner", "analytics")).toBe(true);
    expect(canAccessTab("owner", "billing")).toBe(true);
    expect(canAccessTab("owner", "settings")).toBe(true);
    expect(canAccessTab("owner", "staff")).toBe(true);

    // Kitchen cannot access billing, analytics, settings, staff
    expect(canAccessTab("kitchen", "billing")).toBe(false);
    expect(canAccessTab("kitchen", "analytics")).toBe(false);
    expect(canAccessTab("kitchen", "settings")).toBe(false);
    expect(canAccessTab("kitchen", "staff")).toBe(false);
    expect(canAccessTab("kitchen", "kitchen")).toBe(true);

    // Waiter cannot access billing, analytics, settings, staff
    expect(canAccessTab("waiter", "billing")).toBe(false);
    expect(canAccessTab("waiter", "analytics")).toBe(false);
    expect(canAccessTab("waiter", "settings")).toBe(false);
    expect(canAccessTab("waiter", "orders")).toBe(true);
    expect(canAccessTab("waiter", "tables")).toBe(true);

    expect(normalizeRole("super_admin")).toBe("staff"); // Tenant role normalizer never promotes to super_admin
  });

  it("2. Mandatory Pricing Regression: Base ₹200 + Full Portion ₹50 + Addons ₹30+₹20 * Qty 2 = Unit ₹300, Line ₹600", () => {
    const basePrice = 20000;
    const portionDelta = 5000;
    const modifiers = [
      { option_name: "Addon A (Extra Gravy)", price_delta_paise: 3000 },
      { option_name: "Addon B (Garlic Dip)", price_delta_paise: 2000 },
    ];
    const quantity = 2;

    const pricing = calculateAuthoritativePricing({
      items: [
        {
          menu_item_id: testMenuItemId,
          item_name: "Special Curry",
          base_price_paise: basePrice,
          portion_name: "Full portion",
          portion_delta_paise: portionDelta,
          modifiers,
          quantity,
        },
      ],
      tax_rate_percent: 5,
    });

    // Authoritative unit and line price
    expect(pricing.items[0].unit_price_paise).toBe(30000); // ₹300
    expect(pricing.items[0].line_total_paise).toBe(60000); // ₹600
    expect(pricing.subtotal_paise).toBe(60000);
    expect(pricing.tax_paise).toBe(3000); // 5% GST = ₹30
    expect(pricing.total_paise).toBe(63000); // ₹630

    // Immutable snapshot matches exact values
    expect(pricing.snapshot.items[0].unit_price_paise).toBe(30000);
    expect(pricing.snapshot.items[0].line_total_paise).toBe(60000);
    expect(pricing.snapshot.total_paise).toBe(63000);
  });

  it("3. Order Lifecycle: Customer QR / POS order persisted with immutable pricing snapshot", async () => {
    const orderNumber = `E2E-${Date.now().toString().slice(-4)}`;
    const idempotencyKey = crypto.randomUUID();

    const pricing = calculateAuthoritativePricing({
      items: [
        {
          menu_item_id: testMenuItemId,
          item_name: "Curry Leaf Signature",
          base_price_paise: 20000,
          portion_name: "Full portion",
          portion_delta_paise: 5000,
          modifiers: [
            { option_name: "Extra Cheese", price_delta_paise: 3000 },
            { option_name: "Garlic Dip", price_delta_paise: 2000 },
          ],
          quantity: 2,
        },
      ],
      tax_rate_percent: 5,
    });

    // Insert Order into DB
    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({
        restaurant_id: testRestaurantId,
        table_id: testTableId,
        order_number: orderNumber,
        subtotal_paise: pricing.subtotal_paise,
        tax_paise: pricing.tax_paise,
        discount_paise: pricing.discount_paise,
        total_paise: pricing.total_paise,
        pricing_snapshot: pricing.snapshot,
        payment_method: "counter",
        customer_name: "Aman Sharma",
        customer_phone: testPhone,
        idempotency_key: idempotencyKey,
        status: "pending",
        payment_status: "unpaid",
      })
      .select()
      .single();

    expect(oErr).toBeNull();
    expect(order).toBeDefined();
    createdOrderId = order!.id;

    // Insert order items
    const { data: insertedItems } = await admin
      .from("order_items")
      .insert([
        {
          order_id: createdOrderId,
          menu_item_id: testMenuItemId,
          item_name: "Curry Leaf Signature",
          unit_price_paise: 30000,
          quantity: 2,
          line_total_paise: 60000,
          notes: "Chef special spice",
        },
      ])
      .select("id");

    expect(insertedItems).toBeDefined();
    expect(insertedItems!.length).toBe(1);

    // Insert modifiers
    await admin.from("order_item_modifiers").insert([
      {
        order_item_id: insertedItems![0].id,
        option_name: "Extra Cheese",
        price_delta_paise: 3000,
      },
      {
        order_item_id: insertedItems![0].id,
        option_name: "Garlic Dip",
        price_delta_paise: 2000,
      },
    ]);

    // Verify order was persisted with immutable snapshot
    const { data: loadedOrder } = await admin
      .from("orders")
      .select("id, total_paise, pricing_snapshot")
      .eq("id", createdOrderId)
      .single();

    expect(loadedOrder!.total_paise).toBe(63000);
    expect(loadedOrder!.pricing_snapshot).toBeDefined();
    expect(loadedOrder!.pricing_snapshot.subtotal_paise).toBe(60000);
  });

  it("4. KDS & Status Progression: Pending -> Preparing -> Ready -> Served", async () => {
    // Transition to preparing
    const { error: prepErr } = await admin
      .from("orders")
      .update({ status: "preparing" })
      .eq("id", createdOrderId);
    expect(prepErr).toBeNull();

    // Transition to ready
    const { error: readyErr } = await admin
      .from("orders")
      .update({ status: "ready" })
      .eq("id", createdOrderId);
    expect(readyErr).toBeNull();

    // Verify status is ready
    const { data: readyOrder } = await admin
      .from("orders")
      .select("status")
      .eq("id", createdOrderId)
      .single();
    expect(readyOrder!.status).toBe("ready");
  });

  it("5. Payment Settlement & Immutable Invoice: Generates matching invoice and triggers loyalty ledger", async () => {
    // Settle payment
    await admin
      .from("orders")
      .update({ payment_status: "paid", status: "served" })
      .eq("id", createdOrderId);

    // Generate authoritative invoice
    const { invoiceData } = await InvoiceService.generateInvoice(createdOrderId);
    expect(invoiceData.order.subtotal_paise).toBe(60000);
    expect(invoiceData.order.total_paise).toBe(63000);
    expect(invoiceData.items[0].unit_price_paise).toBe(30000);
    expect(invoiceData.items[0].line_total_paise).toBe(60000);

    // Process Loyalty Points Earn
    const loyalty = await processCustomerLoyalty(
      admin,
      testRestaurantId,
      testPhone,
      "Aman Sharma",
      63000, // ₹630 -> 6 points
      createdOrderId,
      "TEST-01",
    );

    expect(loyalty.pointsEarned).toBe(6);

    // Verify loyalty transaction was recorded in the immutable ledger
    const { data: txs } = await admin
      .from("loyalty_transactions")
      .select("points, type, balance_after")
      .eq("order_id", createdOrderId)
      .eq("type", "earn");

    expect(txs).toBeDefined();
    expect(txs!.length).toBeGreaterThanOrEqual(1);
    expect(txs![0].points).toBe(6);

    // Test Refund / Reversal
    await reverseCustomerLoyalty(admin, testRestaurantId, createdOrderId, "Customer Bill Refund");

    const { data: revTxs } = await admin
      .from("loyalty_transactions")
      .select("points, type")
      .eq("order_id", createdOrderId)
      .eq("type", "reverse");

    expect(revTxs).toBeDefined();
    expect(revTxs!.length).toBeGreaterThanOrEqual(1);
    expect(revTxs![0].points).toBe(-6);
  });
});
