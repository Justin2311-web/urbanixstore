import { notFound } from "next/navigation";
import { getStorefrontPageByKey, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CmsPageView } from "@/components/content/cms-page-view";

type CmsPageShellProps = {
  pageKey: string;
};

export async function CmsPageShell({ pageKey }: CmsPageShellProps) {
  const data = await readUrbanixStoreDataAsync();
  const page = getStorefrontPageByKey(pageKey, data);

  if (!page) {
    notFound();
  }

  return <CmsPageView page={page} settings={data.settings} />;
}
