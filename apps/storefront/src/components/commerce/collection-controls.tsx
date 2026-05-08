import Link from "next/link";
import type { ProductCategory, ProductFilter, ProductSort } from "@ecommerce/shared";
import { urbanixCategories } from "@ecommerce/shared";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const filters: Array<{ id: ProductFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "best-sellers", label: "Best Sellers" },
  { id: "new-arrivals", label: "New Arrivals" },
  { id: "on-sale", label: "On Sale" },
];

const sorts: Array<{ id: ProductSort; label: string }> = [
  { id: "featured", label: "Featured" },
  { id: "price", label: "Price" },
  { id: "newest", label: "Newest" },
];

export function CategoryTabs({
  activeCategory,
  basePath,
  categories = urbanixCategories,
  query,
}: {
  basePath: string;
  activeCategory?: string;
  query?: string;
  categories?: ProductCategory[];
}) {
  const items: Array<{ id?: string; label: string }> = [
    { label: "All" },
    ...categories.map((category) => ({
      id: category.id,
      label: category.name,
    })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {items.map((item) => (
        <Link
          className={cn(
            buttonVariants({ size: "sm", variant: activeCategory === item.id || (!activeCategory && !item.id) ? "default" : "outline" }),
            "shrink-0"
          )}
          href={buildHref(basePath, { category: item.id, q: query })}
          key={item.label}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function CollectionFilters({
  activeCategory,
  activeFilter,
  activeSort,
  basePath,
  query,
}: {
  basePath: string;
  activeCategory?: string;
  activeFilter: ProductFilter;
  activeSort: ProductSort;
  query?: string;
}) {
  return (
    <aside className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-extrabold text-primary">Filter by</h2>
      <div className="flex flex-wrap gap-2 md:flex-col">
        {filters.map((filter) => (
          <Link
            className={buttonVariants({
              className: "justify-start",
              size: "sm",
              variant: activeFilter === filter.id ? "default" : "outline",
            })}
            href={buildHref(basePath, {
              category: activeCategory,
              filter: filter.id === "all" ? undefined : filter.id,
              q: query,
              sort: activeSort,
            })}
            key={filter.id}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      <h2 className="mb-3 mt-5 text-sm font-extrabold text-primary">Sort by</h2>
      <div className="flex flex-wrap gap-2 md:flex-col">
        {sorts.map((sort) => (
          <Link
            className={buttonVariants({
              className: "justify-start",
              size: "sm",
              variant: activeSort === sort.id ? "default" : "outline",
            })}
            href={buildHref(basePath, {
              category: activeCategory,
              filter: activeFilter === "all" ? undefined : activeFilter,
              q: query,
              sort: sort.id,
            })}
            key={sort.id}
          >
            {sort.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export function buildHref(
  basePath: string,
  params: {
    category?: ProductCategory["id"];
    filter?: ProductFilter;
    q?: string;
    sort?: ProductSort;
  }
) {
  const searchParams = new URLSearchParams();

  if (params.category) searchParams.set("category", params.category);
  if (params.filter) searchParams.set("filter", params.filter);
  if (params.q) searchParams.set("q", params.q);
  if (params.sort && params.sort !== "featured") searchParams.set("sort", params.sort);

  const query = searchParams.toString();

  return query ? `${basePath}?${query}` : basePath;
}
