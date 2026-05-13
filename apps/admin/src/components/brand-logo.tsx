import { ShieldCheck } from "lucide-react";

export function BrandLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
        <ShieldCheck className="size-5" />
      </div>
      <div className="leading-none">
        <div className="text-lg font-extrabold uppercase tracking-wide text-primary">
          Urbanix
        </div>
        <div className="text-[0.6rem] font-bold uppercase tracking-[0.35em] text-accent">
          Admin
        </div>
      </div>
    </div>
  );
}
