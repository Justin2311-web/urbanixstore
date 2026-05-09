import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ecommerce/database";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  defaultUrbanixStoreData,
  getCategoryIdByName,
  getDisplayPrice,
  type CheckoutCustomer,
  type HomepageContent,
  type PaymentSettings,
  type ProductCategory,
  type PromotionBanner,
  type UrbanixOrder,
  type UrbanixProduct,
  type UrbanixStoreData,
  type StoreSettings,
} from "./index";

type SupabaseStoreClient = SupabaseClient;

function findWorkspaceRoot() {
  let current = process.cwd();

  for (let index = 0; index < 6; index += 1) {
    const packageJsonPath = join(current, "package.json");

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        workspaces?: string[];
      };

      if (packageJson.workspaces) {
        return current;
      }
    }

    current = dirname(current);
  }

  return process.cwd();
}

export const urbanixDataPath = join(findWorkspaceRoot(), "data", "urbanix-store.json");

function mergeStoreData(data: Partial<UrbanixStoreData>): UrbanixStoreData {
  return {
    categories: data.categories ?? defaultUrbanixStoreData.categories,
    homepage: { ...defaultUrbanixStoreData.homepage, ...data.homepage },
    orders: data.orders ?? defaultUrbanixStoreData.orders,
    payments: { ...defaultUrbanixStoreData.payments, ...data.payments },
    promotionBanners: data.promotionBanners ?? defaultUrbanixStoreData.promotionBanners,
    products: data.products ?? defaultUrbanixStoreData.products,
    settings: {
      ...defaultUrbanixStoreData.settings,
      ...data.settings,
      socialLinks: {
        ...defaultUrbanixStoreData.settings.socialLinks,
        ...data.settings?.socialLinks,
      },
    },
  };
}

export function readUrbanixStoreData(): UrbanixStoreData {
  if (!existsSync(urbanixDataPath)) {
    writeUrbanixStoreData(defaultUrbanixStoreData);
  }

  try {
    return mergeStoreData(JSON.parse(readFileSync(urbanixDataPath, "utf8")) as Partial<UrbanixStoreData>);
  } catch {
    return defaultUrbanixStoreData;
  }
}

export function writeUrbanixStoreData(data: UrbanixStoreData) {
  mkdirSync(dirname(urbanixDataPath), { recursive: true });
  writeFileSync(urbanixDataPath, JSON.stringify(data, null, 2));
}

function getPublicSupabaseKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

