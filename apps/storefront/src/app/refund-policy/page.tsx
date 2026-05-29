import { CmsPageShell } from "@/components/content/cms-page-shell";
import { refundPolicyDefault } from "@/lib/trust-page-defaults";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RefundPolicyPage() {
  return <CmsPageShell pageKey="refund_policy" fallback={refundPolicyDefault} />;
}
