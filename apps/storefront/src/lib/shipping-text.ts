import type { LocalizedTextValue, StoreSettings } from "@ecommerce/shared";

function threshold(value: unknown, fallback: number) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : fallback;
}

export function freeShippingCopy(settings: StoreSettings, fallback?: string | null): LocalizedTextValue {
  const westThreshold = threshold(
    settings.westMalaysiaFreeShippingMinimumAmount ?? settings.freeShippingMinimumAmount ?? settings.freeShippingMinAmount,
    80
  );
  const eastThreshold = threshold(settings.eastMalaysiaFreeShippingMinimumAmount, 150);

  if (!westThreshold || !eastThreshold) {
    return {
      en: fallback || settings.freeShippingText?.en || "Shipping fee is calculated at checkout.",
      zh: settings.freeShippingText?.zh || fallback || "邮费将在结账时计算。",
      ms: settings.freeShippingText?.ms || fallback || "Kos penghantaran dikira semasa pembayaran.",
    };
  }

  return {
    en: `Free shipping: West Malaysia above RM${westThreshold}, East Malaysia above RM${eastThreshold}.`,
    zh: `免运费：西马满 RM${westThreshold}，东马满 RM${eastThreshold}。`,
    ms: `Penghantaran percuma: Semenanjung Malaysia melebihi RM${westThreshold}, Malaysia Timur melebihi RM${eastThreshold}.`,
  };
}
