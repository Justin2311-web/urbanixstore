create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  option_name text not null,
  option_value text not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  price_adjustment numeric(12, 2) not null default 0,
  sku text,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_variants enable row level security;

create policy "Public variants read" on public.product_variants
  for select using (true);

create policy "Service role variants write" on public.product_variants
  for all using (auth.role() = 'service_role');

grant select on public.product_variants to anon, authenticated;
grant all on public.product_variants to service_role;
