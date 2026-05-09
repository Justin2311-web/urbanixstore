drop policy if exists "Admin app can write categories" on public.categories;
drop policy if exists "Admin app can write products" on public.products;
drop policy if exists "Admin app can write product images" on public.product_images;
drop policy if exists "Admin app can write store settings" on public.store_settings;
drop policy if exists "Admin app can write homepage banners" on public.banners;
drop policy if exists "Admin app can write payment settings" on public.payment_settings;
drop policy if exists "Admin app can write promotion banners" on public.promotion_banners;

drop policy if exists "Admin app can upload Urbanix storage assets" on storage.objects;
drop policy if exists "Admin app can update Urbanix storage assets" on storage.objects;
drop policy if exists "Admin app can delete Urbanix storage assets" on storage.objects;
