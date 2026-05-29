create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  tone text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  category_id uuid references public.categories(id) on delete restrict,
  short_description text,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  promotion_price numeric(12, 2) check (promotion_price is null or promotion_price >= 0),
  promotion_start_at timestamptz,
  promotion_end_at timestamptz,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  main_image_url text,
  image_tone text,
  rating numeric(3, 2),
  sold integer not null default 0 check (sold >= 0),
  shipping_info text,
  return_note text,
  highlights jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_promotion_window_check check (
    promotion_start_at is null
    or promotion_end_at is null
    or promotion_end_at >= promotion_start_at
  )
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address jsonb not null default '{}'::jsonb,
  delivery_note text,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  payment_method text not null default 'manual' check (payment_method in ('manual', 'whatsapp')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'unpaid', 'paid', 'failed', 'refunded')),
  order_status text not null default 'pending' check (order_status in ('pending', 'processing', 'shipped', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Urbanix Store',
  store_tagline text not null default 'Smart picks for your urban life.',
  logo_url text,
  favicon_url text,
  whatsapp_number text,
  contact_email text,
  contact_phone text,
  shipping_fee numeric(12, 2) not null default 6 check (shipping_fee >= 0),
  free_shipping_min_amount numeric(12, 2) not null default 50 check (free_shipping_min_amount >= 0),
  currency text not null default 'MYR',
  social_links jsonb not null default '{}'::jsonb,
  is_store_active boolean not null default true,
  maintenance_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id boolean primary key default true check (id),
  hero_title text not null,
  hero_subtitle text,
  hero_button_text text,
  hero_button_link text,
  hero_image_url text,
  promo_strip_text text,
  featured_category_cards jsonb not null default '[]'::jsonb,
  trust_badge_text jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_settings (
  id boolean primary key default true check (id),
  manual_payment_enabled boolean not null default true,
  whatsapp_order_enabled boolean not null default true,
  bank_name text,
  account_name text,
  account_number text,
  payment_instruction text,
  provider_placeholder text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_sort_idx on public.categories (is_active, sort_order);
create index if not exists products_category_active_idx on public.products (category_id, is_active);
create index if not exists products_featured_idx on public.products (is_featured) where is_active = true;
create index if not exists product_images_product_sort_idx on public.product_images (product_id, is_primary desc, sort_order);
create index if not exists orders_status_idx on public.orders (payment_status, order_status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists store_settings_set_updated_at on public.store_settings;
create trigger store_settings_set_updated_at
before update on public.store_settings
for each row execute function public.set_updated_at();

drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at
before update on public.banners
for each row execute function public.set_updated_at();

drop trigger if exists payment_settings_set_updated_at on public.payment_settings;
create trigger payment_settings_set_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.store_settings enable row level security;
alter table public.banners enable row level security;
alter table public.payment_settings enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
using (is_active = true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
using (
  is_active = true
  and exists (
    select 1
    from public.categories
    where categories.id = products.category_id
      and categories.is_active = true
  )
);

drop policy if exists "Public can read product images for active products" on public.product_images;
create policy "Public can read product images for active products"
on public.product_images for select
using (
  exists (
    select 1
    from public.products
    join public.categories on categories.id = products.category_id
    where products.id = product_images.product_id
      and products.is_active = true
      and categories.is_active = true
  )
);

drop policy if exists "Public can read active store settings" on public.store_settings;
create policy "Public can read active store settings"
on public.store_settings for select
using (true);

drop policy if exists "Public can read active banners" on public.banners;
create policy "Public can read active banners"
on public.banners for select
using (is_active = true);

drop policy if exists "Public can read enabled payment settings" on public.payment_settings;
create policy "Public can read enabled payment settings"
on public.payment_settings for select
using (is_enabled = true);

drop policy if exists "Public can create orders" on public.orders;
create policy "Public can create orders"
on public.orders for insert
with check (true);

drop policy if exists "Public can create order items" on public.order_items;
create policy "Public can create order items"
on public.order_items for insert
with check (true);

insert into public.categories (name, slug, description, tone, sort_order, is_active)
values
  ('Portable Fans', 'portable-fans', 'Stay cool anywhere', 'mint', 1, true),
  ('Car Accessories', 'car-accessories', 'Drive smarter', 'teal', 2, true),
  ('Home Picks', 'home-picks', 'Elevate your space', 'peach', 3, true),
  ('Lifestyle', 'lifestyle', 'Essentials for you', 'lilac', 4, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  tone = excluded.tone,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.products (
  name,
  slug,
  sku,
  category_id,
  short_description,
  description,
  price,
  promotion_price,
  stock_quantity,
  is_active,
  is_featured,
  main_image_url,
  image_tone,
  rating,
  sold,
  shipping_info,
  return_note,
  highlights,
  specifications
)
values
  (
    'Turbo Hand Fan Pro',
    'turbo-hand-fan-pro',
    'URX-FAN-PRO-GRN',
    (select id from public.categories where slug = 'portable-fans'),
    'Powerful airflow in the palm of your hand.',
    'A compact high-speed hand fan designed for commuting, desk work, errands, and warm days outdoors.',
    24.90,
    18.90,
    42,
    true,
    true,
    null,
    'fan-green',
    4.8,
    200,
    'Free shipping: West Malaysia above RM80, East Malaysia above RM150.',
    'Returns accepted within 30 days for unused items in original packaging.',
    '["Strong airflow", "USB-C charging", "Pocket-friendly body"]'::jsonb,
    '["3 speed modes", "USB-C charging", "Up to 12 hours battery life", "Pocket-friendly body"]'::jsonb
  ),
  (
    'Grip Car Phone Holder',
    'grip-car-phone-holder',
    'URX-CAR-GRIP-BLK',
    (select id from public.categories where slug = 'car-accessories'),
    'A steady phone holder for cleaner, safer drives.',
    'A compact mount with firm grip support for daily commutes, navigation, and hands-free convenience.',
    18.90,
    15.90,
    36,
    true,
    true,
    null,
    'car',
    4.7,
    90,
    'Free shipping: West Malaysia above RM80, East Malaysia above RM150.',
    'Returns accepted within 30 days for unused items in original packaging.',
    '["Stable clamp grip", "One-hand adjustment", "Matte black finish"]'::jsonb,
    '["Stable clamp grip", "Compact dashboard fit", "One-hand adjustment", "Matte black finish"]'::jsonb
  ),
  (
    'Car Perfume Ocean Breeze',
    'car-perfume-ocean-breeze',
    'URX-CAR-SCENT-OCN',
    (select id from public.categories where slug = 'car-accessories'),
    'A fresh scent upgrade for everyday drives.',
    'A clean ocean-inspired car fragrance made for a calmer cabin and a more pleasant commute.',
    13.90,
    11.90,
    5,
    true,
    true,
    null,
    'perfume',
    4.6,
    76,
    'Free shipping: West Malaysia above RM80, East Malaysia above RM150.',
    'Returns accepted within 30 days for unused items in original packaging.',
    '["Ocean breeze scent", "Compact bottle", "Long-lasting aroma"]'::jsonb,
    '["Ocean breeze scent", "Compact bottle", "Easy placement", "Long-lasting aroma"]'::jsonb
  ),
  (
    'Magnetic Cable Organizer',
    'magnetic-cable-organizer',
    'URX-LIFE-CABLE-MAG',
    (select id from public.categories where slug = 'lifestyle'),
    'Keep daily cables tidy, reachable, and frustration-free.',
    'A minimalist magnetic cable organizer for desks, bedside tables, bags, and small workspaces.',
    10.10,
    8.90,
    28,
    true,
    true,
    null,
    'cable',
    4.7,
    64,
    'Free shipping: West Malaysia above RM80, East Malaysia above RM150.',
    'Returns accepted within 30 days for unused items in original packaging.',
    '["Magnetic hold", "Compact footprint", "Works with common cables"]'::jsonb,
    '["Magnetic hold", "Compact footprint", "Desk-friendly design", "Works with common cables"]'::jsonb
  )
on conflict (slug) do update set
  name = excluded.name,
  sku = excluded.sku,
  category_id = excluded.category_id,
  short_description = excluded.short_description,
  description = excluded.description,
  price = excluded.price,
  promotion_price = excluded.promotion_price,
  stock_quantity = excluded.stock_quantity,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  main_image_url = excluded.main_image_url,
  image_tone = excluded.image_tone,
  rating = excluded.rating,
  sold = excluded.sold,
  shipping_info = excluded.shipping_info,
  return_note = excluded.return_note,
  highlights = excluded.highlights,
  specifications = excluded.specifications;

insert into public.store_settings (
  id,
  store_name,
  store_tagline,
  whatsapp_number,
  contact_email,
  contact_phone,
  shipping_fee,
  free_shipping_min_amount,
  currency,
  social_links,
  is_store_active,
  maintenance_message
)
values (
  true,
  'Urbanix Store',
  'Smart picks for your urban life.',
  '60123456789',
  'hello@urbanix.store',
  '+60 12-345 6789',
  6,
  50,
  'MYR',
  '{}'::jsonb,
  true,
  'Urbanix Store is currently under maintenance. Please check back soon.'
)
on conflict (id) do update set
  store_name = excluded.store_name,
  store_tagline = excluded.store_tagline,
  whatsapp_number = excluded.whatsapp_number,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  shipping_fee = excluded.shipping_fee,
  free_shipping_min_amount = excluded.free_shipping_min_amount,
  currency = excluded.currency,
  is_store_active = excluded.is_store_active,
  maintenance_message = excluded.maintenance_message;

insert into public.banners (
  id,
  hero_title,
  hero_subtitle,
  hero_button_text,
  hero_button_link,
  hero_image_url,
  promo_strip_text,
  featured_category_cards,
  trust_badge_text,
  is_active
)
values (
  true,
  'Stay Cool. Move Smart.',
  'Smart picks for your urban life.',
  'Shop Now',
  '/products',
  'fan-green',
  'Free shipping: West Malaysia above RM80, East Malaysia above RM150.',
  '["portable-fans", "car-accessories", "home-picks", "lifestyle"]'::jsonb,
  '["Free Shipping", "30-Day Returns", "Secure Checkout", "Trusted Store"]'::jsonb,
  true
)
on conflict (id) do update set
  hero_title = excluded.hero_title,
  hero_subtitle = excluded.hero_subtitle,
  hero_button_text = excluded.hero_button_text,
  hero_button_link = excluded.hero_button_link,
  hero_image_url = excluded.hero_image_url,
  promo_strip_text = excluded.promo_strip_text,
  featured_category_cards = excluded.featured_category_cards,
  trust_badge_text = excluded.trust_badge_text,
  is_active = excluded.is_active;

insert into public.payment_settings (
  id,
  manual_payment_enabled,
  whatsapp_order_enabled,
  bank_name,
  account_name,
  account_number,
  payment_instruction,
  provider_placeholder,
  is_enabled
)
values (
  true,
  true,
  true,
  'Urbanix Store',
  'Urbanix Store',
  '1234 5678 9012',
  'Transfer first, then send us the payment screenshot on WhatsApp.',
  'Online gateway integration placeholder',
  true
)
on conflict (id) do update set
  manual_payment_enabled = excluded.manual_payment_enabled,
  whatsapp_order_enabled = excluded.whatsapp_order_enabled,
  bank_name = excluded.bank_name,
  account_name = excluded.account_name,
  account_number = excluded.account_number,
  payment_instruction = excluded.payment_instruction,
  provider_placeholder = excluded.provider_placeholder,
  is_enabled = excluded.is_enabled;

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('banners', 'banners', true),
  ('logos', 'logos', true),
  ('uploads', 'uploads', true)
on conflict (id) do update set
  public = excluded.public;

drop policy if exists "Public can read Urbanix storage assets" on storage.objects;
create policy "Public can read Urbanix storage assets"
on storage.objects for select
using (bucket_id in ('product-images', 'banners', 'logos', 'uploads'));
