import { notFound } from "next/navigation";
import {
  BatteryCharging,
  Check,
  Feather,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Wind,
} from "lucide-react";
import {
  formatCurrency,
  getCategoryIdByName,
} from "@ecommerce/shared";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { PriceDisplay } from "@/components/commerce/price-display";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { ProductGrid } from "@/components/commerce/product-grid";
import { ProductPurchasePanel } from "@/components/commerce/product-purchase-panel";
import { StockBadge } from "@/components/commerce/stock-badge";
import { TrustBadge } from "@/components/commerce/trust-badge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await readUrbanixStoreDataAsync();
  const products = listStorefrontProducts(data);
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);
  const savings =
    product.originalPrice && product.originalPrice > product.price
      ? product.originalPrice - product.price
      : 0;
  const isPortableFan = getCategoryIdByName(product.category) === "portable-fans";
  const trustBadges = data.homepage.trustBadgeText.map((title) => ({
    description: title === "Free Shipping" ? `Orders over RM${data.settings.freeShippingMinimumAmount}` : "",
    title,
  }));
  const savedHighlightIcons = [Sparkles, Truck, LockKeyhole, ShieldCheck];
  const savedHighlightItems = (product.highlights ?? [])
    .filter(Boolean)
    .slice(0, 4)
    .map((text, index) => ({
      icon: savedHighlightIcons[index] ?? Sparkles,
      text,
      title: text,
    }));
  const fallbackHighlightItems = isPortableFan
    ? [
        { icon: Wind, title: "Strong Airflow", text: "Quick cooling wherever you are." },
        { icon: Feather, title: "Portable Size", text: "Easy to carry in your bag." },
        { icon: BatteryCharging, title: "USB-C Charging", text: "Simple everyday charging." },
        { icon: PackageCheck, title: "Long Battery Life", text: "Made for longer days out." },
      ]
    : [
        { icon: Sparkles, title: "Compact Design", text: "Small enough for daily use." },
        { icon: Truck, title: "Fast Delivery", text: "Packed and shipped quickly." },
        { icon: LockKeyhole, title: "Secure Checkout", text: "Safe order experience." },
        { icon: ShieldCheck, title: "Quality Product", text: "Curated by Urbanix Store." },
      ];
  const highlightItems = savedHighlightItems.length > 0 ? savedHighlightItems : fallbackHighlightItems;

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <div className="grid gap-7 lg:grid-cols-[0.9fr_1fr] lg:items-start">
        <ProductGallery product={product} />

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <StockBadge status={product.stockStatus} />
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                SKU: {product.sku}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold sm:text-4xl">{product.name}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {product.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Star className="size-4 fill-warning text-warning" />
            <span className="font-bold text-accent">{product.rating}</span>
            <span className="text-muted-foreground">({product.sold} reviews)</span>
            <span className="rounded-full bg-cream px-3 py-1 text-xs font-bold text-primary">
              {product.sold}+ sold
            </span>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <PriceDisplay
              originalPrice={product.originalPrice}
              price={product.price}
              size="lg"
            />
            {savings > 0 ? (
              <p className="mt-2 text-sm font-bold text-success">
                You save {formatCurrency(savings)}
              </p>
            ) : null}
          </div>

          <ProductPurchasePanel product={product} />

          <div className="grid grid-cols-2 gap-3">
            {highlightItems.map((item) => (
              <HighlightCard
                icon={item.icon}
                key={item.title}
                text={item.text}
                title={item.title}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {trustBadges.map((badge, index) => (
              <TrustBadge badge={badge} index={index} key={badge.title} />
            ))}
          </div>
        </section>
      </div>

      <section className="urbanix-section">
        <div className="grid gap-4 lg:grid-cols-3">
          <InfoPanel title="Description">
            <p>{product.description}</p>
          </InfoPanel>
          <InfoPanel title="Specifications">
            <ul className="flex flex-col gap-2">
              {product.specifications.map((spec) => (
                <li className="flex gap-2" key={spec}>
                  <Check className="mt-0.5 size-4 text-success" />
                  {spec}
                </li>
              ))}
            </ul>
          </InfoPanel>
          <InfoPanel title="Shipping & Returns">
            <p>{product.shippingInfo}</p>
            <p className="mt-3">{product.returnNote}</p>
          </InfoPanel>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="urbanix-section pt-0">
          <div className="mb-4">
            <h2 className="text-lg font-extrabold uppercase text-primary">
              Related Products
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              More curated picks from {product.category}.
            </p>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      ) : null}
    </main>
  );
}

function HighlightCard({
  icon: Icon,
  text,
  title,
}: {
  icon: typeof Wind;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <h2 className="text-sm font-extrabold">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}

function InfoPanel({
  children,
  title,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-border/80 bg-card p-5 text-sm leading-6 text-muted-foreground shadow-sm">
      <h2 className="mb-3 text-lg font-extrabold text-foreground">{title}</h2>
      {children}
    </article>
  );
}
