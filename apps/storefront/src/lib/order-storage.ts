import type { UrbanixOrder } from "@ecommerce/shared";

export const latestOrderKey = "urbanix-latest-order";
export const ordersKey = "urbanix-orders";

export function saveOrder(order: UrbanixOrder) {
  const existingOrders = getOrders();
  const orders = [order, ...existingOrders.filter((item) => item.id !== order.id)];

  window.localStorage.setItem(latestOrderKey, JSON.stringify(order));
  window.localStorage.setItem(ordersKey, JSON.stringify(orders));
}

export function getLatestOrder() {
  const storedOrder = window.localStorage.getItem(latestOrderKey);
  return storedOrder ? (JSON.parse(storedOrder) as UrbanixOrder) : null;
}

export function getOrders() {
  const storedOrders = window.localStorage.getItem(ordersKey);
  return storedOrders ? (JSON.parse(storedOrders) as UrbanixOrder[]) : [];
}

export function createOrderNumber() {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const suffix = String(Math.floor(Math.random() * 90000) + 10000);

  return `URX-${stamp}-${suffix}`;
}
