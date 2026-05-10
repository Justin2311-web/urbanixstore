"use client";

import { useEffect, useState } from "react";
import { Edit3, UserRound } from "lucide-react";
import { CustomerProfileForm } from "@/components/account/customer-profile-form";
import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCustomerProfile, type CustomerProfile } from "@/lib/customer-profile";

export function AccountView() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = loadCustomerProfile();
      setProfile(stored);
      setEditing(!stored);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="pb-20 md:pb-0">
      <section className="border-b border-primary/10 bg-linear-to-br from-[#eaf3ff] via-white to-[#fff4e7]">
        <div className="urbanix-container py-8 sm:py-12">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">Urbanix Store</p>
          <h1 className="mt-2 text-3xl font-extrabold text-primary sm:text-5xl">{t("account.title", "Account")}</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t("account.subtitle", "Save your customer information once and future orders will be pre-filled on this browser.")}
          </p>
        </div>
      </section>

      <section className="urbanix-container py-8 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle>{editing ? t("account.profileForm", "Customer Information") : t("account.savedProfile", "Saved Information")}</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <CustomerProfileForm
                  buttonLabel={profile ? t("account.updateInformation", "Update Information") : t("account.saveInformation", "Save Information")}
                  initialProfile={profile}
                  onSaved={(nextProfile) => {
                    setProfile(nextProfile);
                    setEditing(false);
                  }}
                />
              ) : profile ? (
                <div className="grid gap-4">
                  <ProfileLine label={t("account.fullName", "Full Name")} value={profile.customerName} />
                  <ProfileLine label={t("account.phone", "Phone Number")} value={profile.customerPhone} />
                  <ProfileLine label={t("account.email", "Email Address (optional)")} value={profile.customerEmail || "-"} />
                  <ProfileLine label={t("account.address", "Delivery Address")} value={profile.customerAddress} />
                  <Button className="w-fit" onClick={() => setEditing(true)} type="button" variant="secondary">
                    <Edit3 />
                    {t("account.editInformation", "Edit Information")}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="rounded-3xl border border-primary/10 bg-primary p-6 text-white shadow-[0_18px_45px_rgba(6,71,168,0.18)]">
            <UserRound className="size-10" />
            <h2 className="mt-4 text-xl font-extrabold text-white">{t("account.whySave", "Why save your information?")}</h2>
            <p className="mt-3 text-sm text-white/75">
              {t("account.whySaveText", "Your next WhatsApp order can include your name, phone and delivery address automatically. No password or login is required.")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <div className="text-xs font-extrabold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm font-bold text-primary">{value}</div>
    </div>
  );
}
