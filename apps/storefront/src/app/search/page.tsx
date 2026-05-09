import type { ProductFilter, ProductSort } from "@ecommerce/shared";
import { getCategoryIdByName } from "@ecommerce/shared";
import { listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryTabs, CollectionFilters } from "@/components/commerce/collection-controls";
import { CollectionHero } from "@/components/commerce/collection-hero";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchPageProps = {
  searchParams: Promise<{
    category?: string;
    filter?: ProductFilter;
    q?: string;
    sort?: ProductSort;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const data = await readUrbanixStoreDataAsync();
  const query = params.q ?? "";
  const activeCategory = params.category;
  const activeFilter = params.filter ?? "all";
  const activeSort = params.sort ?? "featured";
  const categories = listStorefrontCategories(data);
  const category = categories.find((item) => item.id === activeCategory);
  const normalizedQuery = query.trim().toLowerCase();
  const products = listStorefrontProducts(data)
    .filter((product) => {
      const categoryMatches = !activeCategory || getCategoryIdByName(product.category) === activeCategory || product.relatedCategory === activeCategory;
      const queryMatches = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery) || product.category.toLowerCase().includes(normalizedQuery);
      const filterMatches =
        activeFilter === "all" ||
        (activeFilter === "best-sellers" && product.sold >= 90) ||
        (activeFilter === "new-arrivals" && product.featured) ||
        (activeFilter === "on-sale" && Boolean(product.promotionPercent));

      return categoryMatches && queryMatches && filterMatches;
    })
    .toSorted((first, second) => {
      if (activeSort === "price") return first.price - second.price;
      if (activeSort === "newest") return second.id.localeCompare(first.id);
      return second.sold - first.sold;
    });

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <CollectionHero category={category} title="Search Urbanix Store" />

      <div className="mb-4">
        <SearchBar defaultValue={query} placeholder="Search products..." />
      </div>

      <div className="mb-5">
        <CategoryTabs activeCategory={activeCategory} basePath="/search" categories={categories} query={query} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
        <CollectionFilters
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSort={activeSort}
          basePath="/search"
          query={query}
        />
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h1 className="text-sm font-bold">
              {products.length} Results{query ? ` for "${query}"` : ""}
            </h1>
            <p className="text-xs font-semibold text-muted-foreground">
              Sort: {activeSort === "price" ? "Price" : activeSort === "newest" ? "Newest" : "Featured"}
            </p>
          </div>
          <ProductGrid
            emptyActionLabel="Contact Us"
            emptyTitle="No matching products yet"
            products={products}
            settings={data.settings}
          />
        </section>
      </div>
    </main>
  );
}