function createSupabaseStoreClient({ admin = false } = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = admin ? process.env.SUPABASE_SERVICE_ROLE_KEY ?? getPublicSupabaseKey() : getPublicSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function asStringArray(value: Json | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toJsonArray(lines: string[]): Json {
  return lines.filter(Boolean);
}

function dateOrNull(value?: string) {
  return value ? value : null;
}

function localCategoryTone(slug: string): ProductCategory["tone"] {
  return defaultUrbanixStoreData.categories.find((category) => category.id === slug)?.tone ?? "mint";
}

function mapCategory(row: Database["public"]["Tables"]["categories"]["Row"]): ProductCategory {
  return {
    active: row.is_active,
    description: row.description ?? "",
    href: `/categories?category=${row.slug}`,
    id: row.slug,
    imageUrl: row.image_url ?? "",
    isActive: row.is_active,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sort_order,
    tone: (row.tone as ProductCategory["tone"] | null) ?? localCategoryTone(row.slug),
  };
}

function mapProduct({
  categoriesById,
  imagesByProductId,
  row,
}: {
  row: Database["public"]["Tables"]["products"]["Row"];
  categoriesById: Map<string, ProductCategory>;
  imagesByProductId: Map<string, Database["public"]["Tables"]["product_images"]["Row"][]>;
}): UrbanixProduct {
  const fallback = defaultUrbanixStoreData.products.find((product) => product.slug === row.slug);
  const category = row.category_id ? categoriesById.get(row.category_id) : undefined;
  const galleryImages = (imagesByProductId.get(row.id) ?? []).map((image) => image.image_url);
  const product: UrbanixProduct = {
    category: category?.name ?? fallback?.category ?? "Lifestyle",
    categoryId: category?.id ?? fallback?.categoryId ?? fallback?.relatedCategory,
    createdAt: row.created_at,
    description: row.description ?? fallback?.description ?? "",
    featured: row.is_featured,
    fullDescription: row.description ?? fallback?.fullDescription ?? fallback?.description ?? "",
    galleryImages,
    highlights: asStringArray(row.highlights),
    id: row.slug,
    image: row.main_image_url ?? fallback?.image ?? "",
    imageTone: (row.image_tone as UrbanixProduct["imageTone"] | null) ?? fallback?.imageTone ?? "fan-green",
    isActive: row.is_active,
    isFeatured: row.is_featured,
    mainImageUrl: row.main_image_url ?? "",
    name: row.name,
    normalPrice: Number(row.price),
    originalPrice: Number(row.price),
    price: Number(row.price),
    productImages: galleryImages.map((imageUrl, index) => ({
      imageUrl,
      isPrimary: index === 0,
      sortOrder: index,
    })),
    promotionEndDate: row.promotion_end_at ?? "",
    promotionEndAt: row.promotion_end_at ?? "",
    promotionPrice: row.promotion_price === null ? undefined : Number(row.promotion_price),
    promotionStartDate: row.promotion_start_at ?? "",
    promotionStartAt: row.promotion_start_at ?? "",
    rating: Number(row.rating ?? fallback?.rating ?? 4.7),
    relatedCategory: category?.id ?? fallback?.relatedCategory,
    returnNote: row.return_note ?? fallback?.returnNote ?? "",
    shippingInfo: row.shipping_info ?? fallback?.shippingInfo ?? "",
    shortDescription: row.short_description ?? "",
    sku: row.sku,
    slug: row.slug,
    sold: row.sold ?? fallback?.sold ?? 0,
    specifications: asStringArray(row.specifications),
    status: row.is_active ? "active" : "inactive",
    stockQuantity: row.stock_quantity,
    stockStatus:
      row.stock_quantity <= 0 ? "out_of_stock" : row.stock_quantity <= 5 ? "low_stock" : "in_stock",
    updatedAt: row.updated_at,
  };
  const pricing = getDisplayPrice(product);

  return {
    ...product,
    originalPrice: pricing.originalPrice,
    price: pricing.price,
    promotionPercent: pricing.promotionPercent,
  };
}

function mapStoreSettings(row?: Database["public"]["Tables"]["store_settings"]["Row"] | null): StoreSettings {
  if (!row) {
    return defaultUrbanixStoreData.settings;
  }

  const socialLinks = typeof row.social_links === "object" && !Array.isArray(row.social_links) && row.social_links
    ? row.social_links
    : {};

  return {
    contactEmail: row.contact_email ?? "",
    contactPhone: row.contact_phone ?? "",
    favicon: row.favicon_url ?? defaultUrbanixStoreData.settings.favicon,
    faviconUrl: row.favicon_url ?? defaultUrbanixStoreData.settings.faviconUrl,
    freeShippingMinimumAmount: Number(row.free_shipping_min_amount),
    freeShippingMinAmount: Number(row.free_shipping_min_amount),
    logo: row.logo_url ?? defaultUrbanixStoreData.settings.logo,
    logoUrl: row.logo_url ?? "",
    maintenanceMessage: row.maintenance_message ?? undefined,
    shippingFee: Number(row.shipping_fee),
    socialLinks: {
      facebook: typeof socialLinks.facebook === "string" ? socialLinks.facebook : "",
      instagram: typeof socialLinks.instagram === "string" ? socialLinks.instagram : "",
      tiktok: typeof socialLinks.tiktok === "string" ? socialLinks.tiktok : "",
    },
    storeActive: row.is_store_active,
    isStoreActive: row.is_store_active,
    storeName: row.store_name,
    storeTagline: row.store_tagline,
    whatsappNumber: row.whatsapp_number ?? "",
    currency: row.currency,
  };
}

function mapHomepage(row?: Database["public"]["Tables"]["banners"]["Row"] | null): HomepageContent {
  if (!row) {
    return defaultUrbanixStoreData.homepage;
  }

  return {
    featuredCategoryCards: asStringArray(row.featured_category_cards),
    heroButtonLink: row.hero_button_link ?? "/products",
    heroButtonText: row.hero_button_text ?? "Shop Now",
    heroImage: row.hero_image_url ?? defaultUrbanixStoreData.homepage.heroImage,
    heroImageUrl: row.hero_image_url ?? "",
    heroSubtitle: row.hero_subtitle ?? "",
    heroTitle: row.hero_title,
    isActive: row.is_active,
    promotionStripText: row.promo_strip_text ?? "",
    promoStripText: row.promo_strip_text ?? "",
    trustBadgeText: asStringArray(row.trust_badge_text),
  };
}

function mapPromotionBanner(row: Database["public"]["Tables"]["promotion_banners"]["Row"]): PromotionBanner {
  return {
    createdAt: row.created_at,
    ctaText: row.cta_text ?? "Shop Now",
    desktopImageUrl: row.desktop_image_url ?? "",
    id: row.id,
    isActive: row.is_active,
    mobileImageUrl: row.mobile_image_url ?? "",
    sortOrder: row.sort_order,
    subtitle: row.subtitle ?? "",
    targetUrl: row.target_url ?? "/products",
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapPaymentSettings(row?: Database["public"]["Tables"]["payment_settings"]["Row"] | null): PaymentSettings {
  if (!row) {
    return defaultUrbanixStoreData.payments;
  }

  return {
    accountName: row.account_name ?? "",
    accountNumber: row.account_number ?? "",
    bankName: row.bank_name ?? "",
    futureGatewayPlaceholder: row.provider_placeholder ?? "",
    providerPlaceholder: row.provider_placeholder ?? "",
    isEnabled: row.is_enabled,
    manualPaymentEnabled: row.manual_payment_enabled,
    paymentInstruction: row.payment_instruction ?? "",
    whatsAppOrderEnabled: row.whatsapp_order_enabled,
  };
}

function mapOrder({
  items,
  row,
}: {
  row: Database["public"]["Tables"]["orders"]["Row"];
  items: Database["public"]["Tables"]["order_items"]["Row"][];
}): UrbanixOrder {
  const customer = row.shipping_address as unknown as CheckoutCustomer;

  return {
    createdAt: row.created_at,
    customer: {
      addressLine1: customer.addressLine1 ?? "",
      addressLine2: customer.addressLine2 ?? "",
      city: customer.city ?? "",
      country: customer.country ?? "Malaysia",
      deliveryNote: row.delivery_note ?? customer.deliveryNote ?? "",
      email: row.customer_email ?? customer.email ?? "",
      fullName: row.customer_name,
      phone: row.customer_phone,
      postcode: customer.postcode ?? "",
      state: customer.state ?? "",
    },
    customerEmail: row.customer_email ?? "",
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryNote: row.delivery_note ?? "",
    discountAmount: Number(row.discount_amount),
    id: row.id,
    items: items.map((item) => ({
      lineTotal: Number(item.total_price),
      product: {
        category: "",
        description: "",
        id: item.product_id ?? item.product_sku,
        imageTone: "fan-green",
        name: item.product_name,
        price: Number(item.unit_price),
        rating: 0,
        returnNote: "",
        shippingInfo: "",
        shortDescription: "",
        sku: item.product_sku,
        slug: item.product_id ?? item.product_sku,
        sold: 0,
        specifications: [],
        stockStatus: "in_stock",
      },
      quantity: item.quantity,
    })),
    orderNumber: row.order_number,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    shippingAddress: customer,
    shippingFee: Number(row.shipping_fee),
    subtotal: Number(row.subtotal),
    totalAmount: Number(row.total_amount),
    totals: {
      discount: Number(row.discount_amount),
      shipping: Number(row.shipping_fee),
      subtotal: Number(row.subtotal),
      total: Number(row.total_amount),
    },
    updatedAt: row.updated_at,
  };
}

export async function readUrbanixStoreDataAsync(): Promise<UrbanixStoreData> {
  const supabase = createSupabaseStoreClient();

  if (!supabase) {
    return readUrbanixStoreData();
  }

  try {
    const [
      categoriesResult,
      productsResult,
      imagesResult,
      settingsResult,
      bannersResult,
      paymentsResult,
      promotionBannersResult,
      ordersResult,
      orderItemsResult,
    ] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("product_images").select("*").order("sort_order", { ascending: true }),
      supabase.from("store_settings").select("*").eq("id", true).maybeSingle(),
      supabase.from("banners").select("*").eq("id", true).maybeSingle(),
      supabase.from("payment_settings").select("*").eq("id", true).maybeSingle(),
      supabase.from("promotion_banners").select("*").order("sort_order", { ascending: true }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("order_items").select("*").order("created_at", { ascending: true }),
    ]);

    const error = [
      categoriesResult.error,
      productsResult.error,
      imagesResult.error,
      settingsResult.error,
      bannersResult.error,
      paymentsResult.error,
      promotionBannersResult.error,
      ordersResult.error,
      orderItemsResult.error,
    ].find(Boolean);

    if (error) {
      throw error;
    }

    const categoriesByUuid = new Map((categoriesResult.data ?? []).map((row) => [row.id, mapCategory(row)]));
    const imagesByProductId = new Map<string, Database["public"]["Tables"]["product_images"]["Row"][]>();

    for (const image of imagesResult.data ?? []) {
      imagesByProductId.set(image.product_id, [...(imagesByProductId.get(image.product_id) ?? []), image]);
    }

    const itemsByOrderId = new Map<string, Database["public"]["Tables"]["order_items"]["Row"][]>();

    for (const item of orderItemsResult.data ?? []) {
      itemsByOrderId.set(item.order_id, [...(itemsByOrderId.get(item.order_id) ?? []), item]);
    }

    const categories = (categoriesResult.data ?? []).map(mapCategory);
    const products = (productsResult.data ?? []).map((row) =>
      mapProduct({
        categoriesById: categoriesByUuid,
        imagesByProductId,
        row,
      })
    );
    const orders = (ordersResult.data ?? []).map((row) =>
      mapOrder({
        items: itemsByOrderId.get(row.id) ?? [],
        row,
      })
    );

    return mergeStoreData({
      categories,
      homepage: mapHomepage(bannersResult.data),
      orders,
      payments: mapPaymentSettings(paymentsResult.data),
      promotionBanners: (promotionBannersResult.data ?? []).map(mapPromotionBanner),
      products,
      settings: mapStoreSettings(settingsResult.data),
    });
  } catch (error) {
    console.error("Falling back to local Urbanix data after Supabase read failed.", error);
    return readUrbanixStoreData();
  }
}

export function listStorefrontProducts(data = readUrbanixStoreData()) {
  const activeCategoryIds = new Set(data.categories.filter((category) => category.active !== false).map((category) => category.id));

  return data.products
    .filter((product) => {
      const categoryId = product.categoryId ?? product.relatedCategory ?? getCategoryIdByName(product.category);
      return product.status !== "inactive" && activeCategoryIds.has(categoryId);
    })
    .map((product) => {
      const pricing = getDisplayPrice(product);

      return {
        ...product,
        originalPrice: pricing.originalPrice,
        price: pricing.price,
        promotionPercent: pricing.promotionPercent,
        stockStatus:
          (product.stockQuantity ?? 1) <= 0
            ? "out_of_stock"
            : (product.stockQuantity ?? 10) <= 5
              ? "low_stock"
              : product.stockStatus,
      };
    });
}

export function listStorefrontCategories(data = readUrbanixStoreData()) {
  return data.categories
    .filter((category) => category.active !== false && category.isActive !== false)
    .toSorted((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0));
}

export function listActivePromotionBanners(data = readUrbanixStoreData()) {
  return data.promotionBanners
    .filter((banner) => banner.isActive)
    .toSorted((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0));
}

function localUpsertProduct(product: UrbanixProduct) {
  const data = readUrbanixStoreData();
  const id = product.id || product.slug;
  const categoryId = product.categoryId ?? product.relatedCategory ?? getCategoryIdByName(product.category);
  const nextProduct = {
    ...product,
    categoryId,
    id,
    isActive: product.isActive ?? product.status !== "inactive",
    isFeatured: product.isFeatured ?? product.featured ?? false,
    mainImageUrl: product.mainImageUrl ?? product.image,
    productHighlights: product.productHighlights ?? product.highlights ?? [],
    promotionEndAt: product.promotionEndAt ?? product.promotionEndDate,
    promotionStartAt: product.promotionStartAt ?? product.promotionStartDate,
    relatedCategory: product.relatedCategory ?? categoryId,
    updatedAt: new Date().toISOString(),
  };
  const existingIndex = data.products.findIndex((item) => item.id === id);

  if (existingIndex >= 0) {
    data.products[existingIndex] = nextProduct;
  } else {
    data.products.unshift(nextProduct);
  }

  writeUrbanixStoreData(data);
  return nextProduct;
}

export async function upsertProduct(product: UrbanixProduct) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    return localUpsertProduct(product);
  }

  const categorySlug = product.categoryId ?? product.relatedCategory ?? getCategoryIdByName(product.category);
  const categoryResult = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();

  if (categoryResult.error) {
    throw categoryResult.error;
  }

  const upsertResult = await supabase
    .from("products")
    .upsert(
      {
        description: product.fullDescription || product.description,
        highlights: toJsonArray(product.highlights ?? product.productHighlights ?? []),
        image_tone: product.imageTone,
        is_active: product.status !== "inactive" && product.isActive !== false,
        is_featured: product.featured ?? product.isFeatured ?? false,
        main_image_url: product.image || product.mainImageUrl || null,
        name: product.name,
        price: product.normalPrice ?? product.originalPrice ?? product.price,
        promotion_end_at: dateOrNull(product.promotionEndAt ?? product.promotionEndDate),
        promotion_price: product.promotionPrice ?? null,
        promotion_start_at: dateOrNull(product.promotionStartAt ?? product.promotionStartDate),
        rating: product.rating,
        return_note: product.returnNote,
        shipping_info: product.shippingInfo,
        short_description: product.shortDescription,
        sku: product.sku,
        slug: product.slug,
        sold: product.sold,
        specifications: toJsonArray(product.specifications),
        stock_quantity: product.stockQuantity ?? 0,
        category_id: categoryResult.data?.id ?? null,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (upsertResult.error) {
    throw upsertResult.error;
  }

  await syncProductImages(supabase, upsertResult.data.id, product.galleryImages ?? []);
  return product;
}

async function syncProductImages(supabase: SupabaseStoreClient, productId: string, galleryImages: string[]) {
  const deleteResult = await supabase.from("product_images").delete().eq("product_id", productId);

  if (deleteResult.error) {
    throw deleteResult.error;
  }

  const imageRows = galleryImages
    .filter(Boolean)
    .map((imageUrl, index) => ({
      alt_text: null,
      image_url: imageUrl,
      is_primary: index === 0,
      product_id: productId,
      sort_order: index,
    }));

  if (imageRows.length === 0) {
    return;
  }

  const insertResult = await supabase.from("product_images").insert(imageRows);

  if (insertResult.error) {
    throw insertResult.error;
  }
}

export async function updateCategories(categories: ProductCategory[]) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.categories = categories.map((category, index) => ({
      ...category,
      active: category.active ?? category.isActive ?? true,
      href: category.href || `/categories?category=${category.slug ?? category.id}`,
      isActive: category.isActive ?? category.active ?? true,
      slug: category.slug ?? category.id,
      sortOrder: category.sortOrder ?? index + 1,
    }));
    writeUrbanixStoreData(data);
    return;
  }

  const result = await supabase.from("categories").upsert(
    categories.map((category, index) => ({
      description: category.description,
      image_url: category.imageUrl ?? null,
      is_active: category.active ?? category.isActive ?? true,
      name: category.name,
      slug: category.slug ?? category.id,
      sort_order: category.sortOrder ?? index + 1,
      tone: category.tone,
    })),
    { onConflict: "slug" }
  );

  if (result.error) {
    throw result.error;
  }
}

export async function replaceCategories(categories: ProductCategory[], deletedSlugs: string[] = []) {
  const normalizedCategories = categories.map((category, index) => ({
    ...category,
    active: category.active ?? category.isActive ?? true,
    href: category.href || `/categories?category=${category.slug ?? category.id}`,
    id: category.slug ?? category.id,
    isActive: category.isActive ?? category.active ?? true,
    slug: category.slug ?? category.id,
    sortOrder: category.sortOrder ?? index + 1,
  }));
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.categories = normalizedCategories.filter((category) => !deletedSlugs.includes(category.slug ?? category.id));
    writeUrbanixStoreData(data);
    return;
  }

  if (deletedSlugs.length > 0) {
    const deleteResult = await supabase.from("categories").delete().in("slug", deletedSlugs);

    if (deleteResult.error) {
      throw deleteResult.error;
    }
  }

  await updateCategories(normalizedCategories);
}

