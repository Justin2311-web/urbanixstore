"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoreSettings } from "@ecommerce/shared";
import { CustomerInfoModal } from "@/components/account/customer-info-modal";
import {
  isCustomerProfileComplete,
  loadCustomerProfile,
  type CustomerProfile,
} from "@/lib/customer-profile";
import { createWhatsAppHref, getWhatsAppNumber } from "@/lib/order-links";

type WhatsAppOrderActionProps = {
  children: React.ReactNode;
  className: string;
  lastOrderProduct?: string;
  makeMessage: (profile: CustomerProfile | null) => string;
  settings: Pick<StoreSettings, "whatsappNumber">;
};

export function WhatsAppOrderAction({
  children,
  className,
  lastOrderProduct,
  makeMessage,
  settings,
}: WhatsAppOrderActionProps) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setProfile(loadCustomerProfile()), 0);

    function handleProfileUpdate(event: Event) {
      const nextProfile = (event as CustomEvent<CustomerProfile>).detail ?? loadCustomerProfile();
      setProfile(nextProfile);
    }

    window.addEventListener("urbanix-customer-profile-updated", handleProfileUpdate);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("urbanix-customer-profile-updated", handleProfileUpdate);
    };
  }, []);

  const href = useMemo(
    () => createWhatsAppHref(getWhatsAppNumber(settings), makeMessage(profile)),
    [makeMessage, profile, settings]
  );

  function openWhatsApp(nextProfile: CustomerProfile | null) {
    window.open(createWhatsAppHref(getWhatsAppNumber(settings), makeMessage(nextProfile)), "_blank", "noopener,noreferrer");
  }

  if (isCustomerProfileComplete(profile)) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }

  return (
    <>
      <button className={className} onClick={() => setModalOpen(true)} type="button">
        {children}
      </button>
      <CustomerInfoModal
        lastOrderProduct={lastOrderProduct}
        onClose={() => setModalOpen(false)}
        onSaved={(nextProfile) => {
          setProfile(nextProfile);
          setModalOpen(false);
          openWhatsApp(nextProfile);
        }}
        open={modalOpen}
      />
    </>
  );
}
