import { saveProduct } from "@/lib/admin-actions";
import { Field, SaveButton, Select, TextArea, CheckField } from "@/components/admin-form";
import { Input } from "@/components/ui/input";
import { ProductImagesField } from "@/components/product-images-field";
import { VariantsField } from "@/components/variants-field";
import type { ProductCategory, UrbanixProduct } from "@ecommerce/shared";

export function ProductForm({
  categories,
  product,
}: {
  categories: ProductCategory[];
  product?: UrbanixProduct;
}) {
  return (
    <form action={saveProduct} className="grid gap-5" encType="multipart/form-data">
      <input name="id" type="hidden" value={product?.id ?? ""} />
      <input name="slug" type="hidden" value={product?.slug ?? ""} />
      <section className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2">
        <Field label="Product name">
          <Input defaultValue={product?.name} name="name" required />
        </Field>
        <Field label="SKU">
          <Input defaultValue={product?.sku} name="sku" required />
        </Field>
        <Field label="Category">
          <Select defaultValue={product?.categoryId ?? product?.relatedCategory ?? categories[0]?.id} name="categoryId">
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
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
      </section>
      <ProductImagesField images={product?.galleryImages?.length ? product.galleryImages : product?.image ? [product.image] : []} />

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
        <Field label="Shipping info">
          <TextArea defaultValue={product?.shippingInfo} name="shippingInfo" />
        </Field>
        <Field label="Return note">
          <TextArea defaultValue={product?.returnNote} name="returnNote" />
        </Field>
      </section>
      <VariantsField existing={product?.variantGroups} />
      <SaveButton label={product ? "Update Product" : "Add Product"} />
    </form>
  );
}
