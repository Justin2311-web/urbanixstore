import { AccountView } from "@/components/account/account-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AccountPage() {
  return <AccountView />;
}
