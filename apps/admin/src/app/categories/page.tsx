import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveCategories } from "@/lib/admin-actions";
import { CheckField, Field, SaveButton, Select } from "@/components/admin-form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tones = ["mint", "teal", "peach", "lilac"];

export default async function CategoriesPage() {
  const { categories } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Category Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Urbanix Store uses four small storefront categories.</p>
      </div>
      <form action={saveCategories} className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <Field label="Description">
                <Input defaultValue={category.description} name={`${category.id}-description`} />
              </Field>
              <Field label="Card tone">
                <Select defaultValue={category.tone} name={`${category.id}-tone`}>
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>{tone}</option>
                  ))}
                </Select>
              </Field>
              <div className="self-end">
                <CheckField defaultChecked={category.active !== false} label="Active" name={`${category.id}-active`} />
              </div>
            </CardContent>
          </Card>
        ))}
        <SaveButton />
      </form>
    </main>
  );
}
