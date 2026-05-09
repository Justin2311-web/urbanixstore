# Urbanix Store Google Sheet CMS

The storefront reads from a Product / Frontend Portal Google Sheet when `GOOGLE_SHEET_ID` or `GOOGLE_SHEET_CMS_URL` is configured. Image columns should contain Cloudinary HTTPS URLs only.

## Publish Setup

1. Create one Google Sheet with the tabs below.
2. Share the sheet as viewable by anyone with the link, or publish it to the web.
3. Add `GOOGLE_SHEET_ID` to the Vercel storefront project. The ID is the value between `/d/` and `/edit` in the Sheet URL.
4. Redeploy the storefront. Sheet reads use `no-store`, so content changes appear after a page refresh.

Alternative API endpoint:

```env
GOOGLE_SHEET_CMS_URL=https://example.com/api/sheet?tab={tab}
```

The endpoint must return either an array of row objects or `{ "rows": [...] }`.

## Environment Variables

```env
GOOGLE_SHEET_ID=
GOOGLE_SHEET_CMS_URL=
NEXT_PUBLIC_GOOGLE_SHEET_ID=
NEXT_PUBLIC_GOOGLE_SHEET_CMS_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_SHOPEE_STORE_URL=
NEXT_PUBLIC_LAZADA_STORE_URL=
```

Prefer the server-only `GOOGLE_SHEET_ID` or `GOOGLE_SHEET_CMS_URL` values in production. The `NEXT_PUBLIC_*` variants remain available for simple deployments.

## Products

Columns:

```csv
status,product_id,sku,slug,category_id,name_en,name_zh,name_ms,description_en,description_zh,description_ms,price,compare_at_price,image_1,image_2,image_3,image_4,image_5,image_6,image_7,image_8,image_9,shopee_url,lazada_url,sort_order
```

Rules:

- `status` must be `active` to appear.
- `slug` is used for `/products/[slug]`. If blank, the storefront generates one from `name_en`.
- `category_id` must match a row in `Categories`.
- `image_1` is the product card and main gallery image.
- `image_2` to `image_9` appear in the product detail gallery.
- `price`, `compare_at_price`, and `sort_order` should be numeric.

## Categories

Columns:

```csv
status,category_id,name_en,name_zh,name_ms,icon,tone,sort_order
```

Rules:

- `status` must be `active` to appear.
- `category_id` connects products to categories.
- `tone` supports the existing storefront tones such as `mint`, `sun`, `sky`, `rose`, `violet`, `sand`, `dark`, `fan-green`, and `fan-orange`.

## Banners

Columns:

```csv
status,banner_id,title_en,title_zh,title_ms,subtitle_en,subtitle_zh,subtitle_ms,button_text_en,button_text_zh,button_text_ms,desktop_image_url,mobile_image_url,target_url,sort_order
```

Rules:

- `status` must be `active` to appear.
- `desktop_image_url` and `mobile_image_url` should be Cloudinary URLs.
- `target_url` can be an internal path like `/products/example` or an external URL.

## StoreSettings

Columns:

```csv
key,value
```

Required keys:

```text
store_name
logo_url
whatsapp_number
free_shipping_threshold
free_shipping_text_en
free_shipping_text_zh
free_shipping_text_ms
facebook_url
instagram_url
tiktok_url
shopee_url
lazada_url
```

Optional keys supported by the storefront:

```text
contact_email
contact_phone
```

## Footer

Columns:

```csv
key,en,zh,ms
```

Recommended keys:

```text
store_tagline
tagline_extra
shop_title
help_title
about_title
contact_title
shipping
returns
contact_us
our_story
blog
privacy_policy
need_help
```

## Language Behavior

The storefront language selector controls localized Sheet fields:

- Product name and description
- Category name
- Banner title, subtitle, and button text
- Free shipping text
- Footer text

If a translated cell is blank, the storefront falls back to the English cell.
