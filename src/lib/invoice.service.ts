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

    const taxRate = order.tax_paise && order.subtotal_paise
      ? Math.round((order.tax_paise * 100) / order.subtotal_paise)
      : restaurant.tax_rate || 5;

    const subtotalPaise = order.subtotal_paise || orderItems.reduce((sum, item) => sum + item.line_total_paise, 0);
    const totalTaxPaise = order.tax_paise || Math.round((subtotalPaise * taxRate) / (100 + taxRate));
    const cgstPaise = Math.round(totalTaxPaise / 2);
    const sgstPaise = totalTaxPaise - cgstPaise;
    const taxableValuePaise = subtotalPaise - totalTaxPaise;

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
        discount_paise: 0,
        tax_paise: totalTaxPaise,
        tax_rate: taxRate,
        total_paise: order.total_paise,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
      },
      items: orderItems.map((item) => ({
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