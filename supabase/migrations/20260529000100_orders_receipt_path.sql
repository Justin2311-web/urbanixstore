-- Receipt privacy hardening: introduce `receipt_path` so new orders can
-- reference the storage object directly instead of a permanent public URL.
-- Idempotent + backward compatible. The legacy `receipt_url` column is
-- intentionally retained so existing orders remain viewable.

alter table public.orders
  add column if not exists receipt_path text;

comment on column public.orders.receipt_path is
  'Supabase Storage object path within the uploads bucket (e.g. receipts/<order>/<uuid>.jpg). '
  'Preferred over receipt_url; admin generates short-lived signed read URLs from this path.';

create index if not exists orders_receipt_path_present_idx
  on public.orders ((receipt_path is not null))
  where receipt_path is not null;
