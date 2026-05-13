"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  /** Unique key within the cart (productId when no variants, or productId::Key=Val:: when variants) */
  cartKey: string;
  productId: string;
  quantity: number;
  selectedVariants?: Record<string, string>;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (productId: string, quantity?: number, selectedVariants?: Record<string, string>) => void;
  clearCart: () => void;
  decrementItem: (cartKey: string) => void;
  removeItem: (cartKey: string) => void;
  setItemQuantity: (cartKey: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "urbanix-cart";

/** Generates a stable cart key from productId + optional selected variants. */
export function makeCartKey(productId: string, selectedVariants?: Record<string, string>): string {
  if (!selectedVariants || Object.keys(selectedVariants).length === 0) return productId;
  const pairs = Object.entries(selectedVariants)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("::");
  return `${productId}::${pairs}`;
}

/** Migrate old localStorage format (Record<string,number>) to CartItem[] */
function migrateStoredCart(raw: unknown): CartItem[] {
  if (Array.isArray(raw)) return raw as CartItem[];
  if (raw && typeof raw === "object") {
    // Old format: { productId: quantity }
    return Object.entries(raw as Record<string, number>)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => ({
        cartKey: productId,
        productId,
        quantity,
      }));
  }
  return [];
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedCart = window.localStorage.getItem(storageKey);
        if (storedCart) {
          setItems(migrateStoredCart(JSON.parse(storedCart)));
        }
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((productId: string, quantity = 1, selectedVariants?: Record<string, string>) => {
    const cartKey = makeCartKey(productId, selectedVariants);
    setItems((current) => {
      const existing = current.find((item) => item.cartKey === cartKey);
      if (existing) {
        return current.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, { cartKey, productId, quantity, selectedVariants }];
    });
  }, []);

  const decrementItem = useCallback((cartKey: string) => {
    setItems((current) => {
      return current
        .map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);
    });
  }, []);

  const removeItem = useCallback((cartKey: string) => {
    setItems((current) => current.filter((item) => item.cartKey !== cartKey));
  }, []);

  const setItemQuantity = useCallback((cartKey: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) return current.filter((item) => item.cartKey !== cartKey);
      return current.map((item) =>
        item.cartKey === cartKey ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      addItem,
      clearCart,
      count: items.reduce((total, item) => total + item.quantity, 0),
      decrementItem,
      items,
      removeItem,
      setItemQuantity,
    }),
    [addItem, clearCart, decrementItem, items, removeItem, setItemQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
}