export async function updateHomepage(homepage: HomepageContent) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.homepage = homepage;
    writeUrbanixStoreData(data);
    return;
  }

  const result = await supabase.from("banners").upsert(
    {
      featured_category_cards: toJsonArray(homepage.featuredCategoryCards),
      hero_button_link: homepage.heroButtonLink,
      hero_button_text: homepage.heroButtonText,
      hero_image_url: homepage.heroImage || null,
      hero_subtitle: homepage.heroSubtitle,
      hero_title: homepage.heroTitle,
      id: true,
      is_active: homepage.isActive ?? true,
      promo_strip_text: homepage.promotionStripText,
      trust_badge_text: toJsonArray(homepage.trustBadgeText),
    },
    { onConflict: "id" }
  );

  if (result.error) {
    throw result.error;
  }
}

export async function updateStoreSettings(settings: StoreSettings) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.settings = {
      ...settings,
      faviconUrl: settings.faviconUrl ?? settings.favicon,
      freeShippingMinAmount: settings.freeShippingMinAmount ?? settings.freeShippingMinimumAmount,
      isStoreActive: settings.isStoreActive ?? settings.storeActive,
      logoUrl: settings.logoUrl ?? settings.logo,
    };
    writeUrbanixStoreData(data);
    return;
  }

  const result = await supabase.from("store_settings").upsert(
    {
      contact_email: settings.contactEmail,
      contact_phone: settings.contactPhone,
      currency: settings.currency ?? "MYR",
      favicon_url: settings.favicon || settings.faviconUrl || null,
      free_shipping_min_amount: settings.freeShippingMinimumAmount,
      id: true,
      is_store_active: settings.storeActive,
      logo_url: settings.logo || settings.logoUrl || null,
      maintenance_message: settings.maintenanceMessage ?? null,
      shipping_fee: settings.shippingFee,
      social_links: settings.socialLinks,
      store_name: settings.storeName,
      store_tagline: settings.storeTagline,
      whatsapp_number: settings.whatsappNumber,
    },
    { onConflict: "id" }
  );

  if (result.error) {
    throw result.error;
  }
}

