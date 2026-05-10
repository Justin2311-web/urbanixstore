"use client";

import type { CheckoutCustomer } from "@ecommerce/shared";

export type CustomerProfile = {
  userId: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
};

export type CustomerProfilePayload = CustomerProfile & {
  lastOrderProduct?: string;
  lastOrderDate?: string;
  notes?: string;
};

const storageKey = "urbanix-customer-profile";

export function createEmptyCustomerProfile(): CustomerProfile {
  const now = new Date().toISOString();

  return {
    createdAt: now,
    customerAddress: "",
    customerEmail: "",
    customerName: "",
    customerPhone: "",
    updatedAt: now,
    userId: "",
  };
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export function loadCustomerProfile(): CustomerProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);

    return stored ? (JSON.parse(stored) as CustomerProfile) : null;
  } catch {
    return null;
  }
}

export function saveCustomerProfileLocally(profile: CustomerProfile) {
  const existing = loadCustomerProfile();
  const now = new Date().toISOString();
  const next: CustomerProfile = {
    ...profile,
    createdAt: profile.createdAt || existing?.createdAt || now,
    customerPhone: normalizePhone(profile.customerPhone),
    updatedAt: now,
    userId: profile.userId || existing?.userId || crypto.randomUUID(),
  };

  window.localStorage.setItem(storageKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("urbanix-customer-profile-updated", { detail: next }));

  return next;
}

export function isCustomerProfileComplete(profile: CustomerProfile | null) {
  return Boolean(profile?.customerName.trim() && normalizePhone(profile.customerPhone) && profile.customerAddress.trim());
}

export async function syncCustomerProfile(profile: CustomerProfilePayload) {
  const response = await fetch("/api/users", {
    body: JSON.stringify(profile),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const data = await response.json().catch(() => ({})) as { error?: string; message?: string; ok?: boolean };

  if (!response.ok) {
    throw new Error(data.error || data.message || "Unable to sync customer information.");
  }

  return data;
}

export function profileToCheckoutCustomer(profile: CustomerProfile): CheckoutCustomer {
  return {
    addressLine1: profile.customerAddress,
    addressLine2: "",
    city: "",
    country: "Malaysia",
    deliveryNote: "",
    email: profile.customerEmail,
    fullName: profile.customerName,
    phone: profile.customerPhone,
    postcode: "",
    state: "",
  };
}
