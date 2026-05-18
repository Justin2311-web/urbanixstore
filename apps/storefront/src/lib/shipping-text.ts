import type { LocalizedTextValue, StoreSettings } from "@ecommerce/shared";

function formatThreshold(settings: StoreSettings) {
  const amount = Number(settings.freeShippingMinimumAmount ?? settings.freeShippingMinAmount ?? 0);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function freeShippingCopy(settings: StoreSettings, fallback?: string | null): LocalizedTextValue {
  const threshold = formatThreshold(settings);
  if (!threshold) {
    return {
      en: fallback || settings.freeShippingText?.en || "Shipping fee is calculated at checkout.",
      zh: settings.freeShippingText?.zh || fallback || "运费将在结账时计算。",
      ms: settings.freeShippingText?.ms || fallback || "Kos penghantaran dikira semasa pembayaran.",
    };
  }

  const amount = `RM${threshold}`;
  return {
    en: `Free shipping for orders above ${amount}`,
    zh: `订单满 ${amount} 即可免邮`,
    ms: `Penghantaran percuma untuk pesanan melebihi ${amount}`,
  };
}
