"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  updateCategories,
  updateHomepage,
  updateOrderStatuses,
  updatePaymentSettings,
  updateStoreSettings,
  upsertProduct,
  readUrbanixStoreDataAsync,
} from "@ecommerce/shared/store";
import {
  getCategoryIdByName,
  type HomepageContent,
  type PaymentSettings,
  type ProductCategory,
  type UrbanixOrder,
  type UrbanixProduct,
  type StoreSettings,
} from "@ecommerce/shared";

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

export async function saveProduct(formData: FormData) {
  const name = text(formData, "name");
  const slug = text(formData, "slug") || getCategoryIdByName(name);
  const existingProduct = (await readUrbanixStoreDataAsync()).products.find((product) => product.id === text(formData, "id"));
  const normalPrice = numberValue(formData, "normalPrice");
  const promotionPrice = numberValue(formData, "promotionPrice");
  const stockQuantity = numberValue(formData, "stockQuantity");
  const category = text(formData, "category");
  const product: UrbanixProduct = {
    category,
    categoryId: text(formData, "categoryId") || text(formData, "relatedCategory") || getCategoryIdByName(category),
    description: text(formData, "fullDescription"),
    featured: boolValue(formData, "featured"),
    fullDescription: text(formData, "fullDescription"),
    galleryImages: lines(formData, "galleryImages"),
    highlights: lines(formData, "highlights"),
    id: text(formData, "id") || slug,
    image: text(formData, "image"),
    imageTone: (text(formData, "imageTone") || "fan-green") as UrbanixProduct["imageTone"],
    isActive: text(formData, "status") !== "inactive",
    isFeatured: boolValue(formData, "featured"),
    mainImageUrl: text(formData, "image"),
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
    relatedCategory: text(formData, "relatedCategory") || getCategoryIdByName(category),
    returnNote: text(formData, "returnNote") || "Returns accepted within 30 days for unused items in original packaging.",
    shippingInfo: text(formData, "shippingInfo") || "Free shipping applies for eligible orders.",
    shortDescription: text(formData, "shortDescription"),
    sku: text(formData, "sku"),
    slug,
    sold: numberValue(formData, "sold") || existingProduct?.sold || 0,
    specifications: lines(formData, "specifications"),
    status: text(formData, "status") === "inactive" ? "inactive" : "active",
    stockQuantity,
    stockStatus: stockQuantity <= 0 ? "out_of_stock" : stockQuantity <= 5 ? "low_stock" : "in_stock",
  };

  await upsertProduct(product);
  revalidatePath("/", "layout");
  redirect("/products");
}

export async function saveCategories(formData: FormData) {
  const names = ["Portable Fans", "Car Accessories", "Home Picks", "Lifestyle"];
  const categories: ProductCategory[] = names.map((name) => {
    const id = getCategoryIdByName(name);

    return {
      active: formData.get(`${id}-active`) === "on",
      description: text(formData, `${id}-description`),
      href: `/categories?category=${id}`,
      id,
      isActive: formData.get(`${id}-active`) === "on",
      name,
      slug: id,
      sortOrder: names.indexOf(name) + 1,
      tone: (text(formData, `${id}-tone`) || "mint") as ProductCategory["tone"],
    };
  });

  await updateCategories(categories);
  revalidatePath("/", "layout");
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

  await updateHomepage(homepage);
  revalidatePath("/", "layout");
}

export async function saveStoreSettings(formData: FormData) {
  const settings: StoreSettings = {
    contactEmail: text(formData, "contactEmail"),
    contactPhone: text(formData, "contactPhone"),
    favicon: text(formData, "favicon"),
    faviconUrl: text(formData, "favicon"),
    freeShippingMinimumAmount: numberValue(formData, "freeShippingMinimumAmount"),
    freeShippingMinAmount: numberValue(formData, "freeShippingMinimumAmount"),
    logo: text(formData, "logo"),
    logoUrl: text(formData, "logo"),
    shippingFee: numberValue(formData, "shippingFee"),
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
  };

  await updateStoreSettings(settings);
  revalidatePath("/", "layout");
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

  await updatePaymentSettings(payments);
  revalidatePath("/", "layout");
}

export async function saveOrderStatuses(formData: FormData) {
  await updateOrderStatuses(text(formData, "orderId"), {
    orderStatus: text(formData, "orderStatus") as UrbanixOrder["orderStatus"],
    paymentStatus: text(formData, "paymentStatus") as UrbanixOrder["paymentStatus"],
  });
  revalidatePath("/orders", "layout");
}
