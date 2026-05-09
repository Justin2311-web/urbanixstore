import type { ProductFilter, ProductSort } from "@ecommerce/shared";
import {
  getCategoryIdByName,
} from "@ecommerce/shared";
import { listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CollectionFilters, CategoryTabs } from "@/components/commerce/collection-controls";
import { CollectionHero } from "@/components/commerce/collection-hero";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";
import { LocalizedText } from "@/components/i18n/localized-text";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
    filter?: ProductFilter;
    sort?: ProductSort;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const data = await readUrbanixStoreDataAsync();
  const activeCategory = params.category;
  const activeFilter = params.filter ?? "all";
  const activeSort = params.sort ?? "featured";
  const categories = listStorefrontCategories(data);
  const category = categories.find((item) => item.id === activeCategory);
  const products = filterProducts(listStorefrontProducts(data), activeCategory, activeFilter, activeSort);

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <CollectionHero category={category} title="All Products" titleKey="products.allProducts" />

      <div className="mb-4">
        <SearchBar placeholder="Search Urbanix products..." />
      </div>

      <div className="mb-5">
        <CategoryTabs activeCategory={activeCategory} basePath="/products" categories={categories} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
        <CollectionFilters
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSort={activeSort}
          basePath="/products"
        />
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-bold">{products.length} <LocalizedText fallback="Products" k="products.count" /></p>
            <p className="text-xs font-semibold text-muted-foreground">
              <LocalizedText fallback="Sort" k="products.sort" />: <LocalizedText fallback={activeSort === "price" ? "Price" : activeSort === "newest" ? "Newest" : "Featured"} k={activeSort === "price" ? "products.price" : activeSort === "newest" ? "products.newest" : "products.featured"} />
            </p>
          </div>
          <ProductGrid products={products} settings={data.settings} />
        </section>
      </div>
    </main>
  );
}

function filterProducts(products: ReturnType<typeof listStorefrontProducts>, category: string | undefined, filter: ProductFilter, sort: ProductSort) {
  return products
    .filter((product) => {
      const categoryMatches = !category || getCategoryIdByName(product.category) === category || product.relatedCategory === category;
      const filterMatches =
        filter === "all" ||
        (filter === "best-sellers" && product.sold >= 90) ||
        (filter === "new-arrivals" && product.featured) ||
        (filter === "on-sale" && Boolean(product.promotionPercent));

      return categoryMatches && filterMatches;
    })
    .toSorted((first, second) => {
      if (sort === "price") return first.price - second.price;
      if (sort === "newest") return second.id.localeCompare(first.id);
      return second.sold - first.sold;
    });
}
