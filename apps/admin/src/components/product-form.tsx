"use client";

import { useState } from "react";
import { saveProduct, createSignedUploadUrl } from "@/lib/actions";

type Category = { id: string; name: string };

/** Per-variant pricing entry as stored in product_variants JSONB (new format) */
type VariantEntry = {
  name: string;
  sku: string;
  originalPrice: string;   // string for input binding
  promotionPrice: string;  // string for input binding — empty = no promo
  stockQuantity: string;   // string for input binding
};

type ExistingProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  category_id: string | null;
  /** Legacy product-level price — used to seed default variant for old products */
  price: number;
  promotion_price: number | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  short_description: string | null;
  description: string | null;
  highlights: string[];
  specifications: string[];
  shipping_info: string | null;
  return_note: string | null;
  rating: number | null;
  /** New-format variant entries (with originalPrice). Null/empty → auto-seed from legacy price. */
  variant_entries: Array<{
    name: string;
    sku: string;
    originalPrice: number;
    promotionPrice?: number | null;
    stockQuantity: number;
  }> | null;
  images: Array<{ image_url: string; sort_order: number }>;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function makeDefaultVariant(product?: ExistingProduct): VariantEntry {
  return {
    name: "Default",
    sku: product?.sku ?? "",
    originalPrice: product?.price ? String(product.price) : "",
    promotionPrice: product?.promotion_price ? String(product.promotion_price) : "",
    stockQuantity: product?.stock_quantity != null ? String(product.stock_quantity) : "0",
  };
}

