// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// Supabase v2.105.x has TypeScript inference regressions (.update/.insert/.upsert
// payloads inferred as `never`). Disabling strict-TS for this server-actions file
// only — runtime safety is ensured by server-side validation, not by TS types here.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase";
import { fd, fdBool, fdLines, fdNum, slugify } from "@/lib/utils";

// ─── STORAGE: signed upload URLs ──────────────────────────────────────────────
// Client components call this to get a short-lived signed URL, then PUT the
// file directly to Supabase Storage — never through Vercel's 4.5 MB body limit.

export async function createSignedUploadUrl(
  bucket: string,
  filePath: string
): Promise<{ signedUrl: string; publicUrl: string }> {
  const sb = createAdminClient();

  const { data, error } = await sb.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    throw new Error(
      `Failed to create upload URL: ${error?.message ?? "Unknown error"}`
    );
  }

  const { data: urlData } = sb.storage.from(bucket).getPublicUrl(filePath);

  return {
    signedUrl: data.signedUrl,
    publicUrl: urlData.publicUrl,
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function revalidateStorefront() {
  const storefrontUrl =
    process.env.STOREFRONT_URL ??
    process.env.NEXT_PUBLIC_STOREFRONT_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://urbanix-storefront.vercel.app";
  const secret = process.env.REVALIDATE_SECRET;
  if (storefrontUrl && secret) {
    try {
      await fetch(`${storefrontUrl}/api/revalidate?secret=${secret}`, {
        method: "POST",
        cache: "no-store",
      });
    } catch (e) {
      console.error("[Admin] revalidateStorefront failed:", e);
    }
  }
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function saveCategory(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id"); // UUID if editing, empty if creating
  const name = fd(formData, "name");
  const slug = fd(formData, "slug") || slugify(name);
  const description = fd(formData, "description");
  const sort_order = fdNum(formData, "sort_order") || 1;
  const is_active = fdBool(formData, "is_active");
  const tone = fd(formData, "tone") || "mint";
  const image_url = fd(formData, "image_url") || null;
  const name_en = fd(formData, "name_en") || name || null;
  const name_zh = fd(formData, "name_zh") || null;
  const name_ms = fd(formData, "name_ms") || null;
  const description_en = fd(formData, "description_en") || description || null;
  const description_zh = fd(formData, "description_zh") || null;
  const description_ms = fd(formData, "description_ms") || null;
  const image_url_en = fd(formData, "image_url_en") || image_url || null;
  const image_url_zh = fd(formData, "image_url_zh") || null;
  const image_url_ms = fd(formData, "image_url_ms") || null;

  if (!name || !slug) {
    redirect("/categories?saveError=Name+and+slug+are+required");
  }

  const { data: existingCategory } = id
    ? await sb
        .from("categories")
        .select("name_en,name_zh,name_ms,description_en,description_zh,description_ms,image_url_en,image_url_zh,image_url_ms")
        .eq("id", id)
        .maybeSingle()
    : { data: null };

  const payload = {
    name,
    slug,
    description: description || null,
    description_en: description_en ?? existingCategory?.description_en ?? null,
    description_zh: description_zh ?? existingCategory?.description_zh ?? null,
    description_ms: description_ms ?? existingCategory?.description_ms ?? null,
    sort_order,
    is_active,
    tone,
    image_url,
    image_url_en: image_url_en ?? existingCategory?.image_url_en ?? null,
    image_url_zh: image_url_zh ?? existingCategory?.image_url_zh ?? null,
    image_url_ms: image_url_ms ?? existingCategory?.image_url_ms ?? null,
    name_en: name_en ?? existingCategory?.name_en ?? name,
    name_zh: name_zh ?? existingCategory?.name_zh ?? null,
    name_ms: name_ms ?? existingCategory?.name_ms ?? null,
  };

  let error;
  if (id) {
    // Update existing
    ({ error } = await sb.from("categories").update(payload).eq("id", id));
  } else {
    // Insert new
    ({ error } = await sb.from("categories").insert(payload));
  }

  if (error) {
    console.error("[Admin] saveCategory error:", error);
    redirect(
      `/categories?saveError=${encodeURIComponent(error.message)}`
    );
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/categories?saved=1");
}

export async function deleteCategory(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");

  if (!id) redirect("/categories?saveError=Missing+category+ID");

  const { error } = await sb.from("categories").delete().eq("id", id);

  if (error) {
    console.error("[Admin] deleteCategory error:", error);
    redirect(
      `/categories?saveError=${encodeURIComponent(error.message)}`
    );
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/categories?saved=1");
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────

async function getProductImageUrls(
  formData: FormData,
  existingUrls: string[]
): Promise<string[]> {
  const urls: string[] = [];

  // All image URLs are already uploaded client-side and submitted as hidden inputs.
  const keptCount = fdNum(formData, "kept_image_count");
  for (let i = 0; i < keptCount; i++) {
    const url = fd(formData, `kept_image_${i}`);
    if (url) urls.push(url);
  }

  // If nothing was provided, keep existing
  if (urls.length === 0) return existingUrls;

  return urls.slice(0, 9);
}

async function syncProductImages(
  productId: string,
  imageUrls: string[]
) {
  const sb = createAdminClient();

  // Delete all existing images for this product
  await sb.from("product_images").delete().eq("product_id", productId);

  if (imageUrls.length === 0) return;

  // Insert new images
  const rows = imageUrls.map((image_url, index) => ({
    product_id: productId,
    image_url,
    is_primary: index === 0,
    sort_order: index,
    alt_text: null,
  }));

  const { error } = await sb.from("product_images").insert(rows);
  if (error) {
    console.error("[Admin] syncProductImages error:", error);
    throw new Error(error.message);
  }
}

export async function saveProduct(formData: FormData) {
  const sb = createAdminClient();

  const productDbId = fd(formData, "product_db_id"); // UUID from DB — empty when creating
  const submittedName = fd(formData, "name");
  const submittedNameEn = fd(formData, "name_en");
  const name = submittedNameEn || submittedName;
  const sku = fd(formData, "sku");
  const slug = fd(formData, "slug") || slugify(name);
  const category_id = fd(formData, "category_id") || null; // UUID from category dropdown
  const is_active = fdBool(formData, "is_active");
  const is_featured = fdBool(formData, "is_featured");
  // ── Multilingual fields ───────────────────────────────────────────────────
  const name_en = name || null;
  const name_zh = fd(formData, "name_zh") || null;
  const name_ms = fd(formData, "name_ms") || null;
  const short_description = fd(formData, "short_description_en") || fd(formData, "short_description") || null;
  const short_description_en = fd(formData, "short_description_en") || null;
  const short_description_zh = fd(formData, "short_description_zh") || null;
  const short_description_ms = fd(formData, "short_description_ms") || null;
  const description = fd(formData, "description_en") || fd(formData, "description") || null;
  const description_en = fd(formData, "description_en") || null;
  const description_zh = fd(formData, "description_zh") || null;
  const description_ms = fd(formData, "description_ms") || null;
  // ─────────────────────────────────────────────────────────────────────────
  // Multilingual highlights
  const highlights_en = fdLines(formData, "highlights_en");
  const highlights_zh = fdLines(formData, "highlights_zh");
  const highlights_ms = fdLines(formData, "highlights_ms");
  // Multilingual specifications
  const specs_en = fdLines(formData, "specifications_en");
  const specs_zh = fdLines(formData, "specifications_zh");
  const specs_ms = fdLines(formData, "specifications_ms");

  // Build multilingual JSONB — if all are empty, fall back to flat highlights for backward compat
  const highlightsPayload = (highlights_en.length > 0 || highlights_zh.length > 0 || highlights_ms.length > 0)
    ? { en: highlights_en, zh: highlights_zh, ms: highlights_ms }
    : fdLines(formData, "highlights");

  const specsPayload = (specs_en.length > 0 || specs_zh.length > 0 || specs_ms.length > 0)
    ? { en: specs_en, zh: specs_zh, ms: specs_ms }
    : fdLines(formData, "specifications");

  const shipping_info = fd(formData, "shipping_info") || null;
  const rating = fdNum(formData, "rating") || null;

  // ── Per-variant pricing entries (new format) ──────────────────────────────
  // Submitted as a JSON array from the hidden input "variant_entries":
  // [{"name":"Black","sku":"URB-BLK","originalPrice":49.90,"promotionPrice":39.90,"stockQuantity":10},...]
  type VariantEntryPayload = {
    name: string;
    localizedName?: { en: string; zh?: string; ms?: string };
    groupName?: string;
    localizedGroupName?: { en: string; zh?: string; ms?: string };
    sku: string;
    originalPrice: number;
    promotionPrice: number | null;
    stockQuantity: number;
    imageUrl?: string;
  };

  const variantEntriesRaw = fd(formData, "variant_entries");
  let variantEntries: VariantEntryPayload[] = [];
  if (variantEntriesRaw) {
    try {
      variantEntries = JSON.parse(variantEntriesRaw) as VariantEntryPayload[];
    } catch {
      // Invalid JSON — treat as no entries
    }
  }

  if (!name) redirect("/products?saveError=Product+name+is+required");
  if (!sku) redirect("/products?saveError=SKU+is+required");
  if (!slug) redirect("/products?saveError=Slug+is+required");
  if (variantEntries.length === 0) {
    redirect("/products?saveError=At+least+one+variant+with+pricing+is+required");
  }

  // Derive product-level price/stock/sku from the first variant for backward compatibility
  // (DB columns kept for fallback; source of truth is now product_variants JSONB)
  const firstVariant = variantEntries[0];
  const price = firstVariant.originalPrice;
  const promotion_price = firstVariant.promotionPrice && firstVariant.promotionPrice > 0
    ? firstVariant.promotionPrice
    : null;
  const stock_quantity = firstVariant.stockQuantity;

  const { data: existingProduct } = productDbId
    ? await sb
        .from("products")
        .select("name,name_en,name_zh,name_ms,short_description,short_description_en,short_description_zh,short_description_ms,description,description_en,description_zh,description_ms,highlights,specifications,shipping_info,rating,main_image_url,main_image_url_en,main_image_url_zh,main_image_url_ms,product_variants")
        .eq("id", productDbId)
        .maybeSingle()
    : { data: null };

  const payload = {
    name: name_en || existingProduct?.name_en || existingProduct?.name || name,
    name_en: name_en || existingProduct?.name_en || existingProduct?.name || name,
    name_zh: name_zh || existingProduct?.name_zh || null,
    name_ms: name_ms || existingProduct?.name_ms || null,
    sku,
    slug,
    category_id: category_id || null,
    // Legacy columns — kept in sync with first variant for any old code that still reads them
    price,
    promotion_price,
    promotion_start_at: null,
    promotion_end_at: null,
    stock_quantity,
    is_active,
    is_featured,
    short_description: short_description || existingProduct?.short_description || null,
    short_description_en: short_description_en || existingProduct?.short_description_en || existingProduct?.short_description || null,
    short_description_zh: short_description_zh || existingProduct?.short_description_zh || null,
    short_description_ms: short_description_ms || existingProduct?.short_description_ms || null,
    description: description || existingProduct?.description || null,
    description_en: description_en || existingProduct?.description_en || existingProduct?.description || null,
    description_zh: description_zh || existingProduct?.description_zh || null,
    description_ms: description_ms || existingProduct?.description_ms || null,
    highlights: (Array.isArray(highlightsPayload) && highlightsPayload.length === 0 ? existingProduct?.highlights ?? [] : highlightsPayload) as unknown as import("@ecommerce/database").Database["public"]["Tables"]["products"]["Row"]["highlights"],
    specifications: (Array.isArray(specsPayload) && specsPayload.length === 0 ? existingProduct?.specifications ?? [] : specsPayload) as unknown as import("@ecommerce/database").Database["public"]["Tables"]["products"]["Row"]["specifications"],
    shipping_info: shipping_info || existingProduct?.shipping_info || null,
    rating: rating || existingProduct?.rating || null,
    // Store the full new-format variant array in product_variants JSONB
    product_variants: variantEntries.length > 0
      ? variantEntries as unknown as import("@ecommerce/database").Database["public"]["Tables"]["products"]["Row"]["product_variants"]
      : existingProduct?.product_variants ?? null,
  };

  let finalProductId = productDbId;

  if (productDbId) {
    // Update existing product
    const { error } = await sb
      .from("products")
      .update(payload)
      .eq("id", productDbId);

    if (error) {
      console.error("[Admin] saveProduct update error:", error);
      redirect(
        `/products/${productDbId}/edit?saveError=${encodeURIComponent(error.message)}`
      );
    }
  } else {
    // Insert new product
    const { data, error } = await sb
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("[Admin] saveProduct insert error:", error);
      redirect(
        `/products/new?saveError=${encodeURIComponent(error.message)}`
      );
    }

    finalProductId = data.id;
  }

  // Sync images
  const existingImages: string[] = [];
  if (productDbId) {
    const { data: imgs } = await sb
      .from("product_images")
      .select("image_url")
      .eq("product_id", productDbId)
      .order("sort_order");
    existingImages.push(...(imgs ?? []).map((i) => i.image_url));
  }

  try {
    const imageUrls = await getProductImageUrls(formData, existingImages);
    await syncProductImages(finalProductId, imageUrls);

    // Also update main_image_url on the product row
    if (imageUrls.length > 0) {
      await sb
        .from("products")
        .update({ main_image_url: imageUrls[0] })
        .eq("id", finalProductId);
    }

    // Per-language image URL arrays (stored as JSON strings in TEXT columns)
    // Only update if the form submitted data for that language — NON-DESTRUCTIVE
    const imageUrlsEnRaw = fd(formData, "image_urls_en");
    const imageUrlsZhRaw = fd(formData, "image_urls_zh");
    const imageUrlsMsRaw = fd(formData, "image_urls_ms");

    const langImageUpdate: Record<string, string | null> = {};
    if (imageUrlsEnRaw && imageUrlsEnRaw !== "[]") langImageUpdate["main_image_url_en"] = imageUrlsEnRaw;
    if (imageUrlsZhRaw && imageUrlsZhRaw !== "[]") langImageUpdate["main_image_url_zh"] = imageUrlsZhRaw;
    if (imageUrlsMsRaw && imageUrlsMsRaw !== "[]") langImageUpdate["main_image_url_ms"] = imageUrlsMsRaw;

    if (Object.keys(langImageUpdate).length > 0) {
      await sb.from("products").update(langImageUpdate).eq("id", finalProductId);
    }
  } catch (e) {
    console.error("[Admin] Image sync failed:", e);
    // Don't fail the whole save — product was saved, just images failed
  }

  revalidateAll();
  await revalidateStorefront();
  redirect(`/products/${finalProductId}/edit?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");

  if (!id) redirect("/products?saveError=Missing+product+ID");

  // Images will cascade-delete if FK has ON DELETE CASCADE; otherwise delete explicitly
  await sb.from("product_images").delete().eq("product_id", id);

  const { error } = await sb.from("products").delete().eq("id", id);

  if (error) {
    console.error("[Admin] deleteProduct error:", error);
    redirect(`/products?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/products?saved=1");
}

// ─── PROMOTION BANNERS ────────────────────────────────────────────────────────

export async function savePromotionBanner(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");
  const title = fd(formData, "title");
  const subtitle = fd(formData, "subtitle") || null;
  const cta_text = fd(formData, "cta_text") || null;
  const target_url = fd(formData, "target_url") || null;
  const sort_order = fdNum(formData, "sort_order") || 1;
  const is_active = fdBool(formData, "is_active");
  const title_en = fd(formData, "title_en") || title || null;
  const title_zh = fd(formData, "title_zh") || null;
  const title_ms = fd(formData, "title_ms") || null;
  const cta_text_en = fd(formData, "cta_text_en") || cta_text || null;
  const cta_text_zh = fd(formData, "cta_text_zh") || null;
  const cta_text_ms = fd(formData, "cta_text_ms") || null;

  if (!title) redirect("/cms?saveError=Banner+title+is+required");

  // Image URLs are submitted directly (uploaded client-side via signed URL)
  const desktop_image_url = fd(formData, "desktop_image_url") || null;
  const mobile_image_url = fd(formData, "mobile_image_url") || null;

  const payload = {
    title,
    subtitle,
    cta_text,
    target_url,
    sort_order,
    is_active,
    desktop_image_url,
    mobile_image_url,
    title_en,
    title_zh,
    title_ms,
    cta_text_en,
    cta_text_zh,
    cta_text_ms,
  };

  let error;
  if (id) {
    ({ error } = await sb.from("promotion_banners").update(payload).eq("id", id));
  } else {
    ({ error } = await sb.from("promotion_banners").insert(payload));
  }

  if (error) {
    console.error("[Admin] savePromotionBanner error:", error);
    redirect(`/cms?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/cms?saved=1");
}

export async function deletePromotionBanner(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");

  if (!id) redirect("/cms?saveError=Missing+banner+ID");

  const { error } = await sb.from("promotion_banners").delete().eq("id", id);

  if (error) {
    console.error("[Admin] deletePromotionBanner error:", error);
    redirect(`/cms?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/cms?saved=1");
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────

export async function updateOrderStatus(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");
  const order_status = fd(formData, "order_status") as
    | "pending"
    | "processing"
    | "shipped"
    | "completed"
    | "cancelled";
  const payment_status = fd(formData, "payment_status") as
    | "pending"
    | "unpaid"
    | "paid"
    | "failed"
    | "refunded";
  const courier = fd(formData, "courier") || null;
  const tracking_number = fd(formData, "tracking_number") || null;

  if (!id) redirect("/orders?saveError=Missing+order+ID");

  const { error } = await sb
    .from("orders")
    .update({ order_status, payment_status, courier, tracking_number })
    .eq("id", id);

  if (error) {
    console.error("[Admin] updateOrderStatus error:", error);
    redirect(`/orders/${id}?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
  redirect(`/orders/${id}?saved=1`);
}

// ─── INVENTORY ────────────────────────────────────────────────────────────────

export async function saveInventory(formData: FormData) {
  const sb = createAdminClient();

  // Get all product IDs from the form
  const productIds = formData
    .getAll("product_id")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const errors: string[] = [];

  await Promise.all(
    productIds.map(async (productId) => {
      const qty = fdNum(formData, `stock_${productId}`);
      const { error } = await sb
        .from("products")
        .update({ stock_quantity: Math.max(0, qty) })
        .eq("id", productId);
      if (error) {
        console.error(`[Admin] saveInventory error for ${productId}:`, error);
        errors.push(error.message);
      }
    })
  );

  revalidateAll();
  await revalidateStorefront();

  if (errors.length > 0) {
    redirect(
      `/inventory?saveError=${encodeURIComponent(errors[0])}`
    );
  }

  redirect("/inventory?saved=1");
}

// ─── CMS / BANNERS ────────────────────────────────────────────────────────────

// FINANCIAL REPORT

const expenseCategories = new Set([
  "Product Cost",
  "Shipping / Logistics",
  "Advertising",
  "Packaging",
  "Platform Fee",
  "Software / Tools",
  "SSM / Business Registration",
  "Sample / Testing Product",
  "Office / Misc",
  "Other",
]);

const revenueSources = new Set([
  "Website",
  "Shopee",
  "Lazada",
  "TikTok Shop",
  "Manual / Offline",
  "Other",
]);

function financeRedirect(message: string) {
  redirect(`/financial-report?saveError=${encodeURIComponent(message)}`);
}

function financeAmount(formData: FormData, key: string) {
  const value = fdNum(formData, key);
  if (!Number.isFinite(value) || value < 0) {
    financeRedirect("Amount must be a valid non-negative number");
  }
  return value;
}

function optionalUuid(value: string, label: string) {
  if (!value) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    financeRedirect(`${label} must be a website order UUID. Use Platform order ID for Shopee, Lazada, or TikTok Shop order numbers.`);
  }
  return value;
}

export async function saveFinanceExpense(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");
  const title = fd(formData, "title");
  const category = fd(formData, "category");
  const amount = financeAmount(formData, "amount");
  const expense_date = fd(formData, "expense_date");

  if (!title) financeRedirect("Expense title is required");
  if (!expenseCategories.has(category)) financeRedirect("Expense category is required");
  if (!expense_date) financeRedirect("Expense date is required");

  const payload = {
    amount,
    attachment_url: fd(formData, "attachment_url") || null,
    category,
    currency: fd(formData, "currency") || "MYR",
    expense_date,
    notes: fd(formData, "notes") || null,
    payment_method: fd(formData, "payment_method") || null,
    title,
  };

  const result = id
    ? await sb.from("finance_expenses").update(payload).eq("id", id)
    : await sb.from("finance_expenses").insert(payload);

  if (result.error) {
    console.error("[Admin] saveFinanceExpense error:", result.error);
    financeRedirect(result.error.message);
  }

  revalidatePath("/financial-report");
  redirect("/financial-report?saved=1");
}

export async function deleteFinanceExpense(formData: FormData) {
  const id = fd(formData, "id");
  if (!id) financeRedirect("Missing expense ID");

  const { error } = await createAdminClient().from("finance_expenses").delete().eq("id", id);
  if (error) {
    console.error("[Admin] deleteFinanceExpense error:", error);
    financeRedirect(error.message);
  }

  revalidatePath("/financial-report");
  redirect("/financial-report?saved=1");
}

export async function saveFinanceRevenue(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");
  const title = fd(formData, "title");
  const source = fd(formData, "source");
  const amount = financeAmount(formData, "amount");
  const revenue_date = fd(formData, "revenue_date");
  const related_order_id = optionalUuid(fd(formData, "related_order_id"), "Related website order ID");
  const platform_order_id = fd(formData, "platform_order_id");

  if (!title) financeRedirect("Revenue title is required");
  if (!revenueSources.has(source)) financeRedirect("Revenue source is required");
  if (!revenue_date) financeRedirect("Revenue date is required");
  if (platform_order_id.length > 120) financeRedirect("Platform order ID must be 120 characters or less");

  const payload = {
    amount,
    currency: fd(formData, "currency") || "MYR",
    notes: fd(formData, "notes") || null,
    platform_order_id: platform_order_id || null,
    related_order_id,
    revenue_date,
    source,
    title,
  };

  const result = id
    ? await sb.from("finance_revenue").update(payload).eq("id", id)
    : await sb.from("finance_revenue").insert(payload);

  if (result.error) {
    console.error("[Admin] saveFinanceRevenue error:", result.error);
    financeRedirect(result.error.message);
  }

  revalidatePath("/financial-report");
  redirect("/financial-report?saved=1");
}

export async function deleteFinanceRevenue(formData: FormData) {
  const id = fd(formData, "id");
  if (!id) financeRedirect("Missing revenue ID");

  const { error } = await createAdminClient().from("finance_revenue").delete().eq("id", id);
  if (error) {
    console.error("[Admin] deleteFinanceRevenue error:", error);
    financeRedirect(error.message);
  }

  revalidatePath("/financial-report");
  redirect("/financial-report?saved=1");
}

export async function saveFinanceSettings(formData: FormData) {
  const payload = {
    currency: fd(formData, "currency") || "MYR",
    default_packaging_cost: financeAmount(formData, "default_packaging_cost"),
    default_shipping_cost: financeAmount(formData, "default_shipping_cost"),
    id: true,
    startup_capital: financeAmount(formData, "startup_capital"),
  };

  const { error } = await createAdminClient()
    .from("finance_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] saveFinanceSettings error:", error);
    redirect(`/financial-report/settings?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/financial-report");
  revalidatePath("/financial-report/settings");
  redirect("/financial-report/settings?saved=1");
}

export async function saveFinanceProductCost(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id");
  const product_name = fd(formData, "product_name");

  if (!product_name) financeRedirect("Product name is required");

  const productId = fd(formData, "product_id");
  const payload = {
    packaging_cost_per_unit: financeAmount(formData, "packaging_cost_per_unit"),
    platform_fee_percent: financeAmount(formData, "platform_fee_percent"),
    product_id: productId || null,
    product_name,
    selling_price: financeAmount(formData, "selling_price"),
    shipping_cost_per_unit: financeAmount(formData, "shipping_cost_per_unit"),
    sku: fd(formData, "sku") || null,
    supplier_cost: financeAmount(formData, "supplier_cost"),
  };

  if (payload.platform_fee_percent > 100) {
    financeRedirect("Platform fee percent cannot be more than 100");
  }

  const result = id
    ? await sb.from("finance_product_costs").update(payload).eq("id", id)
    : productId
      ? await sb.from("finance_product_costs").upsert(payload, { onConflict: "product_id" })
      : await sb.from("finance_product_costs").insert(payload);

  if (result.error) {
    console.error("[Admin] saveFinanceProductCost error:", result.error);
    financeRedirect(result.error.message);
  }

  revalidatePath("/financial-report");
  redirect("/financial-report?saved=1");
}

export async function deleteFinanceProductCost(formData: FormData) {
  const id = fd(formData, "id");
  if (!id) financeRedirect("Missing product cost ID");

  const { error } = await createAdminClient().from("finance_product_costs").delete().eq("id", id);
  if (error) {
    console.error("[Admin] deleteFinanceProductCost error:", error);
    financeRedirect(error.message);
  }

  revalidatePath("/financial-report");
  redirect("/financial-report?saved=1");
}

export async function saveHomepage(formData: FormData) {
  return saveCmsBanner(formData, "/homepage");
}

export async function saveBannersHeroBanner(formData: FormData) {
  return saveCmsBanner(formData, "/banners");
}

export async function saveCmsBanner(formData: FormData, redirectBase = "/cms") {
  const sb = createAdminClient();
  const { data: existingBanner } = await sb.from("banners").select("*").eq("id", true).maybeSingle();
  const existingRow = (existingBanner ?? {}) as Record<string, unknown>;
  const existingPromoMeta = (() => {
    const raw = existingBanner?.promo_strip_text;
    if (typeof raw !== "string" || !raw.trim().startsWith("{")) return null;
    try {
      const parsed = JSON.parse(raw) as {
        heroButtonText?: Record<string, string>;
        heroSubtitle?: Record<string, string>;
        heroTitle?: Record<string, string>;
        promoStripText?: Record<string, string>;
      };
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  })();
  const existingText = (key: string, fallback = "") => {
    const value = existingRow[key];
    return typeof value === "string" ? value : fallback;
  };
  const submittedOrExisting = (key: string, existing = "") =>
    formData.has(key) ? fd(formData, key) : existing;

  const hero_title_en = fd(formData, "hero_title_en") || fd(formData, "heroTitle") || fd(formData, "hero_title");
  const hero_title_zh = submittedOrExisting("hero_title_zh", existingText("hero_title_zh", existingPromoMeta?.heroTitle?.zh ?? ""));
  const hero_title_ms = submittedOrExisting("hero_title_ms", existingText("hero_title_ms", existingPromoMeta?.heroTitle?.ms ?? ""));
  const hero_subtitle_en = fd(formData, "hero_subtitle_en") || fd(formData, "heroSubtitle") || fd(formData, "hero_subtitle");
  const hero_subtitle_zh = submittedOrExisting("hero_subtitle_zh", existingText("hero_subtitle_zh", existingPromoMeta?.heroSubtitle?.zh ?? ""));
  const hero_subtitle_ms = submittedOrExisting("hero_subtitle_ms", existingText("hero_subtitle_ms", existingPromoMeta?.heroSubtitle?.ms ?? ""));
  const hero_button_text_en = fd(formData, "hero_button_text_en") || fd(formData, "heroButtonText") || fd(formData, "hero_button_text");
  const hero_button_text_zh = submittedOrExisting("hero_button_text_zh", existingText("hero_button_text_zh", existingPromoMeta?.heroButtonText?.zh ?? ""));
  const hero_button_text_ms = submittedOrExisting("hero_button_text_ms", existingText("hero_button_text_ms", existingPromoMeta?.heroButtonText?.ms ?? ""));
  const hero_title = hero_title_en || existingBanner?.hero_title || "Stay Cool. Move Smart.";
  const hero_subtitle = hero_subtitle_en || existingBanner?.hero_subtitle || null;
  const hero_image_url = formData.has("heroImage") || formData.has("hero_image_url")
    ? fd(formData, "heroImage") || fd(formData, "hero_image_url") || null
    : existingBanner?.hero_image_url ?? null;
  const hero_button_text = hero_button_text_en || existingBanner?.hero_button_text || null;
  const hero_button_link = formData.has("heroButtonLink") || formData.has("hero_button_link")
    ? fd(formData, "heroButtonLink") || fd(formData, "hero_button_link") || null
    : existingBanner?.hero_button_link ?? null;
  const promo_strip_text_legacy = fd(formData, "promotionStripText") || fd(formData, "promo_strip_text") || null;
  const promo_strip_text_en = fd(formData, "promo_strip_text_en") || promo_strip_text_legacy || null;
  const promo_strip_text_zh = submittedOrExisting("promo_strip_text_zh", existingText("promo_strip_text_zh", existingPromoMeta?.promoStripText?.zh ?? "")) || null;
  const promo_strip_text_ms = submittedOrExisting("promo_strip_text_ms", existingText("promo_strip_text_ms", existingPromoMeta?.promoStripText?.ms ?? "")) || null;
  const promo_strip_text = JSON.stringify({
    heroButtonText: {
      en: hero_button_text_en || hero_button_text || "",
      ms: hero_button_text_ms || "",
      zh: hero_button_text_zh || "",
    },
    heroSubtitle: {
      en: hero_subtitle_en || hero_subtitle || "",
      ms: hero_subtitle_ms || "",
      zh: hero_subtitle_zh || "",
    },
    heroTitle: {
      en: hero_title_en || hero_title,
      ms: hero_title_ms || "",
      zh: hero_title_zh || "",
    },
    promoStripText: {
      en: promo_strip_text_en || promo_strip_text_legacy || "",
      ms: promo_strip_text_ms || "",
      zh: promo_strip_text_zh || "",
    },
  });
  const is_active = fdBool(formData, "isActive") || fdBool(formData, "is_active");
  const announcement_enabled = fdBool(formData, "announcementEnabled");
  const announcement_link = fd(formData, "announcementLink") || null;
  const announcement_bg_color = fd(formData, "announcementBgColor") || "#1a1a1a";
  const announcement_text_color = fd(formData, "announcementTextColor") || "#ffffff";

  if (!hero_title) redirect(`${redirectBase}?saveError=Hero+title+is+required`);

  const payload = {
    id: true,
    hero_title,
    hero_subtitle,
    hero_image_url,
    hero_button_text,
    hero_button_link,
    promo_strip_text,
    is_active,
    announcement_enabled,
    announcement_link,
    announcement_bg_color,
    announcement_text_color,
    featured_category_cards: existingBanner?.featured_category_cards ?? [] as string[],
    trust_badge_text: existingBanner?.trust_badge_text ?? [] as string[],
  };

  console.info("[Admin] saveCmsBanner payload:", {
    heroButtonText: { en: hero_button_text_en || hero_button_text || "", ms: hero_button_text_ms || "", zh: hero_button_text_zh || "" },
    heroSubtitle: { en: hero_subtitle_en || hero_subtitle || "", ms: hero_subtitle_ms || "", zh: hero_subtitle_zh || "" },
    heroTitle: { en: hero_title_en || hero_title, ms: hero_title_ms || "", zh: hero_title_zh || "" },
    promoStripText: { en: promo_strip_text_en || promo_strip_text_legacy || "", ms: promo_strip_text_ms || "", zh: promo_strip_text_zh || "" },
  });

  const { error } = await sb
    .from("banners")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] saveCmsBanner error:", error);
    redirect(`${redirectBase}?saveError=${encodeURIComponent(error.message)}`);
  }

  const { error: multilingualColumnError } = await sb
    .from("banners")
    .update({
      hero_button_text_en: hero_button_text_en || hero_button_text || "",
      hero_button_text_ms,
      hero_button_text_zh,
      hero_subtitle_en: hero_subtitle_en || hero_subtitle || "",
      hero_subtitle_ms,
      hero_subtitle_zh,
      hero_title_en: hero_title_en || hero_title,
      hero_title_ms,
      hero_title_zh,
      promo_strip_text_en: promo_strip_text_en || promo_strip_text_legacy || "",
      promo_strip_text_ms: promo_strip_text_ms || "",
      promo_strip_text_zh: promo_strip_text_zh || "",
    })
    .eq("id", true);

  if (multilingualColumnError) {
    console.info("[Admin] saveCmsBanner stored multilingual hero values in promo_strip_text JSON fallback:", multilingualColumnError.message);
  }

  const { data: savedBanner, error: savedBannerError } = await sb
    .from("banners")
    .select("hero_title,hero_subtitle,hero_button_text,hero_button_link,hero_image_url,promo_strip_text,is_active")
    .eq("id", true)
    .maybeSingle();

  if (savedBannerError) {
    console.error("[Admin] saveCmsBanner readback error:", savedBannerError);
  } else {
    console.info("[Admin] saveCmsBanner saved:", savedBanner);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect(`${redirectBase}?saved=1`);
}

export async function saveCmsNavigation(formData: FormData) {
  const sb = createAdminClient();

  // Nav items submitted as individual nav_label_N / nav_href_N fields
  // Count by finding all nav_label_* keys
  const nav_items: Array<{ label: string; href: string }> = [];
  let i = 0;
  while (formData.has(`nav_label_${i}`)) {
    const label = fd(formData, `nav_label_${i}`);
    const href = fd(formData, `nav_href_${i}`);
    if (label && href) nav_items.push({ label, href });
    i++;
  }

  const payload = {
    id: true,
    nav_items: nav_items as unknown as import("@ecommerce/database").Database["public"]["Tables"]["store_settings"]["Row"]["nav_items"],
  };

  const { error } = await sb
    .from("store_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] saveCmsNavigation error:", error);
    redirect(`/cms?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/cms?saved=1");
}

// ─── PAYMENT SETTINGS ─────────────────────────────────────────────────────────

export async function savePaymentSettings(formData: FormData) {
  const sb = createAdminClient();

  const payload = {
    id: true,
    manual_payment_enabled: fdBool(formData, "manual_payment_enabled"),
    whatsapp_order_enabled: fdBool(formData, "whatsapp_order_enabled"),
    bank_name: fd(formData, "bank_name") || null,
    account_name: fd(formData, "account_name") || null,
    account_number: fd(formData, "account_number") || null,
    payment_instruction: fd(formData, "payment_instruction") || null,
    provider_placeholder: fd(formData, "provider_placeholder") || null,
    is_enabled: true,
  };

  const { error } = await sb
    .from("payment_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] savePaymentSettings error:", error);
    redirect(`/payments?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/payments?saved=1");
}

// ─── QR PAYMENT METHODS ───────────────────────────────────────────────────────

export async function saveQrPaymentMethod(formData: FormData) {
  const sb = createAdminClient();
  const id = fd(formData, "id"); // 'bank_qr' or 'ewallet_qr'

  if (!id) {
    redirect("/payments?saveError=Missing+payment+method+id");
  }

  const payload = {
    id,
    display_name: fd(formData, "display_name"),
    instruction_text: fd(formData, "instruction_text") || null,
    is_active: fdBool(formData, "is_active"),
    qr_image_url: fd(formData, "qr_image_url") || null,
  };

  const { error } = await sb
    .from("qr_payment_methods")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] saveQrPaymentMethod error:", error);
    redirect(`/payments?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/payments?saved=1");
}

// ─── STORE SETTINGS ───────────────────────────────────────────────────────────

export async function saveStoreSettings(formData: FormData) {
  const sb = createAdminClient();

  const social_links = {
    facebook: fd(formData, "facebook") || "",
    instagram: fd(formData, "instagram") || "",
    tiktok: fd(formData, "tiktok") || "",
    shopee: fd(formData, "shopee") || "",
    lazada: fd(formData, "lazada") || "",
    // Uploaded logo image URLs for each platform (stored alongside URLs in same JSONB)
    facebook_logo: fd(formData, "facebook_logo") || "",
    instagram_logo: fd(formData, "instagram_logo") || "",
    tiktok_logo: fd(formData, "tiktok_logo") || "",
    shopee_logo: fd(formData, "shopee_logo") || "",
    lazada_logo: fd(formData, "lazada_logo") || "",
  };

  const payload = {
    id: true,
    store_name: fd(formData, "store_name"),
    store_tagline: fd(formData, "store_tagline"),
    whatsapp_number: fd(formData, "whatsapp_number") || null,
    contact_email: fd(formData, "contact_email") || null,
    contact_phone: fd(formData, "contact_phone") || null,
    shipping_fee: fdNum(formData, "west_malaysia_shipping_fee"),
    free_shipping_min_amount: fdNum(formData, "west_malaysia_free_shipping_min_amount"),
    west_malaysia_shipping_fee: fdNum(formData, "west_malaysia_shipping_fee"),
    east_malaysia_shipping_fee: fdNum(formData, "east_malaysia_shipping_fee"),
    west_malaysia_free_shipping_min_amount: fdNum(formData, "west_malaysia_free_shipping_min_amount"),
    east_malaysia_free_shipping_min_amount: fdNum(formData, "east_malaysia_free_shipping_min_amount"),
    west_malaysia_free_shipping_threshold: fdNum(formData, "west_malaysia_free_shipping_min_amount"),
    east_malaysia_free_shipping_threshold: fdNum(formData, "east_malaysia_free_shipping_min_amount"),
    logo_url: fd(formData, "logo_url") || null,
    favicon_url: fd(formData, "favicon_url") || null,
    is_store_active: fdBool(formData, "is_store_active"),
    maintenance_message: fd(formData, "maintenance_message") || null,
    social_links: social_links as unknown as import("@ecommerce/database").Database["public"]["Tables"]["store_settings"]["Row"]["social_links"],
    currency: fd(formData, "currency") || "MYR",
  };

  if (!payload.store_name) {
    redirect("/settings?saveError=Store+name+is+required");
  }

  const { error } = await sb
    .from("store_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] saveStoreSettings error:", error);
    redirect(`/settings?saveError=${encodeURIComponent(error.message)}`);
  }

  revalidateAll();
  await revalidateStorefront();
  redirect("/settings?saved=1");
}
