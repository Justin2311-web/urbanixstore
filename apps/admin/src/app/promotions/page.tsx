export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { deletePromotionBanner } from "@/lib/actions";
import { BannerForm } from "@/components/banner-form";

type PromoBannerRow = Database["public"]["Tables"]["promotion_banners"]["Row"];

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string; editing?: string; new?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: bannersRaw } = await sb
    .from("promotion_banners")
    .select("*")
    .order("sort_order");
  const banners = bannersRaw as PromoBannerRow[] | null;

  const editingId = params.editing;
  const isAddingNew = params.new === "1";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Promotion Banners</h1>
        {!isAddingNew && (
          <a href="/promotions?new=1" className="btn-primary">
            + Add Banner
          </a>
        )}
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      {/* New banner form */}
      {isAddingNew && (
        <div className="card mb-6 p-5">
          <h2 className="mb-4 font-semibold text-gray-800">New Promotion Banner</h2>
          <BannerForm />
          <a href="/promotions" className="mt-3 inline-block text-sm text-gray-500 hover:underline">
            Cancel
          </a>
        </div>
      )}

      {/* Banner list */}
      <div className="space-y-4">
        {(banners ?? []).length === 0 && !isAddingNew && (
          <div className="card p-10 text-center text-sm text-gray-400">
            No banners yet.{" "}
            <a href="/promotions?new=1" className="text-[#0e5c56] underline">Add one.</a>
          </div>
        )}

        {(banners ?? []).map((banner) => (
          <div key={banner.id} className="card p-5">
            {editingId === banner.id ? (
              <>
                <h2 className="mb-4 font-semibold text-gray-800">Edit Banner</h2>
                <BannerForm banner={banner} />
                <a href="/promotions" className="mt-3 inline-block text-sm text-gray-500 hover:underline">
                  Cancel
                </a>
              </>
            ) : (
              <div className="flex items-start gap-4">
                {/* Preview image */}
                {(banner.desktop_image_url || banner.mobile_image_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={banner.desktop_image_url ?? banner.mobile_image_url ?? ""}
                    alt=""
                    className="h-24 w-40 shrink-0 rounded-lg object-cover border border-gray-200"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{banner.title}</h3>
                    <span className={banner.is_active ? "badge-active" : "badge-inactive"}>
                      {banner.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {banner.subtitle && (
                    <p className="mt-0.5 text-sm text-gray-500 truncate">{banner.subtitle}</p>
                  )}
                  <div className="mt-1 text-xs text-gray-400">
                    Sort: {banner.sort_order}
                    {banner.cta_text && ` · CTA: "${banner.cta_text}"`}
                    {banner.target_url && ` · URL: ${banner.target_url}`}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <a
                    href={`/promotions?editing=${banner.id}`}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Edit
                  </a>
                  <form action={deletePromotionBanner}>
                    <input type="hidden" name="id" value={banner.id} />
                    <button
                      type="submit"
                      formAction={deletePromotionBanner}
                      className="btn-danger text-xs px-3 py-1.5"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

