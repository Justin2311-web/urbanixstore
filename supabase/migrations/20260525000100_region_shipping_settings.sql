alter table public.store_settings
  add column if not exists west_malaysia_shipping_fee numeric(12, 2),
  add column if not exists east_malaysia_shipping_fee numeric(12, 2),
  add column if not exists west_malaysia_free_shipping_min_amount numeric(12, 2),
  add column if not exists east_malaysia_free_shipping_min_amount numeric(12, 2);

update public.store_settings
set
  west_malaysia_shipping_fee = coalesce(west_malaysia_shipping_fee, shipping_fee, 7),
  east_malaysia_shipping_fee = coalesce(east_malaysia_shipping_fee, 15),
  west_malaysia_free_shipping_min_amount = coalesce(west_malaysia_free_shipping_min_amount, 80),
  east_malaysia_free_shipping_min_amount = coalesce(east_malaysia_free_shipping_min_amount, 150),
  shipping_fee = coalesce(shipping_fee, west_malaysia_shipping_fee, 7),
  free_shipping_min_amount = coalesce(free_shipping_min_amount, west_malaysia_free_shipping_min_amount, 80)
where id = true;

insert into public.store_settings (
  id,
  store_name,
  store_tagline,
  shipping_fee,
  free_shipping_min_amount,
  west_malaysia_shipping_fee,
  east_malaysia_shipping_fee,
  west_malaysia_free_shipping_min_amount,
  east_malaysia_free_shipping_min_amount
)
values (
  true,
  'Urbanix Store',
  'Smart picks for your urban life.',
  7,
  80,
  7,
  15,
  80,
  150
)
on conflict (id) do update
set
  west_malaysia_shipping_fee = coalesce(public.store_settings.west_malaysia_shipping_fee, public.store_settings.shipping_fee, excluded.west_malaysia_shipping_fee),
  east_malaysia_shipping_fee = coalesce(public.store_settings.east_malaysia_shipping_fee, excluded.east_malaysia_shipping_fee),
  west_malaysia_free_shipping_min_amount = coalesce(public.store_settings.west_malaysia_free_shipping_min_amount, excluded.west_malaysia_free_shipping_min_amount),
  east_malaysia_free_shipping_min_amount = coalesce(public.store_settings.east_malaysia_free_shipping_min_amount, excluded.east_malaysia_free_shipping_min_amount);

alter table public.store_settings
  alter column west_malaysia_shipping_fee set default 7,
  alter column west_malaysia_shipping_fee set not null,
  alter column east_malaysia_shipping_fee set default 15,
  alter column east_malaysia_shipping_fee set not null,
  alter column west_malaysia_free_shipping_min_amount set default 80,
  alter column west_malaysia_free_shipping_min_amount set not null,
  alter column east_malaysia_free_shipping_min_amount set default 150,
  alter column east_malaysia_free_shipping_min_amount set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'store_settings_west_malaysia_shipping_fee_check'
      and conrelid = 'public.store_settings'::regclass
  ) then
    alter table public.store_settings
      add constraint store_settings_west_malaysia_shipping_fee_check
      check (west_malaysia_shipping_fee >= 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'store_settings_east_malaysia_shipping_fee_check'
      and conrelid = 'public.store_settings'::regclass
  ) then
    alter table public.store_settings
      add constraint store_settings_east_malaysia_shipping_fee_check
      check (east_malaysia_shipping_fee >= 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'store_settings_west_malaysia_free_shipping_min_amount_check'
      and conrelid = 'public.store_settings'::regclass
  ) then
    alter table public.store_settings
      add constraint store_settings_west_malaysia_free_shipping_min_amount_check
      check (west_malaysia_free_shipping_min_amount >= 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'store_settings_east_malaysia_free_shipping_min_amount_check'
      and conrelid = 'public.store_settings'::regclass
  ) then
    alter table public.store_settings
      add constraint store_settings_east_malaysia_free_shipping_min_amount_check
      check (east_malaysia_free_shipping_min_amount >= 0)
      not valid;
  end if;
end $$;

alter table public.orders
  add column if not exists shipping_region text,
  add column if not exists free_shipping_threshold numeric(12, 2),
  add column if not exists is_free_shipping_applied boolean not null default false;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_shipping_region_check'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_shipping_region_check
      check (shipping_region is null or shipping_region in ('west', 'east'))
      not valid;
  end if;
end $$;

alter table public.store_settings validate constraint store_settings_west_malaysia_shipping_fee_check;
alter table public.store_settings validate constraint store_settings_east_malaysia_shipping_fee_check;
alter table public.store_settings validate constraint store_settings_west_malaysia_free_shipping_min_amount_check;
alter table public.store_settings validate constraint store_settings_east_malaysia_free_shipping_min_amount_check;
alter table public.orders validate constraint orders_shipping_region_check;
