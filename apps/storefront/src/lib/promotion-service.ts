import { createClient } from "@supabase/supabase-js";
import type { Database, Json } from "@ecommerce/database";
import { getVariantEffectivePrice, type ProductVariantEntry, type UrbanixProduct } from "@ecommerce/shared";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import {
  calculateSequencePromotion,
  parseSequenceRules,
  type PromotionCartItem,
  type PromotionCalculation,
  type PromotionRecord,
} from "@/lib/promotion-engine";

export type PromotionItemInput = {
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string> | null;
};

export type AppliedPromotion = PromotionCalculation & {
  promotionId: string;
  promoCode: string;
  campaignName: string;
  sequenceRules: ReturnType<typeof parseSequenceRules>;
  repeatSequence: boolean;
  allocation: PromotionRecord["allocation"];
  ruleSnapshot: Json;
};

type ProductRow = Pick<Database["public"]["Tables"]["products"]["Row"], "id" | "slug" | "category_id">;

function createPromotionClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) throw new Error("Promotion service is not configured.");
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function normalizePhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") || null;
}

function resolveProductPrice(product: UrbanixProduct, selectedVariants?: Record<string, string> | null) {
  if (!product.variants?.length) {
    return {
      // The current catalog promotion_price is the effective selling price, not
      // an automatic promotion engine. Keep the stacking flag reserved for a
      // future automatic-promotion source instead of making current products ineligible.
      hasProductPromotion: false,
      unitPrice: product.price,
      variantName: null,
    };
  }
  const selectedName = selectedVariants?.variant;
  const variant = selectedName ? product.variants.find((entry) => entry.name === selectedName) : product.variants[0];
  if (!variant) throw new Error("Invalid product variant.");
  const pricing = getVariantEffectivePrice(variant as ProductVariantEntry);
  return {
    hasProductPromotion: false,
    unitPrice: pricing.price,
    variantName: variant.name,
  };
}

async function buildPromotionItems(inputs: PromotionItemInput[]): Promise<PromotionCartItem[]> {
  const data = await readUrbanixStoreDataAsync();
  const products = listStorefrontProducts(data);
  const productMap = new Map(products.map((product) => [product.id, product]));
  const slugs = [...new Set(inputs.map((item) => item.productId))];
  const sb = createPromotionClient();
  const { data: rows, error } = await sb.from("products").select("id, slug, category_id").in("slug", slugs);
  if (error) throw new Error("Unable to validate promotion products.");
  const dbProducts = new Map((rows as ProductRow[] | null)?.map((row) => [row.slug, row]) ?? []);

  return inputs.map((input, index) => {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0 || input.quantity > 99) throw new Error("Invalid item quantity.");
    const product = productMap.get(input.productId);
    if (!product || product.status === "inactive" || product.isActive === false) throw new Error("One or more products are unavailable.");
    const dbProduct = dbProducts.get(input.productId);
    const pricing = resolveProductPrice(product, input.selectedVariants);
    return {
      cartKey: `${input.productId}:${index}`,
      productId: input.productId,
      productUuid: dbProduct?.id ?? null,
      categoryId: dbProduct?.category_id ?? null,
      variantKey: dbProduct && pricing.variantName ? `${dbProduct.id}::${pricing.variantName}` : null,
      productName: product.name,
      quantity: input.quantity,
      unitPrice: pricing.unitPrice,
      hasProductPromotion: pricing.hasProductPromotion,
    };
  });
}

export async function evaluatePromotion({
  code,
  items,
  customerPhone,
}: {
  code: string;
  items: PromotionItemInput[];
  customerPhone?: string | null;
}): Promise<AppliedPromotion> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) throw new Error("Enter a promo code.");
  const sb = createPromotionClient();
  const { data, error } = await sb.from("promotions").select("*").eq("code", normalizedCode).maybeSingle();
  if (error) throw new Error("Unable to validate promo code.");
  if (!data) throw new Error("Invalid promo code.");
  const promotion = data as PromotionRecord;
  const now = Date.now();
  if (promotion.status !== "active") throw new Error("This promo code is not active.");
  if (promotion.starts_at && new Date(promotion.starts_at).getTime() > now) throw new Error("This promo code is not active yet.");
  if (promotion.ends_at && new Date(promotion.ends_at).getTime() < now) throw new Error("This promo code has expired.");

  if (promotion.total_usage_limit != null) {
    const { count } = await sb.from("orders").select("id", { count: "exact", head: true })
      .eq("promotion_id", promotion.id).neq("order_status", "cancelled");
    if ((count ?? 0) >= promotion.total_usage_limit) throw new Error("This promo code has reached its usage limit.");
  }
  const phone = normalizePhone(customerPhone);
  if (phone && promotion.per_customer_usage_limit != null) {
    const { count } = await sb.from("orders").select("id", { count: "exact", head: true })
      .eq("promotion_id", promotion.id).eq("customer_phone", phone).neq("order_status", "cancelled");
    if ((count ?? 0) >= promotion.per_customer_usage_limit) throw new Error("You have reached the usage limit for this promo code.");
  }

  const promotionItems = await buildPromotionItems(items);
  const subtotal = promotionItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  if (promotion.minimum_subtotal != null && subtotal < promotion.minimum_subtotal) {
    throw new Error(`Minimum subtotal is RM${promotion.minimum_subtotal.toFixed(2)}.`);
  }
  const calculation = calculateSequencePromotion(promotion, promotionItems);
  if (calculation.eligibleQuantity < promotion.minimum_quantity || calculation.discountAmount <= 0) {
    throw new Error("Your cart is not eligible for this promo code.");
  }

  const sequenceRules = parseSequenceRules(promotion.sequence_rules);
  return {
    ...calculation,
    promotionId: promotion.id,
    promoCode: promotion.code,
    campaignName: promotion.campaign_name,
    sequenceRules,
    repeatSequence: promotion.repeat_sequence,
    allocation: promotion.allocation,
    ruleSnapshot: promotion as unknown as Json,
  };
}
