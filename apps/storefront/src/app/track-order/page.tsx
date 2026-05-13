import { TrackOrderView } from "@/components/order/track-order-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Track Order – Urbanix Store",
  description: "Check your order status and shipping information.",
};

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order_number?: string; phone?: string }>;
}) {
  const params = await searchParams;
  return (
    <TrackOrderView
      initialOrderNumber={params.order_number ?? ""}
      initialPhone={params.phone ?? ""}
    />
  );
}
