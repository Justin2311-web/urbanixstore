import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit TypeScript extension.
import { calculateSequencePromotion, type PromotionCartItem, type PromotionRecord } from "./promotion-engine.ts";

const promotion: PromotionRecord = {
  id: "promotion-id",
  campaign_name: "Sequence campaign",
  code: "SEQUENCE",
  status: "active",
  promotion_type: "multi_item_sequence",
  starts_at: null,
  ends_at: null,
  sequence_rules: [
    { position: 1, discountType: "percentage", discountValue: 8 },
    { position: 2, discountType: "percentage", discountValue: 31 },
  ],
  repeat_sequence: true,
  allocation: "cart_order",
  eligibility_type: "entire_store",
  eligible_product_ids: [], eligible_category_ids: [], eligible_variant_keys: [],
  excluded_product_ids: [], excluded_category_ids: [], excluded_variant_keys: [],
  minimum_quantity: 1,
  minimum_subtotal: null,
  total_usage_limit: null,
  per_customer_usage_limit: null,
  maximum_discount_per_order: null,
  stack_with_promo_codes: false,
  stack_with_product_promotions: false,
  stack_with_shipping_promotions: true,
};

function item(quantity: number, unitPrice = 100, cartKey = "a"): PromotionCartItem {
  return { cartKey, productId: cartKey, productUuid: cartKey, categoryId: "category", variantKey: null, productName: cartKey, quantity, unitPrice, hasProductPromotion: false };
}

for (const [quantity, expected] of [[1, 8], [2, 39], [3, 47], [4, 78]] as const) {
  test(`${quantity} units follow the repeating sequence`, () => {
    assert.equal(calculateSequencePromotion(promotion, [item(quantity)]).discountAmount, expected);
  });
}

test("quantities across multiple cart lines are allocated by unit", () => {
  const result = calculateSequencePromotion(promotion, [item(2, 100, "a"), item(2, 100, "b")]);
  assert.equal(result.discountAmount, 78);
  assert.deepEqual(result.breakdown.map((entry) => entry.cartKey), ["a", "a", "b", "b"]);
});

test("repeat off leaves units after the configured sequence undiscounted", () => {
  assert.equal(calculateSequencePromotion({ ...promotion, repeat_sequence: false }, [item(4)]).discountAmount, 39);
});

test("cheapest-first allocation sorts units without changing cart lines", () => {
  const result = calculateSequencePromotion({ ...promotion, allocation: "cheapest_first", repeat_sequence: false }, [item(1, 100, "high"), item(1, 50, "low")]);
  assert.deepEqual(result.breakdown.map((entry) => entry.cartKey), ["low", "high"]);
  assert.equal(result.discountAmount, 35);
});

test("product promotions are excluded when stacking is disabled", () => {
  assert.equal(calculateSequencePromotion(promotion, [{ ...item(1), hasProductPromotion: true }]).discountAmount, 0);
});
