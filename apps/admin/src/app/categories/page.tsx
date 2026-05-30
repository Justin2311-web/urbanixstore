export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { ImageUploadField } from "@/components/image-upload-field";
import { saveCategory, deleteCategory } from "@/lib/actions";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

const CATEGORY_IMAGE_BUCKET = "banners";
const CATEGORY_IMAGE_HELP =
  "Optional. If left empty, the storefront falls back to the English image, then the legacy image. " +
  "Recommended: a square or 4:3 image, around 800 × 600 px.";

const TONES = ["tech-blue", "neon-cyan", "premium-gold", "mint", "teal", "peach", "coral-red", "urban-purple", "fresh-teal", "steel-grey"] as const;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string; editing?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: categories, error } = await sb
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) console.error("[Admin] Categories list error:", error);

  const editingId = params.editing; // which row is being edited inline

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Categories</h1>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      {/* Add new category */}
      <div className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold text-gray-800">Add New Category</h2>
        <form action={saveCategory} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="id" value="" />
          <div>
            <label className="field-label">Name * (EN)</label>
            <input name="name" required className="field-input" placeholder="e.g. Fans" />
          </div>
          <div>
            <label className="field-label">Name (中文)</label>
            <input name="name_zh" className="field-input" placeholder="e.g. 风扇" />
          </div>
          <div>
            <label className="field-label">Name (BM)</label>
            <input name="name_ms" className="field-input" placeholder="e.g. Kipas" />
          </div>
          <div>
            <label className="field-label">Slug</label>
            <input name="slug" className="field-input font-mono text-xs" placeholder="auto-generated" />
          </div>
          <div>
            <label className="field-label">Sort Order</label>
            <input name="sort_order" type="number" min="1" className="field-input" defaultValue={1} />
          </div>
          <div>
            <label className="field-label">Tone / Color</label>
            <select name="tone" className="field-select">
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Description (EN)</label>
            <input name="description" className="field-input" placeholder="Optional short description" />
          </div>
          <div>
            <label className="field-label">Description (中文)</label>
            <input name="description_zh" className="field-input" placeholder="可选简短描述" />
          </div>
          <div>
            <label className="field-label">Description (BM)</label>
            <input name="description_ms" className="field-input" placeholder="Penerangan pilihan" />
          </div>
          <div className="sm:col-span-full">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Category images</h3>
            <p className="mb-3 text-xs text-gray-500">{CATEGORY_IMAGE_HELP}</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="field-label">Category Image (EN)</label>
                <ImageUploadField
                  bucket={CATEGORY_IMAGE_BUCKET}
                  storagePath="categories/new/en"
                  name="image_url_en"
                />
              </div>
              <div>
                <label className="field-label">Category Image (中文)</label>
                <ImageUploadField
                  bucket={CATEGORY_IMAGE_BUCKET}
                  storagePath="categories/new/zh"
                  name="image_url_zh"
                />
              </div>
              <div>
                <label className="field-label">Category Image (BM)</label>
                <ImageUploadField
                  bucket={CATEGORY_IMAGE_BUCKET}
                  storagePath="categories/new/ms"
                  name="image_url_ms"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
          <div className="sm:col-span-full flex justify-end">
            <button type="submit" className="btn-primary">Add Category</button>
          </div>
        </form>
      </div>

      {/* Existing categories */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <h2 className="font-semibold text-gray-800">
            Existing Categories ({(categories ?? []).length})
          </h2>
        </div>

        {(categories ?? ([] as CategoryRow[])).length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-gray-400">No categories yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {(categories ?? ([] as CategoryRow[])).map((cat) => {
              const isEditing = editingId === cat.id;

              return (
                <div key={cat.id} className="px-5 py-4">
                  {isEditing ? (
                    /* Edit form inline */
                    <form action={saveCategory} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <input type="hidden" name="id" value={cat.id} />
                      <div>
                        <label className="field-label">Name * (EN)</label>
                        <input name="name" required className="field-input" defaultValue={(cat as CategoryRow & { name_en?: string | null }).name_en ?? cat.name} />
                      </div>
                      <div>
                        <label className="field-label">Name (中文)</label>
                        <input name="name_zh" className="field-input" defaultValue={(cat as CategoryRow & { name_zh?: string | null }).name_zh ?? ""} />
                      </div>
                      <div>
                        <label className="field-label">Name (BM)</label>
                        <input name="name_ms" className="field-input" defaultValue={(cat as CategoryRow & { name_ms?: string | null }).name_ms ?? ""} />
                      </div>
                      <div>
                        <label className="field-label">Slug</label>
                        <input name="slug" className="field-input font-mono text-xs" defaultValue={cat.slug} />
                      </div>
                      <div>
                        <label className="field-label">Sort Order</label>
                        <input name="sort_order" type="number" className="field-input" defaultValue={cat.sort_order} />
                      </div>
                      <div>
                        <label className="field-label">Tone</label>
                        <select name="tone" className="field-select" defaultValue={cat.tone ?? "mint"}>
                          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="field-label">Description (EN)</label>
                        <input name="description" className="field-input" defaultValue={cat.description ?? ""} />
                      </div>
                      <div>
                        <label className="field-label">Description (中文)</label>
                        <input name="description_zh" className="field-input" defaultValue={(cat as CategoryRow & { description_zh?: string | null }).description_zh ?? ""} />
                      </div>
                      <div>
                        <label className="field-label">Description (BM)</label>
                        <input name="description_ms" className="field-input" defaultValue={(cat as CategoryRow & { description_ms?: string | null }).description_ms ?? ""} />
                      </div>
                      <div className="sm:col-span-full">
                        <h3 className="mb-2 text-sm font-semibold text-gray-700">Category images</h3>
                        <p className="mb-3 text-xs text-gray-500">{CATEGORY_IMAGE_HELP}</p>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <label className="field-label">Category Image (EN)</label>
                            <ImageUploadField
                              bucket={CATEGORY_IMAGE_BUCKET}
                              storagePath={`categories/${cat.id}/en`}
                              name="image_url_en"
                              initialUrl={
                                (cat as CategoryRow & { image_url_en?: string | null }).image_url_en ??
                                cat.image_url ??
                                ""
                              }
                            />
                          </div>
                          <div>
                            <label className="field-label">Category Image (中文)</label>
                            <ImageUploadField
                              bucket={CATEGORY_IMAGE_BUCKET}
                              storagePath={`categories/${cat.id}/zh`}
                              name="image_url_zh"
                              initialUrl={
                                (cat as CategoryRow & { image_url_zh?: string | null }).image_url_zh ?? ""
                              }
                            />
                          </div>
                          <div>
                            <label className="field-label">Category Image (BM)</label>
                            <ImageUploadField
                              bucket={CATEGORY_IMAGE_BUCKET}
                              storagePath={`categories/${cat.id}/ms`}
                              name="image_url_ms"
                              initialUrl={
                                (cat as CategoryRow & { image_url_ms?: string | null }).image_url_ms ?? ""
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:col-span-full">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input name="is_active" type="checkbox" defaultChecked={cat.is_active} className="h-4 w-4 rounded" />
                          <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                      </div>
                      <div className="sm:col-span-full flex gap-2">
                        <button type="submit" className="btn-primary text-sm px-4 py-1.5">Save</button>
                        <a href="/categories" className="btn-secondary text-sm px-4 py-1.5">Cancel</a>
                      </div>
                    </form>
                  ) : (
                    /* Display row */
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {(() => {
                          const localized = cat as CategoryRow & {
                            image_url_en?: string | null;
                            image_url_zh?: string | null;
                            image_url_ms?: string | null;
                          };
                          const fallback = cat.image_url ?? "";
                          const previews = [
                            { label: "EN", url: localized.image_url_en || fallback },
                            { label: "中文", url: localized.image_url_zh || localized.image_url_en || fallback },
                            { label: "BM", url: localized.image_url_ms || localized.image_url_en || fallback },
                          ];
                          return (
                            <div className="flex items-center gap-2">
                              {previews.map((preview) =>
                                preview.url ? (
                                  <div className="flex flex-col items-center gap-0.5" key={preview.label}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={preview.url}
                                      alt={`${cat.name} ${preview.label}`}
                                      className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                                    />
                                    <span className="text-[10px] font-semibold text-gray-500">{preview.label}</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-0.5" key={preview.label}>
                                    <div className="h-10 w-10 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
                                    <span className="text-[10px] font-semibold text-gray-300">{preview.label}</span>
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })()}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{cat.name}</span>
                            <span className={cat.is_active ? "badge-active" : "badge-inactive"}>
                              {cat.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400">
                            slug: <span className="font-mono">{cat.slug}</span>
                            {" · "}sort: {cat.sort_order}
                            {" · "}tone: {cat.tone ?? "mint"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/categories?editing=${cat.id}`}
                          className="btn-secondary text-xs px-3 py-1.5"
                        >
                          Edit
                        </a>
                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={cat.id} />
                          <button
                            type="submit"
                            className="btn-danger text-xs px-3 py-1.5"
                            onClick={undefined}
                            formAction={deleteCategory}
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
