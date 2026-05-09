grant insert, update, delete on table
  public.categories,
  public.products,
  public.product_images,
  public.store_settings,
  public.banners,
  public.payment_settings,
  public.promotion_banners
to anon, authenticated;

drop policy if exists "Admin app can write categories" on public.categories;
create policy "Admin app can write categories"
on public.categories for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can write products" on public.products;
create policy "Admin app can write products"
on public.products for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can write product images" on public.product_images;
create policy "Admin app can write product images"
on public.product_images for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can write store settings" on public.store_settings;
create policy "Admin app can write store settings"
on public.store_settings for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can write homepage banners" on public.banners;
create policy "Admin app can write homepage banners"
on public.banners for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can write payment settings" on public.payment_settings;
create policy "Admin app can write payment settings"
on public.payment_settings for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can write promotion banners" on public.promotion_banners;
create policy "Admin app can write promotion banners"
on public.promotion_banners for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Admin app can upload Urbanix storage assets" on storage.objects;
create policy "Admin app can upload Urbanix storage assets"
on storage.objects for insert
to anon, authenticated
with check (bucket_id in ('product-images', 'banners', 'logos', 'uploads'));

drop policy if exists "Admin app can update Urbanix storage assets" on storage.objects;
create policy "Admin app can update Urbanix storage assets"
on storage.objects for update
to anon, authenticated
using (bucket_id in ('product-images', 'banners', 'logos', 'uploads'))
with check (bucket_id in ('product-images', 'banners', 'logos', 'uploads'));

drop policy if exists "Admin app can delete Urbanix storage assets" on storage.objects;
create policy "Admin app can delete Urbanix storage assets"
on storage.objects for delete
to anon, authenticated
using (bucket_id in ('product-images', 'banners', 'logos', 'uploads'));