function validateVariants(variants: VariantEntry[]): Record<number, string> {
  const errors: Record<number, string> = {};
  variants.forEach((v, i) => {
    const messages: string[] = [];
    if (!v.name.trim()) messages.push("Name is required");
    if (!v.sku.trim()) messages.push("SKU is required");
    const op = parseFloat(v.originalPrice);
    if (!v.originalPrice.trim() || isNaN(op) || op <= 0) messages.push("Original price must be > 0");
    const pp = v.promotionPrice.trim() ? parseFloat(v.promotionPrice) : null;
    if (pp !== null && (isNaN(pp) || pp <= 0)) messages.push("Promotion price must be > 0");
    if (pp !== null && !isNaN(op) && pp >= op) messages.push("Promotion price must be less than original price");
    const qty = parseInt(v.stockQuantity, 10);
    if (isNaN(qty) || qty < 0) messages.push("Stock quantity must be 0 or more");
    if (messages.length > 0) errors[i] = messages.join(". ");
  });
  return errors;
}

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: ExistingProduct;
}) {
  const isEdit = Boolean(product?.id);
  const [nameValue, setNameValue] = useState(product?.name ?? "");
  const [slugValue, setSlugValue] = useState(product?.slug ?? "");
  const [keptImages, setKeptImages] = useState(
    product?.images.map((i) => i.image_url) ?? []
  );
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ── Variant entries (new per-variant pricing format) ─────────────────────────
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>(() => {
    if (product?.variant_entries && product.variant_entries.length > 0) {
      return product.variant_entries.map((v) => ({
        name: v.name,
        sku: v.sku,
        originalPrice: String(v.originalPrice),
        promotionPrice: v.promotionPrice ? String(v.promotionPrice) : "",
        stockQuantity: String(v.stockQuantity),
      }));
    }
    // Auto-seed a default variant from the legacy product-level price
    return [makeDefaultVariant(product)];
  });
  const [variantErrors, setVariantErrors] = useState<Record<number, string>>({});

  function addVariant() {
    setVariantEntries((prev) => [
      ...prev,
      { name: "", sku: "", originalPrice: "", promotionPrice: "", stockQuantity: "0" },
    ]);
  }

  function addDefaultVariant() {
    setVariantEntries((prev) => [...prev, makeDefaultVariant()]);
  }

  function removeVariant(index: number) {
    setVariantEntries((prev) => prev.filter((_, i) => i !== index));
    setVariantErrors((prev) => {
      const next: Record<number, string> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const n = Number(k);
        if (n < index) next[n] = v;
        else if (n > index) next[n - 1] = v;
      });
      return next;
    });
  }

  function updateVariant(
    index: number,
    field: keyof VariantEntry,
    value: string
  ) {
    setVariantEntries((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
    // Clear error for this variant when user edits it
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }

  function buildVariantEntriesJson(): string {
    const entries = variantEntries.map((v) => ({
      name: v.name.trim(),
      sku: v.sku.trim(),
      originalPrice: parseFloat(v.originalPrice) || 0,
      promotionPrice: v.promotionPrice.trim() ? parseFloat(v.promotionPrice) || null : null,
      stockQuantity: parseInt(v.stockQuantity, 10) || 0,
    }));
    return JSON.stringify(entries);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setNameValue(v);
    if (!isEdit) setSlugValue(slugify(v));
  }

  function removeKeptImage(url: string) {
    setKeptImages((prev) => prev.filter((u) => u !== url));
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const MAX_SIZE = 10 * 1024 * 1024;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setImageError(`"${file.name}" is not an image file.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE) {
        setImageError(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 10 MB.`);
        e.target.value = "";
        return;
      }
    }

    const slotsAvailable = 9 - keptImages.length;
    if (files.length > slotsAvailable) {
      setImageError(`Only ${slotsAvailable} more image slot${slotsAvailable === 1 ? "" : "s"} available (max 9 total).`);
      e.target.value = "";
      return;
    }

    setImageError(null);
    setUploadingImages(true);
    setUploadProgress(0);

    try {
      const productId = product?.id ?? `tmp-${Date.now()}`;
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const filePath = `products/${productId}/${Date.now()}-${i}.${ext}`;

        const { signedUrl, publicUrl } = await createSignedUploadUrl("product-images", filePath);

        const res = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!res.ok) throw new Error(`Upload failed for "${file.name}": ${res.statusText}`);

        newUrls.push(publicUrl);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      setKeptImages((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Client-side variant validation before allowing native form submit
    if (variantEntries.length === 0) {
      e.preventDefault();
      setVariantErrors({ 0: "At least one variant is required." });
      return;
    }
    const errors = validateVariants(variantEntries);
    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setVariantErrors(errors);
      // Scroll to variants section
      document.getElementById("variants-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setVariantErrors({});
  }

  return (
    <form action={saveProduct} onSubmit={handleSubmit}>
      {/* Hidden: product DB ID */}
      <input type="hidden" name="product_db_id" value={product?.id ?? ""} />
      {/* Hidden: slug */}
      <input type="hidden" name="slug" value={slugValue} />
      {/* Hidden: kept image URLs */}
      <input type="hidden" name="kept_image_count" value={keptImages.length} />
      {keptImages.map((url, i) => (
        <input key={url} type="hidden" name={`kept_image_${i}`} value={url} />
      ))}
      {/* Hidden: serialised variant entries (new pricing format) */}
      <input type="hidden" name="variant_entries" value={buildVariantEntriesJson()} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Main column ─────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Basic info */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Basic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="field-label">Product Name *</label>
                <input
                  name="name"
                  required
                  className="field-input"
                  value={nameValue}
                  onChange={handleNameChange}
                />
              </div>

              <div>
                <label className="field-label">Product SKU *</label>
                <input
                  name="sku"
                  required
                  className="field-input"
                  defaultValue={product?.sku}
                  placeholder="e.g. URB-001"
                />
              </div>

              <div>
                <label className="field-label">
                  Slug{" "}
                  <span className="text-xs font-normal text-gray-400">
                    {isEdit ? "(editable)" : "(auto-generated)"}
                  </span>
                </label>
                <input
                  className="field-input font-mono text-xs"
                  value={slugValue}
                  onChange={(e) => setSlugValue(slugify(e.target.value))}
                />
              </div>

              <div>
                <label className="field-label">Category</label>
                <select
                  name="category_id"
                  className="field-select"
                  defaultValue={product?.category_id ?? ""}
                >
                  <option value="">— No category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Rating (0–5)</label>
                <input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  className="field-input"
                  defaultValue={product?.rating ?? 4.7}
                />
              </div>
            </div>
          </div>

          {/* ── Product Variants & Pricing (moved here from old Pricing position) ── */}
          <div id="variants-section" className="card p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-gray-800">Product Variants & Pricing</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Every product needs at least one variant. For single-option products, use a
                  &quot;Default&quot; variant. Price, promotion price, SKU, and stock are set per variant.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={addDefaultVariant}
                  className="rounded-lg border border-[#0e5c56]/30 bg-[#e8f3ef] px-3 py-1.5 text-xs font-semibold text-[#0e5c56] hover:bg-[#d0e9e3]"
                >
                  + Default
                </button>
                <button
                  type="button"
                  onClick={addVariant}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  + Add Variant
                </button>
              </div>
            </div>

            {variantEntries.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-red-200 bg-red-50 px-4 py-4 text-center">
                <p className="text-xs font-semibold text-red-600">
                  ⚠ At least one variant is required. Click <strong>+ Default</strong> to add one.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {variantEntries.map((variant, index) => (
                  <div
                    key={index}
                    className={`rounded-xl border p-4 ${
                      variantErrors[index]
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    {/* Variant header */}
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-full bg-[#0e5c56]/10 px-2.5 py-0.5 text-xs font-bold text-[#0e5c56]">
                        Variant {index + 1}
                      </span>
                      {variantEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Error message */}
                    {variantErrors[index] && (
                      <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700">
                        ⚠ {variantErrors[index]}
                      </div>
                    )}

                    {/* Variant fields */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="field-label">
                          Variant Name *{" "}
                          <span className="text-xs font-normal text-gray-400">
                            e.g. Black, White, Default
                          </span>
                        </label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, "name", e.target.value)}
                          placeholder="e.g. Black"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label">
                          Variant SKU *
                        </label>
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => updateVariant(index, "sku", e.target.value)}
                          placeholder="e.g. URB-001-BLK"
                          className="field-input font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="field-label">
                          Original Price (RM) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.originalPrice}
                          onChange={(e) => updateVariant(index, "originalPrice", e.target.value)}
                          placeholder="0.00"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label">
                          Promotion Price (RM){" "}
                          <span className="text-xs font-normal text-gray-400">optional</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={variant.promotionPrice}
                          onChange={(e) => updateVariant(index, "promotionPrice", e.target.value)}
                          placeholder="0.00 — leave empty for no promo"
                          className="field-input"
                        />
                        {variant.promotionPrice && variant.originalPrice && (
                          <p className="mt-0.5 text-xs text-[#0e5c56]">
                            {(() => {
                              const op = parseFloat(variant.originalPrice);
                              const pp = parseFloat(variant.promotionPrice);
                              if (!isNaN(op) && !isNaN(pp) && pp > 0 && pp < op) {
                                const pct = Math.round(((op - pp) / op) * 100);
                                return `${pct}% off`;
                              }
                              return null;
                            })()}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="field-label">Stock Quantity *</label>
                        <input
                          type="number"
                          min="0"
                          value={variant.stockQuantity}
                          onChange={(e) => updateVariant(index, "stockQuantity", e.target.value)}
                          placeholder="0"
                          className="field-input"
                        />
                        {(() => {
                          const qty = parseInt(variant.stockQuantity, 10);
                          if (isNaN(qty) || qty <= 0)
                            return <p className="mt-0.5 text-xs text-red-500">Out of stock</p>;
                          if (qty <= 5)
                            return <p className="mt-0.5 text-xs text-amber-600">Low stock ({qty} left)</p>;
                          return <p className="mt-0.5 text-xs text-green-600">In stock ({qty})</p>;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {variantEntries.length > 0 && (
              <div className="mt-3 rounded-lg border border-[#0e5c56]/20 bg-[#e8f3ef]/60 px-4 py-3">
                <p className="text-xs font-semibold text-[#0e5c56]">
                  💡 Storefront shows the first variant&apos;s price by default. Price updates
                  dynamically when a customer selects a different variant.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Description</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Short Description</label>
                <textarea
                  name="short_description"
                  className="field-textarea"
                  rows={2}
                  defaultValue={product?.short_description ?? ""}
                  placeholder="Brief product summary shown in product cards"
                />
              </div>

              <div>
                <label className="field-label">Full Description</label>
                <textarea
                  name="description"
                  className="field-textarea"
                  rows={5}
                  defaultValue={product?.description ?? ""}
                  placeholder="Detailed product description"
                />
              </div>

              <div>
                <label className="field-label">
                  Highlights{" "}
                  <span className="text-xs font-normal text-gray-400">one per line</span>
                </label>
                <textarea
                  name="highlights"
                  className="field-textarea"
                  rows={4}
                  defaultValue={(product?.highlights ?? []).join("\n")}
                  placeholder={"Fast airflow\nLow noise\nEnergy saving"}
                />
              </div>

              <div>
                <label className="field-label">
                  Specifications{" "}
                  <span className="text-xs font-normal text-gray-400">one per line</span>
                </label>
                <textarea
                  name="specifications"
                  className="field-textarea"
                  rows={4}
                  defaultValue={(product?.specifications ?? []).join("\n")}
                  placeholder={"Voltage: 240V\nPower: 45W\nBlade: 16 inch"}
                />
              </div>
            </div>
          </div>

          {/* Shipping & Returns */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Shipping & Returns</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Shipping Info</label>
                <textarea
                  name="shipping_info"
                  className="field-textarea"
                  rows={2}
                  defaultValue={product?.shipping_info ?? ""}
                  placeholder="Free shipping for orders above RM40"
                />
              </div>
              <div>
                <label className="field-label">Return Note</label>
                <textarea
                  name="return_note"
                  className="field-textarea"
                  rows={2}
                  defaultValue={product?.return_note ?? ""}
                  placeholder="Returns accepted within 30 days"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Side column ──────────────────────────────────── */}
        <div className="space-y-5">
          {/* Status */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Status</h2>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={product?.is_active ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active (visible on storefront)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  name="is_featured"
                  type="checkbox"
                  defaultChecked={product?.is_featured ?? false}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">
                  Featured (show on homepage)
                </span>
              </label>
            </div>
          </div>

          {/* Variant summary */}
          {variantEntries.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-gray-800">Variant Summary</h2>
              <div className="space-y-2">
                {variantEntries.map((v, i) => {
                  const op = parseFloat(v.originalPrice);
                  const pp = v.promotionPrice ? parseFloat(v.promotionPrice) : null;
                  const price = pp && !isNaN(pp) && pp > 0 && pp < op ? pp : op;
                  const qty = parseInt(v.stockQuantity, 10);
                  return (
                    <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs">
                      <p className="font-bold text-gray-700">{v.name || `Variant ${i + 1}`}</p>
                      <p className="text-gray-500">
                        {!isNaN(price) ? `RM${price.toFixed(2)}` : "—"}{" "}
                        {pp && !isNaN(pp) && pp < op ? (
                          <span className="text-gray-400 line-through">RM{op.toFixed(2)}</span>
                        ) : null}
                        {" · "}
                        {isNaN(qty) || qty <= 0 ? (
                          <span className="text-red-500">Out of stock</span>
                        ) : (
                          <span className={qty <= 5 ? "text-amber-600" : "text-green-600"}>
                            {qty} in stock
                          </span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Images */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">
              Images{" "}
              <span className="text-xs font-normal text-gray-400">({keptImages.length}/9)</span>
            </h2>

            {keptImages.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Current Images
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {keptImages.map((url, i) => (
                    <div key={url} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-full rounded-lg object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeKeptImage(url)}
                        className="absolute right-1 top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {keptImages.length < 9 && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={uploadingImages}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f3ef] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0e5c56] hover:file:bg-[#d0e9e3] disabled:opacity-50"
                  onChange={handleFileChange}
                />

                {uploadingImages && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-[#0e5c56] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{uploadProgress}%</span>
                  </div>
                )}

                {imageError && <p className="mt-1 text-xs text-red-600">⚠ {imageError}</p>}

                {!imageError && !uploadingImages && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Up to {9 - keptImages.length} more · Max 10 MB each · JPG, PNG, WebP
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="card p-5 space-y-3">
            <button type="submit" className="btn-primary w-full justify-center py-2.5">
              {isEdit ? "💾 Save Changes" : "✨ Create Product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
