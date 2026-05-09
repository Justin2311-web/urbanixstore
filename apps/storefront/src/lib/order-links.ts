import type { CartLine, LanguageCode, StoreSettings, UrbanixProduct } from "@ecommerce/shared";

const defaultWhatsAppNumber = "60198993269";

export function getWhatsAppNumber(settings?: Pick<StoreSettings, "whatsappNumber">) {
  const number = settings?.whatsappNumber || defaultWhatsAppNumber;
  const digitsOnly = number.replace(/\D/g, "");

  return digitsOnly || defaultWhatsAppNumber;
}

export function getLocalizedProductName(product: UrbanixProduct, language: LanguageCode) {
  return product.localizedName?.[language] || product.localizedName?.en || product.name;
}

export function getProductUrl(product: UrbanixProduct) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "https://urbanix-storefront.vercel.app");

  return `${siteUrl.replace(/\/$/, "")}/products/${product.slug}`;
}

export function formatOrderPrice(price: number) {
  return `RM${Number(price || 0).toFixed(2)}`;
}

export function createProductWhatsAppMessage({
  language,
  product,
  quantity = 1,
  settings,
}: {
  language: LanguageCode;
  product: UrbanixProduct;
  quantity?: number;
  settings: Pick<StoreSettings, "storeName">;
}) {
  return [
    `Hi ${settings.storeName}, I want to order:`,
    "",
    `Product: ${getLocalizedProductName(product, language)}`,
    `SKU: ${product.sku}`,
    `Price: ${formatOrderPrice(product.price)}`,
    `Quantity: ${quantity}`,
    `Product Link: ${getProductUrl(product)}`,
    "",
    "Name:",
    "Phone:",
    "Address:",
    "Payment Method:",
  ].join("\n");
}

export function createCartWhatsAppMessage({
  language,
  lines,
  settings,
}: {
  language: LanguageCode;
  lines: CartLine[];
  settings: Pick<StoreSettings, "storeName">;
}) {
  const productBlocks = lines.map((line) => [
    `Product: ${getLocalizedProductName(line.product, language)}`,
    `SKU: ${line.product.sku}`,
    `Price: ${formatOrderPrice(line.product.price)}`,
    `Quantity: ${line.quantity}`,
    `Product Link: ${getProductUrl(line.product)}`,
  ].join("\n"));
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);

  return [
    `Hi ${settings.storeName}, I want to order:`,
    "",
    productBlocks.join("\n\n"),
    "",
    `Total: ${formatOrderPrice(total)}`,
    "",
    "Name:",
    "Phone:",
    "Address:",
    "Payment Method:",
  ].join("\n");
}

export function createWhatsAppHref(whatsappNumber: string, message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
