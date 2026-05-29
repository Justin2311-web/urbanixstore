import { CmsPageShell } from "@/components/content/cms-page-shell";
import { shippingDefault } from "@/lib/trust-page-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ShippingPage() {
  return <CmsPageShell pageKey="shipping" fallback={shippingDefault} />;
}
