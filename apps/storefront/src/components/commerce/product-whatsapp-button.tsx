"use client";

import { MessageCircle } from "lucide-react";
import type { StoreSettings, UrbanixProduct } from "@ecommerce/shared";
import { useLanguage } from "@/components/i18n/language-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  createProductWhatsAppMessage,
  createWhatsAppHref,
  getWhatsAppNumber,
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
  const message = createProductWhatsAppMessage({
    language,
    product,
    quantity,
    settings,
  });

  return (
    <a
      className={buttonVariants({
        className: `bg-success text-white hover:bg-success/90 ${className ?? ""}`,
        size,
      })}
      href={createWhatsAppHref(getWhatsAppNumber(settings), message)}
      rel="noreferrer"
      target="_blank"
    >
      <MessageCircle />
      Order via WhatsApp
    </a>
  );
}
