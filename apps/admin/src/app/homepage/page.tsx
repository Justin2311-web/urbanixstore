import { readUrbanixStoreDataAsync } from "@ecommerce/shared/store";
import { saveHomepage } from "@/lib/admin-actions";
import { Field, SaveButton, TextArea } from "@/components/admin-form";
import { SaveNotice } from "@/components/save-notice";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomepagePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const params = await searchParams;
  const { homepage } = await readUrbanixStoreDataAsync();

  return (
    <main className="urbanix-container urbanix-section">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Banner / Homepage Content</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update the storefront hero, featured categories, strip, and trust text.</p>
      </div>
      <SaveNotice saved={params.saved} />
      <form action={saveHomepage}>
        <Card>
          <CardHeader>
            <CardTitle>Homepage Content</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Hero title">
              <Input defaultValue={homepage.heroTitle} name="heroTitle" />
            </Field>
            <Field label="Hero subtitle">
              <Input defaultValue={homepage.heroSubtitle} name="heroSubtitle" />
            </Field>
            <Field label="Hero button text">
              <Input defaultValue={homepage.heroButtonText} name="heroButtonText" />
            </Field>
            <Field label="Hero button link">
              <Input defaultValue={homepage.heroButtonLink} name="heroButtonLink" />
            </Field>
            <Field label="Hero image / tone">
              <Input defaultValue={homepage.heroImage} name="heroImage" />
            </Field>
            <Field label="Promotion strip text">
              <Input defaultValue={homepage.promotionStripText} name="promotionStripText" />
            </Field>
            <Field label="Featured category cards, one id per line">
              <TextArea defaultValue={homepage.featuredCategoryCards.join("\n")} name="featuredCategoryCards" />
            </Field>
            <Field label="Trust badge text, one per line">
              <TextArea defaultValue={homepage.trustBadgeText.join("\n")} name="trustBadgeText" />
            </Field>
            <div className="md:col-span-2">
              <SaveButton />
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}
