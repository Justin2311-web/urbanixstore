import { CheckoutView } from "@/components/checkout/checkout-view";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CheckoutPage() {
  const data = await readUrbanixStoreDataAsync();
  const { payments, settings } = data;
  const products = listStorefrontProducts(data);

  return <CheckoutView payments={payments} products={products} settings={settings} />;
}
