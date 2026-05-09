export type AppNavItem = {
  label: string;
  href: string;
};

export const storefrontNavItems: AppNavItem[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "New Arrivals", href: "/products" },
  { label: "Best Sellers", href: "/products" },
  { label: "About Us", href: "/categories" },
  { label: "Cart", href: "/cart" },
];

export const adminNavItems: AppNavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Add Product", href: "/products/new" },
  { label: "Categories", href: "/categories" },
  { label: "Homepage", href: "/homepage" },
  { label: "Promotions", href: "/promotions" },
  { label: "Orders", href: "/orders" },
  { label: "Store Settings", href: "/settings" },
  { label: "Payment Settings", href: "/payments" },
];

export const platformConfig = {
  name: "Urbanix Store",
  storefrontName: "Urbanix Store",
  adminName: "Urbanix Admin",
  tagline: "Smart picks. Urban life.",
  currency: "MYR",
  whatsappNumber: "60123456789",
  freeShippingThreshold: 50,
} as const;

export type StoreSettings = {
  storeName: string;
  storeTagline: string;
  logo: string;
  favicon: string;
  logoUrl?: string;
  faviconUrl?: string;
  whatsappNumber: string;
  contactEmail: string;
  contactPhone: string;
  shippingFee: number;
  freeShippingMinimumAmount: number;
  freeShippingMinAmount?: number;
  currency?: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  storeActive: boolean;
  isStoreActive?: boolean;
  maintenanceMessage?: string;
};

export type PaymentSettings = {
  manualPaymentEnabled: boolean;
  whatsAppOrderEnabled: boolean;
  bankName: string;
  accountName: string;
  accountNumber: string;
  paymentInstruction: string;
  futureGatewayPlaceholder: string;
  providerPlaceholder?: string;
  isEnabled?: boolean;
};

export type HomepageContent = {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroImage: string;
  heroImageUrl?: string;
  featuredCategoryCards: string[];
  promotionStripText: string;
  promoStripText?: string;
  trustBadgeText: string[];
  isActive?: boolean;
};

export type PromotionBanner = {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  targetUrl: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export function formatCurrency(amount: number, currency = platformConfig.currency) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
  }).format(amount);
}

export type ProductCategory = {
  id: string;
  name: string;
  slug?: string;
  href: string;
  description: string;
  imageUrl?: string;
  tone: "teal" | "mint" | "peach" | "lilac" | "sky" | "rose" | "amber" | "slate" | "lime";
  active?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type UrbanixProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId?: string;
  category: string;
  sku: string;
  shortDescription: string;
  description: string;
  specifications: string[];
  shippingInfo: string;
  returnNote: string;
  price: number;
  originalPrice?: number;
  promotionPercent?: number;
  rating: number;
  sold: number;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  imageTone: "fan-green" | "fan-cream" | "fan-black" | "car" | "perfume" | "cable";
  image?: string;
  galleryImages?: string[];
  productImages?: Array<{
    imageUrl: string;
    altText?: string;
    sortOrder?: number;
    isPrimary?: boolean;
  }>;
  normalPrice?: number;
  promotionPrice?: number;
  promotionStartDate?: string;
  promotionEndDate?: string;
  promotionStartAt?: string;
  promotionEndAt?: string;
  stockQuantity?: number;
  status?: "active" | "inactive";
  isActive?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  mainImageUrl?: string;
  fullDescription?: string;
  highlights?: string[];
  productHighlights?: string[];
  relatedCategory?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductSort = "featured" | "price" | "newest";
export type ProductFilter = "all" | "best-sellers" | "new-arrivals" | "on-sale";

export type CartLine = {
  product: UrbanixProduct;
  quantity: number;
  lineTotal: number;
};

export type OrderTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
};

export type CheckoutCustomer = {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  deliveryNote: string;
};

export type PaymentMethod = "manual" | "whatsapp";

export type UrbanixOrder = {
  id: string;
  orderNumber: string;
  customer: CheckoutCustomer;
  items: CartLine[];
  totals: OrderTotals;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "unpaid" | "paid" | "failed" | "refunded";
  orderStatus: "pending" | "processing" | "shipped" | "completed" | "cancelled";
  createdAt: string;
  updatedAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: CheckoutCustomer | Record<string, string>;
  deliveryNote?: string;
  subtotal?: number;
  shippingFee?: number;
  discountAmount?: number;
  totalAmount?: number;
};

