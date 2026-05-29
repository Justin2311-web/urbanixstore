import { CmsPageShell } from "@/components/content/cms-page-shell";
import { termsAndConditionsDefault } from "@/lib/trust-page-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function TermsAndConditionsPage() {
  return <CmsPageShell pageKey="terms_and_conditions" fallback={termsAndConditionsDefault} />;
}
