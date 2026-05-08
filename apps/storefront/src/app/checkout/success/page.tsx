import { OrderSuccessView } from "@/components/checkout/order-success-view";
import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutSuccessPage() {
  const { settings } = await readUrbanixStoreDataAsync();

  return <OrderSuccessView whatsappNumber={settings.whatsappNumber} />;
}
