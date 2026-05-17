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
  getCategoryIdByName,
} from "@ecommerce/shared";
import { listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
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
    .slice(0, 8);
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
    <main className="urbanix-container py-8 pb-24 sm:py-10">
      {/* ── Main product section: image left, info right ── */}
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start lg:gap-8">
        {/* Left: gallery with auto-slide + arrows */}
        <ProductGallery product={product} />

        {/* Right: all product information */}
        <section className="flex flex-col gap-4">
          {/* Stock badge + SKU */}
          <div className="flex flex-wrap items-center gap-2">
            <StockBadge status={product.stockStatus} />
            <span className="rounded-full bg-secondary/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              SKU: {product.sku}
            </span>
          </div>

          {/* Product name + short description */}
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              <LocalizedValue fallback={product.name} value={product.localizedName} />
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <LocalizedValue fallback={product.shortDescription} value={product.localizedDescription} />
            </p>
          </div>

          {/* Rating + sold */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 font-bold text-muted-foreground">
              <Star className="size-3.5 fill-warning text-warning" />
              <span className="text-foreground">{product.rating}</span>
              <span className="opacity-60">({product.sold} reviews)</span>
            </div>
            <span className="rounded-full bg-cream/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
              {product.sold}+ sold
            </span>
          </div>

          {/* Price display + variant selector + add-to-cart (client component) */}
          <ProductPurchasePanel product={product} settings={data.settings} />

          {/* Highlight cards */}
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
        </section>
      </div>

      {/* ── Info panels ── */}
      <section className="mt-12">
        <div className="grid gap-5 lg:grid-cols-3">
          <InfoPanel title="Description">
            <p>
              <LocalizedValue fallback={product.description} value={product.localizedDescription} />
            </p>
          </InfoPanel>
          <InfoPanel title="Specifications">
            <ul className="flex flex-col gap-2.5">
              {product.specifications.map((spec) => (
                <li className="flex gap-3" key={spec}>
                  <div className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success/10">
                    <Check className="size-2.5 text-success" />
                  </div>
                  {spec}
                </li>
              ))}
            </ul>
          </InfoPanel>
          <InfoPanel title="Delivery Info">
            <div className="flex flex-col gap-3">
              <p>{product.shippingInfo}</p>
              <div className="rounded-2xl bg-secondary/30 p-3 text-xs">
                <LocalizedValue fallback={data.homepage.promotionStripText} value={data.settings.freeShippingText} />
              </div>
            </div>
          </InfoPanel>
        </div>
      </section>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 ? (
        <section className="mt-12 border-t border-border/50 pt-12">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
              Related Products
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              More from the {product.category} collection.
            </p>
          </div>
          <ProductGrid compact products={relatedProducts} />
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
    <div className="urbanix-surface p-4 transition-transform hover:scale-[1.02]">
      <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="size-5" />
      </div>
      <h2 className="text-sm font-extrabold text-foreground">{title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
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
    <article className="urbanix-surface p-6 text-sm leading-relaxed text-muted-foreground">
      <h2 className="mb-4 text-base font-extrabold text-foreground">{title}</h2>
      {children}
    </article>
  );
}
