import type { CartLine, LanguageCode, ProductVariantOption, StoreSettings, UrbanixProduct } from "@ecommerce/shared";

const defaultWhatsAppNumber = "60198993269";

export type OrderCustomerInfo = {
  customerAddress: string;
  customerName: string;
  customerPhone: string;
};

export type SelectedProductOption = {
  groupName: string;
  option: ProductVariantOption;
};

export function getWhatsAppNumber(settings?: Pick<StoreSettings, "whatsappNumber">) {
  const number = settings?.whatsappNumber || defaultWhatsAppNumber;
  const digitsOnly = number.replace(/\D/g, "");

  return digitsOnly || defaultWhatsAppNumber;
}

export function getLocalizedProductName(product: UrbanixProduct, language: LanguageCode) {
  return product.localizedName?.[language] || product.localizedName?.en || product.name;
}

export function getLocalizedVariantOption(option: ProductVariantOption, language: LanguageCode) {
  return {
    name: option.localizedOptionName?.[language] || option.localizedOptionName?.en || option.optionName,
    value: option.localizedOptionValue?.[language] || option.localizedOptionValue?.en || option.optionValue,
  };
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
  customer,
  finalPrice,
  language,
  product,
  quantity = 1,
  selectedOptions = [],
  settings,
}: {
  customer?: OrderCustomerInfo | null;
  finalPrice?: number;
  language: LanguageCode;
  product: UrbanixProduct;
  quantity?: number;
  selectedOptions?: SelectedProductOption[];
  settings: Pick<StoreSettings, "storeName">;
}) {
  const selectedVariantSkus = selectedOptions.map(({ option }) => option.sku).filter(Boolean);
  const selectedOptionLines = selectedOptions.map(({ option }) => {
    const localized = getLocalizedVariantOption(option, language);

    return `- ${localized.name}: ${localized.value}`;
  });
  const resolvedPrice = finalPrice ?? product.price;

  return [
    `Hi ${settings.storeName}, I want to order:`,
    "",
    `Product: ${getLocalizedProductName(product, language)}`,
    `SKU: ${selectedVariantSkus.length > 0 ? `${product.sku} / ${selectedVariantSkus.join(" / ")}` : product.sku}`,
    ...(selectedOptionLines.length > 0 ? ["Selected Options:", ...selectedOptionLines] : []),
    ...(selectedOptionLines.length > 0 ? ["", `Base Price: ${formatOrderPrice(product.price)}`, `Final Price: ${formatOrderPrice(resolvedPrice)}`] : [`Price: ${formatOrderPrice(product.price)}`]),
    `Quantity: ${quantity}`,
    `Product Link: ${getProductUrl(product)}`,
    "",
    ...customerInfoLines(customer),
    "Payment Method:",
  ].join("\n");
}

export function createCartWhatsAppMessage({
  customer,
  language,
  lines,
  settings,
}: {
  customer?: OrderCustomerInfo | null;
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
    ...customerInfoLines(customer),
    "Payment Method:",
  ].join("\n");
}

export function createWhatsAppHref(whatsappNumber: string, message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function customerInfoLines(customer?: OrderCustomerInfo | null) {
  return [
    "Customer Information:",
    `Name: ${customer?.customerName ?? ""}`,
    `Phone: ${customer?.customerPhone ?? ""}`,
    `Address: ${customer?.customerAddress ?? ""}`,
    "",
  ];
}
