import { CmsPageShell } from "@/components/content/cms-page-shell";
import { returnPolicyDefault } from "@/lib/trust-page-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReturnPolicyPage() {
  return <CmsPageShell pageKey="return_policy" fallback={returnPolicyDefault} />;
}
