alter table public.orders
  add column if not exists receipt_bucket text,
  add column if not exists receipt_path text,
  add column if not exists receipt_public_url_legacy text,
  add column if not exists receipt_uploaded_at timestamptz;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set
  public = false;

create index if not exists orders_receipt_path_idx
  on public.orders (receipt_path)
  where receipt_path is not null;
