# Urbanix Store E-Commerce Platform

Urbanix Store is a two-app e-commerce monorepo:

- `apps/storefront`: customer storefront
- `apps/admin`: store owner admin dashboard
- `packages/shared`: shared commerce types, seed data, pricing helpers, and local JSON store helpers
- `packages/database`: shared Supabase database types
- `supabase/migrations`: database schema and seed migrations

Both apps are Next.js App Router projects using TypeScript, Tailwind CSS, shadcn/ui, and Supabase client helpers.

## Project Structure

```txt
.
├─ apps/
│  ├─ storefront/   # Vercel project: urbanix-storefront
│  └─ admin/        # Vercel project: urbanix-admin
├─ packages/
│  ├─ shared/
│  └─ database/
├─ supabase/
│  └─ migrations/
├─ data/
│  └─ urbanix-store.json
├─ package.json
└─ package-lock.json
```

This is a monorepo. Deploy the Storefront and Admin as two separate Vercel projects from the same GitHub repository.

## Prerequisites

- Node.js 20+
- npm 10+
- Git
- A Supabase project for production data
- A Vercel account connected to GitHub

## Local Setup

Install dependencies from the repository root:

```bash
npm install
```

Create local environment files:

```bash
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Fill in Supabase and app URL values in each `.env.local`.

## Local Development

Run the storefront:

```bash
npm run dev:storefront
```

Run the admin dashboard:

```bash
npm run dev:admin
```

Default local URLs:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3001`

## Checks

Run from the repository root:

```bash
npm run lint
npm run typecheck
npm run build
```

Individual builds:

```bash
npm run build:storefront
npm run build:admin
```

## Environment Variables

Storefront only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_ADMIN_URL=
```

Admin only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Never add `SUPABASE_SERVICE_ROLE_KEY` to the Storefront project. Never prefix the service role key with `NEXT_PUBLIC_`.

## Supabase

Apply migrations from:

```txt
supabase/migrations
```

The current schema migration creates Urbanix Store tables for categories, products, product images, orders, order items, store settings, homepage banners, and payment settings.

## Vercel Deployment

Create two Vercel projects from this same GitHub repository:

### Storefront

- Project name: `urbanix-storefront`
- Root Directory: `apps/storefront`
- Framework: Next.js
- Install Command: `cd ../.. && npm install`
- Build Command: `cd ../.. && npm run build:storefront`
- Output Directory: leave default
- Env vars: use only the Storefront variables above

### Admin

- Project name: `urbanix-admin`
- Root Directory: `apps/admin`
- Framework: Next.js
- Install Command: `cd ../.. && npm install`
- Build Command: `cd ../.. && npm run build:admin`
- Output Directory: leave default
- Env vars: use only the Admin variables above

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full GitHub and Vercel checklist.
