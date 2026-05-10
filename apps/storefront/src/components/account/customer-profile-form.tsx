"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createEmptyCustomerProfile,
  isCustomerProfileComplete,
  loadCustomerProfile,
  saveCustomerProfileLocally,
  syncCustomerProfile,
  type CustomerProfile,
} from "@/lib/customer-profile";

type CustomerProfileFormProps = {
  buttonLabel?: string;
  initialProfile?: CustomerProfile | null;
  lastOrderProduct?: string;
  onSaved?: (profile: CustomerProfile, options: { remoteSynced: boolean }) => void;
};

export function CustomerProfileForm({
  buttonLabel,
  initialProfile,
  lastOrderProduct,
  onSaved,
}: CustomerProfileFormProps) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<CustomerProfile>(initialProfile ?? createEmptyCustomerProfile());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = initialProfile ?? loadCustomerProfile();

      if (stored) {
        setProfile(stored);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [initialProfile]);

  function updateField(field: keyof CustomerProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!profile.customerName.trim()) nextErrors.customerName = t("account.nameRequired", "Full name is required.");
    if (!profile.customerPhone.trim()) nextErrors.customerPhone = t("account.phoneRequired", "Phone number is required.");
    if (!profile.customerAddress.trim()) nextErrors.customerAddress = t("account.addressRequired", "Delivery address is required.");
    if (profile.customerEmail && !profile.customerEmail.includes("@")) nextErrors.customerEmail = t("account.emailInvalid", "Enter a valid email address.");

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setStatus("saving");
    setMessage("");

    const saved = saveCustomerProfileLocally(profile);
    let remoteSynced = false;

    try {
      await syncCustomerProfile({
        ...saved,
        lastOrderDate: lastOrderProduct ? new Date().toISOString() : "",
        lastOrderProduct,
      });
      remoteSynced = true;
      setStatus("success");
      setMessage(t("account.saveSuccess", "Information saved successfully."));
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : t("account.saveError", "Information saved locally, but Google Sheet sync failed."));
    }

    onSaved?.(saved, { remoteSynced });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <ProfileField error={errors.customerName} label={t("account.fullName", "Full Name")}>
        <Input
          autoComplete="name"
          onChange={(event) => updateField("customerName", event.target.value)}
          placeholder={t("account.fullNamePlaceholder", "Your full name")}
          value={profile.customerName}
        />
      </ProfileField>

      <ProfileField error={errors.customerPhone} label={t("account.phone", "Phone Number")}>
        <Input
          autoComplete="tel"
          inputMode="tel"
          onChange={(event) => updateField("customerPhone", event.target.value)}
          placeholder="60198993269"
          value={profile.customerPhone}
        />
      </ProfileField>

      <ProfileField error={errors.customerEmail} label={t("account.email", "Email Address (optional)")}>
        <Input
          autoComplete="email"
          onChange={(event) => updateField("customerEmail", event.target.value)}
          placeholder="name@example.com"
          type="email"
          value={profile.customerEmail}
        />
      </ProfileField>

      <ProfileField error={errors.customerAddress} label={t("account.address", "Delivery Address")}>
        <textarea
          autoComplete="street-address"
          className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onChange={(event) => updateField("customerAddress", event.target.value)}
          placeholder={t("account.addressPlaceholder", "House/unit, street, postcode, city, state")}
          value={profile.customerAddress}
        />
      </ProfileField>

      {message ? (
        <p className={status === "error" ? "text-sm font-semibold text-destructive" : "flex items-center gap-2 text-sm font-semibold text-success"}>
          {status === "success" ? <CheckCircle2 className="size-4" /> : null}
          {message}
        </p>
      ) : null}

      <Button disabled={status === "saving" || !isCustomerProfileComplete(profile)} size="lg" type="submit">
        {status === "saving" ? <Loader2 className="animate-spin" /> : null}
        {buttonLabel ?? t("account.saveInformation", "Save Information")}
      </Button>
    </form>
  );
}

function ProfileField({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-primary">
      {label}
      {children}
      {error ? <span className="text-xs font-semibold text-destructive">{error}</span> : null}
    </label>
  );
}
