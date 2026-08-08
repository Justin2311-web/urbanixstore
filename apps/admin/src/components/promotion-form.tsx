"use client";

import { useState } from "react";
import type { Database } from "@ecommerce/database";
import { savePromotion } from "@/lib/actions";
import { CheckField, Field, SaveButton, Select } from "@/components/admin-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
type Option = { id: string; label: string };
type Rule = { position: number; discountType: "percentage" | "fixed_amount"; discountValue: number };

function parseRules(value: Promotion["sequence_rules"] | undefined): Rule[] {
  if (!Array.isArray(value)) return [{ position: 1, discountType: "percentage", discountValue: 0 }];
  const rules = value.map((entry, index): Rule | null => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
    return {
      position: index + 1,
      discountType: entry.discountType === "fixed_amount" ? "fixed_amount" : "percentage",
      discountValue: Number(entry.discountValue) || 0,
    };
  }).filter((entry): entry is Rule => entry !== null);
  return rules.length ? rules : [{ position: 1, discountType: "percentage", discountValue: 0 }];
}

function dateTimeValue(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

export function PromotionForm({ promotion, products, categories, variants }: {
  promotion?: Promotion;
  products: Option[];
  categories: Option[];
  variants: Option[];
}) {
  const [rules, setRules] = useState(() => parseRules(promotion?.sequence_rules));
  const title = promotion ? `${promotion.code} — ${promotion.campaign_name}` : "New promotion";
  const selected = (value: Promotion["eligible_product_ids"] | undefined) => Array.isArray(value) ? value : [];

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form action={savePromotion} className="grid gap-5">
          <input name="id" type="hidden" value={promotion?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Campaign name"><Input defaultValue={promotion?.campaign_name ?? ""} name="campaign_name" required /></Field>
            <Field label="Promo code"><Input defaultValue={promotion?.code ?? ""} name="code" required /></Field>
            <Field label="Status"><Select defaultValue={promotion?.status ?? "draft"} name="status"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="expired">Expired</option><option value="disabled">Disabled</option></Select></Field>
            <Field label="Promotion type"><Select defaultValue="multi_item_sequence" name="promotion_type"><option value="multi_item_sequence">Multi Item Sequence Discount</option></Select></Field>
            <Field label="Start date"><Input defaultValue={dateTimeValue(promotion?.starts_at)} name="starts_at" type="datetime-local" /></Field>
            <Field label="End date"><Input defaultValue={dateTimeValue(promotion?.ends_at)} name="ends_at" type="datetime-local" /></Field>
            <Field label="Allocation"><Select defaultValue={promotion?.allocation ?? "cart_order"} name="allocation"><option value="cart_order">Cart Order</option><option value="cheapest_first">Cheapest First</option><option value="most_expensive_first">Most Expensive First</option></Select></Field>
            <Field label="Eligibility"><Select defaultValue={promotion?.eligibility_type ?? "entire_store"} name="eligibility_type"><option value="entire_store">Entire Store</option><option value="selected_products">Selected Products</option><option value="selected_categories">Selected Categories</option><option value="selected_variants">Selected Variants</option></Select></Field>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Sequence rules</h3><button className="text-sm font-bold text-primary underline" onClick={() => setRules((current) => [...current, { position: current.length + 1, discountType: "percentage", discountValue: 0 }])} type="button">Add position</button></div>
            <div className="grid gap-3">
              {rules.map((rule, index) => (
                <div className="grid items-end gap-3 md:grid-cols-[90px_1fr_1fr_auto]" key={index}>
                  <Field label="Position"><Input name="sequence_position" readOnly value={index + 1} /></Field>
                  <Field label="Discount type"><Select defaultValue={rule.discountType} name="sequence_type"><option value="percentage">Percentage</option><option value="fixed_amount">Fixed amount (RM)</option></Select></Field>
                  <Field label="Discount value"><Input defaultValue={rule.discountValue || ""} min="0.01" name="sequence_value" required step="0.01" type="number" /></Field>
                  <button className="h-11 text-sm font-bold text-destructive underline disabled:opacity-40" disabled={rules.length === 1} onClick={() => setRules((current) => current.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, position: itemIndex + 1 })))} type="button">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <MultiSelect label="Eligible products" name="eligible_product_ids" options={products} values={selected(promotion?.eligible_product_ids) as string[]} />
            <MultiSelect label="Eligible categories" name="eligible_category_ids" options={categories} values={selected(promotion?.eligible_category_ids) as string[]} />
            <MultiSelect label="Eligible variants" name="eligible_variant_keys" options={variants} values={selected(promotion?.eligible_variant_keys) as string[]} />
            <MultiSelect label="Excluded products" name="excluded_product_ids" options={products} values={selected(promotion?.excluded_product_ids) as string[]} />
            <MultiSelect label="Excluded categories" name="excluded_category_ids" options={categories} values={selected(promotion?.excluded_category_ids) as string[]} />
            <MultiSelect label="Excluded variants" name="excluded_variant_keys" options={variants} values={selected(promotion?.excluded_variant_keys) as string[]} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Minimum quantity"><Input defaultValue={promotion?.minimum_quantity ?? 1} min="1" name="minimum_quantity" required type="number" /></Field>
            <Field label="Minimum subtotal (RM, optional)"><Input defaultValue={promotion?.minimum_subtotal ?? ""} min="0" name="minimum_subtotal" step="0.01" type="number" /></Field>
            <Field label="Maximum discount/order (RM, optional)"><Input defaultValue={promotion?.maximum_discount_per_order ?? ""} min="0" name="maximum_discount_per_order" step="0.01" type="number" /></Field>
            <Field label="Total usage limit (optional)"><Input defaultValue={promotion?.total_usage_limit ?? ""} min="1" name="total_usage_limit" type="number" /></Field>
            <Field label="Per customer usage limit (optional)"><Input defaultValue={promotion?.per_customer_usage_limit ?? ""} min="1" name="per_customer_usage_limit" type="number" /></Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <CheckField defaultChecked={promotion?.repeat_sequence ?? false} label="Repeat sequence" name="repeat_sequence" />
            <CheckField defaultChecked={promotion?.stack_with_promo_codes ?? false} label="Stack with other promo codes" name="stack_with_promo_codes" />
            <CheckField defaultChecked={promotion?.stack_with_product_promotions ?? false} label="Stack with automatic product promotions" name="stack_with_product_promotions" />
            <CheckField defaultChecked={promotion?.stack_with_shipping_promotions ?? true} label="Stack with existing shipping/free shipping" name="stack_with_shipping_promotions" />
          </div>
          <SaveButton label={promotion ? "Save promotion" : "Create promotion"} />
        </form>
      </CardContent>
    </Card>
  );
}

function MultiSelect({ label, name, options, values }: { label: string; name: string; options: Option[]; values: string[] }) {
  return <Field label={label}><select className="min-h-36 rounded-xl border border-input bg-card p-2 text-sm" defaultValue={values} multiple name={name}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field>;
}
