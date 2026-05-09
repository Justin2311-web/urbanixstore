import type { ProductFilter, ProductSort } from "@ecommerce/shared";
import { getCategoryIdByName } from "@ecommerce/shared";
import { listStorefrontCategories, listStorefrontProducts, readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryTabs, CollectionFilters } from "@/components/commerce/collection-controls";
import { CollectionHero } from "@/components/commerce/collection-hero";
import { ProductGrid } from "@/components/commerce/product-grid";
import { SearchBar } from "@/components/commerce/search-bar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CategoriesPageProps = {
  searchParams: Promise<{
    category?: string;
    filter?: ProductFilter;
    sort?: ProductSort;
  }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const data = await readUrbanixStoreDataAsync();
  const categories = listStorefrontCategories(data);
  const activeCategory = params.category ?? categories[0]?.id;
  const activeFilter = params.filter ?? "all";
  const activeSort = params.sort ?? "featured";
  const category = categories.find((item) => item.id === activeCategory);
  const products = listStorefrontProducts(data).filter((product) => getCategoryIdByName(product.category) === activeCategory || product.relatedCategory === activeCategory);

  return (
    <main className="urbanix-container urbanix-section pb-24">
      <CollectionHero category={category} />

      <div className="mb-4">
        <SearchBar placeholder={`Search ${category?.name ?? "products"}...`} />
      </div>

      <div className="mb-5">
        <CategoryTabs activeCategory={activeCategory} basePath="/categories" categories={categories} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
        <CollectionFilters
          activeCategory={activeCategory}
          activeFilter={activeFilter}
          activeSort={activeSort}
          basePath="/categories"
        />
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm font-bold">{products.length} Products</p>
            <p className="text-xs font-semibold text-muted-foreground">
              Collection: {category?.name ?? "All"}
            </p>
          </div>
          <ProductGrid products={products} />
        </section>
      </div>
    </main>
  );
}
