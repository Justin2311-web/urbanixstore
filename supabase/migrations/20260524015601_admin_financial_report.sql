create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  category text not null check (category in (
    'Product Cost',
    'Shipping / Logistics',
    'Advertising',
    'Packaging',
    'Platform Fee',
    'Software / Tools',
    'SSM / Business Registration',
    'Sample / Testing Product',
    'Office / Misc',
    'Other'
  )),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'MYR',
  expense_date date not null,
  payment_method text,
  notes text,
  attachment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_revenue (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  source text not null check (source in (
    'Website',
    'Shopee',
    'Lazada',
    'TikTok Shop',
    'Manual / Offline',
    'Other'
  )),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'MYR',
  revenue_date date not null,
  related_order_id uuid references public.orders(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_expenses_date_category_idx
on public.finance_expenses (expense_date desc, category);

create index if not exists finance_revenue_date_source_idx
on public.finance_revenue (revenue_date desc, source);

create index if not exists finance_revenue_related_order_idx
on public.finance_revenue (related_order_id)
where related_order_id is not null;

drop trigger if exists finance_expenses_set_updated_at on public.finance_expenses;
create trigger finance_expenses_set_updated_at
before update on public.finance_expenses
for each row execute function public.set_updated_at();

drop trigger if exists finance_revenue_set_updated_at on public.finance_revenue;
create trigger finance_revenue_set_updated_at
before update on public.finance_revenue
for each row execute function public.set_updated_at();

alter table public.finance_expenses enable row level security;
alter table public.finance_revenue enable row level security;

revoke all on table public.finance_expenses from anon, authenticated;
revoke all on table public.finance_revenue from anon, authenticated;
