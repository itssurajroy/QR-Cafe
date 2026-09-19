// Copyright (c) 2026 QRslice. All rights reserved.
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { generateInvoicePDF, type InvoiceData } from "./pdf-generator";

export class InvoiceService {
  static async generateInvoice(orderId: string): Promise<{ pdfBuffer: Buffer; invoiceData: InvoiceData }> {
    const db = createSupabaseAdmin();

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const { data: orderItems, error: itemsError } = await db
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      throw new Error("Failed to fetch order items");
    }

    const { data: restaurant, error: restaurantError } = await db
      .from("restaurants")
      .select("id, name, slug, address, phone, gstin, tax_rate, currency")
      .eq("id", order.restaurant_id)
      .maybeSingle();

    if (restaurantError || !restaurant) {
      throw new Error("Restaurant not found");
    }

    // Tax convention & Immutable snapshot precedence:
    // If order has an immutable pricing_snapshot, use it as the single source of truth.
    // Otherwise fallback to stored order fields and recompute reconciliations.
    const snapshot = order.pricing_snapshot;
    const discountPaise = snapshot?.discount_paise ?? (order.discount_paise ?? order.discount ?? 0);
    const subtotalPaise = snapshot?.subtotal_paise ?? (order.subtotal_paise || orderItems.reduce((sum, item) => sum + item.line_total_paise, 0));
    const taxableBasePaise = snapshot?.net_subtotal_paise ?? Math.max(0, subtotalPaise - discountPaise);

    const taxRate =
      snapshot?.tax_rate_percent ??
      order.tax_rate ??
      restaurant.tax_rate ??
      (order.tax_paise && taxableBasePaise
        ? Math.round((order.tax_paise * 100) / taxableBasePaise)
        : 5);

    const totalTaxPaise = snapshot?.tax_paise ?? Math.round((taxableBasePaise * taxRate) / 100);
    const cgstPaise = Math.floor(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    const taxableValuePaise = taxableBasePaise;

    const grandTotalPaise = snapshot?.total_paise ?? order.total_paise ?? (taxableValuePaise + totalTaxPaise);

    const invoiceData: InvoiceData = {
      restaurant: {
        name: restaurant.name,
        address: restaurant.address,
        phone: restaurant.phone,
        gstin: restaurant.gstin,
        currency: restaurant.currency || "INR",
      },
      order: {
        id: order.id,
        order_number: String(order.order_number),
        table_label: order.table_label || "Counter",
        created_at: order.created_at,
        subtotal_paise: subtotalPaise,
        discount_paise: discountPaise,
        tax_paise: totalTaxPaise,
        tax_rate: taxRate,
        total_paise: grandTotalPaise,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
      },
      items: (snapshot?.items && snapshot.items.length > 0)
        ? snapshot.items.map((item: any) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price_paise: item.unit_price_paise,
            line_total_paise: item.line_total_paise,
            notes: item.notes,
          }))
        : orderItems.map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
            unit_price_paise: item.unit_price_paise,
            line_total_paise: item.line_total_paise,
            notes: item.notes,
          })),
      tax: {
        taxable_value_paise: taxableValuePaise,
        tax_rate: taxRate,
        cgst_paise: cgstPaise,
        sgst_paise: sgstPaise,
        total_tax_paise: totalTaxPaise,
      },
    };

    const pdfBuffer = generateInvoicePDF(invoiceData);

    return { pdfBuffer, invoiceData };
  }
}