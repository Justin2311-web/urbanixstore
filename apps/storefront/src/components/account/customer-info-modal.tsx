"use client";

import { X } from "lucide-react";
import type { CustomerProfile } from "@/lib/customer-profile";
import { CustomerProfileForm } from "@/components/account/customer-profile-form";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";

type CustomerInfoModalProps = {
  lastOrderProduct?: string;
  onClose: () => void;
  onSaved: (profile: CustomerProfile) => void;
  open: boolean;
};

export function CustomerInfoModal({ lastOrderProduct, onClose, onSaved, open }: CustomerInfoModalProps) {
  const { t } = useLanguage();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/45 p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Urbanix Store</p>
            <h2 className="mt-1 text-2xl font-extrabold text-primary">{t("account.beforeOrderTitle", "Please fill your information before placing order.")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("account.beforeOrderText", "We will save it on this browser so future orders can be pre-filled.")}
            </p>
          </div>
          <Button aria-label="Close" onClick={onClose} size="icon-sm" type="button" variant="ghost">
            <X />
          </Button>
        </div>
        <CustomerProfileForm
          buttonLabel={t("account.saveContinue", "Save & Continue Order")}
          lastOrderProduct={lastOrderProduct}
          onSaved={(profile) => onSaved(profile)}
        />
      </div>
    </div>
  );
}
