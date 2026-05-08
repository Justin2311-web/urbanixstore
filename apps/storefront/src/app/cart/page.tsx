import { CartView } from "@/components/checkout/cart-view";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CartPage() {
  const data = await readUrbanixStoreDataAsync();
  const { settings } = data;
  const products = listStorefrontProducts(data);

  return <CartView products={products} settings={settings} />;
}
