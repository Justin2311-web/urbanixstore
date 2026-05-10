"use client";

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import type { StoreSettings, UrbanixProduct } from "@ecommerce/shared";
import { WhatsAppOrderAction } from "@/components/account/whatsapp-order-action";
import { useLanguage } from "@/components/i18n/language-provider";
import { buttonVariants } from "@/components/ui/button";
import {
  createProductWhatsAppMessage,
  type SelectedProductOption,
} from "@/lib/order-links";

export function ProductWhatsAppButton({
  className,
  product,
  disabled = false,
  finalPrice,
  onBlocked,
  quantity = 1,
  selectedOptions,
  settings,
  size = "sm",
}: {
  className?: string;
  disabled?: boolean;
  finalPrice?: number;
  onBlocked?: () => void;
  product: UrbanixProduct;
  quantity?: number;
  selectedOptions?: SelectedProductOption[];
  settings: Pick<StoreSettings, "storeName" | "whatsappNumber">;
  size?: "sm" | "lg";
}) {
  const { language } = useLanguage();
  const hasRequiredOptions = (product.variantGroups?.length ?? 0) > 0;
  const buttonClassName = buttonVariants({
    className: `bg-success text-white hover:bg-success/90 ${className ?? ""}`,
    size,
  });

  if (disabled) {
    return (
      <button className={buttonClassName} onClick={onBlocked} type="button">
        <MessageCircle />
        Order via WhatsApp
      </button>
    );
  }

  if (hasRequiredOptions && !selectedOptions) {
    return (
      <Link className={buttonClassName} href={`/products/${product.slug}`}>
        <MessageCircle />
        Choose Options
      </Link>
    );
  }

  return (
    <WhatsAppOrderAction
      className={buttonClassName}
      lastOrderProduct={product.name}
      makeMessage={(customer) => createProductWhatsAppMessage({
        customer,
        finalPrice,
        language,
        product,
        quantity,
        selectedOptions,
        settings,
      })}
      settings={settings}
    >
      <MessageCircle />
      Order via WhatsApp
    </WhatsAppOrderAction>
  );
}