export async function updatePaymentSettings(payments: PaymentSettings) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.payments = {
      ...payments,
      isEnabled: payments.isEnabled ?? true,
      providerPlaceholder: payments.providerPlaceholder ?? payments.futureGatewayPlaceholder,
    };
    writeUrbanixStoreData(data);
    return;
  }

  const result = await supabase.from("payment_settings").upsert(
    {
      account_name: payments.accountName,
      account_number: payments.accountNumber,
      bank_name: payments.bankName,
      id: true,
      is_enabled: payments.isEnabled ?? true,
      manual_payment_enabled: payments.manualPaymentEnabled,
      payment_instruction: payments.paymentInstruction,
      provider_placeholder: payments.providerPlaceholder ?? payments.futureGatewayPlaceholder,
      whatsapp_order_enabled: payments.whatsAppOrderEnabled,
    },
    { onConflict: "id" }
  );

  if (result.error) {
    throw result.error;
  }
}

export async function upsertPromotionBanners(banners: PromotionBanner[], deletedIds: string[] = []) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.promotionBanners = banners
      .filter((banner) => !deletedIds.includes(banner.id))
      .toSorted((first, second) => first.sortOrder - second.sortOrder);
    writeUrbanixStoreData(data);
    return;
  }

  if (deletedIds.length > 0) {
    const deleteResult = await supabase.from("promotion_banners").delete().in("id", deletedIds);

    if (deleteResult.error) {
      throw deleteResult.error;
    }
  }

  if (banners.length === 0) {
    return;
  }

  const result = await supabase.from("promotion_banners").upsert(
    banners.map((banner, index) => ({
      cta_text: banner.ctaText,
      desktop_image_url: banner.desktopImageUrl || null,
      id: banner.id || undefined,
      is_active: banner.isActive,
      mobile_image_url: banner.mobileImageUrl || null,
      sort_order: banner.sortOrder || index + 1,
      subtitle: banner.subtitle,
      target_url: banner.targetUrl || "/products",
      title: banner.title,
    })),
    { onConflict: "id" }
  );

  if (result.error) {
    throw result.error;
  }
}

