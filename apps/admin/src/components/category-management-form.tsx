"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProductCategory } from "@ecommerce/shared";
import { saveCategories } from "@/lib/admin-actions";
import { CheckField, Field, SaveButton, Select } from "@/components/admin-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tones: ProductCategory["tone"][] = ["mint", "teal", "peach", "lilac", "sky", "rose", "amber", "slate", "lime"];

type CategoryRow = ProductCategory & {
  key: string;
};

export function CategoryManagementForm({ categories }: { categories: ProductCategory[] }) {
  const [rows, setRows] = useState<CategoryRow[]>(
    categories.map((category) => ({
      ...category,
      key: category.slug ?? category.id,
    }))
  );

  return (
    <form action={saveCategories} className="grid gap-4">
      <input name="categoryKeys" type="hidden" value={JSON.stringify(rows.map((row) => row.key))} />
      <div className="flex justify-end">
        <Button
          onClick={() =>
            setRows((current) => [
              ...current,
              {
                active: true,
                description: "",
                href: "",
                id: "",
                isActive: true,
                key: `new-${Date.now()}`,
                name: "",
                slug: "",
                sortOrder: current.length + 1,
                tone: "mint",
              },
            ])
          }
          type="button"
          variant="secondary"
        >
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>
      {rows.map((category, index) => (
        <Card key={category.key}>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{category.name || "New category"}</CardTitle>
            <Button onClick={() => setRows((current) => current.filter((row) => row.key !== category.key))} size="icon-sm" type="button" variant="ghost">
              <Trash2 className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-[1fr_1fr_110px_160px_150px_120px]">
            <input name={`${category.key}-slug`} type="hidden" value={category.slug ?? category.id} />
            <Field label="Name">
              <Input defaultValue={category.name} name={`${category.key}-name`} required />
            </Field>
            <Field label="Description">
              <Input defaultValue={category.description} name={`${category.key}-description`} />
            </Field>
            <Field label="Sort">
              <Input defaultValue={category.sortOrder ?? index + 1} min="1" name={`${category.key}-sortOrder`} type="number" />
            </Field>
            <Field label="Card tone">
              <Select defaultValue={category.tone} name={`${category.key}-tone`}>
                {tones.map((tone) => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </Select>
            </Field>
            <div className="self-end">
              <CheckField defaultChecked={category.active !== false} label="Active" name={`${category.key}-active`} />
            </div>
            <div className="self-end">
              <CheckField label="Delete" name={`${category.key}-delete`} />
            </div>
          </CardContent>
        </Card>
      ))}
      <SaveButton />
    </form>
  );
}
