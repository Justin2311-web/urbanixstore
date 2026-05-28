create table if not exists public.finance_settings (
  id boolean primary key default true check (id),
  startup_capital numeric(12, 2) not null default 2500 check (startup_capital >= 0),
  default_shipping_cost numeric(12, 2) not null default 0 check (default_shipping_cost >= 0),
  default_packaging_cost numeric(12, 2) not null default 0 check (default_packaging_cost >= 0),
  currency text not null default 'MYR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_product_costs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  supplier_cost numeric(12, 2) not null default 0 check (supplier_cost >= 0),
  shipping_cost_per_unit numeric(12, 2) not null default 0 check (shipping_cost_per_unit >= 0),
  packaging_cost_per_unit numeric(12, 2) not null default 0 check (packaging_cost_per_unit >= 0),
  platform_fee_percent numeric(6, 2) not null default 0 check (platform_fee_percent >= 0 and platform_fee_percent <= 100),
  selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists finance_product_costs_product_id_idx
on public.finance_product_costs (product_id)
where product_id is not null;

create index if not exists finance_product_costs_sku_idx
on public.finance_product_costs (sku);

drop trigger if exists finance_settings_set_updated_at on public.finance_settings;
create trigger finance_settings_set_updated_at
before update on public.finance_settings
for each row execute function public.set_updated_at();

drop trigger if exists finance_product_costs_set_updated_at on public.finance_product_costs;
create trigger finance_product_costs_set_updated_at
before update on public.finance_product_costs
for each row execute function public.set_updated_at();

alter table public.finance_settings enable row level security;
alter table public.finance_product_costs enable row level security;

revoke all on table public.finance_settings from anon, authenticated;
revoke all on table public.finance_product_costs from anon, authenticated;

insert into public.finance_settings (id, startup_capital, default_shipping_cost, default_packaging_cost, currency)
values (true, 2500.00, 0.00, 0.00, 'MYR')
on conflict (id) do nothing;

insert into public.finance_expenses (title, category, amount, currency, expense_date, payment_method, notes)
select seed.title, seed.category, seed.amount, 'MYR', current_date, 'Bank Transfer', 'Seeded from Urbanix startup finance data'
from (
  values
    ('SSM Registration', 'SSM / Business Registration', 70.00::numeric),
    ('Claude Code Subscription', 'Software / Tools', 80.42::numeric),
    ('A6 Thermal Printer', 'Packaging', 104.93::numeric),
    ('Sample Product Cost', 'Sample / Testing Product', 11.83::numeric),
    ('China Shipping', 'Shipping / Logistics', 50.00::numeric),
    ('First Product Procurement Batch', 'Product Cost', 169.20::numeric),
    ('Second Product Procurement Batch', 'Product Cost', 982.01::numeric)
) as seed(title, category, amount)
where not exists (
  select 1
  from public.finance_expenses existing
  where existing.title = seed.title
    and existing.amount = seed.amount
    and existing.notes = 'Seeded from Urbanix startup finance data'
);
