"use client";

import { MessageCircle } from "lucide-react";
import type { StoreSettings, UrbanixProduct } from "@ecommerce/shared";
import { WhatsAppOrderAction } from "@/components/account/whatsapp-order-action";
import { useLanguage } from "@/components/i18n/language-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  createProductWhatsAppMessage,
} from "@/lib/order-links";

export function ProductWhatsAppButton({
  className,
  product,
  quantity = 1,
  settings,
  size = "sm",
}: {
  className?: string;
  product: UrbanixProduct;
  quantity?: number;
  settings: Pick<StoreSettings, "storeName" | "whatsappNumber">;
  size?: "sm" | "lg";
}) {
  const { language } = useLanguage();

  return (
    <WhatsAppOrderAction
      className={buttonVariants({
        className: `bg-success text-white hover:bg-success/90 ${className ?? ""}`,
        size,
      })}
      lastOrderProduct={product.name}
      makeMessage={(customer) => createProductWhatsAppMessage({
        customer,
        language,
        product,
        quantity,
        settings,
      })}
      settings={settings}
    >
      <MessageCircle />
      Order via WhatsApp
    </WhatsAppOrderAction>
  );
}
