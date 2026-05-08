import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function WhatsAppCta({
  message,
  whatsappNumber,
}: {
  message?: string;
  whatsappNumber: string;
}) {
  const href = `https://wa.me/${whatsappNumber}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    <div className="rounded-2xl border border-success/20 bg-white p-4 text-center shadow-sm">
      <a
        className={buttonVariants({
          className: "w-full bg-success text-white hover:bg-success/90",
          size: "lg",
        })}
        href={href}
        target="_blank"
      >
        <MessageCircle />
        Chat on WhatsApp
      </a>
      <p className="mt-3 text-xs font-medium text-muted-foreground">We are here to help.</p>
    </div>
  );
}
