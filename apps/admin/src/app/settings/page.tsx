export const dynamic = "force-dynamic";

import type { Database } from "@ecommerce/database";
import { createAdminClient } from "@/lib/supabase";
import { Flash } from "@/components/flash";
import { saveStoreSettings } from "@/lib/actions";

type StoreSettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; saveError?: string }>;
}) {
  const params = await searchParams;
  const sb = createAdminClient();

  const { data: settingsRaw } = await sb
    .from("store_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  const settings = settingsRaw as StoreSettingsRow | null;

  const social = (settings?.social_links ?? {}) as Record<string, string>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Store Settings</h1>
      </div>

      <Flash saved={params.saved} saveError={params.saveError} />

      <form action={saveStoreSettings}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Store identity */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Store Identity</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Store Name *</label>
                <input name="store_name" required className="field-input" defaultValue={settings?.store_name ?? "Urbanix Store"} />
              </div>
              <div>
                <label className="field-label">Store Tagline</label>
                <input name="store_tagline" className="field-input" defaultValue={settings?.store_tagline ?? ""} />
              </div>
              <div>
                <label className="field-label">Currency</label>
                <input name="currency" className="field-input" defaultValue={settings?.currency ?? "MYR"} />
              </div>
              <div>
                <label className="field-label">Logo URL</label>
                <input name="logo_url" className="field-input" defaultValue={settings?.logo_url ?? ""} placeholder="https://…" />
              </div>
              <div>
                <label className="field-label">Favicon URL</label>
                <input name="favicon_url" className="field-input" defaultValue={settings?.favicon_url ?? ""} placeholder="https://…" />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">WhatsApp Number</label>
                <input name="whatsapp_number" className="field-input" defaultValue={settings?.whatsapp_number ?? ""} placeholder="60198993269" />
              </div>
              <div>
                <label className="field-label">Contact Email</label>
                <input name="contact_email" type="email" className="field-input" defaultValue={settings?.contact_email ?? ""} />
              </div>
              <div>
                <label className="field-label">Contact Phone</label>
                <input name="contact_phone" className="field-input" defaultValue={settings?.contact_phone ?? ""} />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Shipping</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">Shipping Fee (RM)</label>
                <input name="shipping_fee" type="number" min="0" step="0.01" className="field-input" defaultValue={settings?.shipping_fee ?? 7} />
              </div>
              <div>
                <label className="field-label">Free Shipping Min. (RM)</label>
                <input name="free_shipping_min_amount" type="number" min="0" step="0.01" className="field-input" defaultValue={settings?.free_shipping_min_amount ?? 40} />
              </div>
            </div>
          </div>

          {/* Social links */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label className="field-label">Facebook URL</label>
                <input name="facebook" className="field-input" defaultValue={social.facebook ?? ""} placeholder="https://facebook.com/…" />
              </div>
              <div>
                <label className="field-label">Instagram URL</label>
                <input name="instagram" className="field-input" defaultValue={social.instagram ?? ""} placeholder="https://instagram.com/…" />
              </div>
              <div>
                <label className="field-label">TikTok URL</label>
                <input name="tiktok" className="field-input" defaultValue={social.tiktok ?? ""} placeholder="https://tiktok.com/@…" />
              </div>
            </div>
          </div>

          {/* Store status */}
          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Store Status</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="is_store_active"
                  type="checkbox"
                  defaultChecked={settings?.is_store_active ?? true}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Store is active / open</span>
              </label>
              <div>
                <label className="field-label">Maintenance Message</label>
                <input
                  name="maintenance_message"
                  className="field-input"
                  defaultValue={settings?.maintenance_message ?? ""}
                  placeholder="We'll be back soon!"
                />
                <p className="mt-1 text-xs text-gray-400">Shown when store is inactive.</p>
              </div>
            </div>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn-primary">
              💾 Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