export type TrustBadge = {
  title: string;
  description: string;
};

export const urbanixCategories: ProductCategory[] = [
  {
    id: "portable-fans",
    name: "Portable Fans",
    slug: "portable-fans",
    href: "/categories?category=portable-fans",
    description: "Stay cool anywhere",
    tone: "mint",
    active: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "car-accessories",
    name: "Car Accessories",
    slug: "car-accessories",
    href: "/categories?category=car-accessories",
    description: "Drive smarter",
    tone: "teal",
    active: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "home-picks",
    name: "Home Picks",
    slug: "home-picks",
    href: "/categories?category=home-picks",
    description: "Elevate your space",
    tone: "peach",
    active: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    slug: "lifestyle",
    href: "/categories?category=lifestyle",
    description: "Essentials for you",
    tone: "lilac",
    active: true,
    isActive: true,
    sortOrder: 4,
  },
];

export const urbanixProducts: UrbanixProduct[] = [
  {
    id: "turbo-hand-fan-pro",
    name: "Turbo Hand Fan Pro",
    slug: "turbo-hand-fan-pro",
    category: "Portable Fans",
    sku: "URX-FAN-PRO-GRN",
    shortDescription: "Powerful airflow in the palm of your hand.",
    description:
      "A compact high-speed hand fan designed for commuting, desk work, errands, and warm days outdoors.",
    specifications: [
      "3 speed modes",
      "USB-C charging",
      "Up to 12 hours battery life",
      "Pocket-friendly body",
    ],
    shippingInfo: "Free shipping applies for orders over RM50.",
    returnNote: "Returns accepted within 30 days for unused items in original packaging.",
    price: 18.9,
    originalPrice: 24.9,
    promotionPercent: 20,
    rating: 4.8,
    sold: 200,
    stockStatus: "in_stock",
    imageTone: "fan-green",
    normalPrice: 24.9,
    promotionPrice: 18.9,
    stockQuantity: 42,
    status: "active",
    featured: true,
    highlights: ["Strong airflow", "USB-C charging", "Pocket-friendly body"],
    relatedCategory: "portable-fans",
  },
  {
    id: "grip-car-phone-holder",
    name: "Grip Car Phone Holder",
    slug: "grip-car-phone-holder",
    category: "Car Accessories",
    sku: "URX-CAR-GRIP-BLK",
    shortDescription: "A steady phone holder for cleaner, safer drives.",
    description:
      "A compact mount with firm grip support for daily commutes, navigation, and hands-free convenience.",
    specifications: ["Stable clamp grip", "Compact dashboard fit", "One-hand adjustment", "Matte black finish"],
    shippingInfo: "Free shipping applies for orders over RM50.",
    returnNote: "Returns accepted within 30 days for unused items in original packaging.",
    price: 15.9,
    originalPrice: 18.9,
    promotionPercent: 15,
    rating: 4.7,
    sold: 90,
    stockStatus: "in_stock",
    imageTone: "car",
    normalPrice: 18.9,
    promotionPrice: 15.9,
    stockQuantity: 36,
    status: "active",
    featured: true,
    highlights: ["Stable clamp grip", "One-hand adjustment", "Matte black finish"],
    relatedCategory: "car-accessories",
  },
  {
    id: "car-perfume-ocean-breeze",
    name: "Car Perfume Ocean Breeze",
    slug: "car-perfume-ocean-breeze",
    category: "Car Accessories",
    sku: "URX-CAR-SCENT-OCN",
    shortDescription: "A fresh scent upgrade for everyday drives.",
    description:
      "A clean ocean-inspired car fragrance made for a calmer cabin and a more pleasant commute.",
    specifications: ["Ocean breeze scent", "Compact bottle", "Easy placement", "Long-lasting aroma"],
    shippingInfo: "Free shipping applies for orders over RM50.",
    returnNote: "Returns accepted within 30 days for unused items in original packaging.",
    price: 11.9,
    originalPrice: 13.9,
    promotionPercent: 10,
    rating: 4.6,
    sold: 76,
    stockStatus: "low_stock",
    imageTone: "perfume",
    normalPrice: 13.9,
    promotionPrice: 11.9,
    stockQuantity: 5,
    status: "active",
    featured: true,
    highlights: ["Ocean breeze scent", "Compact bottle", "Long-lasting aroma"],
    relatedCategory: "car-accessories",
  },
  {
    id: "magnetic-cable-organizer",
    name: "Magnetic Cable Organizer",
    slug: "magnetic-cable-organizer",
    category: "Lifestyle",
    sku: "URX-LIFE-CABLE-MAG",
    shortDescription: "Keep daily cables tidy, reachable, and frustration-free.",
    description:
      "A minimalist magnetic cable organizer for desks, bedside tables, bags, and small workspaces.",
    specifications: ["Magnetic hold", "Compact footprint", "Desk-friendly design", "Works with common cables"],
    shippingInfo: "Free shipping applies for orders over RM50.",
    returnNote: "Returns accepted within 30 days for unused items in original packaging.",
    price: 8.9,
    originalPrice: 10.1,
    promotionPercent: 12,
    rating: 4.7,
    sold: 64,
    stockStatus: "in_stock",
    imageTone: "cable",
    normalPrice: 10.1,
    promotionPrice: 8.9,
    stockQuantity: 28,
    status: "active",
    featured: true,
    highlights: ["Magnetic hold", "Compact footprint", "Works with common cables"],
    relatedCategory: "lifestyle",
  },
  {
    id: "urbanix-hand-fan-lite",
    name: "Urbanix Hand Fan Lite",
    slug: "urbanix-hand-fan-lite",
    category: "Portable Fans",
    sku: "URX-FAN-LITE-CRM",
    shortDescription: "Lightweight cooling for daily carry.",
    description:
      "A soft-toned portable fan with simple controls and a lightweight build for quick cooling anywhere.",
    specifications: ["2 speed modes", "USB charging", "Lightweight shell", "Quiet airflow"],
    shippingInfo: "Free shipping applies for orders over RM50.",
    returnNote: "Returns accepted within 30 days for unused items in original packaging.",
    price: 15.9,
    rating: 4.7,
    sold: 120,
    stockStatus: "in_stock",
    imageTone: "fan-cream",
    normalPrice: 15.9,
    stockQuantity: 18,
    status: "active",
    featured: false,
    highlights: ["Lightweight shell", "Quiet airflow", "USB charging"],
    relatedCategory: "portable-fans",
  },
  {
    id: "clip-fan-air-360",
    name: "Clip Fan Air 360",
    slug: "clip-fan-air-360",
    category: "Portable Fans",
    sku: "URX-FAN-CLIP-360",
    shortDescription: "Flexible cooling for desks, shelves, and small corners.",
    description:
      "A clip-on fan with adjustable positioning for focused airflow where you need it most.",
    specifications: ["360-degree angle", "Clip-on base", "Desk-ready design", "Rechargeable battery"],
    shippingInfo: "Free shipping applies for orders over RM50.",
    returnNote: "Returns accepted within 30 days for unused items in original packaging.",
    price: 19.9,
    rating: 4.6,
    sold: 86,
    stockStatus: "out_of_stock",
    imageTone: "fan-black",
    normalPrice: 19.9,
    stockQuantity: 0,
    status: "active",
    featured: false,
    highlights: ["360-degree angle", "Clip-on base", "Rechargeable battery"],
    relatedCategory: "portable-fans",
  },
];

