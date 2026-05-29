# Receipt Privacy — Phase 6 hardening

Implemented in branch `launch-readiness-phase-6-receipt-privacy`.

## Summary of the new flow

1. Customer uploads a receipt during checkout (JPG/PNG/WEBP/PDF, ≤5 MB).
2. Storefront `/api/signed-upload` returns:
   - `filePath`: storage path inside the `uploads` bucket (e.g.
     `receipts/<order-number>/<uuid>.jpg`)
   - `signedUrl`: short-lived PUT URL the browser uses to upload
   - **No `publicUrl` is returned.**
3. The browser PUTs the file to `signedUrl`, then sends `receiptPath` to
   `/api/orders`.
4. `/api/orders` validates the path (`receipts/<safe order>/...<allowed ext>`)
   and stores it in `orders.receipt_path`. The legacy `orders.receipt_url`
   column is left NULL for new orders.
5. Admin order detail server-renders a fresh 10-minute signed read URL
   from `receipt_path` via the service role key. The URL never leaves
   the server-rendered HTML, never reaches the storefront, and never
   appears in the track-order API response (which only returns
   `hasReceipt: boolean`).
6. Old orders with only `receipt_url` continue to render in admin with
   a "Legacy receipt link" warning chip until the bucket is flipped
   private (after which legacy links stop working — see rollback).

## Backward compatibility

- `/api/orders` still accepts `receiptUrl` as a fallback for any
  in-flight client that hasn't refreshed. New clients send
  `receiptPath` only.
- Admin reads `receipt_path` first, then `receipt_url`. If neither is
  present, the receipt panel is hidden.
- DB migration `20260529000100_orders_receipt_path.sql` only adds the
  new column. It does not touch existing data.

## Migration

File: `supabase/migrations/20260529000100_orders_receipt_path.sql`

```sql
alter table public.orders
  add column if not exists receipt_path text;
-- + partial index for non-null receipt_path
```

Idempotent and safe to re-run.

## Apply the migration

If your repo is linked to the Supabase project:

```bash
supabase db push
```

Or manually via the dashboard:

1. Supabase → SQL Editor → New query
2. Paste the contents of `20260529000100_orders_receipt_path.sql`
3. Run. Confirm `orders.receipt_path` column exists.

## Flipping the bucket to private (manual, after code is deployed)

**Do not flip until the code in this branch is deployed to production
and at least one test order with `receipt_path` has been verified
viewable from admin.**

1. Supabase Dashboard → **Storage** → `uploads` bucket → **Configuration**
2. Toggle **Public bucket** off.
3. Save.
4. Verify:
   - Place a fresh test order on the storefront — checkout should
     succeed exactly as before.
   - Open the new order in admin — receipt should render via the signed
     URL.
   - Open an old order (created before the bucket was flipped) — the
     legacy public URL will now return 404/403. This is expected.

## Rollback plan

If admin cannot view receipts after the flip:

1. Supabase Dashboard → Storage → `uploads` → Configuration
2. Toggle **Public bucket** back on.
3. Legacy receipts become viewable again immediately.
4. Investigate the admin signed-URL flow (most likely
   `SUPABASE_SERVICE_ROLE_KEY` not set or wrong on the admin Vercel
   project).

## Env vars

No new env vars introduced by Phase 6. The existing
`SUPABASE_SERVICE_ROLE_KEY` (already required on storefront for the
signed upload URL) is also required on the admin Vercel project for
signed read URL generation. Confirm it is set on both.

## Track order API

`/api/orders/track` continues to return `hasReceipt: boolean` only. It
does **not** return `receipt_url` or `receipt_path`, so customers
cannot retrieve receipts after submission.

## What is intentionally still TODO (future work)

- Backfill: write a one-shot script that parses any existing
  `receipt_url` values, extracts the object path, and copies it into
  `receipt_path` so historical orders work after the bucket flip.
  Skipped here because soft-launch orders are few and manually
  reviewable; safer to leave the bucket public until ready.
- After the legacy window is closed, drop `orders.receipt_url` in a
  follow-up migration.
