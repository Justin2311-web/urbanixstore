# Urbanix Store

Urbanix Store is now a storefront-only ecommerce website. The previous admin dashboard has been removed from the monorepo so the project can focus on the customer shopping experience, WhatsApp ordering, and future lightweight content integrations.

## Project Structure

```text
apps/
  storefront/       # Customer storefront, Vercel project: urbanix-storefront
packages/
  database/         # Supabase generated types for optional read-only data
  shared/           # Storefront data models, default data, and commerce helpers
supabase/
  migrations/       # Optional read-only storefront schema/history
```

## Local Development

```bash
npm install
npm run dev
```

The storefront runs at [http://localhost:3000](http://localhost:3000).

## Quality Checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Storefront Environment

`apps/storefront/.env.example` contains the storefront-only environment shape:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GOOGLE_SHEET_CMS_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_SHOPEE_STORE_URL=
NEXT_PUBLIC_LAZADA_STORE_URL=
```

Supabase is currently used only as an optional public read source for storefront catalog/settings data. If Supabase env vars are not configured locally, the storefront falls back to `data/urbanix-store.json` and the default shared data.

## Ordering

Checkout stores the latest order in the browser and prepares a WhatsApp message for the customer. No admin dashboard or order-management backend is included.

## Future CMS/Image/Marketplace Integrations

The storefront is prepared for:

- Google Sheet CMS via `NEXT_PUBLIC_GOOGLE_SHEET_CMS_URL`
- Cloudinary-hosted images via `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- Shopee and Lazada outbound links via `NEXT_PUBLIC_SHOPEE_STORE_URL` and `NEXT_PUBLIC_LAZADA_STORE_URL`

## Deployment

Deploy only the storefront Vercel project:

- Project name: `urbanix-storefront`
- Root Directory: `apps/storefront`
- Install Command: `cd ../.. && npm install`
- Build Command: `cd ../.. && npm run build:storefront`