export const defaultHomepageContent: HomepageContent = {
  heroTitle: "Stay Cool. Move Smart.",
  heroSubtitle: "Smart picks for your urban life.",
  heroButtonText: "Shop Now",
  heroButtonLink: "/products",
  heroImage: "fan-green",
  heroImageUrl: "",
  featuredCategoryCards: ["portable-fans", "car-accessories", "home-picks", "lifestyle"],
  promotionStripText: "Free Shipping for orders over RM50",
  promoStripText: "Free Shipping for orders over RM50",
  trustBadgeText: ["Free Shipping", "30-Day Returns", "Secure Checkout", "Trusted Store"],
  isActive: true,
};

export const defaultStoreSettings: StoreSettings = {
  storeName: "Urbanix Store",
  storeTagline: "Smart picks for your urban life.",
  logo: "Urbanix Store",
  favicon: "/favicon.ico",
  logoUrl: "",
  faviconUrl: "/favicon.ico",
  whatsappNumber: "60123456789",
  contactEmail: "hello@urbanix.store",
  contactPhone: "+60 12-345 6789",
  shippingFee: 6,
  freeShippingMinimumAmount: 50,
  freeShippingMinAmount: 50,
  currency: "MYR",
  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: "",
  },
  storeActive: true,
  isStoreActive: true,
  maintenanceMessage: "Urbanix Store is currently under maintenance. Please check back soon.",
};

