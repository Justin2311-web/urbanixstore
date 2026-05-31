/**
 * Hand-curated customer reviews shown on the homepage Review Wall.
 *
 * Soft-launch approach: static config, no Supabase table, no user-
 * submission flow, no admin CRUD. Edit this file directly to update
 * the wall.
 *
 * Editorial rules:
 * - First name only, never a real surname.
 * - Location is city / state, kept generic (e.g. "Selangor").
 * - No absolute claims ("best", "100%", "guaranteed").
 * - Keep voice natural and Malaysia-flavoured across EN / 中 / BM.
 * - productLabel is a CATEGORY-level descriptor, not a SKU.
 */

export type CustomerReview = {
  /** Stable React key. Do not reorder existing IDs. */
  id: string;
  /** First name only — e.g. "Aina". */
  name: string;
  /** City and/or state — e.g. "Selangor" / "Kuching, Sarawak". */
  location: string;
  /** 1-5; rendered as filled / outline stars. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Category-level label — e.g. "Portable Fan". */
  productLabel: string;
  /** Optional short chip — e.g. "Fast Delivery". */
  tag?: string;
  /** When true, the "Verified Buyer" badge is shown. */
  verified: boolean;
  /** Trilingual review body. */
  text: {
    en: string;
    zh: string;
    ms: string;
  };
};

export const customerReviews: CustomerReview[] = [
  {
    id: "aina-selangor",
    name: "Aina",
    location: "Selangor",
    rating: 5,
    productLabel: "Portable Fan",
    tag: "Fast Delivery",
    verified: true,
    text: {
      en: "Got my hand fan in 2 days before the Hari Raya trip — perfect for the panas weather. WhatsApp team replied quickly when I asked about charging.",
      zh: "两天就收到风扇，开斋节出门刚好用上。问充电的事时 WhatsApp 团队回得很快。",
      ms: "Dapat kipas dalam 2 hari sebelum balik kampung Hari Raya — sesuai untuk cuaca panas. Pasukan WhatsApp jawab cepat bila tanya pasal cas.",
    },
  },
  {
    id: "mei-ling-johor",
    name: "Mei Ling",
    location: "Johor",
    rating: 5,
    productLabel: "Car Accessory",
    tag: "Daily Use",
    verified: true,
    text: {
      en: "Bought the magnetic phone holder for my car. Grip is steady on bumpy roads, packaging arrived intact.",
      zh: "买了磁吸手机座给车用。颠簸路也夹得很稳，包装收到时完好。",
      ms: "Beli pemegang telefon magnet untuk kereta. Cengkaman kekal kuat di jalan berbonggol, bungkusan tiba dalam keadaan baik.",
    },
  },
  {
    id: "daniel-penang",
    name: "Daniel",
    location: "Penang",
    rating: 5,
    productLabel: "Order Experience",
    tag: "Easy Payment",
    verified: true,
    text: {
      en: "QR payment was straightforward, no card needed. Order was confirmed on WhatsApp the same day.",
      zh: "QR 付款很方便，不用刷卡。当天就在 WhatsApp 收到订单确认。",
      ms: "Bayar QR senang, tak perlu kad. Pengesahan pesanan sampai di WhatsApp pada hari yang sama.",
    },
  },
  {
    id: "fatimah-kl",
    name: "Fatimah",
    location: "Kuala Lumpur",
    rating: 4,
    productLabel: "Car Scent",
    tag: "Helpful Support",
    verified: true,
    text: {
      en: "Car freshener smells subtle, not too strong. Useful for the daily commute and the price feels fair for the quality.",
      zh: "车用香水味道淡雅，不会太冲。每天通勤都用，价钱也合理。",
      ms: "Penyegar udara kereta wangi lembut, tak terlalu kuat. Berguna untuk pergi kerja, harga pun berpatutan.",
    },
  },
  {
    id: "wei-jun-sarawak",
    name: "Wei Jun",
    location: "Kuching, Sarawak",
    rating: 5,
    productLabel: "Delivery",
    tag: "Sarawak Delivered",
    verified: true,
    text: {
      en: "East Malaysia delivery was faster than I expected — arrived in under a week. The tracking link helped a lot.",
      zh: "东马运送比我预期快，不到一周就到。追踪链接帮了大忙。",
      ms: "Penghantaran ke Sarawak lebih cepat dari sangkaan — sampai dalam seminggu. Pautan jejak sangat membantu.",
    },
  },
  {
    id: "hafiz-seremban",
    name: "Hafiz",
    location: "Seremban",
    rating: 5,
    productLabel: "Car Organizer",
    tag: "Repeat Buyer",
    verified: true,
    text: {
      en: "The boot organizer fits perfectly and keeps groceries from rolling around. Will order again.",
      zh: "后箱收纳盒尺寸刚好，去市场买菜也不会到处滚。下次还会再买。",
      ms: "Kotak susun but muat sempurna, barang dapur tak bergolek-golek lagi. Akan order lagi.",
    },
  },
];
