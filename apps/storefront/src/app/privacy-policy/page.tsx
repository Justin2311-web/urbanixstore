import { CmsPageShell } from "@/components/content/cms-page-shell";
import { privacyPolicyDefault } from "@/lib/trust-page-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function PrivacyPolicyPage() {
  return <CmsPageShell pageKey="privacy_policy" fallback={privacyPolicyDefault} />;
}
