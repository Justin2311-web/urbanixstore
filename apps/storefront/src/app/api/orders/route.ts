import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createStorefrontClient } from "@/lib/supabase";
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  calculateShippingFee,
  getVariantEffectivePrice,
  malaysiaStates,
  type ProductVariantEntry,
  type UrbanixProduct,
} from "@ecommerce/shared";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import type { Database } from "@ecommerce/database";

export const dynamic = "force-dynamic";

const genericOrderError = "Unable to place order. Please check your details and try again.";
const legacyReceiptBucket = "uploads";
const privateReceiptBucket = "receipts";

type CreateOrderPayload = {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryNote?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postcode: string;
    country?: string;
  };
  paymentMethod: "manual" | "whatsapp";
  paymentMethodType?: string | null;
  // Preferred: private storage metadata returned by /api/signed-upload.
  receiptBucket?: string;
  receiptPath?: string;
  // Kept only for older clients/orders that still point at public uploads.
  receiptUrl?: string;
  items: Array<{
    productId?: string;
    quantity: number;
    selectedVariants?: Record<string, string> | null;
  }>;
};

type CreatedOrder = Pick<Database["public"]["Tables"]["orders"]["Row"], "id" | "order_number">;
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
type ProductLookupRow = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "slug">;
type QueryError = { message: string } | null;

type OrderInsertTable = {
  insert(values: OrderInsert): {
    select(columns: string): {
      single(): Promise<{ data: CreatedOrder | null; error: QueryError }>;
    };
  };
};

type OrderItemsInsertTable = {
  insert(values: OrderItemInsert[]): Promise<{ error: QueryError }>;
};

type ProductLookupTable = {
  select(columns: string): {
    in(column: string, values: string[]): Promise<{ data: ProductLookupRow[] | null; error: QueryError }>;
  };
};

type StorageListObject = {
  name: string;
};

