import { saveProduct } from "@/lib/admin-actions";
import { Field, SaveButton, Select, TextArea, CheckField } from "@/components/admin-form";
import { Input } from "@/components/ui/input";
import type { ProductCategory, UrbanixProduct } from "@ecommerce/shared";

const tones: UrbanixProduct["imageTone"][] = ["fan-green", "fan-cream", "fan-black", "car", "perfume", "cable"];

export function ProductForm({
  categories,
  product,
}: {
  categories: ProductCategory[];
  product?: UrbanixProduct;
}) {
  return (
    <form action={saveProduct} className="grid gap-5">
      <input name="id" type="hidden" value={product?.id ?? ""} />
      <section className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2">
        <Field label="Product name">
          <Input defaultValue={product?.name} name="name" required />
        </Field>
        <Field label="Slug">
          <Input defaultValue={product?.slug} name="slug" />
        </Field>
        <Field label="SKU">
          <Input defaultValue={product?.sku} name="sku" required />
        </Field>
        <Field label="Category">
          <Select defaultValue={product?.category ?? categories[0]?.name} name="category">
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Product image URL or tone">
          <Input defaultValue={product?.image} name="image" placeholder="Optional image URL" />
        </Field>
        <Field label="Visual tone">
          <Select defaultValue={product?.imageTone ?? "fan-green"} name="imageTone">
            {tones.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Normal price">
          <Input defaultValue={product?.normalPrice ?? product?.originalPrice ?? product?.price} min="0" name="normalPrice" step="0.01" type="number" />
        </Field>
        <Field label="Promotion price">
          <Input defaultValue={product?.promotionPrice ?? ""} min="0" name="promotionPrice" step="0.01" type="number" />
        </Field>
        <Field label="Promotion start date">
          <Input defaultValue={product?.promotionStartDate} name="promotionStartDate" type="date" />
        </Field>
        <Field label="Promotion end date">
          <Input defaultValue={product?.promotionEndDate} name="promotionEndDate" type="date" />
        </Field>
        <Field label="Stock quantity">
          <Input defaultValue={product?.stockQuantity ?? 10} min="0" name="stockQuantity" type="number" />
        </Field>
        <Field label="Product status">
          <Select defaultValue={product?.status ?? "active"} name="status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </Field>
        <CheckField defaultChecked={product?.featured} label="Featured product" name="featured" />
        <Field label="Related category">
          <Select defaultValue={product?.relatedCategory ?? categories[0]?.id} name="relatedCategory">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="grid gap-4 rounded-2xl border bg-card p-4">
        <Field label="Short description">
          <TextArea defaultValue={product?.shortDescription} name="shortDescription" required />
        </Field>
        <Field label="Full description">
          <TextArea defaultValue={product?.fullDescription ?? product?.description} name="fullDescription" />
        </Field>
        <Field label="Product highlights, one per line">
          <TextArea defaultValue={product?.highlights?.join("\n")} name="highlights" />
        </Field>
        <Field label="Specifications, one per line">
          <TextArea defaultValue={product?.specifications.join("\n")} name="specifications" />
        </Field>
        <Field label="Gallery images, one URL per line">
          <TextArea defaultValue={product?.galleryImages?.join("\n")} name="galleryImages" />
        </Field>
      </section>
      <SaveButton label={product ? "Update Product" : "Add Product"} />
    </form>
  );
}
