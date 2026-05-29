import { notFound } from "next/navigation";
import type { StorefrontPage } from "@ecommerce/shared";
import { getStorefrontPageByKey, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CmsPageView } from "@/components/content/cms-page-view";

type CmsPageShellProps = {
  pageKey: string;
  fallback?: StorefrontPage;
};

export async function CmsPageShell({ pageKey, fallback }: CmsPageShellProps) {
  const data = await readUrbanixStoreDataAsync();
  const page = getStorefrontPageByKey(pageKey, data) ?? fallback;

  if (!page) {
    notFound();
  }

  return <CmsPageView page={page} settings={data.settings} />;
}
