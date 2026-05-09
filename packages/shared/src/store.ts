import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ecommerce/database";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  defaultUrbanixStoreData,
  getCategoryIdByName,
  getDisplayPrice,
  platformConfig,
  type FooterContent,
  type HomepageContent,
  type LocalizedTextValue,
  type PaymentSettings,
  type ProductCategory,
  type PromotionBanner,
  type StoreSettings,
  type UrbanixProduct,
  type UrbanixStoreData,
} from "./index";

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
    footer: { ...defaultUrbanixStoreData.footer, ...data.footer },
    products: data.products ?? defaultUrbanixStoreData.products,
    promotionBanners: data.promotionBanners ?? defaultUrbanixStoreData.promotionBanners,
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

function getGoogleSheetConfig() {
  const sheetId = process.env.GOOGLE_SHEET_ID ?? process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID;
  const endpoint = process.env.GOOGLE_SHEET_CMS_URL ?? process.env.NEXT_PUBLIC_GOOGLE_SHEET_CMS_URL;

  if (!sheetId && !endpoint) {
    return null;
  }

  return { endpoint, sheetId };
}

function createSupabaseStoreClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getPublicSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          next: { revalidate: 0 },
        } as RequestInit & { next?: { revalidate: number } }),
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });
}

function asStringArray(value: Json | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function localized(en: string, zh?: string, ms?: string): LocalizedTextValue {
  return {
    en: en.trim(),
    zh: zh?.trim() || en.trim(),
    ms: ms?.trim() || en.trim(),
  };
}

function cell(row: Record<string, string>, key: string) {
  return String(row[key] ?? "").trim();
}

function numberCell(row: Record<string, string>, key: string, fallback = 0) {
  const value = Number(cell(row, key));
  return Number.isFinite(value) ? value : fallback;
}

function isActive(row: Record<string, string>) {
  return cell(row, "status").toLowerCase() === "active";
}

function sortRows(first: Record<string, string>, second: Record<string, string>) {
  return numberCell(first, "sort_order", 9999) - numberCell(second, "sort_order", 9999);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseGoogleVisualizationJson(text: string): Record<string, string>[] {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?$/);
  const payload = JSON.parse(match?.[1] ?? text) as {
    table?: {
      cols?: Array<{ label?: string }>;
      rows?: Array<{ c?: Array<{ v?: unknown; f?: string }> }>;
    };
  };
  const columns = payload.table?.cols?.map((column) => column.label || "") ?? [];

  return (payload.table?.rows ?? []).map((row) => {
    const next: Record<string, string> = {};

    columns.forEach((column, index) => {
      if (column) {
        const value = row.c?.[index]?.f ?? row.c?.[index]?.v ?? "";
        next[column] = String(value);
      }
    });

    return next;
  });
}

async function fetchSheetRows(tab: string): Promise<Record<string, string>[]> {
  const config = getGoogleSheetConfig();

  if (!config) {
    return [];
  }

  const url = config.endpoint
    ? config.endpoint.replace("{sheet}", encodeURIComponent(tab)).replace("{tab}", encodeURIComponent(tab))
    : `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(tab)}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
    next: { revalidate: 0 },
  } as RequestInit & { next?: { revalidate: number } });

  if (!response.ok) {
    throw new Error(`Google Sheet tab "${tab}" returned ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const data = await response.json() as Record<string, string>[] | { rows?: Record<string, string>[] };
    return Array.isArray(data) ? data : data.rows ?? [];
  }

  return parseGoogleVisualizationJson(await response.text());
}

function footerText(footer: FooterContent, key: string, fallback: LocalizedTextValue): LocalizedTextValue {
  return footer[key] ?? fallback;
}

function mapGoogleProduct(row: Record<string, string>, categoriesById: Map<string, ProductCategory>): UrbanixProduct {
  const categoryId = cell(row, "category_id");
  const category = categoriesById.get(categoryId);
  const images = Array.from({ length: 9 }, (_, index) => cell(row, `image_${index + 1}`)).filter(Boolean);
  const price = numberCell(row, "price");
  const compareAtPrice = numberCell(row, "compare_at_price");

  return {
    category: category?.name ?? categoryId,
    categoryId,
    description: cell(row, "description_en"),
    featured: true,
    fullDescription: cell(row, "description_en"),
    galleryImages: images,
    highlights: [],
    id: cell(row, "product_id") || cell(row, "slug"),
    image: images[0] ?? "",
    imageTone: "fan-green",
    isActive: true,
    isFeatured: true,
    lazadaUrl: cell(row, "lazada_url"),
    localizedDescription: localized(cell(row, "description_en"), cell(row, "description_zh"), cell(row, "description_ms")),
    localizedName: localized(cell(row, "name_en"), cell(row, "name_zh"), cell(row, "name_ms")),
    mainImageUrl: images[0] ?? "",
    name: cell(row, "name_en"),
    normalPrice: compareAtPrice || price,
    originalPrice: compareAtPrice > price ? compareAtPrice : undefined,
    price,
    productImages: images.map((imageUrl, index) => ({
      imageUrl,
      isPrimary: index === 0,
      sortOrder: index,
    })),
    rating: 4.8,
    relatedCategory: categoryId,
    returnNote: "Returns and exchanges depend on marketplace policy.",
    shippingInfo: "Shipping details are confirmed during order chat.",
    shopeeUrl: cell(row, "shopee_url"),
    shortDescription: cell(row, "description_en"),
    sku: cell(row, "sku"),
    slug: cell(row, "slug") || slugify(cell(row, "name_en")),
    sold: 0,
    specifications: [],
    status: "active",
    stockQuantity: 99,
    stockStatus: "in_stock",
  };
}

