import { CmsPageShell } from "@/components/content/cms-page-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ShippingPage() {
  return <CmsPageShell pageKey="shipping" />;
}
