"use client";

import { useState } from "react";
import { saveProduct, createSignedUploadUrl } from "@/lib/actions";

type Category = { id: string; name: string };
type ImageLang = "en" | "zh" | "ms";

/** Per-variant pricing entry as stored in product_variants JSONB (new format) */
type VariantEntry = {
  name: string;
  nameZh: string;
  nameMs: string;
  groupName: string;
  groupNameZh: string;
  groupNameMs: string;
  sku: string;
  originalPrice: string;   // string for input binding
  promotionPrice: string;  // string for input binding - empty = no promo
  stockQuantity: string;   // string for input binding
  imageUrl: string;
};

type ExistingProduct = {
  id: string;
  name: string;
  name_en: string;
  name_zh: string;
  name_ms: string;
  sku: string;
  slug: string;
  category_id: string | null;
  /** Legacy product-level price - used to seed default variant for old products */
  price: number;
  promotion_price: number | null;
  promotion_start_at: string | null;
  promotion_end_at: string | null;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  short_description: string | null;
  short_description_en: string;
  short_description_zh: string;
  short_description_ms: string;
  description: string | null;
  description_en: string;
  description_zh: string;
  description_ms: string;
  highlights: string[];
  highlights_en?: string[];
  highlights_zh?: string[];
  highlights_ms?: string[];
  specifications: string[];
  specifications_en?: string[];
  specifications_zh?: string[];
  specifications_ms?: string[];
  shipping_info: string | null;
  rating: number | null;
  /** New-format variant entries (with originalPrice). Null/empty -> auto-seed from legacy price. */
  variant_entries: Array<{
    name: string;
    localizedName?: { en: string; zh?: string; ms?: string };
    groupName?: string;
    localizedGroupName?: { en: string; zh?: string; ms?: string };
    sku: string;
    originalPrice: number;
    promotionPrice?: number | null;
    stockQuantity: number;
    imageUrl?: string;
  }> | null;
  images: Array<{ image_url: string; sort_order: number }>;
  images_en?: Array<{ image_url: string; sort_order: number }>;
  images_zh?: Array<{ image_url: string; sort_order: number }>;
  images_ms?: Array<{ image_url: string; sort_order: number }>;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function makeDefaultVariant(product?: ExistingProduct): VariantEntry {
  return {
    name: "Default",
    nameZh: "默认",
    nameMs: "Lalai",
    groupName: "Option",
    groupNameZh: "选项",
    groupNameMs: "Pilihan",
    sku: product?.sku ?? "",
    originalPrice: product?.price ? String(product.price) : "",
    promotionPrice: product?.promotion_price ? String(product.promotion_price) : "",
    stockQuantity: product?.stock_quantity != null ? String(product.stock_quantity) : "0",
    imageUrl: "",
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
  const [nameValue, setNameValue] = useState(product?.name_en ?? product?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugValue, setSlugValue] = useState(product?.slug ?? "");
  // Multilingual name
  const [nameZh, setNameZh] = useState(product?.name_zh ?? "");
  const [nameMs, setNameMs] = useState(product?.name_ms ?? "");
  // Multilingual short description
  const [shortDescEn, setShortDescEn] = useState(product?.short_description_en ?? product?.short_description ?? "");
  const [shortDescZh, setShortDescZh] = useState(product?.short_description_zh ?? "");
  const [shortDescMs, setShortDescMs] = useState(product?.short_description_ms ?? "");
  // Multilingual full description
  const [descEn, setDescEn] = useState(product?.description_en ?? product?.description ?? "");
  const [descZh, setDescZh] = useState(product?.description_zh ?? "");
  const [descMs, setDescMs] = useState(product?.description_ms ?? "");
  // Active language tab for multilingual sections
  const [nameLang, setNameLang] = useState<"en" | "zh" | "ms">("en");
  const [descLang, setDescLang] = useState<"en" | "zh" | "ms">("en");
  const [hlLang, setHlLang] = useState<"en" | "zh" | "ms">("en");
  const [specLang, setSpecLang] = useState<"en" | "zh" | "ms">("en");
  // Multilingual highlights
  const [hlEn, setHlEn] = useState<string>(() => {
    if (product?.highlights_en && product.highlights_en.length > 0) return product.highlights_en.join("\n");
    const h = product?.highlights ?? [];
    return Array.isArray(h) ? (h as string[]).join("\n") : "";
  });
  const [hlZh, setHlZh] = useState<string>(() => (product?.highlights_zh ?? []).join("\n"));
  const [hlMs, setHlMs] = useState<string>(() => (product?.highlights_ms ?? []).join("\n"));
  // Multilingual specifications
  const [specEn, setSpecEn] = useState<string>(() => {
    if (product?.specifications_en && product.specifications_en.length > 0) return product.specifications_en.join("\n");
    const s = product?.specifications ?? [];
    return Array.isArray(s) ? (s as string[]).join("\n") : "";
  });
  const [specZh, setSpecZh] = useState<string>(() => (product?.specifications_zh ?? []).join("\n"));
  const [specMs, setSpecMs] = useState<string>(() => (product?.specifications_ms ?? []).join("\n"));
  // Per-language image state
  const [imgLang, setImgLang] = useState<"en" | "zh" | "ms">("en");
  const [keptImagesEn, setKeptImagesEn] = useState<string[]>(() =>
    product?.images_en?.map(i => i.image_url) ?? product?.images.map(i => i.image_url) ?? []
  );
  const [keptImagesZh, setKeptImagesZh] = useState<string[]>(() =>
    product?.images_zh?.map(i => i.image_url) ?? []
  );
  const [keptImagesMs, setKeptImagesMs] = useState<string[]>(() =>
    product?.images_ms?.map(i => i.image_url) ?? []
  );
  // keptImages mirrors keptImagesEn for backward-compat with syncProductImages (product_images table)
  const [keptImages, setKeptImages] = useState(
    product?.images_en?.map(i => i.image_url) ?? product?.images.map((i) => i.image_url) ?? []
  );
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggingImageUrl, setDraggingImageUrl] = useState<string | null>(null);
  const [variantImageUploads, setVariantImageUploads] = useState<Record<number, number>>({});
  const [variantImageErrors, setVariantImageErrors] = useState<Record<number, string>>({});

  // Variant entries (new per-variant pricing format)
  const [variantEntries, setVariantEntries] = useState<VariantEntry[]>(() => {
    if (product?.variant_entries && product.variant_entries.length > 0) {
      return product.variant_entries.map((v) => ({
        name: v.name,
        nameZh: v.localizedName?.zh ?? "",
        nameMs: v.localizedName?.ms ?? "",
        groupName: v.groupName ?? v.localizedGroupName?.en ?? "Option",
        groupNameZh: v.localizedGroupName?.zh ?? "",
        groupNameMs: v.localizedGroupName?.ms ?? "",
        sku: v.sku,
        originalPrice: String(v.originalPrice),
        promotionPrice: v.promotionPrice ? String(v.promotionPrice) : "",
        stockQuantity: String(v.stockQuantity),
        imageUrl: v.imageUrl ?? "",
      }));
    }
    // Auto-seed a default variant from the legacy product-level price
    return [makeDefaultVariant(product)];
  });
  const [variantErrors, setVariantErrors] = useState<Record<number, string>>({});

  function addVariant() {
    setVariantEntries((prev) => [
      ...prev,
      { name: "", nameZh: "", nameMs: "", groupName: "Option", groupNameZh: "选项", groupNameMs: "Pilihan", sku: "", originalPrice: "", promotionPrice: "", stockQuantity: "0", imageUrl: "" },
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
    setVariantImageErrors((prev) => {
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
      localizedName: {
        en: v.name.trim(),
        zh: v.nameZh.trim() || v.name.trim(),
        ms: v.nameMs.trim() || v.name.trim(),
      },
      groupName: v.groupName.trim() || "Option",
      localizedGroupName: {
        en: v.groupName.trim() || "Option",
        zh: v.groupNameZh.trim() || v.groupName.trim() || "Option",
        ms: v.groupNameMs.trim() || v.groupName.trim() || "Option",
      },
      sku: v.sku.trim(),
      originalPrice: parseFloat(v.originalPrice) || 0,
      promotionPrice: v.promotionPrice.trim() ? parseFloat(v.promotionPrice) || null : null,
      stockQuantity: parseInt(v.stockQuantity, 10) || 0,
      imageUrl: v.imageUrl.trim() || undefined,
    }));
    return JSON.stringify(entries);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setNameValue(v);
    if (v.trim()) setNameError(null);
    if (!isEdit) setSlugValue(slugify(v));
  }

  function removeKeptImage(url: string) {
    if (imgLang === "en") {
      setKeptImagesEn((prev) => prev.filter((u) => u !== url));
      setKeptImages((prev) => prev.filter((u) => u !== url));
    }
    else if (imgLang === "zh") setKeptImagesZh((prev) => prev.filter((u) => u !== url));
    else setKeptImagesMs((prev) => prev.filter((u) => u !== url));
  }

  function updateImagesForLanguage(lang: ImageLang, updater: (images: string[]) => string[]) {
    if (lang === "en") {
      setKeptImagesEn((current) => {
        const next = updater(current);
        setKeptImages(next);
        return next;
      });
      return;
    }
    if (lang === "zh") {
      setKeptImagesZh(updater);
      return;
    }
    setKeptImagesMs(updater);
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    updateImagesForLanguage(imgLang, (images) => {
      const next = [...images];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return images;
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function handleImageDrop(targetIndex: number) {
    if (!draggingImageUrl) return;
    const fromIndex = currentImages.indexOf(draggingImageUrl);
    if (fromIndex >= 0) {
      moveImage(fromIndex, targetIndex);
    }
    setDraggingImageUrl(null);
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

    const currentImages = imgLang === "en" ? keptImagesEn : imgLang === "zh" ? keptImagesZh : keptImagesMs;
    const slotsAvailable = 9 - currentImages.length;
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
        const filePath = `products/${productId}/${imgLang}/${Date.now()}-${i}.${ext}`;

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

      if (imgLang === "en") {
        setKeptImagesEn((prev) => [...prev, ...newUrls]);
        setKeptImages((prev) => [...prev, ...newUrls]);
      }
      else if (imgLang === "zh") setKeptImagesZh((prev) => [...prev, ...newUrls]);
      else setKeptImagesMs((prev) => [...prev, ...newUrls]);
    } catch (err: unknown) {
      setImageError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  }

  async function handleVariantImageChange(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 10 * 1024 * 1024;
    if (!file.type.startsWith("image/")) {
      setVariantImageErrors((current) => ({ ...current, [index]: `"${file.name}" is not an image file.` }));
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE) {
      setVariantImageErrors((current) => ({
        ...current,
        [index]: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum is 10 MB.`,
      }));
      e.target.value = "";
      return;
    }

    setVariantImageErrors((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
    setVariantImageUploads((current) => ({ ...current, [index]: 10 }));

    try {
      const productId = product?.id ?? `tmp-${Date.now()}`;
      const ext = file.name.split(".").pop() ?? "jpg";
      const safeVariantName = slugify(variantEntries[index]?.name || `variant-${index + 1}`) || `variant-${index + 1}`;
      const filePath = `products/${productId}/variants/${safeVariantName}-${Date.now()}.${ext}`;
      const { signedUrl, publicUrl } = await createSignedUploadUrl("product-images", filePath);

      setVariantImageUploads((current) => ({ ...current, [index]: 45 }));
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);

      updateVariant(index, "imageUrl", publicUrl);
      setVariantImageUploads((current) => ({ ...current, [index]: 100 }));
    } catch (err: unknown) {
      setVariantImageErrors((current) => ({
        ...current,
        [index]: err instanceof Error ? err.message : "Upload failed. Please try again.",
      }));
    } finally {
      setVariantImageUploads((current) => {
        const next = { ...current };
        delete next[index];
        return next;
      });
      e.target.value = "";
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!nameValue.trim()) {
      e.preventDefault();
      setNameError("English product name is required.");
      setNameLang("en");
      return;
    }
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

  const currentImages = imgLang === "en" ? keptImagesEn : imgLang === "zh" ? keptImagesZh : keptImagesMs;

  return (
    <form action={saveProduct} onSubmit={handleSubmit}>
      {/* Hidden: product DB ID */}
      <input type="hidden" name="product_db_id" value={product?.id ?? ""} />
      {/* Hidden: slug */}
      <input type="hidden" name="slug" value={slugValue} />
      {/* Hidden: legacy required name, kept in sync with EN name */}
      <input type="hidden" name="name" value={nameValue} />
      {/* Hidden: multilingual name */}
      <input type="hidden" name="name_en" value={nameValue} />
      <input type="hidden" name="name_zh" value={nameZh} />
      <input type="hidden" name="name_ms" value={nameMs} />
      {/* Hidden: multilingual short description */}
      <input type="hidden" name="short_description_en" value={shortDescEn} />
      <input type="hidden" name="short_description_zh" value={shortDescZh} />
      <input type="hidden" name="short_description_ms" value={shortDescMs} />
      {/* Hidden: multilingual full description */}
      <input type="hidden" name="description_en" value={descEn} />
      <input type="hidden" name="description_zh" value={descZh} />
      <input type="hidden" name="description_ms" value={descMs} />
      {/* Hidden: kept image URLs */}
      <input type="hidden" name="kept_image_count" value={keptImagesEn.length} />
      {keptImagesEn.map((url, i) => (
        <input key={url} type="hidden" name={`kept_image_${i}`} value={url} />
      ))}
      {/* Hidden: serialised variant entries (new pricing format) */}
      <input type="hidden" name="variant_entries" value={buildVariantEntriesJson()} />
      {/* Hidden: multilingual highlights */}
      <input type="hidden" name="highlights_en" value={hlEn} />
      <input type="hidden" name="highlights_zh" value={hlZh} />
      <input type="hidden" name="highlights_ms" value={hlMs} />
      {/* Hidden: multilingual specifications */}
      <input type="hidden" name="specifications_en" value={specEn} />
      <input type="hidden" name="specifications_zh" value={specZh} />
      <input type="hidden" name="specifications_ms" value={specMs} />
      {/* Hidden: per-language image URL arrays (stored as JSON strings) */}
      <input type="hidden" name="image_urls_en" value={JSON.stringify(keptImagesEn)} />
      <input type="hidden" name="image_urls_zh" value={JSON.stringify(keptImagesZh)} />
      <input type="hidden" name="image_urls_ms" value={JSON.stringify(keptImagesMs)} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">

          {/* Basic info */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Basic Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">

              {/* Multilingual Product Name */}
              <div className="sm:col-span-2">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="field-label mb-0">Product Name *</label>
                  <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    {(["en", "zh", "ms"] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setNameLang(lang)}
                        className={`rounded px-2.5 py-0.5 text-xs font-bold transition ${
                          nameLang === lang
                            ? "bg-[#0e5c56] text-white"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {lang === "en" ? "EN" : lang === "zh" ? "中文" : "BM"}
                      </button>
                    ))}
                  </div>
                </div>
                {nameError ? (
                  <p className="mb-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                    {nameError}
                  </p>
                ) : null}
                {nameLang === "en" && (
                  <input
                    required
                    className="field-input"
                    placeholder="English product name"
                    value={nameValue}
                    onChange={handleNameChange}
                  />
                )}
                {nameLang === "zh" && (
                  <input
                    className="field-input"
                    placeholder="中文产品名称"
                    value={nameZh}
                    onChange={(e) => setNameZh(e.target.value)}
                  />
                )}
                {nameLang === "ms" && (
                  <input
                    className="field-input"
                    placeholder="Nama produk dalam Bahasa Malaysia"
                    value={nameMs}
                    onChange={(e) => setNameMs(e.target.value)}
                  />
                )}
                <p className="mt-1 text-[11px] text-gray-400">
                  {nameLang === "en" ? "Required. Used as default name." : "Optional. Falls back to EN if empty."}
                </p>
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
                  <option value="">- No category -</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Rating (0-5)</label>
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

          {/* Product Variants & Pricing */}
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
                  Warning: At least one variant is required. Click <strong>+ Default</strong> to add one.
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
                        Warning: {variantErrors[index]}
                      </div>
                    )}

                    {/* Variant fields */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="field-label">Variant Image</label>
                        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                            {variant.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                alt={`${variant.name || `Variant ${index + 1}`} preview`}
                                className="h-full w-full object-contain"
                                src={variant.imageUrl}
                              />
                            ) : (
                              <span className="px-2 text-center text-[11px] font-semibold text-gray-400">
                                No image
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={variantImageUploads[index] != null}
                              onChange={(e) => handleVariantImageChange(index, e)}
                              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f3ef] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[#0e5c56] hover:file:bg-[#d0e9e3] disabled:opacity-50"
                            />
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {variant.imageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => updateVariant(index, "imageUrl", "")}
                                  className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                                >
                                  Remove image
                                </button>
                              ) : null}
                              <span className="text-xs text-gray-400">
                                Shared across EN / 中文 / BM. Max 10 MB.
                              </span>
                            </div>
                            {variantImageUploads[index] != null ? (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="h-1.5 flex-1 rounded-full bg-gray-200">
                                  <div
                                    className="h-1.5 rounded-full bg-[#0e5c56] transition-all duration-300"
                                    style={{ width: `${variantImageUploads[index]}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">{variantImageUploads[index]}%</span>
                              </div>
                            ) : null}
                            {variantImageErrors[index] ? (
                              <p className="mt-1 text-xs font-semibold text-red-600">
                                Warning: {variantImageErrors[index]}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

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
                        <label className="field-label">Variant Name 中文</label>
                        <input
                          type="text"
                          value={variant.nameZh}
                          onChange={(e) => updateVariant(index, "nameZh", e.target.value)}
                          placeholder="例如：黑色"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label">Variant Name BM</label>
                        <input
                          type="text"
                          value={variant.nameMs}
                          onChange={(e) => updateVariant(index, "nameMs", e.target.value)}
                          placeholder="Contoh: Hitam"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label">Group Name</label>
                        <input
                          type="text"
                          value={variant.groupName}
                          onChange={(e) => updateVariant(index, "groupName", e.target.value)}
                          placeholder="e.g. Color"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label">Group 中文</label>
                        <input
                          type="text"
                          value={variant.groupNameZh}
                          onChange={(e) => updateVariant(index, "groupNameZh", e.target.value)}
                          placeholder="例如：颜色"
                          className="field-input"
                        />
                      </div>

                      <div>
                        <label className="field-label">Group BM</label>
                        <input
                          type="text"
                          value={variant.groupNameMs}
                          onChange={(e) => updateVariant(index, "groupNameMs", e.target.value)}
                          placeholder="Contoh: Warna"
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
                          placeholder="0.00 - leave empty for no promo"
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
                  Tip: Storefront shows the first variant&apos;s price by default. Price updates
                  dynamically when a customer selects a different variant.
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Description</h2>
              <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {(["en", "zh", "ms"] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setDescLang(lang)}
                    className={`rounded px-2.5 py-0.5 text-xs font-bold transition ${
                      descLang === lang
                        ? "bg-[#0e5c56] text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {lang === "en" ? "EN" : lang === "zh" ? "中文" : "BM"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {/* Short Description */}
              <div>
                <label className="field-label">
                  Short Description{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({descLang === "en" ? "English" : descLang === "zh" ? "中文" : "Bahasa Malaysia"})
                  </span>
                </label>
                {descLang === "en" && (
                  <textarea
                    className="field-textarea"
                    rows={2}
                    placeholder="Brief product summary shown in product cards"
                    value={shortDescEn}
                    onChange={(e) => setShortDescEn(e.target.value)}
                  />
                )}
                {descLang === "zh" && (
                  <textarea
                    className="field-textarea"
                    rows={2}
                    placeholder="简短产品摘要（产品卡片显示）"
                    value={shortDescZh}
                    onChange={(e) => setShortDescZh(e.target.value)}
                  />
                )}
                {descLang === "ms" && (
                  <textarea
                    className="field-textarea"
                    rows={2}
                    placeholder="Ringkasan produk pendek (ditunjukkan dalam kad produk)"
                    value={shortDescMs}
                    onChange={(e) => setShortDescMs(e.target.value)}
                  />
                )}
              </div>

              {/* Full Description */}
              <div>
                <label className="field-label">
                  Full Description{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({descLang === "en" ? "English" : descLang === "zh" ? "中文" : "Bahasa Malaysia"})
                  </span>
                </label>
                {descLang === "en" && (
                  <textarea
                    className="field-textarea"
                    rows={6}
                    placeholder="Detailed product description"
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                  />
                )}
                {descLang === "zh" && (
                  <textarea
                    className="field-textarea"
                    rows={6}
                    placeholder="详细产品说明"
                    value={descZh}
                    onChange={(e) => setDescZh(e.target.value)}
                  />
                )}
                {descLang === "ms" && (
                  <textarea
                    className="field-textarea"
                    rows={6}
                    placeholder="Penerangan produk terperinci"
                    value={descMs}
                    onChange={(e) => setDescMs(e.target.value)}
                  />
                )}
              </div>

              {/* Highlights - multilingual */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="field-label mb-0">Highlights <span className="text-xs font-normal text-gray-400">one per line</span></label>
                  <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    {(["en", "zh", "ms"] as const).map((lang) => (
                      <button key={lang} type="button" onClick={() => setHlLang(lang)}
                        className={`rounded px-2.5 py-0.5 text-xs font-bold transition ${hlLang === lang ? "bg-[#0e5c56] text-white" : "text-gray-500 hover:text-gray-700"}`}>
                        {lang === "en" ? "EN" : lang === "zh" ? "中文" : "BM"}
                      </button>
                    ))}
                  </div>
                </div>
                {hlLang === "en" && <textarea className="field-textarea" rows={4} value={hlEn} onChange={e => setHlEn(e.target.value)} placeholder={"Fast airflow\nLow noise\nEnergy saving"} />}
                {hlLang === "zh" && <textarea className="field-textarea" rows={4} value={hlZh} onChange={e => setHlZh(e.target.value)} placeholder={"强劲风力\n低噪音\n节能"} />}
                {hlLang === "ms" && <textarea className="field-textarea" rows={4} value={hlMs} onChange={e => setHlMs(e.target.value)} placeholder={"Angin kuat\nBunyi rendah\nJimat tenaga"} />}
              </div>

              {/* Specifications - multilingual */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="field-label mb-0">Specifications <span className="text-xs font-normal text-gray-400">one per line</span></label>
                  <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                    {(["en", "zh", "ms"] as const).map((lang) => (
                      <button key={lang} type="button" onClick={() => setSpecLang(lang)}
                        className={`rounded px-2.5 py-0.5 text-xs font-bold transition ${specLang === lang ? "bg-[#0e5c56] text-white" : "text-gray-500 hover:text-gray-700"}`}>
                        {lang === "en" ? "EN" : lang === "zh" ? "中文" : "BM"}
                      </button>
                    ))}
                  </div>
                </div>
                {specLang === "en" && <textarea className="field-textarea" rows={4} value={specEn} onChange={e => setSpecEn(e.target.value)} placeholder={"Voltage: 240V\nPower: 45W\nBlade: 16 inch"} />}
                {specLang === "zh" && <textarea className="field-textarea" rows={4} value={specZh} onChange={e => setSpecZh(e.target.value)} placeholder={"电压: 240V\n功率: 45W\n叶片: 16寸"} />}
                {specLang === "ms" && <textarea className="field-textarea" rows={4} value={specMs} onChange={e => setSpecMs(e.target.value)} placeholder={"Voltan: 240V\nKuasa: 45W\nBilah: 16 inci"} />}
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Shipping / Delivery Info</h2>
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
            </div>
          </div>
        </div>

        {/* Side column */}
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
                        {!isNaN(price) ? `RM${price.toFixed(2)}` : "-"}{" "}
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

          {/* Images - per language */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">
                Images{" "}
                <span className="text-xs font-normal text-gray-400">({currentImages.length}/9)</span>
              </h2>
              <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
                {(["en", "zh", "ms"] as const).map((lang) => (
                  <button key={lang} type="button" onClick={() => setImgLang(lang)}
                    className={`rounded px-2.5 py-0.5 text-xs font-bold transition ${imgLang === lang ? "bg-[#0e5c56] text-white" : "text-gray-500 hover:text-gray-700"}`}>
                    {lang === "en" ? "EN" : lang === "zh" ? "中文" : "BM"}
                  </button>
                ))}
              </div>
            </div>

            {currentImages.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Current Images · drag to reorder · first image is main
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {currentImages.map((url, i) => (
                    <div
                      key={url}
                      className="relative group cursor-grab rounded-lg focus-within:ring-2 focus-within:ring-[#0e5c56]/30"
                      draggable
                      onDragStart={(event) => {
                        setDraggingImageUrl(url);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", url);
                      }}
                      onDragEnd={() => setDraggingImageUrl(null)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        handleImageDrop(i);
                      }}
                    >
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
                        ×
                      </button>
                      <div className="absolute left-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          aria-label="Move image earlier"
                          className="rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white disabled:opacity-35"
                          disabled={i === 0}
                          onClick={() => moveImage(i, i - 1)}
                          type="button"
                        >
                          ↑
                        </button>
                        <button
                          aria-label="Move image later"
                          className="rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white disabled:opacity-35"
                          disabled={i === currentImages.length - 1}
                          onClick={() => moveImage(i, i + 1)}
                          type="button"
                        >
                          ↓
                        </button>
                      </div>
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

            {currentImages.length < 9 && (
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

                {imageError && <p className="mt-1 text-xs text-red-600">Warning: {imageError}</p>}

                {!imageError && !uploadingImages && (
                  <p className="mt-1.5 text-xs text-gray-400">
                    Up to {9 - currentImages.length} more · Max 10 MB each · JPG, PNG, WebP
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Save button */}
          <div className="card p-5 space-y-3">
            <button type="submit" className="btn-primary w-full justify-center py-2.5">
              {isEdit ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
