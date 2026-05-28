alter table public.orders
  add column if not exists receipt_url text,
  add column if not exists payment_method_type text,
  add column if not exists courier text,
  add column if not exists tracking_number text;

alter table public.order_items
  add column if not exists selected_variants jsonb;

create index if not exists orders_order_number_customer_phone_idx
  on public.orders (order_number, customer_phone);

create index if not exists orders_tracking_number_idx
  on public.orders (tracking_number)
  where tracking_number is not null;
