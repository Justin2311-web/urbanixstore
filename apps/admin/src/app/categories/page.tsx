export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { saveCategory, deleteCategory } from "@/lib/actions";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

const TONES = ["mint", "coral", "sky", "gold", "lavender", "green", "orange", "blue"] as const;

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
            <label className="field-label">Name *</label>
            <input name="name" required className="field-input" placeholder="e.g. Fans" />
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
            <label className="field-label">Description</label>
            <input name="description" className="field-input" placeholder="Optional short description" />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Image URL</label>
            <input name="image_url" className="field-input" placeholder="https://…" />
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
                        <label className="field-label">Name *</label>
                        <input name="name" required className="field-input" defaultValue={cat.name} />
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
                        <label className="field-label">Description</label>
                        <input name="description" className="field-input" defaultValue={cat.description ?? ""} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="field-label">Image URL</label>
                        <input name="image_url" className="field-input" defaultValue={cat.image_url ?? ""} />
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
                        {cat.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cat.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-gray-200" />
                        )}
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