export const defaultPaymentSettings: PaymentSettings = {
  manualPaymentEnabled: true,
  whatsAppOrderEnabled: true,
  bankName: "Urbanix Store",
  accountName: "Urbanix Store",
  accountNumber: "1234 5678 9012",
  paymentInstruction: "Transfer first, then send us the payment screenshot on WhatsApp.",
  futureGatewayPlaceholder: "Online gateway integration placeholder",
  providerPlaceholder: "Online gateway integration placeholder",
  isEnabled: true,
};

export type UrbanixStoreData = {
  products: UrbanixProduct[];
  categories: ProductCategory[];
  homepage: HomepageContent;
  promotionBanners: PromotionBanner[];
  settings: StoreSettings;
  payments: PaymentSettings;
  orders: UrbanixOrder[];
};

export const defaultUrbanixStoreData: UrbanixStoreData = {
  categories: urbanixCategories,
  homepage: defaultHomepageContent,
  orders: [],
  payments: defaultPaymentSettings,
  promotionBanners: [],
  products: urbanixProducts,
  settings: defaultStoreSettings,
};

export function getVisibleCategories(categories = urbanixCategories) {
  return categories
    .filter((category) => category.active !== false && category.isActive !== false)
    .toSorted((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0));
}

export function isProductVisible(product: UrbanixProduct, categories = urbanixCategories) {
  const category = categories.find(
    (item) => item.name === product.category || item.id === product.relatedCategory || item.id === product.categoryId
  );

  return product.status !== "inactive" && product.isActive !== false && category?.active !== false && category?.isActive !== false;
}

export function getDisplayPrice(product: UrbanixProduct, today = new Date()) {
  const normalPrice = product.normalPrice ?? product.originalPrice ?? product.price;
  const promotionPrice = product.promotionPrice ?? product.price;
  const startsAt = product.promotionStartAt || product.promotionStartDate ? new Date(product.promotionStartAt ?? product.promotionStartDate ?? "") : null;
  const endsAt = product.promotionEndAt || product.promotionEndDate ? new Date(product.promotionEndAt ?? product.promotionEndDate ?? "") : null;
  const started = !startsAt || startsAt <= today;
  const active = !endsAt || endsAt >= today;
  const hasPromotion = promotionPrice < normalPrice && started && active;

  return {
    originalPrice: hasPromotion ? normalPrice : undefined,
    price: hasPromotion ? promotionPrice : normalPrice,
    promotionPercent: hasPromotion ? Math.round(((normalPrice - promotionPrice) / normalPrice) * 100) : undefined,
  };
}

export function normalizeProductPricing(product: UrbanixProduct): UrbanixProduct {
  const display = getDisplayPrice(product);

  return {
    ...product,
    categoryId: product.categoryId ?? product.relatedCategory ?? getCategoryIdByName(product.category),
    isActive: product.isActive ?? product.status !== "inactive",
    isFeatured: product.isFeatured ?? product.featured ?? false,
    mainImageUrl: product.mainImageUrl ?? product.image,
    productHighlights: product.productHighlights ?? product.highlights ?? [],
    originalPrice: display.originalPrice,
    price: display.price,
    promotionPercent: display.promotionPercent,
    stockStatus:
      (product.stockQuantity ?? 1) <= 0
        ? "out_of_stock"
        : (product.stockQuantity ?? 10) <= 5
          ? "low_stock"
          : product.stockStatus,
  };
}

