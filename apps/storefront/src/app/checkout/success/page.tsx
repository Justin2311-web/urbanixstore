import { OrderSuccessView } from "@/components/checkout/order-success-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CheckoutSuccessPage() {
  return <OrderSuccessView />;
}
