alter table public.banners
  add column if not exists hero_title_en text,
  add column if not exists hero_title_zh text,
  add column if not exists hero_title_ms text,
  add column if not exists hero_subtitle_en text,
  add column if not exists hero_subtitle_zh text,
  add column if not exists hero_subtitle_ms text,
  add column if not exists hero_button_text_en text,
  add column if not exists hero_button_text_zh text,
  add column if not exists hero_button_text_ms text,
  add column if not exists promo_strip_text_en text,
  add column if not exists promo_strip_text_zh text,
  add column if not exists promo_strip_text_ms text;

update public.banners
set
  hero_title_en = coalesce(hero_title_en, hero_title),
  hero_subtitle_en = coalesce(hero_subtitle_en, hero_subtitle),
  hero_button_text_en = coalesce(hero_button_text_en, hero_button_text),
  promo_strip_text_en = coalesce(promo_strip_text_en, promo_strip_text)
where id = true;
