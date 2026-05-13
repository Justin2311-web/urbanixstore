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

function dateOrNull(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function revalidateStorefront() {
  const storefrontUrl = process.env.NEXT_PUBLIC_SITE_URL;
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

  if (!name || !slug) {
    redirect("/categories?saveError=Name+and+slug+are+required");
  }

  const payload = {
    name,
    slug,
    description: description || null,
    sort_order,
    is_active,
    tone,
    image_url,
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
  const name = fd(formData, "name");
  const sku = fd(formData, "sku");
  const slug = fd(formData, "slug") || slugify(name);
  const category_id = fd(formData, "category_id") || null; // UUID from category dropdown
  const price = fdNum(formData, "price");
  const promotion_price = fdNum(formData, "promotion_price") || null;
  const promotion_start_at = dateOrNull(fd(formData, "promotion_start_at"));
  const promotion_end_at = dateOrNull(fd(formData, "promotion_end_at"));
  const stock_quantity = fdNum(formData, "stock_quantity");
  const is_active = fdBool(formData, "is_active");
  const is_featured = fdBool(formData, "is_featured");
  const short_description = fd(formData, "short_description") || null;
  const description = fd(formData, "description") || null;
  const highlights = fdLines(formData, "highlights");
  const specifications = fdLines(formData, "specifications");
  const shipping_info = fd(formData, "shipping_info") || null;
  const return_note = fd(formData, "return_note") || null;
  const rating = fdNum(formData, "rating") || null;

  // Product variants: JSON string from hidden input, e.g. [{"name":"Color","values":["Black","White"]}]
  const variantsRaw = fd(formData, "product_variants");
  let product_variants: Array<{ name: string; values: string[] }> | null = null;
  if (variantsRaw) {
    try {
      product_variants = JSON.parse(variantsRaw) as Array<{ name: string; values: string[] }>;
    } catch {
      // Invalid JSON — ignore
    }
  }

  if (!name) redirect("/products?saveError=Product+name+is+required");
  if (!sku) redirect("/products?saveError=SKU+is+required");
  if (!slug) redirect("/products?saveError=Slug+is+required");
  if (price <= 0) redirect(`/products?saveError=Price+must+be+greater+than+0`);

  const payload = {
    name,
    sku,
    slug,
    category_id: category_id || null,
    price,
    promotion_price: promotion_price && promotion_price > 0 ? promotion_price : null,
    promotion_start_at,
    promotion_end_at,
    stock_quantity,
    is_active,
    is_featured,
    short_description,
    description,
    highlights: highlights as unknown as import("@ecommerce/database").Database["public"]["Tables"]["products"]["Row"]["highlights"],
    specifications: specifications as unknown as import("@ecommerce/database").Database["public"]["Tables"]["products"]["Row"]["specifications"],
    shipping_info,
    return_note,
    rating: rating || null,
    product_variants: (product_variants ?? null) as unknown as import("@ecommerce/database").Database["public"]["Tables"]["products"]["Row"]["product_variants"],
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

export async function saveHomepage(formData: FormData) {
  return saveCmsBanner(formData, "/homepage");
}

export async function saveCmsBanner(formData: FormData, redirectBase = "/cms") {
  const sb = createAdminClient();
  const hero_title = fd(formData, "heroTitle") || fd(formData, "hero_title");
  const hero_subtitle = fd(formData, "heroSubtitle") || fd(formData, "hero_subtitle") || null;
  const hero_image_url = fd(formData, "heroImage") || fd(formData, "hero_image_url") || null;
  const hero_button_text = fd(formData, "heroButtonText") || fd(formData, "hero_button_text") || null;
  const hero_button_link = fd(formData, "heroButtonLink") || fd(formData, "hero_button_link") || null;
  const promo_strip_text = fd(formData, "promotionStripText") || fd(formData, "promo_strip_text") || null;
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
    featured_category_cards: [] as string[],
    trust_badge_text: [] as string[],
  };

  const { error } = await sb
    .from("banners")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("[Admin] saveCmsBanner error:", error);
    redirect(`${redirectBase}?saveError=${encodeURIComponent(error.message)}`);
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
  };

  const payload = {
    id: true,
    store_name: fd(formData, "store_name"),
    store_tagline: fd(formData, "store_tagline"),
    whatsapp_number: fd(formData, "whatsapp_number") || null,
    contact_email: fd(formData, "contact_email") || null,
    contact_phone: fd(formData, "contact_phone") || null,
    shipping_fee: fdNum(formData, "shipping_fee"),
    free_shipping_min_amount: fdNum(formData, "free_shipping_min_amount"),
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
