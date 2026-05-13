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
import { LocalizedValue } from "@/components/i18n/localized-value";

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
    <main className="urbanix-container urbanix-section pb-32">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <ProductGallery product={product} />

        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <StockBadge status={product.stockStatus} />
              <span className="rounded-full bg-secondary/60 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                SKU: {product.sku}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                <LocalizedValue fallback={product.name} value={product.localizedName} />
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                <LocalizedValue fallback={product.shortDescription} value={product.localizedDescription} />
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-4 py-2 font-bold text-muted-foreground">
              <Star className="size-4 fill-muted-foreground/30 text-muted-foreground/30" />
              <span className="text-foreground">{product.rating}</span>
              <span className="opacity-60">({product.sold} reviews)</span>
            </div>
            <span className="rounded-full bg-cream/60 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
              {product.sold}+ sold
            </span>
          </div>

          <div className="urbanix-surface p-8">
            <PriceDisplay
              originalPrice={product.originalPrice}
              price={product.price}
              size="lg"
            />
            {savings > 0 ? (
              <p className="mt-3 text-sm font-bold text-success">
                Special Price: You save {formatCurrency(savings)}
              </p>
            ) : null}
          </div>

          <ProductPurchasePanel product={product} settings={data.settings} />

          <div className="grid grid-cols-2 gap-4">
            {highlightItems.map((item) => (
              <HighlightCard
                icon={item.icon}
                key={item.title}
                text={item.text}
                title={item.title}
              />
            ))}
          </div>

        </section>
      </div>

      <section className="urbanix-section mt-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <InfoPanel title="Description">
            <p>
              <LocalizedValue fallback={product.description} value={product.localizedDescription} />
            </p>
          </InfoPanel>
          <InfoPanel title="Specifications">
            <ul className="flex flex-col gap-3">
              {product.specifications.map((spec) => (
                <li className="flex gap-3" key={spec}>
                  <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <Check className="size-3 text-success" />
                  </div>
                  {spec}
                </li>
              ))}
            </ul>
          </InfoPanel>
          <InfoPanel title="Delivery Info">
            <div className="flex flex-col gap-4">
              <p>{product.shippingInfo}</p>
              <div className="rounded-2xl bg-secondary/30 p-4">
                <LocalizedValue fallback={data.homepage.promotionStripText} value={data.settings.freeShippingText} />
              </div>
            </div>
          </InfoPanel>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="urbanix-section border-t border-border/50 pt-20">
          <div className="mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Related Products
            </h2>
            <p className="mt-2 text-muted-foreground">
              Handpicked selections from the {product.category} collection.
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
    <div className="urbanix-surface p-6 transition-transform hover:scale-[1.02]">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-6" />
      </div>
      <h2 className="text-base font-extrabold text-foreground">{title}</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
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
    <article className="urbanix-surface p-8 text-sm leading-relaxed text-muted-foreground">
      <h2 className="mb-6 text-xl font-extrabold text-foreground">{title}</h2>
      {children}
    </article>
  );
}

