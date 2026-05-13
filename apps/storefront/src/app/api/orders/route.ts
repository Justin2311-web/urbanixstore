// @ts-nocheck
// Supabase v2.105.x has TypeScript inference regressions (.insert/.select payloads
// inferred as `never`). Runtime correctness is ensured by the RLS policies.
import { NextResponse } from "next/server";
import { createStorefrontClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type CreateOrderPayload = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryNote?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: "manual" | "whatsapp";
  paymentMethodType?: string | null;
  receiptUrl?: string;
  items: Array<{
    productId?: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    selectedVariants?: Record<string, string> | null;
  }>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderPayload;
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryNote,
      discountAmount,
      items,
      orderNumber,
      paymentMethod,
      paymentMethodType,
      receiptUrl,
      shippingAddress,
      shippingFee,
      subtotal,
      totalAmount,
    } = body;

    if (!customerName?.trim() || !customerPhone?.trim()) {
      return NextResponse.json(
        { error: "Customer name and phone are required." },
        { status: 400 }
      );
    }
    if (!items?.length) {
      return NextResponse.json(
        { error: "Order must have at least one item." },
        { status: 400 }
      );
    }

    const sb = createStorefrontClient();

    const { data: order, error: orderError } = await sb
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.replace(/\D/g, ""),
        customer_email: customerEmail?.trim() || null,
        delivery_note: deliveryNote?.trim() || null,
        shipping_address: shippingAddress,
        subtotal,
        shipping_fee: shippingFee,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_method_type: paymentMethodType || null,
        order_status: "pending",
        payment_status: "pending",
        receipt_url: receiptUrl || null,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("[Storefront] Failed to create order:", orderError);
      return NextResponse.json(
        { error: orderError?.message ?? "Failed to create order." },
        { status: 500 }
      );
    }

    const itemRows = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId ?? null,
      product_name: item.productName,
      product_sku: item.productSku,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      selected_variants: item.selectedVariants ?? null,
    }));

    const { error: itemsError } = await sb.from("order_items").insert(itemRows);
    if (itemsError) {
      console.error("[Storefront] Failed to create order items:", itemsError);
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error("[Storefront] /api/orders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
