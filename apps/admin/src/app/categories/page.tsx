export const dynamic = "force-dynamic";

import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { CategoryManagementForm } from "@/components/category-management-form";
import { SaveNotice } from "@/components/save-notice";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const { categories } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Category Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Add, edit, reorder, and retire storefront categories.</p>
      </div>
      <SaveNotice saved={params.saved} />
      <CategoryManagementForm categories={categories} />
    </main>
  );
}
