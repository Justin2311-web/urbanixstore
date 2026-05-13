"use client";

import { useState } from "react";
import { saveProduct, createSignedUploadUrl } from "@/lib/actions";

type Category = { id: string; name: string };

type ExistingProduct = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  category_id: string | null;
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
  product_variants: Array<{ name: string; values: string[] }> | null;
  images: Array<{ image_url: string; sort_order: number }>;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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

  // Variant groups state: each entry is {name, values (as comma-separated string for editing)}
  const [variantGroups, setVariantGroups] = useState<Array<{ name: string; valuesText: string }>>(
    (product?.product_variants ?? []).map((g) => ({
      name: g.name,
      valuesText: g.values.join(", "),
    }))
  );

  function addVariantGroup() {
    setVariantGroups((prev) => [...prev, { name: "", valuesText: "" }]);
  }

  function removeVariantGroup(index: number) {
    setVariantGroups((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariantGroup(index: number, field: "name" | "valuesText", value: string) {
    setVariantGroups((prev) =>
      prev.map((g, i) => (i === index ? { ...g, [field]: value } : g))
    );
  }

  /** Serialise current variant groups to the JSONB format for the hidden input */
  function buildVariantsJson(): string {
    const groups = variantGroups
      .map((g) => ({
        name: g.name.trim(),
        values: g.valuesText
          .split(/[,\n]/)
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((g) => g.name && g.values.length > 0);
    return groups.length > 0 ? JSON.stringify(groups) : "";
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

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    // Validate each file before touching the server
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setImageError(`"${file.name}" is not an image file.`);
        e.target.value = "";
        return;
      }
      if (file.size > MAX_SIZE) {
        setImageError(
          `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 10 MB.`
        );
        e.target.value = "";
        return;
      }
    }

    const slotsAvailable = 9 - keptImages.length;
    if (files.length > slotsAvailable) {
      setImageError(
        `Only ${slotsAvailable} more image slot${slotsAvailable === 1 ? "" : "s"} available (max 9 total).`
      );
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

        // 1. Get signed upload URL (tiny server-action request — no file data)
        const { signedUrl, publicUrl } = await createSignedUploadUrl(
          "product-images",
          filePath
        );

        // 2. PUT file directly to Supabase Storage (bypasses Vercel body limit)
        const res = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        if (!res.ok) {
          throw new Error(`Upload failed for "${file.name}": ${res.statusText}`);
        }

        newUrls.push(publicUrl);
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // Add newly uploaded URLs to the kept-images list so they're submitted with the form
      setKeptImages((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      setImageError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  }

  return (
    <form action={saveProduct}>
      {/* Hidden: product DB ID (UUID) */}
      <input type="hidden" name="product_db_id" value={product?.id ?? ""} />

      {/* Hidden: slug */}
      <input type="hidden" name="slug" value={slugValue} />

      {/* Hidden: kept image URLs */}
      <input type="hidden" name="kept_image_count" value={keptImages.length} />
      {keptImages.map((url, i) => (
        <input key={url} type="hidden" name={`kept_image_${i}`} value={url} />
      ))}

      {/* Hidden: product variants JSON */}
      <input type="hidden" name="product_variants" value={buildVariantsJson()} />

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
                <label className="field-label">SKU *</label>
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

          {/* Pricing */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Normal Price (RM) *</label>
                <input
                  name="price"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="field-input"
                  defaultValue={product?.price}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="field-label">
                  Promotion Price (RM){" "}
                  <span className="text-xs font-normal text-gray-400">optional</span>
                </label>
                <input
                  name="promotion_price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="field-input"
                  defaultValue={product?.promotion_price ?? ""}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="field-label">Promo Start Date</label>
                <input
                  name="promotion_start_at"
                  type="datetime-local"
                  className="field-input"
                  defaultValue={
                    product?.promotion_start_at
                      ? new Date(product.promotion_start_at).toISOString().slice(0, 16)
                      : ""
                  }
                />
              </div>

              <div>
                <label className="field-label">Promo End Date</label>
                <input
                  name="promotion_end_at"
                  type="datetime-local"
                  className="field-input"
                  defaultValue={
                    product?.promotion_end_at
                      ? new Date(product.promotion_end_at).toISOString().slice(0, 16)
                      : ""
                  }
                />
              </div>
            </div>
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

          {/* Product Variants */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">Product Variants</h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Add options customers must choose (e.g. Color, Size). Leave empty for single-option products.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariantGroup}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                + Add Group
              </button>
            </div>

            {variantGroups.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-center text-xs text-gray-400">
                No variant groups yet. Click <strong>+ Add Group</strong> to add one.
              </p>
            ) : (
              <div className="space-y-3">
                {variantGroups.map((group, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => updateVariantGroup(index, "name", e.target.value)}
                        placeholder="Group name (e.g. Color, Size, Style)"
                        className="field-input flex-1 text-sm font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantGroup(index)}
                        className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        aria-label="Remove variant group"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Values <span className="font-normal">(comma or newline-separated)</span>
                      </label>
                      <input
                        type="text"
                        value={group.valuesText}
                        onChange={(e) => updateVariantGroup(index, "valuesText", e.target.value)}
                        placeholder="e.g. Black, White, Blue"
                        className="field-input text-sm"
                      />
                      {group.valuesText.trim() && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {group.valuesText
                            .split(/[,\n]/)
                            .map((v) => v.trim())
                            .filter(Boolean)
                            .map((v) => (
                              <span
                                key={v}
                                className="rounded-full border border-[#0e5c56]/20 bg-[#e8f3ef] px-2 py-0.5 text-xs font-semibold text-[#0e5c56]"
                              >
                                {v}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

          {/* Inventory */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Inventory</h2>
            <div>
              <label className="field-label">Stock Quantity</label>
              <input
                name="stock_quantity"
                type="number"
                min="0"
                className="field-input"
                defaultValue={product?.stock_quantity ?? 0}
              />
            </div>
          </div>

          {/* Images */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">
              Images{" "}
              <span className="text-xs font-normal text-gray-400">
                ({keptImages.length}/9)
              </span>
            </h2>

            {/* Current images */}
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

            {/* Add new images — uploaded directly to Supabase, URL appended to kept list */}
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

                {/* Upload progress bar */}
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

                {/* Error message */}
                {imageError && (
                  <p className="mt-1 text-xs text-red-600">⚠ {imageError}</p>
                )}

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
            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
            >
              {isEdit ? "💾 Save Changes" : "✨ Create Product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
