import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ecommerce/database";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  defaultUrbanixStoreData,
  getCategoryIdByName,
  getDisplayPrice,
  platformConfig,
  type CheckoutCustomer,
  type FooterContent,
  type HomepageContent,
  type LocalizedTextValue,
  type PaymentSettings,
  type ProductCategory,
  type ProductVariantGroup,
  type ProductVariantOption,
  type PromotionBanner,
  type StoreSettings,
  type StorefrontPage,
  type UrbanixOrder,
  type UrbanixProduct,
  type UrbanixStoreData,
} from "./index";

type SupabaseStoreClient = SupabaseClient;
type StoreReadOptions = {
  includeOrders?: boolean;
};

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
    pages: data.pages ?? defaultUrbanixStoreData.pages,
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

function createSupabaseStoreClient({ admin = false } = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = admin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY ?? getPublicSupabaseKey()
    : getPublicSupabaseKey();

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

function booleanCell(row: Record<string, string>, key: string, fallback = false) {
  const value = cell(row, key).toLowerCase();

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "y", "on"].includes(value);
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

function groupProductVariants(options: ProductVariantOption[]): ProductVariantGroup[] {
  const groups = new Map<string, ProductVariantGroup>();

  for (const option of options.toSorted((first, second) => first.sortOrder - second.sortOrder)) {
    const groupId = slugify(option.optionName);
    const existing = groups.get(groupId);

    if (existing) {
      existing.options.push(option);
      existing.sortOrder = Math.min(existing.sortOrder, option.sortOrder);
      continue;
    }

    groups.set(groupId, {
      id: groupId,
      localizedOptionName: option.localizedOptionName,
      optionName: option.optionName,
      options: [option],
      sortOrder: option.sortOrder,
    });
  }

  return [...groups.values()].toSorted((first, second) => first.sortOrder - second.sortOrder);
}

function isUsableAssetUrl(value: string | null | undefined) {
  return Boolean(value && (/^(https?:)?\/\//.test(value) || value.startsWith("/")));
}

function withoutReturnBadges(values: string[]) {
  return values.filter((value) => !value.toLowerCase().includes("return"));
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
    : `https://docs.google.com/spreadsheets/d/${config.sheetId}/gviz/tq?tqx=out:json&headers=1&sheet=${encodeURIComponent(tab)}`;
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

async function fetchOptionalSheetRows(tab: string): Promise<Record<string, string>[]> {
  try {
    return await fetchSheetRows(tab);
  } catch (error) {
    console.warn(`[Urbanix] Optional Google Sheet tab "${tab}" unavailable.`, error);
    return [];
  }
}

function footerText(footer: FooterContent, key: string, fallback: LocalizedTextValue): LocalizedTextValue {
  return footer[key] ?? fallback;
}

function mapGoogleVariant(row: Record<string, string>): ProductVariantOption {
  return {
    id: cell(row, "variant_id"),
    imageUrl: cell(row, "variant_image_url"),
    isActive: true,
    localizedOptionName: localized(cell(row, "option_name_en"), cell(row, "option_name_zh"), cell(row, "option_name_ms")),
    localizedOptionValue: localized(cell(row, "option_value_en"), cell(row, "option_value_zh"), cell(row, "option_value_ms")),
    optionName: cell(row, "option_name_en"),
    optionValue: cell(row, "option_value_en"),
    priceAdjustment: numberCell(row, "price_adjustment"),
    productId: cell(row, "product_id"),
    sku: cell(row, "variant_sku"),
    sortOrder: numberCell(row, "sort_order"),
  };
}

function mapGoogleProduct({
  categoriesById,
  row,
  variants,
}: {
  row: Record<string, string>;
  categoriesById: Map<string, ProductCategory>;
  variants: ProductVariantOption[];
}): UrbanixProduct {
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
    returnNote: "",
    shippingInfo: "Free shipping applies for orders above RM40. Delivery details are confirmed during order chat.",
    shopeeUrl: cell(row, "shopee_url"),
    shortDescription: cell(row, "description_en"),
    sku: cell(row, "sku"),
    slug: cell(row, "slug") || slugify(cell(row, "name_en")),
    sold: 0,
    specifications: [],
    status: "active",
    stockQuantity: 99,
    stockStatus: "in_stock",
    variantGroups: groupProductVariants(variants),
    variantOptions: variants,
  };
}

async function readGoogleSheetStoreData(): Promise<UrbanixStoreData | null> {
  if (!getGoogleSheetConfig()) {
    return null;
  }

  const [productRows, categoryRows, bannerRows, settingRows, footerRows, pageRows, variantRows] = await Promise.all([
    fetchSheetRows("Products"),
    fetchSheetRows("Categories"),
    fetchSheetRows("Banners"),
    fetchSheetRows("StoreSettings"),
    fetchSheetRows("Footer"),
    fetchSheetRows("Pages"),
    fetchOptionalSheetRows("ProductVariants"),
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
  const variantsByProductId = new Map<string, ProductVariantOption[]>();

  for (const variant of variantRows.filter(isActive).sort(sortRows).map(mapGoogleVariant)) {
    variantsByProductId.set(variant.productId, [...(variantsByProductId.get(variant.productId) ?? []), variant]);
  }

  const products = productRows
    .filter(isActive)
    .sort(sortRows)
    .map((row) => {
      const productId = cell(row, "product_id") || cell(row, "slug");

      return mapGoogleProduct({
        categoriesById,
        row,
        variants: variantsByProductId.get(productId) ?? [],
      });
    });
  const promotionBanners = bannerRows
    .filter(isActive)
    .sort(sortRows)
    .map((row): PromotionBanner => {
      const buttonUrl = cell(row, "button_url") || cell(row, "target_url") || "";
      const imageClickUrl = cell(row, "image_click_url") || cell(row, "target_url") || buttonUrl || "/products";
      const buttonText = cell(row, "button_text_en");

      return {
        buttonEnabled: booleanCell(row, "button_enabled", Boolean(buttonText && buttonUrl)),
        buttonUrl,
        ctaText: buttonText,
        desktopImageUrl: cell(row, "desktop_image_url"),
        id: cell(row, "banner_id"),
        imageClickUrl,
        isActive: true,
        localizedCtaText: localized(buttonText, cell(row, "button_text_zh"), cell(row, "button_text_ms")),
        localizedSubtitle: localized("", "", ""),
        localizedTitle: localized("", "", ""),
        mobileImageUrl: cell(row, "mobile_image_url"),
        sortOrder: numberCell(row, "sort_order"),
        subtitle: "",
        targetUrl: imageClickUrl,
        title: "",
      };
    });
  const settingsMap = new Map(settingRows.map((row) => [cell(row, "key"), cell(row, "value")]));
  const footer = Object.fromEntries(footerRows.map((row) => [
    cell(row, "key"),
    localized(cell(row, "en"), cell(row, "zh"), cell(row, "ms")),
  ])) as FooterContent;
  const pages = pageRows
    .filter(isActive)
    .sort(sortRows)
    .map((row): StorefrontPage => ({
      content: cell(row, "content_en"),
      isActive: true,
      key: cell(row, "page_key"),
      localizedContent: localized(cell(row, "content_en"), cell(row, "content_zh"), cell(row, "content_ms")),
      localizedTitle: localized(cell(row, "title_en"), cell(row, "title_zh"), cell(row, "title_ms")),
      sortOrder: numberCell(row, "sort_order"),
      title: cell(row, "title_en"),
    }));
  const freeShippingText = localized(
    settingsMap.get("free_shipping_text_en") || "Free shipping for orders above RM40",
    settingsMap.get("free_shipping_text_zh") || "订单满 RM40 即可免邮",
    settingsMap.get("free_shipping_text_ms") || "Penghantaran percuma untuk pesanan melebihi RM40"
  );
  const settings: StoreSettings = {
    ...defaultUrbanixStoreData.settings,
    contactEmail: settingsMap.get("contact_email") || defaultUrbanixStoreData.settings.contactEmail,
    contactPhone: settingsMap.get("contact_phone") || defaultUrbanixStoreData.settings.contactPhone,
    freeShippingMinimumAmount: Number(settingsMap.get("free_shipping_threshold") || 40),
    freeShippingMinAmount: Number(settingsMap.get("free_shipping_threshold") || 40),
    freeShippingText,
    logo: settingsMap.get("logo_url") || defaultUrbanixStoreData.settings.logo,
    logoUrl: settingsMap.get("logo_url") || defaultUrbanixStoreData.settings.logoUrl,
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
    heroButtonLink: promotionBanners[0]?.buttonUrl || promotionBanners[0]?.imageClickUrl || "/products",
    heroButtonText: promotionBanners[0]?.ctaText ?? defaultUrbanixStoreData.homepage.heroButtonText,
    heroSubtitle: defaultUrbanixStoreData.homepage.heroSubtitle,
    heroTitle: freeShippingText.en,
    promotionStripText: freeShippingText.en,
    promoStripText: freeShippingText.en,
  };

  return mergeStoreData({
    categories,
    footer,
    homepage,
    pages,
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
    returnNote: "",
    shippingInfo: "Free shipping applies for orders above RM40. Delivery details are confirmed during order chat.",
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
    freeShippingMinimumAmount: 40,
    freeShippingMinAmount: 40,
    freeShippingText: defaultUrbanixStoreData.settings.freeShippingText,
    logo: isUsableAssetUrl(row.logo_url) ? row.logo_url ?? "" : defaultUrbanixStoreData.settings.logo,
    logoUrl: isUsableAssetUrl(row.logo_url) ? row.logo_url ?? "" : defaultUrbanixStoreData.settings.logoUrl,
    maintenanceMessage: row.maintenance_message ?? undefined,
    platformLinks: {
      lazada: typeof socialLinks.lazada === "string" ? socialLinks.lazada : defaultUrbanixStoreData.settings.platformLinks?.lazada ?? "",
      shopee: typeof socialLinks.shopee === "string" ? socialLinks.shopee : defaultUrbanixStoreData.settings.platformLinks?.shopee ?? "",
    },
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
    whatsappNumber: row.whatsapp_number || defaultUrbanixStoreData.settings.whatsappNumber,
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
    promotionStripText: defaultUrbanixStoreData.homepage.promotionStripText,
    promoStripText: defaultUrbanixStoreData.homepage.promoStripText,
    trustBadgeText: withoutReturnBadges(asStringArray(row.trust_badge_text)),
  };
}

function mapPromotionBanner(row: Database["public"]["Tables"]["promotion_banners"]["Row"]): PromotionBanner {
  const targetUrl = row.target_url ?? "/products";

  return {
    buttonEnabled: Boolean(row.cta_text && targetUrl),
    buttonUrl: targetUrl,
    createdAt: row.created_at,
    ctaText: row.cta_text ?? "Shop Now",
    desktopImageUrl: row.desktop_image_url ?? "",
    id: row.id,
    imageClickUrl: targetUrl,
    isActive: row.is_active,
    mobileImageUrl: row.mobile_image_url ?? "",
    sortOrder: row.sort_order,
    subtitle: row.subtitle ?? "",
    targetUrl,
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

export async function readUrbanixStoreDataAsync(options: StoreReadOptions = {}): Promise<UrbanixStoreData> {
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

  let orders: UrbanixOrder[] = [];

  if (options.includeOrders) {
    const ordersResult = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (!ordersResult.error) {
      orders = (ordersResult.data ?? []).map((row) => mapOrder(row));
    }
  }

  return mergeStoreData({
    categories,
    homepage: mapHomepage(bannersResult.data),
    orders,
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

export function listStorefrontPages(data = readUrbanixStoreData()) {
  return data.pages
    .filter((page) => page.isActive)
    .toSorted((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0));
}

export function getStorefrontPageByKey(pageKey: string, data = readUrbanixStoreData()) {
  return listStorefrontPages(data).find((page) => page.key === pageKey);
}

// ─── Admin write helpers ──────────────────────────────────────────────────────

function toJsonArray(lines: string[]): Json {
  return lines as Json;
}

function dateOrNull(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isAssetUrl(value?: string | null): boolean {
  return Boolean(value && (/^(https?:)?\/\//.test(value) || value.startsWith("/")));
}

function mapOrder(row: { id: string; order_number: string; customer_name: string; customer_phone: string; customer_email?: string | null; shipping_address?: unknown; delivery_note?: string | null; subtotal: number; shipping_fee: number; discount_amount: number; total_amount: number; payment_method: string; payment_status: string; order_status: string; created_at: string; updated_at?: string; order_items?: Array<{ id: string; product_name: string; product_sku: string; quantity: number; unit_price: number; total_price: number }> }): UrbanixOrder {
  const address = (row.shipping_address ?? {}) as Partial<CheckoutCustomer>;
  const customer: CheckoutCustomer = {
    addressLine1: address.addressLine1 ?? "",
    addressLine2: address.addressLine2 ?? "",
    city: address.city ?? "",
    country: address.country ?? "Malaysia",
    deliveryNote: row.delivery_note ?? "",
    email: row.customer_email ?? address.email ?? "",
    fullName: row.customer_name,
    phone: row.customer_phone,
    postcode: address.postcode ?? "",
    state: address.state ?? "",
  };

  return {
    createdAt: row.created_at,
    customer,
    customerEmail: row.customer_email ?? "",
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    deliveryNote: row.delivery_note ?? "",
    discountAmount: Number(row.discount_amount),
    id: row.id,
    items: (row.order_items ?? []).map((item) => ({
      lineTotal: Number(item.total_price),
      product: {
        id: item.product_sku,
        name: item.product_name,
        price: Number(item.unit_price),
        sku: item.product_sku,
      } as UrbanixProduct,
      quantity: item.quantity,
      totalPrice: Number(item.total_price),
      unitPrice: Number(item.unit_price),
    })),
    orderNumber: row.order_number,
    orderStatus: row.order_status as UrbanixOrder["orderStatus"],
    paymentMethod: row.payment_method as UrbanixOrder["paymentMethod"],
    paymentStatus: row.payment_status as UrbanixOrder["paymentStatus"],
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
    updatedAt: row.updated_at ?? row.created_at,
  };
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

  if (categoryResult.error) throw categoryResult.error;
  if (!categoryResult.data?.id) throw new Error(`Category "${categorySlug}" not found in Supabase.`);

  const upsertResult = await supabase
    .from("products")
    .upsert(
      {
        category_id: categoryResult.data.id,
        description: product.fullDescription || product.description,
        highlights: toJsonArray(product.highlights ?? []),
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
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (upsertResult.error) throw upsertResult.error;

  await syncProductImages(supabase, upsertResult.data.id, product.galleryImages ?? []);
  return product;
}

async function syncProductImages(supabase: SupabaseStoreClient, productId: string, galleryImages: string[]) {
  const deleteResult = await supabase.from("product_images").delete().eq("product_id", productId);
  if (deleteResult.error) throw deleteResult.error;

  const imageRows = galleryImages
    .filter(Boolean)
    .map((imageUrl, index) => ({
      alt_text: null,
      image_url: imageUrl,
      is_primary: index === 0,
      product_id: productId,
      sort_order: index,
    }));

  if (imageRows.length === 0) return;

  const insertResult = await supabase.from("product_images").insert(imageRows);
  if (insertResult.error) throw insertResult.error;
}

export async function updateCategories(categories: ProductCategory[]) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.categories = categories.map((c, i) => ({
      ...c,
      active: c.active ?? c.isActive ?? true,
      href: c.href || `/categories?category=${c.slug ?? c.id}`,
      isActive: c.isActive ?? c.active ?? true,
      slug: c.slug ?? c.id,
      sortOrder: c.sortOrder ?? i + 1,
    }));
    writeUrbanixStoreData(data);
    return;
  }

  const result = await supabase.from("categories").upsert(
    categories.map((c, i) => ({
      description: c.description,
      image_url: c.imageUrl ?? null,
      is_active: c.active ?? c.isActive ?? true,
      name: c.name,
      slug: c.slug ?? c.id,
      sort_order: c.sortOrder ?? i + 1,
      tone: c.tone,
    })),
    { onConflict: "slug" }
  );

  if (result.error) throw result.error;
}

export async function replaceCategories(categories: ProductCategory[], deletedSlugs: string[] = []) {
  const normalized = categories.map((c, i) => ({
    ...c,
    active: c.active ?? c.isActive ?? true,
    href: c.href || `/categories?category=${c.slug ?? c.id}`,
    id: c.slug ?? c.id,
    isActive: c.isActive ?? c.active ?? true,
    slug: c.slug ?? c.id,
    sortOrder: c.sortOrder ?? i + 1,
  }));
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.categories = normalized.filter((c) => !deletedSlugs.includes(c.slug ?? c.id));
    writeUrbanixStoreData(data);
    return;
  }

  if (deletedSlugs.length > 0) {
    const del = await supabase.from("categories").delete().in("slug", deletedSlugs);
    if (del.error) throw del.error;
  }

  await updateCategories(normalized);
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

  if (result.error) throw result.error;

  const primaryBannerResult = await supabase
    .from("promotion_banners")
    .select("id, desktop_image_url, mobile_image_url")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (primaryBannerResult.error) throw primaryBannerResult.error;

  const bannerPayload = {
    cta_text: homepage.heroButtonText || "Shop Now",
    desktop_image_url: isAssetUrl(homepage.heroImage) ? homepage.heroImage : primaryBannerResult.data?.desktop_image_url ?? null,
    is_active: homepage.isActive ?? true,
    mobile_image_url: primaryBannerResult.data?.mobile_image_url ?? null,
    sort_order: 1,
    subtitle: homepage.heroSubtitle,
    target_url: homepage.heroButtonLink || "/products",
    title: homepage.heroTitle,
  };

  const promoResult = primaryBannerResult.data?.id
    ? await supabase.from("promotion_banners").update(bannerPayload).eq("id", primaryBannerResult.data.id)
    : await supabase.from("promotion_banners").insert(bannerPayload);

  if (promoResult.error) throw promoResult.error;
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

  if (result.error) throw result.error;
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

  if (result.error) throw result.error;
}

export async function upsertPromotionBanners(banners: PromotionBanner[], deletedIds: string[] = []) {
  const supabase = createSupabaseStoreClient({ admin: true });

  if (!supabase) {
    const data = readUrbanixStoreData();
    data.promotionBanners = banners
      .filter((b) => !deletedIds.includes(b.id))
      .toSorted((a, b) => a.sortOrder - b.sortOrder);
    writeUrbanixStoreData(data);
    return;
  }

  if (deletedIds.length > 0) {
    const del = await supabase.from("promotion_banners").delete().in("id", deletedIds);
    if (del.error) throw del.error;
  }

  if (banners.length === 0) return;

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

  if (result.error) throw result.error;
}

export async function uploadUrbanixAsset(file: File, bucket: "product-images" | "banners" | "logos", folder: string) {
  const supabase = createSupabaseStoreClient({ admin: true });
  if (!supabase) throw new Error("Supabase Storage upload requires SUPABASE_SERVICE_ROLE_KEY.");
  if (file.size === 0) return "";

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "webp";
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const filePath = `${safeFolder}/${crypto.randomUUID()}.${extension}`;
  const uploadResult = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (uploadResult.error) throw uploadResult.error;

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

  const insertOrder = await supabase.from("orders").insert({
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

  if (insertOrder.error) throw insertOrder.error;

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
    if (insertItems.error) throw insertItems.error;
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
    data.orders = data.orders.map((o) => (o.id === orderId ? { ...o, ...statuses } : o));
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

  if (result.error) throw result.error;
}