export async function uploadUrbanixAsset(file: File, bucket: "product-images" | "banners" | "logos", folder: string) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    throw new Error("Supabase Storage upload requires server-side Supabase credentials.");
  }

  if (file.size === 0) {
    return "";
  }

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const filePath = `${safeFolder}/${crypto.randomUUID()}.${extension}`;
  const uploadResult = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(uploadResult.data.path);
  return data.publicUrl;
}

export async function upsertOrder(order: UrbanixOrder) {
  const supabase = createSupabaseStoreClient();

  if (!supabase) {
    const data = readUrbanixStoreData();
    const nextOrder = normalizeOrder(order);
    data.orders = [nextOrder, ...data.orders.filter((item) => item.id !== order.id)];
    writeUrbanixStoreData(data);
    return nextOrder;
  }

  const insertOrder = await supabase
    .from("orders")
    .insert({
      created_at: order.createdAt,
      customer_email: order.customer.email,
      customer_name: order.customer.fullName,
      customer_phone: order.customer.phone,
      delivery_note: order.customer.deliveryNote || null,
      discount_amount: order.totals.discount,
      id: order.id,
      order_number: order.orderNumber,
      order_status: order.orderStatus,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      shipping_address: order.customer as unknown as Json,
      shipping_fee: order.totals.shipping,
      subtotal: order.totals.subtotal,
      total_amount: order.totals.total,
    });

  if (insertOrder.error) {
    throw insertOrder.error;
  }

  const orderItems = order.items.map((item) => ({
    order_id: order.id,
    product_id: null,
    product_name: item.product.name,
    product_sku: item.product.sku,
    quantity: item.quantity,
    total_price: item.lineTotal,
    unit_price: item.product.price,
  }));

  if (orderItems.length > 0) {
    const insertItems = await supabase.from("order_items").insert(orderItems);

    if (insertItems.error) {
      throw insertItems.error;
    }
  }

  return normalizeOrder(order);
}

