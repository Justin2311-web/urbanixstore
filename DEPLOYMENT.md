# Urbanix Store GitHub and Vercel Deployment Guide

## 1. Project Readiness

This repository is a monorepo.

- Repository root: project root with `package.json`, `package-lock.json`, `apps/`, `packages/`, and `supabase/`
- Storefront root directory: `apps/storefront`
- Admin root directory: `apps/admin`
- Shared packages: `packages/shared`, `packages/database`

Root scripts:

```bash
npm run dev:storefront
npm run dev:admin
npm run lint
npm run typecheck
npm run build
npm run build:storefront
npm run build:admin
```

Both apps are Next.js projects. Vercel output directory should be left as the default; Next.js creates `.next` automatically.

## 2. GitHub-Ready Files

Commit these:

- `apps/storefront`
- `apps/admin`
- `packages`
- `supabase/migrations`
- `data/urbanix-store.json` for local development seed data
- `.env.example` files
- `README.md`
- `DEPLOYMENT.md`
- `package.json`
- `package-lock.json`

Do not commit:

- `node_modules`
- `.next`
- `out`
- `build`
- `dist`
- `.vercel`
- `.env`
- `.env.local`
- `.env.production.local`
- Any real Supabase keys

## 3. Environment Variables

### Storefront Vercel Project

Add these to `urbanix-storefront`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_ADMIN_URL=
```

Example values:

```env
NEXT_PUBLIC_SITE_URL=https://urbanixstore.com
NEXT_PUBLIC_ADMIN_URL=https://admin.urbanixstore.com
```

Do not add `SUPABASE_SERVICE_ROLE_KEY` to the Storefront project.

### Admin Vercel Project

Add these to `urbanix-admin`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Example value:

```env
NEXT_PUBLIC_SITE_URL=https://admin.urbanixstore.com
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with `NEXT_PUBLIC_`.

## 4. Local Preflight

Run from the repository root before pushing:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Optional per-app checks:

```bash
npm run build:storefront
npm run build:admin
```

## 5. GitHub Upload Commands

If Git is not initialized:

```bash
git init
```

Stage and commit:

```bash
git add .
git commit -m "Prepare Urbanix Store for deployment"
git branch -M main
```

Connect GitHub:

```bash
git remote add origin <my-github-repo-url>
git push -u origin main
```

Replace `<my-github-repo-url>` with your real GitHub repository URL, for example:

```bash
git remote add origin https://github.com/your-username/urbanix-store.git
```

If `origin` already exists:

```bash
git remote set-url origin <my-github-repo-url>
git push -u origin main
```

## 6. Vercel Storefront Project

Create/import a new Vercel project:

- Project name: `urbanix-storefront`
- GitHub repository: same repo
- Root Directory: `apps/storefront`
- Framework Preset: Next.js
- Install Command: `cd ../.. && npm install`
- Build Command: `cd ../.. && npm run build:storefront`
- Output Directory: leave empty/default

Add Storefront environment variables only.

Suggested domains:

- `urbanixstore.com`
- Vercel default domain, for example `urbanix-storefront.vercel.app`

## 7. Vercel Admin Project

Create/import another Vercel project from the same GitHub repo:

- Project name: `urbanix-admin`
- GitHub repository: same repo
- Root Directory: `apps/admin`
- Framework Preset: Next.js
- Install Command: `cd ../.. && npm install`
- Build Command: `cd ../.. && npm run build:admin`
- Output Directory: leave empty/default

Add Admin environment variables only.

Suggested domains:

- `admin.urbanixstore.com`
- Vercel default domain, for example `urbanix-admin.vercel.app`

## 8. Vercel Settings Workflow

1. In Vercel, click **Add New Project**.
2. Import the GitHub repository.
3. For Storefront, set Root Directory to `apps/storefront`.
4. Add Storefront environment variables.
5. Deploy.
6. Repeat with a second Vercel project for Admin using Root Directory `apps/admin`.
7. Add Admin environment variables.
8. Deploy.
9. If you add or change env vars later, redeploy from **Deployments -> Redeploy**.
10. Check build logs under each deployment if a build fails.

## 9. Common Deployment Errors

- Wrong root directory: set Storefront to `apps/storefront`, Admin to `apps/admin`.
- Workspace package not found: use the provided install/build commands that run from the monorepo root.
- Missing env vars: add all required Vercel environment variables and redeploy.
- Service role exposed: remove `SUPABASE_SERVICE_ROLE_KEY` from Storefront immediately.
- Supabase reads fail: verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Admin writes fail: verify `SUPABASE_SERVICE_ROLE_KEY` exists only in Admin.
- Auth redirects fail: update Supabase Auth Site URL and Redirect URLs.

## 10. Supabase Production Checks

In Supabase:

1. Apply migrations in `supabase/migrations`.
2. Confirm required tables exist.
3. Confirm seeded categories/products/settings exist.
4. Confirm RLS policies are enabled.
5. Confirm Storefront can read active products/categories.
6. Confirm Admin can update data using server-side service role code.
7. In Authentication settings, set Site URL and Redirect URLs:
   - Storefront URL, for example `https://urbanixstore.com`
   - Admin URL, for example `https://admin.urbanixstore.com`
   - Vercel preview URLs if you use preview deployments

## 11. Final Production Test Checklist

Storefront:

- Homepage loads.
- Product listing loads.
- Product detail loads.
- Add to cart works.
- Cart totals are correct.
- Checkout works.
- WhatsApp order link works.
- No console errors.
- No 404 errors.

Admin:

- Admin login works.
- Product management works.
- Product update appears on Storefront after refresh.
- Category update appears on Storefront after refresh.
- Banner/homepage update appears on Storefront after refresh.
- Store settings update appears on Storefront after refresh.
- Order management works.

Deployment:

- Storefront Vercel deployment builds successfully.
- Admin Vercel deployment builds successfully.
- Environment variable errors are gone.
- Supabase production data is connected.
