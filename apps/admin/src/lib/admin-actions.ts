"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updateHomepage,
  updateOrderStatuses,
  updatePaymentSettings,
  updateStoreSettings,
  replaceCategories,
  uploadUrbanixAsset,
  upsertPromotionBanners,
  upsertProduct,
  readUrbanixStoreDataAsync,
} from "@ecommerce/shared/store";
import {
  getCategoryIdByName,
  type HomepageContent,
  type PaymentSettings,
  type ProductCategory,
  type PromotionBanner,
  type UrbanixOrder,
  type UrbanixProduct,
  type StoreSettings,
} from "@ecommerce/shared";

async function revalidateStorefront() {
  const storefrontUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (!storefrontUrl || !secret) {
    try {
      await fetch(`http://localhost:3000/api/revalidate?secret=${secret ?? "dev"}`, {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // local storefront may not be running, ignore
    }
    return;
  }

  try {
    await fetch(`${storefrontUrl}/api/revalidate?secret=${secret}`, {
      method: "POST",
      cache: "no-store",
    });
  } catch (error) {
    console.error("[Admin] Failed to revalidate storefront:", error);
  }
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  return Number(text(formData, key) || 0);
}

function boolValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function lines(formData: FormData, key: string) {
  return text(formData, key)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jsonStringArray(formData: FormData, key: string) {
  try {
    const value = JSON.parse(text(formData, key));
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

type BannerLang = "en" | "zh" | "ms";
const bannerLangs: BannerLang[] = ["en", "zh", "ms"];

function encodeLocalizedImages(images: Record<BannerLang, string>) {
  const fallback = images.en || images.zh || images.ms || "";
  return JSON.stringify({
    en: images.en || fallback,
    zh: images.zh || images.en || fallback,
    ms: images.ms || images.en || fallback,
  });
}

function fileValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is File => value instanceof File && value.size > 0);
}

function hasBannerUpload(formData: FormData, key: string) {
  return bannerLangs.some((lang) =>
    fileValues(formData, `${key}-desktopFile-${lang}`).length > 0 ||
    fileValues(formData, `${key}-mobileFile-${lang}`).length > 0
  );
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const details = error as Record<string, unknown>;
    return [details.code, details.message, details.details, details.hint]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
      .join(" | ") || JSON.stringify(details);
  }
  return String(error);
}

async function getProductImageUrls(formData: FormData, slug: string, existingImages: string[]) {
  const files = fileValues(formData, "productImageFiles");
  const tokens = jsonStringArray(formData, "productImageOrder");
  const uploadedByIndex = new Map<number, string>();
  const uploadFileAt = async (index: number) => {
    if (!uploadedByIndex.has(index) && files[index]) {
      uploadedByIndex.set(index, await uploadUrbanixAsset(files[index], "product-images", slug));
    }

    return uploadedByIndex.get(index) ?? "";
  };

  if (tokens.length === 0) {
    const uploaded = await Promise.all(files.slice(0, Math.max(0, 9 - existingImages.length)).map((file) =>
      uploadUrbanixAsset(file, "product-images", slug)
    ));

    return [...existingImages, ...uploaded].filter(Boolean).slice(0, 9);
  }

  const urls: string[] = [];

  for (const token of tokens) {
    if (urls.length >= 9) {
      break;
    }

    if (token.startsWith("existing:")) {
      const url = token.slice("existing:".length);

      if (existingImages.includes(url)) {
        urls.push(url);
      }
    }

    if (token.startsWith("file:")) {
      const uploaded = await uploadFileAt(Number(token.slice("file:".length)));

      if (uploaded) {
        urls.push(uploaded);
      }
    }
  }

  return urls;
}

export async function saveProduct(formData: FormData) {
  const name = text(formData, "name");
  const id = text(formData, "id");
  const slug = text(formData, "slug") || slugify(name) || getCategoryIdByName(name);
  console.log(`[Admin] saveProduct start: id=${id} slug=${slug} name=${name}`);

  const data = await readUrbanixStoreDataAsync();
  const existingProduct = data.products.find((product) => product.id === id);
  const normalPrice = numberValue(formData, "normalPrice");
  const promotionPrice = numberValue(formData, "promotionPrice");
  const stockQuantity = numberValue(formData, "stockQuantity");
  const categoryId = text(formData, "categoryId") || existingProduct?.categoryId || data.categories[0]?.id || "";
  const category = data.categories.find((item) => item.id === categoryId || item.slug === categoryId)?.name ?? existingProduct?.category ?? "Lifestyle";
  console.log(`[Admin] saveProduct: categoryId=${categoryId} category=${category} normalPrice=${normalPrice} stock=${stockQuantity}`);

  const existingImages = jsonStringArray(formData, "existingProductImages");
  let productImageUrls: string[];
  try {
    productImageUrls = await getProductImageUrls(formData, slug, existingImages);
    console.log(`[Admin] saveProduct: imageUrls count=${productImageUrls.length}`);
  } catch (err) {
    console.error("[Admin] Image upload failed:", err);
    productImageUrls = existingImages;
  }
  const mainImageUrl = productImageUrls[0] ?? existingProduct?.image ?? "";

  // Parse variant groups from the VariantsField client component
  let variantGroups: import("@ecommerce/shared").ProductVariantGroup[] = existingProduct?.variantGroups ?? [];
  try {
    const raw = text(formData, "variantGroupsJson");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        variantGroups = parsed.map((g: import("@ecommerce/shared").ProductVariantGroup) => ({
          ...g,
          options: g.options.map((o) => ({ ...o, productId: text(formData, "id") || slug })),
        }));
      }
    }
  } catch {
    // malformed JSON — keep existing variants
  }

  const product: UrbanixProduct = {
    category,
    categoryId,
    description: text(formData, "fullDescription"),
    featured: boolValue(formData, "featured"),
    fullDescription: text(formData, "fullDescription"),
    galleryImages: productImageUrls,
    highlights: lines(formData, "highlights"),
    id: text(formData, "id") || slug,
    image: mainImageUrl,
    imageTone: existingProduct?.imageTone ?? "fan-green",
    isActive: text(formData, "status") !== "inactive",
    isFeatured: boolValue(formData, "featured"),
    mainImageUrl,
    name,
    normalPrice,
    originalPrice: promotionPrice > 0 && promotionPrice < normalPrice ? normalPrice : undefined,
    price: promotionPrice > 0 ? promotionPrice : normalPrice,
    promotionEndDate: text(formData, "promotionEndDate"),
    promotionEndAt: text(formData, "promotionEndDate"),
    promotionPrice: promotionPrice || undefined,
    promotionStartDate: text(formData, "promotionStartDate"),
    promotionStartAt: text(formData, "promotionStartDate"),
    rating: numberValue(formData, "rating") || existingProduct?.rating || 4.7,
    relatedCategory: categoryId,
    returnNote: existingProduct?.returnNote ?? "",
    shippingInfo: text(formData, "shippingInfo") || "Free shipping: West Malaysia above RM80, East Malaysia above RM150.",
    shortDescription: text(formData, "shortDescription"),
    sku: text(formData, "sku"),
    slug,
    sold: numberValue(formData, "sold") || existingProduct?.sold || 0,
    specifications: lines(formData, "specifications"),
    status: text(formData, "status") === "inactive" ? "inactive" : "active",
    stockQuantity,
    stockStatus: stockQuantity <= 0 ? "out_of_stock" : stockQuantity <= 5 ? "low_stock" : "in_stock",
    variantGroups,
  };

  console.log(`[Admin] saveProduct: calling upsertProduct for slug=${slug}`);
  try {
    await upsertProduct(product);
    console.log(`[Admin] saveProduct: upsertProduct succeeded for slug=${slug}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Admin] saveProduct upsert failed for slug=${slug}:`, message);
    redirect(`/products/${slug}/edit?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect(`/products/${slug}/edit?saved=1`);
}

export async function saveCategories(formData: FormData) {
  const keys = jsonStringArray(formData, "categoryKeys");
  const deletedSlugs: string[] = [];
  const categories = keys
    .map((key, index): ProductCategory | null => {
      const name = text(formData, `${key}-name`);
      const slug = text(formData, `${key}-slug`) || slugify(name);

      if (!name || !slug) {
        return null;
      }

      if (formData.get(`${key}-delete`) === "on") {
        deletedSlugs.push(slug);
        return null;
      }

      return {
        active: formData.get(`${key}-active`) === "on",
        description: text(formData, `${key}-description`),
        href: `/categories?category=${slug}`,
        id: slug,
        isActive: formData.get(`${key}-active`) === "on",
        name,
        slug,
        sortOrder: numberValue(formData, `${key}-sortOrder`) || index + 1,
        tone: (text(formData, `${key}-tone`) || "mint") as ProductCategory["tone"],
      };
    })
    .filter((category): category is ProductCategory => Boolean(category));

  try {
    await replaceCategories(categories, deletedSlugs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Admin] saveCategories failed:", message);
    redirect(`/categories?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect("/categories?saved=1");
}

export async function saveHomepage(formData: FormData) {
  const homepage: HomepageContent = {
    featuredCategoryCards: lines(formData, "featuredCategoryCards"),
    heroButtonLink: text(formData, "heroButtonLink"),
    heroButtonText: text(formData, "heroButtonText"),
    heroImage: text(formData, "heroImage"),
    heroImageUrl: text(formData, "heroImage"),
    heroSubtitle: text(formData, "heroSubtitle"),
    heroTitle: text(formData, "heroTitle"),
    promotionStripText: text(formData, "promotionStripText"),
    promoStripText: text(formData, "promotionStripText"),
    trustBadgeText: lines(formData, "trustBadgeText"),
    isActive: true,
  };

  try {
    await updateHomepage(homepage);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Admin] saveHomepage failed:", message);
    redirect(`/homepage?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect("/homepage?saved=1");
}

export async function saveStoreSettings(formData: FormData) {
  const settings: StoreSettings = {
    contactEmail: text(formData, "contactEmail"),
    contactPhone: text(formData, "contactPhone"),
    favicon: text(formData, "favicon"),
    faviconUrl: text(formData, "favicon"),
    eastMalaysiaFreeShippingMinimumAmount: numberValue(formData, "eastMalaysiaFreeShippingMinimumAmount") || numberValue(formData, "east_malaysia_free_shipping_min_amount") || 150,
    eastMalaysiaShippingFee: numberValue(formData, "eastMalaysiaShippingFee") || numberValue(formData, "east_malaysia_shipping_fee") || 15,
    freeShippingMinimumAmount: numberValue(formData, "westMalaysiaFreeShippingMinimumAmount") || numberValue(formData, "freeShippingMinimumAmount") || numberValue(formData, "west_malaysia_free_shipping_min_amount"),
    freeShippingMinAmount: numberValue(formData, "westMalaysiaFreeShippingMinimumAmount") || numberValue(formData, "freeShippingMinimumAmount") || numberValue(formData, "west_malaysia_free_shipping_min_amount"),
    logo: text(formData, "logo"),
    logoUrl: text(formData, "logo"),
    shippingFee: numberValue(formData, "westMalaysiaShippingFee") || numberValue(formData, "shippingFee") || numberValue(formData, "west_malaysia_shipping_fee"),
    socialLinks: {
      facebook: text(formData, "facebook"),
      instagram: text(formData, "instagram"),
      tiktok: text(formData, "tiktok"),
    },
    storeActive: boolValue(formData, "storeActive"),
    isStoreActive: boolValue(formData, "storeActive"),
    storeName: text(formData, "storeName"),
    storeTagline: text(formData, "storeTagline"),
    whatsappNumber: text(formData, "whatsappNumber"),
    westMalaysiaFreeShippingMinimumAmount: numberValue(formData, "westMalaysiaFreeShippingMinimumAmount") || numberValue(formData, "freeShippingMinimumAmount") || numberValue(formData, "west_malaysia_free_shipping_min_amount"),
    westMalaysiaShippingFee: numberValue(formData, "westMalaysiaShippingFee") || numberValue(formData, "shippingFee") || numberValue(formData, "west_malaysia_shipping_fee"),
  };

  try {
    await updateStoreSettings(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Admin] saveStoreSettings failed:", message);
    redirect(`/settings?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export async function savePaymentSettings(formData: FormData) {
  const payments: PaymentSettings = {
    accountName: text(formData, "accountName"),
    accountNumber: text(formData, "accountNumber"),
    bankName: text(formData, "bankName"),
    futureGatewayPlaceholder: text(formData, "futureGatewayPlaceholder"),
    providerPlaceholder: text(formData, "futureGatewayPlaceholder"),
    isEnabled: true,
    manualPaymentEnabled: boolValue(formData, "manualPaymentEnabled"),
    paymentInstruction: text(formData, "paymentInstruction"),
    whatsAppOrderEnabled: boolValue(formData, "whatsAppOrderEnabled"),
  };

  try {
    await updatePaymentSettings(payments);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Admin] savePaymentSettings failed:", message);
    redirect(`/payments?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect("/payments?saved=1");
}

export async function savePromotionBanners(formData: FormData) {
  const keys = jsonStringArray(formData, "bannerKeys");
  const deletedIds: string[] = [];
  const banners: PromotionBanner[] = [];

  try {
    console.info("[Admin] savePromotionBanners submitted:", {
      action: "promotion-banners",
      bannerCount: keys.length,
      keys: keys.map((key) => ({
        hasDesktopUpload: bannerLangs.some((lang) => fileValues(formData, `${key}-desktopFile-${lang}`).length > 0),
        hasExistingDesktop: bannerLangs.some((lang) => Boolean(text(formData, `${key}-desktopImageUrl-${lang}`))),
        hasExistingMobile: bannerLangs.some((lang) => Boolean(text(formData, `${key}-mobileImageUrl-${lang}`))),
        hasMobileUpload: bannerLangs.some((lang) => fileValues(formData, `${key}-mobileFile-${lang}`).length > 0),
        idPresent: Boolean(text(formData, `${key}-id`)),
        key,
      })),
    });

    for (const [index, key] of keys.entries()) {
      const id = text(formData, `${key}-id`);
      const localizedTitle = {
        en: text(formData, `${key}-title-en`),
        ms: text(formData, `${key}-title-ms`),
        zh: text(formData, `${key}-title-zh`),
      };
      const localizedSubtitle = {
        en: text(formData, `${key}-subtitle-en`),
        ms: text(formData, `${key}-subtitle-ms`),
        zh: text(formData, `${key}-subtitle-zh`),
      };
      const localizedCtaText = {
        en: text(formData, `${key}-buttonText-en`),
        ms: text(formData, `${key}-buttonText-ms`),
        zh: text(formData, `${key}-buttonText-zh`),
      };
      const title = localizedTitle.en || localizedTitle.zh || localizedTitle.ms;
      const subtitle = localizedSubtitle.en || localizedSubtitle.zh || localizedSubtitle.ms;
      const targetUrl = text(formData, `${key}-targetUrl`);
      const existingDesktopImage = bannerLangs.some((lang) => text(formData, `${key}-desktopImageUrl-${lang}`));
      const existingMobileImage = bannerLangs.some((lang) => text(formData, `${key}-mobileImageUrl-${lang}`));
      const hasAnyImage = existingDesktopImage || existingMobileImage || hasBannerUpload(formData, key);
      const hasAnyCtaText = Boolean(localizedCtaText.en || localizedCtaText.zh || localizedCtaText.ms);

      if (!id && !title && !subtitle && !hasAnyCtaText && !targetUrl && !hasAnyImage) {
        continue;
      }

      if (formData.get(`${key}-delete`) === "on") {
        if (id) {
          deletedIds.push(id);
        }

        continue;
      }

      const folder = id || slugify(title) || `banner-${Date.now()}-${index + 1}`;
      const desktopImages = { en: "", zh: "", ms: "" };
      const mobileImages = { en: "", zh: "", ms: "" };

      for (const lang of bannerLangs) {
        const desktopFile = fileValues(formData, `${key}-desktopFile-${lang}`)[0];
        const mobileFile = fileValues(formData, `${key}-mobileFile-${lang}`)[0];
        desktopImages[lang] = desktopFile
          ? await uploadUrbanixAsset(desktopFile, "banners", `${folder}/desktop-${lang}`)
          : text(formData, `${key}-desktopImageUrl-${lang}`);
        mobileImages[lang] = mobileFile
          ? await uploadUrbanixAsset(mobileFile, "banners", `${folder}/mobile-${lang}`)
          : text(formData, `${key}-mobileImageUrl-${lang}`);
      }

      const buttonEnabled = formData.get(`${key}-buttonEnabled`) === "on" && hasAnyCtaText && Boolean(targetUrl);

      banners.push({
        buttonEnabled,
        buttonPosition: (text(formData, `${key}-buttonPosition`) || "bottom-left") as PromotionBanner["buttonPosition"],
        buttonUrl: buttonEnabled ? targetUrl : "",
        buttonText: {
          bm: localizedCtaText.ms,
          en: localizedCtaText.en,
          zh: localizedCtaText.zh,
        },
        ctaText: localizedCtaText.en,
        desktopImageUrl: encodeLocalizedImages(desktopImages),
        id,
        imageClickUrl: targetUrl,
        isActive: formData.get(`${key}-isActive`) === "on",
        localizedCtaText,
        localizedSubtitle,
        localizedTitle,
        mobileImageUrl: encodeLocalizedImages(mobileImages),
        sortOrder: numberValue(formData, `${key}-sortOrder`) || index + 1,
        subtitle,
        targetUrl,
        title,
      });
    }

    await upsertPromotionBanners(banners, deletedIds);
  } catch (err) {
    const message = errorMessage(err);
    console.error("[Admin] savePromotionBanners failed:", message);
    redirect(`/banners?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect("/banners?saved=1");
}

export async function saveOrderStatuses(formData: FormData) {
  try {
    await updateOrderStatuses(text(formData, "orderId"), {
      orderStatus: text(formData, "orderStatus") as UrbanixOrder["orderStatus"],
      paymentStatus: text(formData, "paymentStatus") as UrbanixOrder["paymentStatus"],
    });
  } catch (err) {
    console.error("[Admin] saveOrderStatuses failed:", err instanceof Error ? err.message : String(err));
  }
  revalidatePath("/orders", "layout");
}

export async function saveStockUpdate(formData: FormData) {
  const { products } = await readUrbanixStoreDataAsync();

  const updates = products
    .map((product) => {
      const raw = formData.get(`stock-${product.id}`);
      if (raw === null) return null;
      const stockQuantity = Math.max(0, Number(raw) || 0);
      return { ...product, stockQuantity, stockStatus: stockQuantity <= 0 ? "out_of_stock" as const : stockQuantity <= 5 ? "low_stock" as const : "in_stock" as const };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  try {
    await Promise.all(updates.map((p) => upsertProduct(p)));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Admin] saveStockUpdate failed:", message);
    redirect(`/inventory?saveError=${encodeURIComponent(message)}`);
  }
  await revalidateStorefront();
  revalidatePath("/", "layout");
  redirect("/inventory?saved=1");
}
