# Urbanix Store Storefront Deployment

Urbanix Store is now deployed as a single storefront-only Next.js app.

## Vercel Project

- Project: `urbanix-storefront`
- Root Directory: `apps/storefront`
- Install Command: `cd ../.. && npm install`
- Build Command: `cd ../.. && npm run build:storefront`
- Production URL: `https://urbanix-storefront.vercel.app`

The former admin project is no longer part of the repository and should not be used for new deployments.

## Environment Variables

Required only if the storefront should read live catalog/settings data from Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
```

Reserved for the next CMS/media/marketplace phase:

```env
NEXT_PUBLIC_GOOGLE_SHEET_CMS_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_SHOPEE_STORE_URL=
NEXT_PUBLIC_LAZADA_STORE_URL=
```

No `SUPABASE_SERVICE_ROLE_KEY`, admin credentials, or revalidation secret are required by the storefront.

## Verification

Run these before deployment:

```bash
npm run typecheck
npm run lint
npm run build
```

Then deploy:

```bash
npx vercel deploy --prod
```

## What Remains

- Storefront homepage, catalog, categories, product detail, cart, checkout, multilingual UI, and footer
- Optional read-only Supabase storefront data fetching
- Browser-local order persistence
- WhatsApp order handoff

## What Was Removed

- Admin app workspace
- Admin pages, components, server actions, upload forms, and order-management UI
- Admin revalidation endpoint and cross-app revalidation secret
- Storefront order write API
