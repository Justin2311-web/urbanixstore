import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ecommerce/database";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  defaultUrbanixStoreData,
  getCategoryIdByName,
  getDisplayPrice,
  type HomepageContent,
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
