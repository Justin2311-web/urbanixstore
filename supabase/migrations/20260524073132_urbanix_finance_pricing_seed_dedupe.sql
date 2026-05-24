begin;

insert into public.finance_settings (
  id,
  startup_capital,
  default_shipping_cost,
  default_packaging_cost,
  currency
)
values (true, 2500.00, 0.00, 0.00, 'MYR')
on conflict (id) do update
set
  startup_capital = excluded.startup_capital,
  currency = excluded.currency;

with confirmed_expenses(title, category, amount, notes) as (
  values
    ('SSM Registration', 'SSM / Business Registration', 70.00::numeric, 'Urbanix Store business registration.'),
    ('Claude Code Subscription', 'Software / Tools', 80.42::numeric, 'AI coding tool subscription for Urbanix Store development.'),
    ('A6 Thermal Printer', 'Office / Misc', 104.93::numeric, 'A6 thermal printer for order fulfillment and parcel labels.'),
    ('Sample Product Cost', 'Sample / Testing Product', 11.83::numeric, 'Initial testing product cost.'),
    ('China to Malaysia Consolidated Shipping', 'Shipping / Logistics', 50.00::numeric, 'Product shipping from China to Malaysia.'),
    ('First Product Procurement Batch', 'Product Cost', 169.20::numeric, 'First product purchase batch.'),
    ('Second Product Procurement Batch', 'Product Cost', 982.01::numeric, 'Second product purchase batch.')
),
updated_matching_expenses as (
  update public.finance_expenses existing
  set
    title = confirmed_expenses.title,
    category = confirmed_expenses.category,
    amount = confirmed_expenses.amount,
    currency = 'MYR',
    notes = confirmed_expenses.notes
  from confirmed_expenses
  where existing.amount = confirmed_expenses.amount
    and (
      existing.title = confirmed_expenses.title
      or (existing.title = 'China Shipping' and confirmed_expenses.title = 'China to Malaysia Consolidated Shipping')
      or existing.notes = 'Seeded from Urbanix startup finance data'
    )
  returning existing.id
)
insert into public.finance_expenses (
  title,
  category,
  amount,
  currency,
  expense_date,
  payment_method,
  notes
)
select
  confirmed_expenses.title,
  confirmed_expenses.category,
  confirmed_expenses.amount,
  'MYR',
  current_date,
  'Bank Transfer',
  confirmed_expenses.notes
from confirmed_expenses
where not exists (
  select 1
  from public.finance_expenses existing
  where existing.title = confirmed_expenses.title
    and existing.amount = confirmed_expenses.amount
);

