import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { Database, Json } from "@ecommerce/database";

export const dynamic = "force-dynamic";

const genericLookupError = "Order not found. Please check your order number and phone number.";

type OrderRow = Pick<
  Database["public"]["Tables"]["orders"]["Row"],
  | "id"
  | "order_number"
  | "created_at"
  | "order_status"
  | "payment_status"
  | "tracking_number"
  | "courier"
  | "receipt_path"
  | "receipt_url"
  | "subtotal"
  | "shipping_fee"
  | "discount_amount"
  | "total_amount"
  | "customer_phone"
>;

type OrderItemRow = Pick<
  Database["public"]["Tables"]["order_items"]["Row"],
  "product_name" | "product_sku" | "quantity" | "unit_price" | "total_price" | "selected_variants"
>;

type OrderLookupTable = {
  select(columns: string): {
    eq(column: string, value: string): {
      in(column: string, values: string[]): {
        maybeSingle(): Promise<{ data: OrderRow | null; error: { message: string } | null }>;
      };
    };
  };
};

type OrderItemsLookupTable = {
  select(columns: string): {
    eq(column: string, value: string): {
      order(column: string, options: { ascending: boolean }): Promise<{
        data: OrderItemRow[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

function fail(status = 404) {
  return NextResponse.json({ error: genericLookupError }, { status });
}

function createOrderLookupClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key for order tracking.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizeOrderNumber(value: string | null) {
  const normalized = value?.trim().toUpperCase() ?? "";
  if (!/^[A-Z0-9-]{4,64}$/.test(normalized)) return null;
  return normalized;
}

function normalizePhoneDigits(value: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function phoneCandidates(value: string | null) {
  const digits = normalizePhoneDigits(value);
  if (!/^(?:0?1\d{8,9}|601\d{8,9})$/.test(digits)) return [];

  const candidates = new Set<string>([digits]);
  if (digits.startsWith("60")) {
    candidates.add(`0${digits.slice(2)}`);
  } else if (digits.startsWith("0")) {
    candidates.add(`6${digits}`);
  }

  return [...candidates];
}

function isPhoneMatch(storedPhone: string, candidates: string[]) {
  const storedDigits = normalizePhoneDigits(storedPhone);
  return candidates.includes(storedDigits);
}

function selectedVariantsForResponse(value: Json | null) {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;

  const entries = Object.entries(value).filter(
    (entry): entry is [string, string] =>
      typeof entry[0] === "string" && typeof entry[1] === "string"
  );

  return entries.length ? Object.fromEntries(entries) : null;
}

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await rateLimit({
      key: `track:ip:${ip}`,
      limit: 30,
      windowSeconds: 60,
    });
    if (!ipLimit.ok) {
      return new Response(
        JSON.stringify({ error: "Too many lookups. Please wait a moment and try again." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(ipLimit.resetSeconds),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderNumber = normalizeOrderNumber(searchParams.get("order_number"));
    const phones = phoneCandidates(searchParams.get("phone"));

    if (!orderNumber || phones.length === 0) return fail(400);

    const orderLimit = await rateLimit({
      key: `track:order:${orderNumber}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (!orderLimit.ok) {
      return rateLimitResponse(
        orderLimit,
        "Too many lookups for this order. Please wait a moment and try again."
      );
    }

    const sb = createOrderLookupClient();
    const ordersTable = sb.from("orders") as unknown as OrderLookupTable;
    const orderItemsTable = sb.from("order_items") as unknown as OrderItemsLookupTable;

    const { data: order, error: orderError } = await ordersTable
      .select(
        "id, order_number, created_at, order_status, payment_status, tracking_number, courier, receipt_path, receipt_url, subtotal, shipping_fee, discount_amount, total_amount, customer_phone"
      )
      .eq("order_number", orderNumber)
      .in("customer_phone", phones)
      .maybeSingle();

    if (orderError) {
      console.error("[Storefront] /api/orders/track order lookup error:", orderError);
      return fail(500);
    }

    if (!order || !isPhoneMatch(order.customer_phone, phones)) return fail();

    const { data: orderItems, error: itemsError } = await orderItemsTable
      .select("product_name, product_sku, quantity, unit_price, total_price, selected_variants")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    if (itemsError) {
      console.error("[Storefront] /api/orders/track item lookup error:", itemsError);
      return fail(500);
    }

    return NextResponse.json({
      order: {
        orderNumber: order.order_number,
        createdAt: order.created_at,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
        trackingNumber: order.tracking_number,
        courier: order.courier,
        hasReceipt: Boolean(order.receipt_path || order.receipt_url),
        subtotal: order.subtotal,
        shippingFee: order.shipping_fee,
        discountAmount: order.discount_amount,
        totalAmount: order.total_amount,
        items: (orderItems ?? []).map((item) => ({
          productName: item.product_name,
          productSku: item.product_sku,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          selectedVariants: selectedVariantsForResponse(item.selected_variants),
        })),
      },
    });
  } catch (error) {
    console.error("[Storefront] /api/orders/track error:", error);
    return fail(500);
  }
}
