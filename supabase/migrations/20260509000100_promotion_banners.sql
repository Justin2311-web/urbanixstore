create table if not exists public.promotion_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  cta_text text,
  target_url text,
  desktop_image_url text,
  mobile_image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promotion_banners_active_sort_idx
on public.promotion_banners (is_active, sort_order);

drop trigger if exists promotion_banners_set_updated_at on public.promotion_banners;
create trigger promotion_banners_set_updated_at
before update on public.promotion_banners
for each row execute function public.set_updated_at();

alter table public.promotion_banners enable row level security;

drop policy if exists "Public can read active promotion banners" on public.promotion_banners;
create policy "Public can read active promotion banners"
on public.promotion_banners for select
using (is_active = true);

grant select on table public.promotion_banners to anon, authenticated;

insert into public.promotion_banners (
  title,
  subtitle,
  cta_text,
  target_url,
  desktop_image_url,
  mobile_image_url,
  is_active,
  sort_order
)
values (
  'Stay Cool. Move Smart.',
  'Smart picks for your urban life.',
  'Shop Now',
  '/products',
  '',
  '',
  true,
  1
)
on conflict do nothing;
