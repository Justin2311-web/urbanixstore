import type { Json } from "@ecommerce/database";

export type PromotionSequenceRule = {
  position: number;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
};

export type PromotionRecord = {
  id: string;
  campaign_name: string;
  code: string;
  status: "draft" | "scheduled" | "active" | "expired" | "disabled";
  promotion_type: "multi_item_sequence";
  starts_at: string | null;
  ends_at: string | null;
  sequence_rules: Json;
  repeat_sequence: boolean;
  allocation: "cart_order" | "cheapest_first" | "most_expensive_first";
  eligibility_type: "entire_store" | "selected_products" | "selected_categories" | "selected_variants";
  eligible_product_ids: Json;
  eligible_category_ids: Json;
  eligible_variant_keys: Json;
  excluded_product_ids: Json;
  excluded_category_ids: Json;
  excluded_variant_keys: Json;
  minimum_quantity: number;
  minimum_subtotal: number | null;
  total_usage_limit: number | null;
  per_customer_usage_limit: number | null;
  maximum_discount_per_order: number | null;
  stack_with_promo_codes: boolean;
  stack_with_product_promotions: boolean;
  stack_with_shipping_promotions: boolean;
};

export type PromotionCartItem = {
  cartKey: string;
  productId: string;
  productUuid: string | null;
  categoryId: string | null;
  variantKey: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  hasProductPromotion: boolean;
};

export type PromotionDiscountBreakdown = {
  cartKey: string;
  productId: string;
  productName: string;
  unitIndex: number;
  sequencePosition: number;
  discountType: PromotionSequenceRule["discountType"];
  discountValue: number;
  unitPrice: number;
  discountAmount: number;
};

export type PromotionCalculation = {
  discountAmount: number;
  breakdown: PromotionDiscountBreakdown[];
  eligibleQuantity: number;
};

function stringList(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function parseSequenceRules(value: Json): PromotionSequenceRule[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const position = Number(entry.position);
      const discountType = entry.discountType;
      const discountValue = Number(entry.discountValue);
      if (!Number.isInteger(position) || position < 1) return null;
      if (discountType !== "percentage" && discountType !== "fixed_amount") return null;
      if (!Number.isFinite(discountValue) || discountValue <= 0) return null;
      if (discountType === "percentage" && discountValue > 100) return null;
      return { position, discountType, discountValue } satisfies PromotionSequenceRule;
    })
    .filter((rule): rule is PromotionSequenceRule => rule !== null)
    .sort((a, b) => a.position - b.position);
}

function isEligible(item: PromotionCartItem, promotion: PromotionRecord): boolean {
  const productIds = stringList(promotion.eligible_product_ids);
  const categoryIds = stringList(promotion.eligible_category_ids);
  const variantKeys = stringList(promotion.eligible_variant_keys);
  const excludedProducts = stringList(promotion.excluded_product_ids);
  const excludedCategories = stringList(promotion.excluded_category_ids);
  const excludedVariants = stringList(promotion.excluded_variant_keys);

  if ((!promotion.stack_with_product_promotions && item.hasProductPromotion) ||
      (item.productUuid && excludedProducts.includes(item.productUuid)) ||
      (item.categoryId && excludedCategories.includes(item.categoryId)) ||
      (item.variantKey && excludedVariants.includes(item.variantKey))) return false;

  if (promotion.eligibility_type === "entire_store") return true;
  if (promotion.eligibility_type === "selected_products") return Boolean(item.productUuid && productIds.includes(item.productUuid));
  if (promotion.eligibility_type === "selected_categories") return Boolean(item.categoryId && categoryIds.includes(item.categoryId));
  return Boolean(item.variantKey && variantKeys.includes(item.variantKey));
}

const toSen = (value: number) => Math.round(value * 100);
const fromSen = (value: number) => value / 100;

export function calculateSequencePromotion(
  promotion: PromotionRecord,
  items: PromotionCartItem[]
): PromotionCalculation {
  const rules = parseSequenceRules(promotion.sequence_rules);
  if (rules.length === 0) return { discountAmount: 0, breakdown: [], eligibleQuantity: 0 };

  const units = items.flatMap((item) =>
    isEligible(item, promotion)
      ? Array.from({ length: item.quantity }, (_, unitIndex) => ({ ...item, unitIndex }))
      : []
  );
  if (promotion.allocation !== "cart_order") {
    units.sort((a, b) => promotion.allocation === "cheapest_first"
      ? toSen(a.unitPrice) - toSen(b.unitPrice)
      : toSen(b.unitPrice) - toSen(a.unitPrice));
  }
  if (units.length < promotion.minimum_quantity) {
    return { discountAmount: 0, breakdown: [], eligibleQuantity: units.length };
  }

  let totalDiscountSen = 0;
  const maxDiscountSen = promotion.maximum_discount_per_order == null
    ? Number.POSITIVE_INFINITY
    : toSen(promotion.maximum_discount_per_order);
  const breakdown: PromotionDiscountBreakdown[] = [];

  units.forEach((unit, index) => {
    if (!promotion.repeat_sequence && index >= rules.length) return;
    const rule = rules[index % rules.length];
    const unitPriceSen = toSen(unit.unitPrice);
    const rawDiscountSen = rule.discountType === "percentage"
      ? Math.round(unitPriceSen * rule.discountValue / 100)
      : toSen(rule.discountValue);
    const remainingSen = Math.max(0, maxDiscountSen - totalDiscountSen);
    const discountSen = Math.min(unitPriceSen, rawDiscountSen, remainingSen);
    if (discountSen <= 0) return;
    totalDiscountSen += discountSen;
    breakdown.push({
      cartKey: unit.cartKey,
      productId: unit.productId,
      productName: unit.productName,
      unitIndex: unit.unitIndex + 1,
      sequencePosition: rule.position,
      discountType: rule.discountType,
      discountValue: rule.discountValue,
      unitPrice: fromSen(unitPriceSen),
      discountAmount: fromSen(discountSen),
    });
  });

  return { discountAmount: fromSen(totalDiscountSen), breakdown, eligibleQuantity: units.length };
}
