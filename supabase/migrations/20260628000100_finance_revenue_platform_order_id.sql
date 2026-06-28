alter table public.finance_revenue
add column if not exists platform_order_id text;

comment on column public.finance_revenue.platform_order_id is
  'External marketplace order ID from Shopee, Lazada, TikTok Shop, or another non-website sales channel.';

create index if not exists finance_revenue_platform_order_idx
on public.finance_revenue (source, platform_order_id)
where platform_order_id is not null;
