grant usage on schema public to anon, authenticated;

grant select on table
  public.categories,
  public.products,
  public.product_images,
  public.store_settings,
  public.banners,
  public.payment_settings
to anon, authenticated;

grant insert on table
  public.orders,
  public.order_items
to anon, authenticated;
