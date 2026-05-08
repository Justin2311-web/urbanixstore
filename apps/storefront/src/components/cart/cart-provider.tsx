"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CartContextValue = {
  items: Record<string, number>;
  count: number;
  addItem: (productId: string, quantity?: number) => void;
  clearCart: () => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setItemQuantity: (productId: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "urbanix-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState<Record<string, number>>({});

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const storedCart = window.localStorage.getItem(storageKey);

        if (storedCart) {
          setItems(JSON.parse(storedCart) as Record<string, number>);
        }
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setItems((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + quantity,
    }));
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setItems((current) => {
      const nextQuantity = (current[productId] ?? 0) - 1;
      const next = { ...current };

      if (nextQuantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = nextQuantity;
      }

      return next;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }, []);

  const setItemQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      const next = { ...current };

      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }

      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems({});
  }, []);

  const value = useMemo(
    () => ({
      addItem,
      clearCart,
      count: Object.values(items).reduce((total, quantity) => total + quantity, 0),
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
