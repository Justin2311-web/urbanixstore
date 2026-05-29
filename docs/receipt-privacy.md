# Receipt Privacy Plan

## Current state (soft-launch OK, public-launch needs hardening)

- Bucket: `uploads` in Supabase Storage is **public** (anonymous read).
- Storefront `/api/signed-upload` requests a signed **write** URL using the
  service role key, then returns the **public read URL** to the client.
- The public read URL is stored as `orders.receipt_url`.
- Admin views the receipt by following that public URL.

Risk: anyone who guesses or obtains a receipt URL (e.g. via shared links,
referer leak, or browser history) can view another customer's bank receipt
(PII + payment details).

The upload path already includes a random `crypto.randomUUID()` segment,
so URLs are not enumerable, but they are still effectively public
bearer URLs.

## Target state (private bucket + signed read)

1. **Make bucket private**
   - Supabase Dashboard → Storage → `uploads` bucket → Settings →
     toggle "Public bucket" **off**.
   - No SQL migration is required; this is a bucket-level setting.

2. **Stop exposing public URLs to clients**
   - Storefront `/api/signed-upload` should return only `filePath`
     (and `signedUrl` for the actual PUT) — **not** `publicUrl`.
   - Storefront should store `receipt_path` (not `receipt_url`) on the
     order payload sent to `/api/orders`.

3. **Database column**
   - Add `orders.receipt_path TEXT` via an idempotent migration:
     ```sql
     ALTER TABLE public.orders
       ADD COLUMN IF NOT EXISTS receipt_path TEXT;
     ```
   - Keep `receipt_url` for backwards compatibility for a transition
     period; new orders write `receipt_path`. After all old orders are
     fulfilled, drop `receipt_url` in a later migration.

4. **Admin read flow**
   - Admin order detail page generates a short-lived signed read URL
     using the service role key:
     ```ts
     const { data } = await supabaseAdmin
       .storage
       .from("uploads")
       .createSignedUrl(receiptPath, 60 * 10); // 10 minutes
     ```
   - Render that URL behind an admin-only server component or API route.
   - Never render the storage path or signed URL in a client component
     that could be cached/scraped.

5. **Track-order API**
   - The customer-facing `/api/orders/track` already returns only
     `hasReceipt: boolean` — no change needed.

## Why this PR does not flip the bucket

- Flipping the bucket to private without simultaneously updating the
  admin viewer would break receipt viewing for the operations team.
- Switching to `receipt_path` storage requires a coordinated change
  across storefront API + storefront client (checkout) + admin order
  detail page + DB migration. That is a separate, larger change set
  and should ship behind QA.

## Recommended rollout

1. Add `receipt_path` column (idempotent migration).
2. Update storefront to send `receipt_path` while still also sending
   `receiptUrl` for one release.
3. Update admin to prefer `receipt_path` and call `createSignedUrl`
   when present; fall back to `receipt_url`.
4. Once admin is deployed, flip the bucket to private.
5. After the next billing cycle, drop the legacy `receipt_url` column.
