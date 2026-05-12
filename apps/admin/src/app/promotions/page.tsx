import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { SaveNotice } from "@/components/save-notice";
import { PromotionBannersForm } from "@/components/promotion-banners-form";

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const { promotionBanners } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Promotion Banners</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage the responsive homepage banner carousel.</p>
      </div>
      <SaveNotice saved={params.saved} />
      <PromotionBannersForm banners={promotionBanners} />
    </main>
  );
}