with ranked_confirmed_duplicates as (
  select
    id,
    row_number() over (
      partition by title, amount
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.finance_expenses
  where (title, amount) in (
    values
      ('SSM Registration', 70.00::numeric),
      ('Claude Code Subscription', 80.42::numeric),
      ('A6 Thermal Printer', 104.93::numeric),
      ('Sample Product Cost', 11.83::numeric),
      ('China to Malaysia Consolidated Shipping', 50.00::numeric),
      ('First Product Procurement Batch', 169.20::numeric),
      ('Second Product Procurement Batch', 982.01::numeric)
  )
)
delete from public.finance_expenses
where id in (
  select id
  from ranked_confirmed_duplicates
  where duplicate_rank > 1
);

with product_seed(sort_order, product_id, english_name, sku, supplier_cost, original_price, promotion_price) as (
  values
    (1, 'c5b21031-e9ee-4684-9a87-a34da0fc6256'::uuid, '2025 New High-Speed Turbo Handheld Fan', 'URX-FAN-PRO-GRN', 22.85::numeric, 59.90::numeric, 49.90::numeric),
    (2, '4cb13d4f-05ee-4040-8386-307ffc92bb3f'::uuid, 'Solar Aircraft Car Air Freshener', 'URX-JET-PERFUME', 11.43::numeric, 29.90::numeric, 24.90::numeric),
    (3, 'b856e7fe-f28b-4f38-acf4-6c71d7ebaecf'::uuid, 'Car Phone Holder', 'URX-CAR-GRIP-BLK', 9.32::numeric, 24.90::numeric, 19.90::numeric),
    (4, null::uuid, 'Cute Panda Car Backseat Organizer', 'URX-PANDA-BACKSEAT-ORG', 12.63::numeric, 34.90::numeric, 29.90::numeric),
    (5, null::uuid, 'Simple Car Backseat Organizer Tissue Storage Bag', 'URX-TISSUE-BACKSEAT-BAG', 8.72::numeric, 24.90::numeric, 19.90::numeric),
    (6, 'ce94638d-f405-4d76-9fce-b17ef7204e86'::uuid, 'Hidden Temporary Parking Number Plate', 'URX-PARK-NO', 4.39::numeric, 14.90::numeric, 9.90::numeric),
    (7, null::uuid, 'Rearview Mirror Car Fragrance Pendant', 'URX-MIRROR-FRAGRANCE', 2.10::numeric, 9.90::numeric, 7.90::numeric),
    (8, '8c3bc95b-e7a0-4c53-9b27-6f027f31fdeb'::uuid, 'Car Middle Seat Storage Hanging Bag', 'URX-STORE-BAG', 9.62::numeric, 29.90::numeric, 24.90::numeric),
    (9, '2ec35e81-fa89-4c5a-bed1-3fa44bc1f0c8'::uuid, 'Magnetic Cable Organizer', 'URX-LIFE-CABLE-MAG', 0.96::numeric, 4.90::numeric, 2.90::numeric),
    (10, '1ebd1900-492c-4c76-babf-ed7e7c254357'::uuid, '100-Speed Turbo Handheld Fan', 'URX-COLD-FAN', 11.97::numeric, 29.90::numeric, 24.90::numeric),
    (11, '4ffc6ca0-37e6-4cd2-a492-11d7dc2f5334'::uuid, 'RGB Wireless Charging Electric Car Phone Holder', 'URX-WRLS-HOLD', 19.84::numeric, 59.90::numeric, 49.90::numeric),
    (12, '38865ae0-b471-4b2c-8d93-acfbbc513bad'::uuid, 'Power Strip Wall Mount Holder', 'URX-WALL-HOLDER', 2.65::numeric, 7.90::numeric, 5.90::numeric)
),
updated_products as (
  update public.products p
  set
    price = product_seed.original_price,
    promotion_price = product_seed.promotion_price,
    product_variants = case
      when jsonb_typeof(p.product_variants) = 'array'
        and jsonb_array_length(p.product_variants) > 0
      then (
        select jsonb_agg(
          case
            when jsonb_array_length(p.product_variants) = 1
              or lower(coalesce(variant ->> 'name', '')) = 'default'
              or not (variant ? 'originalPrice')
            then variant || jsonb_build_object(
              'originalPrice', product_seed.original_price,
              'promotionPrice', product_seed.promotion_price
            )
            else variant
          end
        )
        from jsonb_array_elements(p.product_variants) as variant
      )
      else p.product_variants
    end
  from product_seed
  where p.id = product_seed.product_id
  returning p.id
),
upsert_linked_costs as (
  insert into public.finance_product_costs (
    product_id,
    product_name,
    sku,
    supplier_cost,
    shipping_cost_per_unit,
    packaging_cost_per_unit,
    platform_fee_percent,
    selling_price
  )
  select
    product_seed.product_id,
    coalesce(p.name, product_seed.english_name),
    coalesce(p.sku, product_seed.sku),
    product_seed.supplier_cost,
    0,
    0,
    0,
    product_seed.promotion_price
  from product_seed
  left join public.products p on p.id = product_seed.product_id
  where product_seed.product_id is not null
  on conflict (product_id) where product_id is not null do update
  set
    product_name = excluded.product_name,
    sku = excluded.sku,
    supplier_cost = excluded.supplier_cost,
    shipping_cost_per_unit = excluded.shipping_cost_per_unit,
    packaging_cost_per_unit = excluded.packaging_cost_per_unit,
    platform_fee_percent = excluded.platform_fee_percent,
    selling_price = excluded.selling_price
  returning id
),
updated_unmatched_costs as (
  update public.finance_product_costs existing
  set
    product_name = product_seed.english_name,
    supplier_cost = product_seed.supplier_cost,
    shipping_cost_per_unit = 0,
    packaging_cost_per_unit = 0,
    platform_fee_percent = 0,
    selling_price = product_seed.promotion_price
  from product_seed
  where product_seed.product_id is null
    and (
      existing.sku = product_seed.sku
      or existing.product_name = product_seed.english_name
    )
  returning existing.id
)
insert into public.finance_product_costs (
  product_id,
  product_name,
  sku,
  supplier_cost,
  shipping_cost_per_unit,
  packaging_cost_per_unit,
  platform_fee_percent,
  selling_price
)
select
  null,
  product_seed.english_name,
  product_seed.sku,
  product_seed.supplier_cost,
  0,
  0,
  0,
  product_seed.promotion_price
from product_seed
where product_seed.product_id is null
  and not exists (
    select 1
    from public.finance_product_costs existing
    where existing.sku = product_seed.sku
      or existing.product_name = product_seed.english_name
  );

with linked_duplicates as (
  select
    id,
    row_number() over (
      partition by product_id
      order by updated_at desc, created_at desc, id asc
    ) as duplicate_rank
  from public.finance_product_costs
  where product_id is not null
),
manual_duplicates as (
  select
    id,
    row_number() over (
      partition by sku
      order by updated_at desc, created_at desc, id asc
    ) as duplicate_rank
  from public.finance_product_costs
  where product_id is null
    and sku is not null
    and sku <> ''
)
delete from public.finance_product_costs
where id in (
  select id from linked_duplicates where duplicate_rank > 1
  union
  select id from manual_duplicates where duplicate_rank > 1
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'cost_price'
  ) then
    execute $sql$
      with product_seed(product_id, supplier_cost) as (
        values
          ('c5b21031-e9ee-4684-9a87-a34da0fc6256'::uuid, 22.85::numeric),
          ('4cb13d4f-05ee-4040-8386-307ffc92bb3f'::uuid, 11.43::numeric),
          ('b856e7fe-f28b-4f38-acf4-6c71d7ebaecf'::uuid, 9.32::numeric),
          ('ce94638d-f405-4d76-9fce-b17ef7204e86'::uuid, 4.39::numeric),
          ('8c3bc95b-e7a0-4c53-9b27-6f027f31fdeb'::uuid, 9.62::numeric),
          ('2ec35e81-fa89-4c5a-bed1-3fa44bc1f0c8'::uuid, 0.96::numeric),
          ('1ebd1900-492c-4c76-babf-ed7e7c254357'::uuid, 11.97::numeric),
          ('4ffc6ca0-37e6-4cd2-a492-11d7dc2f5334'::uuid, 19.84::numeric),
          ('38865ae0-b471-4b2c-8d93-acfbbc513bad'::uuid, 2.65::numeric)
      )
      update public.products p
      set cost_price = product_seed.supplier_cost
      from product_seed
      where p.id = product_seed.product_id
    $sql$;
  end if;
end $$;

commit;