function fail(message = genericOrderError, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function roundMoney(value: number) {
  return Number(value.toFixed(2));
}

function normalizePhoneForValidation(phone: string) {
  return phone.replace(/[\s().-]/g, "");
}

function isValidMalaysiaPhone(phone: string) {
  const normalized = normalizePhoneForValidation(phone);
  return /^(?:\+?60|0)1\d{8,9}$/.test(normalized);
}

function phoneForStorage(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeState(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function findValidState(state: string) {
  const normalized = normalizeState(state);
  return malaysiaStates.find((item) => normalizeState(item) === normalized) ?? null;
}

function safeOrderSegment(orderNumber: string) {
  return orderNumber.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "-").slice(0, 64);
}

function validateReceiptUrl(receiptUrl: string | undefined, orderNumber: string) {
  if (!receiptUrl) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error("Missing Supabase URL for receipt validation.");
  }

  const parsedReceipt = new URL(receiptUrl);
  const parsedSupabase = new URL(supabaseUrl);
  const orderSegment = safeOrderSegment(orderNumber);
  const expectedPrefix = `/storage/v1/object/public/${legacyReceiptBucket}/receipts/${orderSegment}/`;

  if (
    parsedReceipt.origin !== parsedSupabase.origin ||
    !parsedReceipt.pathname.startsWith(expectedPrefix) ||
    !/\.(?:jpe?g|png|webp|pdf)$/i.test(parsedReceipt.pathname)
  ) {
    throw new Error("Receipt URL does not match allowed storage path.");
  }

  return receiptUrl;
}

function validateReceiptPath(receiptBucket: string | undefined, receiptPath: string | undefined, orderNumber: string) {
  if (!receiptBucket || !receiptPath) return null;

  if (receiptBucket !== privateReceiptBucket) {
    throw new Error("Receipt bucket does not match private receipt storage.");
  }

  const orderSegment = safeOrderSegment(orderNumber);
  const normalizedPath = receiptPath.trim();
  const expectedPrefix = `orders/${orderSegment}/`;

  if (
    !normalizedPath.startsWith(expectedPrefix) ||
    normalizedPath.length > 256 ||
    normalizedPath.includes("..") ||
    !/^[a-zA-Z0-9/_.-]+$/.test(normalizedPath) ||
    !/\.(?:jpe?g|png|webp|pdf)$/i.test(normalizedPath)
  ) {
    throw new Error("Receipt path does not match allowed storage path.");
  }

  return { bucket: receiptBucket, path: normalizedPath };
}

function createAdminStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key for receipt verification.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function verifyReceiptObjectExists(receipt: { bucket: string; path: string }) {
  const lastSlash = receipt.path.lastIndexOf("/");
  const directory = lastSlash >= 0 ? receipt.path.slice(0, lastSlash) : "";
  const fileName = lastSlash >= 0 ? receipt.path.slice(lastSlash + 1) : receipt.path;

  if (!fileName) return false;

  const sb = createAdminStorageClient();
  const { data, error } = await sb.storage
    .from(receipt.bucket)
    .list(directory, {
      limit: 1,
      search: fileName,
    });

  if (error) {
    console.error("[Storefront] Receipt object verification failed:", error);
    throw new Error("Receipt object verification failed.");
  }

  return (data as StorageListObject[] | null)?.some((object) => object.name === fileName) ?? false;
}

function resolveVariant(product: UrbanixProduct, selectedVariants?: Record<string, string> | null) {
  if (!product.variants?.length) {
    return {
      displaySku: product.sku,
      stockQuantity: product.stockQuantity ?? 0,
      unitPrice: product.price,
      variant: null,
    };
  }

  const selectedName = selectedVariants?.variant;
  const variant = selectedName
    ? product.variants.find((item) => item.name === selectedName)
    : product.variants[0];

  if (!variant) {
    throw new Error("Invalid selected variant.");
  }

  const pricing = getVariantEffectivePrice(variant as ProductVariantEntry);
  return {
    displaySku: variant.sku,
    stockQuantity: variant.stockQuantity,
    unitPrice: pricing.price,
    variant,
  };
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = await rateLimit({
      key: `orders:ip:${ip}`,
      limit: 10,
      windowSeconds: 60,
    });
    if (!ipLimit.ok) {
      return rateLimitResponse(
        ipLimit,
        "Too many order attempts. Please wait a moment and try again."
      );
    }

    const body = (await request.json()) as CreateOrderPayload;

    const phoneDigits = phoneForStorage(body.customerPhone ?? "");
    if (phoneDigits) {
      const phoneLimit = await rateLimit({
        key: `orders:phone:${phoneDigits}`,
        limit: 5,
        windowSeconds: 300,
      });
      if (!phoneLimit.ok) {
        return rateLimitResponse(
          phoneLimit,
          "Too many order attempts for this phone number. Please wait a few minutes."
        );
      }
    }
    const {
      customerName,
      customerPhone,
      customerEmail,
      deliveryNote,
      items,
      orderNumber,
      paymentMethod,
      paymentMethodType,
      receiptBucket,
      receiptPath,
      receiptUrl,
      shippingAddress,
    } = body;

    if (!customerName?.trim()) return fail("Customer name is required.");
    if (!customerPhone?.trim() || !isValidMalaysiaPhone(customerPhone)) {
      return fail("Enter a valid Malaysia phone number.");
    }
    if (!shippingAddress?.addressLine1?.trim()) return fail("Shipping address is required.");
    if (!shippingAddress?.city?.trim()) return fail("City is required.");
    if (!shippingAddress?.postcode?.trim()) return fail("Postcode is required.");
    if (!shippingAddress?.state?.trim()) return fail("State is required to calculate shipping.");

    const validState = findValidState(shippingAddress.state);
    if (!validState) return fail("Select a valid Malaysia state.");
    if (!items?.length) return fail("Order must have at least one item.");

    if (!receiptPath?.trim() && !receiptUrl?.trim()) {
      return fail("Please upload your payment receipt before placing the order.");
    }

    let validatedReceipt: { bucket: string; path: string } | null = null;
    let validatedReceiptUrl: string | null = null;
    try {
      validatedReceipt = validateReceiptPath(receiptBucket, receiptPath, orderNumber);
      // receiptUrl is accepted only as a legacy fallback for older clients.
      if (!validatedReceipt) {
        validatedReceiptUrl = validateReceiptUrl(receiptUrl, orderNumber);
      }
    } catch (error) {
      console.warn("[Storefront] Rejected receipt reference:", error);
      return fail("Invalid receipt reference.");
    }

    if (!validatedReceipt && !validatedReceiptUrl) {
      return fail("Please upload your payment receipt before placing the order.");
    }

    if (validatedReceipt) {
      try {
        const receiptExists = await verifyReceiptObjectExists(validatedReceipt);
        if (!receiptExists) {
          return fail("Please upload your payment receipt before placing the order.");
        }
      } catch (error) {
        console.error("[Storefront] Receipt verification error:", error);
        return fail(genericOrderError, 500);
      }
    }

    const data = await readUrbanixStoreDataAsync();
    const products = listStorefrontProducts(data);
    const productMap = new Map(products.map((product) => [product.id, product]));

    const sb = createStorefrontClient();
    const productSlugs = [...new Set(items.map((item) => item.productId).filter((id): id is string => Boolean(id)))];
    const productUuidBySlug = new Map<string, string>();

    if (productSlugs.length > 0) {
      const productTable = sb.from("products") as unknown as ProductLookupTable;
      const { data: rows, error } = await productTable.select("id, slug").in("slug", productSlugs);
      if (error) {
        console.error("[Storefront] Product lookup failed:", error);
        return fail(genericOrderError, 500);
      }
      for (const row of rows ?? []) {
        productUuidBySlug.set(row.slug, row.id);
      }
    }

    const orderItems: OrderItemInsert[] = [];
    let serverSubtotal = 0;

    for (const item of items) {
      if (!item.productId) return fail("Invalid cart item.");
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 99) {
        return fail("Invalid item quantity.");
      }

      const product = productMap.get(item.productId);
      if (!product || product.status === "inactive" || product.isActive === false) {
        return fail("One or more products are unavailable.");
      }

      let resolved: ReturnType<typeof resolveVariant>;
      try {
        resolved = resolveVariant(product, item.selectedVariants);
      } catch {
        return fail("Invalid product variant.");
      }

      if (resolved.stockQuantity <= 0 || item.quantity > resolved.stockQuantity) {
        return fail("One or more items are out of stock.");
      }

      const lineTotal = roundMoney(resolved.unitPrice * item.quantity);
      serverSubtotal = roundMoney(serverSubtotal + lineTotal);

      orderItems.push({
        order_id: "",
        product_id: productUuidBySlug.get(product.id) ?? null,
        product_name: product.name,
        product_sku: resolved.displaySku,
        quantity: item.quantity,
        unit_price: resolved.unitPrice,
        total_price: lineTotal,
        selected_variants: item.selectedVariants ?? null,
      });
    }

    // No automatic discount yet. A promotion engine (codes / campaigns) is pending.
    // Keep this at 0 so the server total matches calculateOrderTotals on the client.
    const serverDiscountAmount = 0;
    const shipping = calculateShippingFee({
      settings: data.settings,
      state: validState,
      subtotal: serverSubtotal,
    });
    const serverTotalAmount = Math.max(0, roundMoney(serverSubtotal - serverDiscountAmount + shipping.fee));

    const ordersTable = sb.from("orders") as unknown as OrderInsertTable;
    const orderItemsTable = sb.from("order_items") as unknown as OrderItemsInsertTable;

    const { data: order, error: orderError } = await ordersTable
      .insert({
        order_number: orderNumber,
        customer_name: customerName.trim(),
        customer_phone: phoneForStorage(customerPhone),
        customer_email: customerEmail?.trim() || null,
        delivery_note: deliveryNote?.trim() || null,
        shipping_address: {
          ...shippingAddress,
          country: shippingAddress.country || "Malaysia",
          state: validState,
        },
        subtotal: serverSubtotal,
        shipping_fee: shipping.fee,
        shipping_region: shipping.region,
        free_shipping_threshold: shipping.freeShippingThreshold ?? null,
        is_free_shipping_applied: shipping.isFreeShippingApplied,
        discount_amount: serverDiscountAmount,
        total_amount: serverTotalAmount,
        payment_method: paymentMethod,
        payment_method_type: paymentMethodType || null,
        order_status: "pending",
        payment_status: "pending",
        receipt_bucket: validatedReceipt?.bucket ?? null,
        receipt_path: validatedReceipt?.path ?? null,
        receipt_public_url_legacy: validatedReceiptUrl,
        receipt_uploaded_at: new Date().toISOString(),
        receipt_url: validatedReceiptUrl,
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("[Storefront] Failed to create order:", orderError);
      return fail(genericOrderError, 500);
    }

    const { error: itemsError } = await orderItemsTable.insert(
      orderItems.map((item) => ({ ...item, order_id: order.id }))
    );
    if (itemsError) {
      console.error("[Storefront] Failed to create order items:", itemsError);
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totals: {
        discountAmount: serverDiscountAmount,
        freeShippingThreshold: shipping.freeShippingThreshold ?? null,
        isFreeShippingApplied: shipping.isFreeShippingApplied,
        shippingFee: shipping.fee,
        shippingRegion: shipping.region,
        subtotal: serverSubtotal,
        totalAmount: serverTotalAmount,
      },
    });
  } catch (error) {
    console.error("[Storefront] /api/orders error:", error);
    return fail(genericOrderError, 500);
  }
}
