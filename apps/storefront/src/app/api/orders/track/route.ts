// @ts-nocheck
// Supabase v2.105.x TypeScript inference regression — see orders/route.ts
import { NextResponse } from "next/server";
import { createStorefrontClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order_number")?.trim().toUpperCase();
    const phone = searchParams.get("phone")?.replace(/\D/g, "");

    if (!orderNumber && !phone) {
      return NextResponse.json(
        { error: "Provide an order number or phone number to track." },
        { status: 400 }
      );
    }

    const sb = createStorefrontClient();

    let query = sb
      .from("orders")
      .select(
        "id, order_number, customer_name, created_at, order_status, payment_status, tracking_number, courier, receipt_url, subtotal, shipping_fee, total_amount, order_items(product_name, product_sku, quantity, unit_price, total_price, selected_variants)"
      )
      .order("created_at", { ascending: false });

    if (orderNumber && phone) {
      query = query.eq("order_number", orderNumber).eq("customer_phone", phone);
    } else if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    } else if (phone) {
      query = query.eq("customer_phone", phone).limit(5);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Storefront] /api/orders/track error:", error);
      return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No order found." }, { status: 404 });
    }

    const safe = data.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      createdAt: order.created_at,
      orderStatus: order.order_status,
      paymentStatus: order.payment_status,
      trackingNumber: order.tracking_number,
      courier: order.courier,
      hasReceipt: Boolean(order.receipt_url),
      subtotal: order.subtotal,
      shippingFee: order.shipping_fee,
      totalAmount: order.total_amount,
      items: (order.order_items as Array<{
        product_name: string;
        product_sku: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        selected_variants?: Record<string, string> | null;
      }>).map((item) => ({
        productName: item.product_name,
        productSku: item.product_sku,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        selectedVariants: item.selected_variants ?? null,
      })),
    }));

    return NextResponse.json({ orders: safe });
  } catch (error) {
    console.error("[Storefront] /api/orders/track error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
