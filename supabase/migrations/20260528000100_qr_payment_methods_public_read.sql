create table if not exists public.qr_payment_methods (
  id text primary key,
  display_name text not null,
  qr_image_url text,
  instruction_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists qr_payment_methods_set_updated_at on public.qr_payment_methods;
create trigger qr_payment_methods_set_updated_at
before update on public.qr_payment_methods
for each row execute function public.set_updated_at();

alter table public.qr_payment_methods enable row level security;

drop policy if exists "Public can read active QR payment methods" on public.qr_payment_methods;
create policy "Public can read active QR payment methods"
on public.qr_payment_methods for select
using (is_active = true);

grant select on table public.qr_payment_methods to anon, authenticated;
grant all on table public.qr_payment_methods to service_role;