function normalizeOrder(order: UrbanixOrder): UrbanixOrder {
  return {
    ...order,
    customerEmail: order.customerEmail ?? order.customer.email,
    customerName: order.customerName ?? order.customer.fullName,
    customerPhone: order.customerPhone ?? order.customer.phone,
    deliveryNote: order.deliveryNote ?? order.customer.deliveryNote,
    discountAmount: order.discountAmount ?? order.totals.discount,
    shippingAddress: order.shippingAddress ?? order.customer,
    shippingFee: order.shippingFee ?? order.totals.shipping,
    subtotal: order.subtotal ?? order.totals.subtotal,
    totalAmount: order.totalAmount ?? order.totals.total,
    updatedAt: new Date().toISOString(),
  };
}

export async function updateOrderStatuses(
  orderId: string,
  statuses: Pick<UrbanixOrder, "orderStatus" | "paymentStatus">
) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.orders = data.orders.map((order) => (order.id === orderId ? { ...order, ...statuses } : order));
    writeUrbanixStoreData(data);
    return;
  }

  const result = await supabase
    .from("orders")
    .update({
      order_status: statuses.orderStatus,
      payment_status: statuses.paymentStatus,
    })
    .eq("id", orderId);

  if (result.error) {
    throw result.error;
  }
}
