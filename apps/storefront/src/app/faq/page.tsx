import { CmsPageShell } from "@/components/content/cms-page-shell";
import { faqDefault } from "@/lib/trust-page-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function FaqPage() {
  return <CmsPageShell pageKey="faq" fallback={faqDefault} />;
}
