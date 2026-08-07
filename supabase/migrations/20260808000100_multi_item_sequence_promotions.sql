create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  campaign_name text not null,
  code text not null,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'active', 'expired', 'disabled')),
  promotion_type text not null default 'multi_item_sequence'
    check (promotion_type in ('multi_item_sequence')),
  starts_at timestamptz,
  ends_at timestamptz,
  sequence_rules jsonb not null default '[]'::jsonb,
  repeat_sequence boolean not null default false,
  allocation text not null default 'cart_order'
    check (allocation in ('cart_order', 'cheapest_first', 'most_expensive_first')),
  eligibility_type text not null default 'entire_store'
    check (eligibility_type in ('entire_store', 'selected_products', 'selected_categories', 'selected_variants')),
  eligible_product_ids jsonb not null default '[]'::jsonb,
  eligible_category_ids jsonb not null default '[]'::jsonb,
  eligible_variant_keys jsonb not null default '[]'::jsonb,
  excluded_product_ids jsonb not null default '[]'::jsonb,
  excluded_category_ids jsonb not null default '[]'::jsonb,
  excluded_variant_keys jsonb not null default '[]'::jsonb,
  minimum_quantity integer not null default 1 check (minimum_quantity > 0),
  minimum_subtotal numeric(12, 2) check (minimum_subtotal is null or minimum_subtotal >= 0),
  total_usage_limit integer check (total_usage_limit is null or total_usage_limit > 0),
  per_customer_usage_limit integer check (per_customer_usage_limit is null or per_customer_usage_limit > 0),
  maximum_discount_per_order numeric(12, 2) check (maximum_discount_per_order is null or maximum_discount_per_order >= 0),
  stack_with_promo_codes boolean not null default false,
  stack_with_product_promotions boolean not null default false,
  stack_with_shipping_promotions boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_window_check check (starts_at is null or ends_at is null or ends_at >= starts_at),
  constraint promotions_sequence_rules_check check (jsonb_typeof(sequence_rules) = 'array'),
  constraint promotions_code_not_blank check (length(btrim(code)) > 0)
);

create unique index if not exists promotions_code_upper_unique_idx on public.promotions (upper(btrim(code)));
create index if not exists promotions_status_window_idx on public.promotions (status, starts_at, ends_at);

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at
before update on public.promotions
for each row execute function public.set_updated_at();

alter table public.promotions enable row level security;
revoke all on table public.promotions from anon, authenticated;

alter table public.orders
  add column if not exists promotion_id uuid references public.promotions(id) on delete set null,
  add column if not exists promo_code text,
  add column if not exists campaign_name text,
  add column if not exists promotion_rule_snapshot jsonb,
  add column if not exists discount_breakdown jsonb;

create index if not exists orders_promotion_usage_idx on public.orders (promotion_id, created_at desc)
where promotion_id is not null;
create index if not exists orders_promotion_customer_usage_idx on public.orders (promotion_id, customer_phone, created_at desc)
where promotion_id is not null;

create or replace function public.enforce_promotion_usage_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  promotion_row public.promotions%rowtype;
  usage_count bigint;
begin
  if new.promotion_id is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext(new.promotion_id::text));
  select * into promotion_row from public.promotions where id = new.promotion_id;
  if not found or promotion_row.status <> 'active'
    or (promotion_row.starts_at is not null and promotion_row.starts_at > now())
    or (promotion_row.ends_at is not null and promotion_row.ends_at < now()) then
    raise exception 'Promotion is not active';
  end if;
  if promotion_row.total_usage_limit is not null then
    select count(*) into usage_count from public.orders
      where promotion_id = new.promotion_id and order_status <> 'cancelled';
    if usage_count >= promotion_row.total_usage_limit then raise exception 'Promotion usage limit reached'; end if;
  end if;
  if promotion_row.per_customer_usage_limit is not null then
    select count(*) into usage_count from public.orders
      where promotion_id = new.promotion_id and customer_phone = new.customer_phone and order_status <> 'cancelled';
    if usage_count >= promotion_row.per_customer_usage_limit then raise exception 'Customer promotion usage limit reached'; end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_enforce_promotion_usage_limits on public.orders;
create trigger orders_enforce_promotion_usage_limits
before insert on public.orders
for each row execute function public.enforce_promotion_usage_limits();

insert into public.promotions (
  campaign_name,
  code,
  status,
  promotion_type,
  sequence_rules,
  repeat_sequence,
  allocation,
  eligibility_type,
  minimum_quantity,
  stack_with_promo_codes,
  stack_with_product_promotions,
  stack_with_shipping_promotions
)
values (
  'Urbanix Malaysia National Day / Merdeka Promotion 2026',
  'MERDEKA31',
  'active',
  'multi_item_sequence',
  '[{"position":1,"discountType":"percentage","discountValue":8},{"position":2,"discountType":"percentage","discountValue":31}]'::jsonb,
  true,
  'cart_order',
  'entire_store',
  1,
  false,
  false,
  true
)
on conflict ((upper(btrim(code)))) do nothing;