export function getCategoryById(categoryId?: string) {
  return getVisibleCategories().find((category) => category.id === categoryId);
}

export function getCategoryIdByName(categoryName: string) {
  return categoryName.toLowerCase().replaceAll(" ", "-");
}

export function filterUrbanixProducts({
  category,
  filter = "all",
  query = "",
  sort = "featured",
}: {
  category?: string;
  filter?: ProductFilter;
  query?: string;
  sort?: ProductSort;
}) {
  const normalizedQuery = query.trim().toLowerCase();

  const filteredProducts = urbanixProducts.filter((product) => {
    const categoryMatches =
      !category || getCategoryIdByName(product.category) === category;
    const queryMatches =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery);
    const filterMatches =
      filter === "all" ||
      (filter === "best-sellers" && product.sold >= 90) ||
      (filter === "new-arrivals" && ["urbanix-hand-fan-lite", "magnetic-cable-organizer"].includes(product.id)) ||
      (filter === "on-sale" && Boolean(product.promotionPercent));

    return isProductVisible(product) && categoryMatches && queryMatches && filterMatches;
  });

  return filteredProducts.map(normalizeProductPricing).toSorted((first, second) => {
    if (sort === "price") {
      return first.price - second.price;
    }

    if (sort === "newest") {
      return second.id.localeCompare(first.id);
    }

    return second.sold - first.sold;
  });
}

export function getProductById(productId: string) {
  return urbanixProducts.find((product) => product.id === productId);
}

export function getProductBySlug(slug: string) {
  return urbanixProducts.find((product) => product.slug === slug);
}

export function getCartLines(items: Record<string, number>, products = urbanixProducts): CartLine[] {
  return Object.entries(items)
    .map(([productId, quantity]) => {
      const product = products.find((item) => item.id === productId);

      if (!product || quantity <= 0) {
        return null;
      }

      return {
        lineTotal: product.price * quantity,
        product,
        quantity,
      };
    })
    .filter((line): line is CartLine => Boolean(line));
}

export function calculateOrderTotals(
  lines: CartLine[],
  settings: Pick<StoreSettings, "freeShippingMinimumAmount" | "shippingFee"> = {
    freeShippingMinimumAmount: platformConfig.freeShippingThreshold,
    shippingFee: 6,
  }
): OrderTotals {
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const discount = subtotal >= 60 ? Number((subtotal * 0.1).toFixed(2)) : 0;
  const shipping = subtotal === 0 || subtotal >= settings.freeShippingMinimumAmount ? 0 : settings.shippingFee;

  return {
    discount,
    shipping,
    subtotal,
    total: Math.max(0, subtotal - discount + shipping),
  };
}

export function createWhatsAppOrderMessage(order: UrbanixOrder) {
  const itemLines = order.items
    .map(
      (item) =>
        `- ${item.product.name} x${item.quantity} = ${formatCurrency(item.lineTotal)}`
    )
    .join("\n");

  return [
    `Hi Urbanix Store, I would like to confirm my order ${order.orderNumber}.`,
    "",
    `Name: ${order.customer.fullName}`,
    `Phone: ${order.customer.phone}`,
    `Email: ${order.customer.email}`,
    `Address: ${order.customer.addressLine1}, ${order.customer.addressLine2}, ${order.customer.city}, ${order.customer.state}, ${order.customer.postcode}, ${order.customer.country}`,
    order.customer.deliveryNote ? `Note: ${order.customer.deliveryNote}` : "",
    "",
    "Items:",
    itemLines,
    "",
    `Total: ${formatCurrency(order.totals.total)}`,
    `Payment method: ${order.paymentMethod === "manual" ? "Manual Payment / Bank Transfer" : "WhatsApp Order"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const trustBadges: TrustBadge[] = [
  { title: "Free Shipping", description: "Orders over RM50" },
  { title: "30-Day Returns", description: "No hassle" },
  { title: "Secure Checkout", description: "100% safe" },
  { title: "Trusted Store", description: "Friendly support" },
];
