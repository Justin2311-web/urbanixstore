alter table public.promotion_banners
  add column if not exists cta_text_en text,
  add column if not exists cta_text_zh text,
  add column if not exists cta_text_ms text,
  add column if not exists title_en text,
  add column if not exists title_zh text,
  add column if not exists title_ms text,
  add column if not exists subtitle_en text,
  add column if not exists subtitle_zh text,
  add column if not exists subtitle_ms text,
  add column if not exists button_enabled boolean not null default true,
  add column if not exists button_position text default 'bottom-left';

update public.promotion_banners
set
  cta_text_en = coalesce(cta_text_en, cta_text),
  title_en = coalesce(title_en, title),
  subtitle_en = coalesce(subtitle_en, subtitle),
  button_enabled = coalesce(button_enabled, cta_text is not null)
where true;