async function readGoogleSheetStoreData(): Promise<UrbanixStoreData | null> {
  if (!getGoogleSheetConfig()) {
    return null;
  }

  const [productRows, categoryRows, bannerRows, settingRows, footerRows] = await Promise.all([
    fetchSheetRows("Products"),
    fetchSheetRows("Categories"),
    fetchSheetRows("Banners"),
    fetchSheetRows("StoreSettings"),
    fetchSheetRows("Footer"),
  ]);
  const categories = categoryRows
    .filter(isActive)
    .sort(sortRows)
    .map((row): ProductCategory => ({
      active: true,
      description: "",
      href: `/categories?category=${cell(row, "category_id")}`,
      icon: cell(row, "icon"),
      id: cell(row, "category_id"),
      isActive: true,
      localizedName: localized(cell(row, "name_en"), cell(row, "name_zh"), cell(row, "name_ms")),
      name: cell(row, "name_en"),
      slug: cell(row, "category_id"),
      sortOrder: numberCell(row, "sort_order"),
      tone: (cell(row, "tone") || "mint") as ProductCategory["tone"],
    }));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const products = productRows
    .filter(isActive)
    .sort(sortRows)
    .map((row) => mapGoogleProduct(row, categoriesById));
  const promotionBanners = bannerRows
    .filter(isActive)
    .sort(sortRows)
    .map((row): PromotionBanner => ({
      ctaText: cell(row, "button_text_en"),
      desktopImageUrl: cell(row, "desktop_image_url"),
      id: cell(row, "banner_id"),
      isActive: true,
      localizedCtaText: localized(cell(row, "button_text_en"), cell(row, "button_text_zh"), cell(row, "button_text_ms")),
      localizedSubtitle: localized(cell(row, "subtitle_en"), cell(row, "subtitle_zh"), cell(row, "subtitle_ms")),
      localizedTitle: localized(cell(row, "title_en"), cell(row, "title_zh"), cell(row, "title_ms")),
      mobileImageUrl: cell(row, "mobile_image_url"),
      sortOrder: numberCell(row, "sort_order"),
      subtitle: cell(row, "subtitle_en"),
      targetUrl: cell(row, "target_url") || "/products",
      title: cell(row, "title_en"),
    }));
  const settingsMap = new Map(settingRows.map((row) => [cell(row, "key"), cell(row, "value")]));
  const footer = Object.fromEntries(footerRows.map((row) => [
    cell(row, "key"),
    localized(cell(row, "en"), cell(row, "zh"), cell(row, "ms")),
  ])) as FooterContent;
  const freeShippingText = localized(
    settingsMap.get("free_shipping_text_en") || `Free Shipping for orders over RM${settingsMap.get("free_shipping_threshold") || platformConfig.freeShippingThreshold}`,
    settingsMap.get("free_shipping_text_zh") || "",
    settingsMap.get("free_shipping_text_ms") || ""
  );
  const settings: StoreSettings = {
    ...defaultUrbanixStoreData.settings,
    contactEmail: settingsMap.get("contact_email") || defaultUrbanixStoreData.settings.contactEmail,
    contactPhone: settingsMap.get("contact_phone") || defaultUrbanixStoreData.settings.contactPhone,
    freeShippingMinimumAmount: Number(settingsMap.get("free_shipping_threshold") || platformConfig.freeShippingThreshold),
    freeShippingMinAmount: Number(settingsMap.get("free_shipping_threshold") || platformConfig.freeShippingThreshold),
    freeShippingText,
    logo: settingsMap.get("logo_url") || defaultUrbanixStoreData.settings.logo,
    logoUrl: settingsMap.get("logo_url") || "",
    platformLinks: {
      lazada: settingsMap.get("lazada_url") || "",
      shopee: settingsMap.get("shopee_url") || "",
    },
    socialLinks: {
      facebook: settingsMap.get("facebook_url") || "",
      instagram: settingsMap.get("instagram_url") || "",
      tiktok: settingsMap.get("tiktok_url") || "",
    },
    storeName: settingsMap.get("store_name") || defaultUrbanixStoreData.settings.storeName,
    storeTagline: footerText(footer, "store_tagline", { en: defaultUrbanixStoreData.settings.storeTagline }).en,
    whatsappNumber: settingsMap.get("whatsapp_number") || defaultUrbanixStoreData.settings.whatsappNumber,
  };
  const homepage: HomepageContent = {
    ...defaultUrbanixStoreData.homepage,
    featuredCategoryCards: categories.map((category) => category.id),
    heroButtonLink: promotionBanners[0]?.targetUrl ?? "/products",
    heroButtonText: promotionBanners[0]?.ctaText ?? defaultUrbanixStoreData.homepage.heroButtonText,
    heroSubtitle: promotionBanners[0]?.subtitle ?? defaultUrbanixStoreData.homepage.heroSubtitle,
    heroTitle: promotionBanners[0]?.title ?? defaultUrbanixStoreData.homepage.heroTitle,
    promotionStripText: freeShippingText.en,
    promoStripText: freeShippingText.en,
  };

  return mergeStoreData({
    categories,
    footer,
    homepage,
    payments: {
      ...defaultUrbanixStoreData.payments,
      whatsAppOrderEnabled: true,
    },
    products,
    promotionBanners,
    settings,
  });
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
  const category = row.category_id ? categoriesById.get(row.category_id) : undefined;
  const galleryImages = (imagesByProductId.get(row.id) ?? []).map((image) => image.image_url);
  const product: UrbanixProduct = {
    category: category?.name ?? "Uncategorized",
    categoryId: category?.id,
    createdAt: row.created_at,
    description: row.description ?? "",
    featured: row.is_featured,
    fullDescription: row.description ?? "",
    galleryImages,
    highlights: asStringArray(row.highlights),
    id: row.slug,
    image: row.main_image_url ?? galleryImages[0] ?? "",
    imageTone: (row.image_tone as UrbanixProduct["imageTone"] | null) ?? "fan-green",
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
    rating: Number(row.rating ?? 0),
    relatedCategory: category?.id,
    returnNote: row.return_note ?? "",
    shippingInfo: row.shipping_info ?? "",
    shortDescription: row.short_description ?? "",
    sku: row.sku,
    slug: row.slug,
    sold: row.sold ?? 0,
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
    currency: row.currency,
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

export async function readUrbanixStoreDataAsync(): Promise<UrbanixStoreData> {
  try {
    const googleSheetData = await readGoogleSheetStoreData();

    if (googleSheetData) {
      return googleSheetData;
    }
  } catch (error) {
    console.error("[Urbanix] Google Sheet CMS unavailable, falling back to Supabase/static data.", error);
  }

  const supabase = createSupabaseStoreClient();

  if (!supabase) {
    if (process.env.VERCEL) {
      throw new Error("Missing Supabase environment variables for live Urbanix data.");
    }

    return readUrbanixStoreData();
  }

  const [
    categoriesResult,
    productsResult,
    imagesResult,
    settingsResult,
    bannersResult,
    paymentsResult,
    promotionBannersResult,
  ] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("product_images").select("*").order("sort_order", { ascending: true }),
    supabase.from("store_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("banners").select("*").eq("id", true).maybeSingle(),
    supabase.from("payment_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("promotion_banners").select("*").order("sort_order", { ascending: true }),
  ]);

  const publicError = [
    categoriesResult.error,
    productsResult.error,
    imagesResult.error,
    settingsResult.error,
    bannersResult.error,
    paymentsResult.error,
    promotionBannersResult.error,
  ].find(Boolean);

  if (publicError) {
    throw publicError;
  }

  const categoriesByUuid = new Map((categoriesResult.data ?? []).map((row) => [row.id, mapCategory(row)]));
  const imagesByProductId = new Map<string, Database["public"]["Tables"]["product_images"]["Row"][]>();

  for (const image of imagesResult.data ?? []) {
    imagesByProductId.set(image.product_id, [...(imagesByProductId.get(image.product_id) ?? []), image]);
  }

  const categories = (categoriesResult.data ?? []).map(mapCategory);
  const products = (productsResult.data ?? []).map((row) =>
    mapProduct({
      categoriesById: categoriesByUuid,
      imagesByProductId,
      row,
    })
  );

  return mergeStoreData({
    categories,
    homepage: mapHomepage(bannersResult.data),
    payments: mapPaymentSettings(paymentsResult.data),
    products,
    promotionBanners: (promotionBannersResult.data ?? []).map(mapPromotionBanner),
    settings: mapStoreSettings(settingsResult.data),
  });
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
