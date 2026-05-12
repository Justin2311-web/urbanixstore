import { Button } from "@/components/ui/button";

export function Field({
  children,
  label,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-foreground">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function TextArea(props: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className="min-h-24 rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
      {...props}
    />
  );
}

export function Select(props: React.ComponentProps<"select">) {
  return (
    <select
      className="h-11 rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/20"
      {...props}
    />
  );
}

export function CheckField({
  defaultChecked,
  label,
  name,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold">
      <input className="size-4" defaultChecked={defaultChecked} name={name} type="checkbox" />
      {label}
    </label>
  );
}

export function SaveButton({ label = "Save Changes" }: { label?: string }) {
  return (
    <Button className="w-fit" type="submit" variant="secondary">
      {label}
    </Button>
  );
}
